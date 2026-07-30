import { buildTypeChart, getEffectiveness } from '../api/typeChart'
import { mapMoveToCard } from '../api/mappers'
import { buildDeck, drawHand, removeCardFromHand, returnCardToDeck, shuffle } from './cards'
import { battleXpReward, calcDamage, rollHit } from './formulas'
import type {
  BattleState,
  MoveCard,
  NodeType,
  PokemonInstance,
  TypeChart,
} from '../models/types'

let typeChartCache: TypeChart | null = null

async function getTypeChart(): Promise<TypeChart> {
  if (!typeChartCache) typeChartCache = await buildTypeChart()
  return typeChartCache
}

export function firstLivingIndex(party: PokemonInstance[]): number {
  return party.findIndex((p) => p.currentHp > 0)
}

export async function initBattle(
  playerParty: PokemonInstance[],
  enemyParty: PokemonInstance[],
  nodeType: NodeType,
): Promise<BattleState> {
  const playerActiveIndex = firstLivingIndex(playerParty)
  const enemyActiveIndex = firstLivingIndex(enemyParty)
  const active = playerParty[playerActiveIndex]
  const deck = shuffle(await buildDeck(active))
  const { deck: remaining, hand } = drawHand(deck, [], 4)

  const avgEnemyLevel =
    enemyParty.reduce((s, p) => s + p.level, 0) / enemyParty.length

  const intro =
    nodeType === 'boss'
      ? 'The Gym Leader stands ready!'
      : nodeType === 'trainer'
        ? 'A trainer wants to battle!'
        : 'A wild Pokémon appeared!'

  return {
    playerParty: playerParty.map((p) => ({ ...p })),
    enemyParty: enemyParty.map((p) => ({ ...p })),
    playerActiveIndex,
    enemyActiveIndex,
    playerHand: hand,
    playerDeck: remaining,
    turn: 'player',
    winner: null,
    log: [intro],
    nodeType,
    xpReward: battleXpReward(Math.floor(avgEnemyLevel), nodeType),
    mustSwitch: false,
    pendingEnemyAction: false,
  }
}

async function getEnemyMoves(pokemon: PokemonInstance): Promise<MoveCard[]> {
  const cards: MoveCard[] = []
  for (const moveId of pokemon.unlockedMoveIds) {
    const card = await mapMoveToCard(moveId)
    if (card) cards.push(card)
  }
  return cards
}

async function enemyChooseMove(
  enemy: PokemonInstance,
  target: PokemonInstance,
): Promise<MoveCard | null> {
  const moves = await getEnemyMoves(enemy)
  if (moves.length === 0) return null

  const chart = await getTypeChart()
  let best = moves[0]
  let bestScore = -1

  for (const move of moves) {
    const eff = getEffectiveness(chart, move.type, target.types)
    const score = move.power * eff + Math.random() * 5
    if (score > bestScore) {
      bestScore = score
      best = move
    }
  }

  return best
}

function effectivenessLabel(mult: number): string {
  if (mult >= 2) return " It's super effective!"
  if (mult <= 0) return " It has no effect..."
  if (mult <= 0.5) return " It's not very effective."
  return ''
}

async function applyMove(
  state: BattleState,
  attackerSide: 'player' | 'enemy',
  move: MoveCard,
): Promise<BattleState> {
  const chart = await getTypeChart()
  const party = attackerSide === 'player' ? state.playerParty : state.enemyParty
  const defParty = attackerSide === 'player' ? state.enemyParty : state.playerParty
  const atkIdx = attackerSide === 'player' ? state.playerActiveIndex : state.enemyActiveIndex
  const defIdx = attackerSide === 'player' ? state.enemyActiveIndex : state.playerActiveIndex

  const attacker = party[atkIdx]
  const defender = defParty[defIdx]
  const log = [...state.log]

  log.push(`${attacker.name} used ${move.name}!`)

  if (!rollHit(move.accuracy)) {
    log.push(`But it missed!`)
    return { ...state, log }
  }

  const damage = calcDamage(attacker, defender, move, chart)
  const eff = getEffectiveness(chart, move.type, defender.types)
  log.push(`${defender.name} took ${damage} damage.${effectivenessLabel(eff)}`)

  const newDefender = {
    ...defender,
    currentHp: Math.max(0, defender.currentHp - damage),
  }

  const newDefParty = defParty.map((p, i) => (i === defIdx ? newDefender : p))

  if (attackerSide === 'player') {
    return {
      ...state,
      enemyParty: newDefParty,
      log,
    }
  }

  return {
    ...state,
    playerParty: newDefParty,
    log,
  }
}

function checkFaint(state: BattleState): BattleState {
  const enemy = state.enemyParty[state.enemyActiveIndex]
  const player = state.playerParty[state.playerActiveIndex]
  let next = { ...state, log: [...state.log] }

  if (enemy.currentHp <= 0) {
    next.log.push(`${enemy.name} fainted!`)
    const nextEnemyIdx = firstLivingIndex(next.enemyParty)
    if (nextEnemyIdx === -1) {
      next.turn = 'ended'
      next.winner = 'player'
      next.log.push('You won the battle!')
      return next
    }
    next.enemyActiveIndex = nextEnemyIdx
    next.log.push(`${next.enemyParty[nextEnemyIdx].name} was sent out!`)
  }

  if (player.currentHp <= 0) {
    next.log.push(`${player.name} fainted!`)
    const nextPlayerIdx = firstLivingIndex(next.playerParty)
    if (nextPlayerIdx === -1) {
      next.turn = 'ended'
      next.winner = 'enemy'
      next.log.push('You blacked out...')
      return next
    }
    next.mustSwitch = true
    next.turn = 'player'
    return next
  }

  return next
}

export async function refreshPlayerHand(state: BattleState): Promise<BattleState> {
  const active = state.playerParty[state.playerActiveIndex]
  const fullDeck = shuffle(await buildDeck(active))
  const { deck, hand } = drawHand(fullDeck, [], 4)
  return { ...state, playerDeck: deck, playerHand: hand }
}

export async function playerPlayCard(
  state: BattleState,
  cardIndex: number,
): Promise<BattleState> {
  if (state.turn !== 'player' || state.mustSwitch) return state

  const card = state.playerHand[cardIndex]
  if (!card) return state

  let next = { ...state }
  next = await applyMove(next, 'player', card)

  const played = removeCardFromHand(state.playerHand, cardIndex)
  next.playerHand = played
  next.playerDeck = returnCardToDeck(next.playerDeck, card)

  next = checkFaint(next)
  if (next.turn === 'ended' || next.mustSwitch) return next

  next.turn = 'enemy'
  next = await enemyTurn(next)

  if (next.turn !== 'ended' && !next.mustSwitch) {
    const drawn = drawHand(next.playerDeck, next.playerHand, 4)
    next.playerDeck = drawn.deck
    next.playerHand = drawn.hand
    next.turn = 'player'
  }

  return next
}

export async function playerSwitch(
  state: BattleState,
  partyIndex: number,
): Promise<BattleState> {
  if (state.turn !== 'player') return state
  if (partyIndex === state.playerActiveIndex) return state
  const target = state.playerParty[partyIndex]
  if (!target || target.currentHp <= 0) return state

  let next: BattleState = {
    ...state,
    playerActiveIndex: partyIndex,
    mustSwitch: false,
    log: [...state.log, `Go! ${target.name}!`],
  }

  next = await refreshPlayerHand(next)

  if (state.mustSwitch) {
    next.turn = 'player'
    return next
  }

  next.turn = 'enemy'
  next = await enemyTurn(next)

  if (next.turn !== 'ended' && !next.mustSwitch) {
    const drawn = drawHand(next.playerDeck, next.playerHand, 4)
    next.playerDeck = drawn.deck
    next.playerHand = drawn.hand
    next.turn = 'player'
  }

  return next
}

export async function enemyTurn(state: BattleState): Promise<BattleState> {
  if (state.turn === 'ended') return state

  const enemy = state.enemyParty[state.enemyActiveIndex]
  const player = state.playerParty[state.playerActiveIndex]
  const move = await enemyChooseMove(enemy, player)

  if (!move) {
    return {
      ...state,
      log: [...state.log, `${enemy.name} has no moves!`],
      turn: 'player',
    }
  }

  let next = await applyMove(state, 'enemy', move)
  next = checkFaint(next)

  if (next.turn !== 'ended' && !next.mustSwitch) {
    next.turn = 'player'
  }

  return next
}

export function getActivePokemon(state: BattleState, side: 'player' | 'enemy'): PokemonInstance {
  return side === 'player'
    ? state.playerParty[state.playerActiveIndex]
    : state.enemyParty[state.enemyActiveIndex]
}
