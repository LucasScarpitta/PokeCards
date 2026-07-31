import { createPokemonInstance } from '../api/mappers'
import { prefetchTypes } from '../api/pokeapi'
import { initBattle } from '../game/battle'
import { applyCatchToParty } from '../game/catch'
import {
  addToInventory,
  applyBattleBuffs,
  createBattleBuff,
  emptyInventory,
  getItemPrice,
  getShopItem,
  healPokemon,
  normalizeInventory,
  pickPokeballSpecies,
  pokeballSpeciesRoll,
  removeFromInventory,
  revivePokemon,
  starterLevel,
} from '../game/items'
import { generateMap, getAvailableNodes, pickCatchSpecies } from '../game/map'
import { pickTrainerTeam, pickWildSpecies } from '../game/rng'
import { shouldBiasEarlyMatchup } from '../game/matchup'
import { scaleCatchLevel, scaleEnemyLevel } from '../game/scaling'
import { createSeed, seededRandom } from '../game/rng'
import { clearRun, loadRun, saveRun } from './persistence'
import type {
  ItemId,
  MapNode,
  PokemonInstance,
  PostBattleResult,
  RunState,
} from '../models/types'
import type { ToastKind } from './toastStore'

export type ActionResult = {
  state: RunState
  toast?: { kind: ToastKind; message: string }
}

function ok(state: RunState, toast?: ActionResult['toast']): ActionResult {
  return { state, toast }
}

function fail(state: RunState, message: string, kind: ToastKind = 'error'): ActionResult {
  return { state, toast: { kind, message } }
}

export type RunAction =
  | { type: 'INIT' }
  | { type: 'NEW_RUN' }
  | { type: 'CONTINUE_RUN' }
  | { type: 'SELECT_STARTER'; speciesId: number }
  | { type: 'SELECT_NODE'; nodeId: string }
  | { type: 'OPEN_MARKET' }
  | { type: 'CLOSE_MARKET' }
  | { type: 'BUY_ITEM'; itemId: ItemId }
  | { type: 'USE_ITEM'; itemId: ItemId; pokemonUid?: string }
  | { type: 'BATTLE_UPDATED'; battle: RunState['battle'] }
  | { type: 'BATTLE_END'; party: PokemonInstance[]; postBattle: Omit<PostBattleResult, 'goldGained'> }
  | { type: 'RETURN_TO_MAP' }
  | { type: 'CATCH_POKEMON'; accept: boolean; replaceUid?: string }
  | { type: 'GAME_OVER' }
  | { type: 'VICTORY' }
  | { type: 'RESET' }

const initialState: RunState = {
  screen: 'home',
  party: [],
  map: [],
  currentNodeId: null,
  battleNodeId: null,
  seed: 0,
  badges: 0,
  gold: 0,
  inventory: emptyInventory(),
  pendingBattleBuffs: [],
  battle: null,
  postBattle: null,
  catchOffer: null,
  catchFromItem: false,
  itemRollCounter: 0,
  pokeballsBought: 0,
}

export function getInitialRunState(): RunState {
  return { ...initialState, inventory: emptyInventory() }
}

function normalizeRunState(state: RunState): RunState {
  return {
    ...state,
    gold: state.gold ?? 0,
    inventory: normalizeInventory(state.inventory),
    pendingBattleBuffs: state.pendingBattleBuffs ?? [],
    catchFromItem: state.catchFromItem ?? false,
    itemRollCounter: state.itemRollCounter ?? 0,
    pokeballsBought: state.pokeballsBought ?? 0,
  }
}

async function rollPokeballCatch(state: RunState): Promise<PokemonInstance> {
  const speciesId = pickPokeballSpecies(state.seed, pokeballSpeciesRoll(state))
  const level = starterLevel(state.party)
  return createPokemonInstance(speciesId, level)
}

export async function handleRunAction(
  state: RunState,
  action: RunAction,
): Promise<ActionResult> {
  state = normalizeRunState(state)

  switch (action.type) {
    case 'INIT':
      return ok(state)

    case 'NEW_RUN':
      clearRun()
      await prefetchTypes()
      return ok({
        ...initialState,
        screen: 'starter',
        seed: createSeed(),
        inventory: emptyInventory(),
      })

    case 'CONTINUE_RUN': {
      const saved = loadRun()
      if (saved) return ok(normalizeRunState(saved))
      return ok(state)
    }

    case 'SELECT_STARTER': {
      const starter = await createPokemonInstance(action.speciesId, 5)
      const map = generateMap(state.seed, starter.types)
      const next: RunState = {
        ...state,
        screen: 'map',
        party: [starter],
        map,
        currentNodeId: null,
        gold: 0,
        inventory: emptyInventory(),
        pendingBattleBuffs: [],
        pokeballsBought: 0,
      }
      saveRun(next)
      return ok(next)
    }

    case 'OPEN_MARKET': {
      const next: RunState = { ...state, screen: 'market' }
      saveRun(next)
      return ok(next)
    }

    case 'CLOSE_MARKET': {
      const next: RunState = { ...state, screen: 'map' }
      saveRun(next)
      return ok(next)
    }

    case 'BUY_ITEM': {
      const item = getShopItem(action.itemId)

      if (item.kind === 'pokeball') {
        const price = getItemPrice('pokeball', state.pokeballsBought)
        if (state.gold < price) return fail(state, 'Not enough gold.')

        const wild = await rollPokeballCatch(state)
        const next: RunState = {
          ...state,
          gold: state.gold - price,
          pokeballsBought: state.pokeballsBought + 1,
          screen: 'catch',
          catchOffer: wild,
          catchFromItem: true,
          itemRollCounter: state.itemRollCounter + 1,
        }
        saveRun(next)
        return ok(next)
      }

      if (state.gold < item.price) return fail(state, 'Not enough gold.')

      const next: RunState = {
        ...state,
        gold: state.gold - item.price,
        inventory: addToInventory(state.inventory, action.itemId),
      }
      saveRun(next)
      return ok(next, { kind: 'success', message: `Purchased ${item.name}!` })
    }

    case 'USE_ITEM': {
      const item = getShopItem(action.itemId)
      const cantUse = "Can't use that item right now."

      if (item.kind === 'pokeball') {
        const inv = removeFromInventory(state.inventory, action.itemId)
        if (!inv) return fail(state, cantUse)

        const wild = await rollPokeballCatch(state)
        const next: RunState = {
          ...state,
          inventory: inv,
          screen: 'catch',
          catchOffer: wild,
          catchFromItem: true,
          itemRollCounter: state.itemRollCounter + 1,
        }
        saveRun(next)
        return ok(next)
      }

      const inv = removeFromInventory(state.inventory, action.itemId)
      if (!inv) return fail(state, cantUse)

      if (item.kind === 'heal') {
        if (!action.pokemonUid || !item.healAmount) return fail(state, cantUse)
        const target = state.party.find((p) => p.uid === action.pokemonUid)
        if (!target || target.currentHp <= 0 || target.currentHp >= target.maxHp) {
          return fail(state, cantUse)
        }

        const next: RunState = {
          ...state,
          inventory: inv,
          party: state.party.map((p) =>
            p.uid === action.pokemonUid ? healPokemon(p, item.healAmount!) : p,
          ),
        }
        saveRun(next)
        return ok(next, { kind: 'success', message: `${target.name} was healed!` })
      }

      if (item.kind === 'revive') {
        if (!action.pokemonUid) return fail(state, cantUse)
        const target = state.party.find((p) => p.uid === action.pokemonUid)
        if (!target || target.currentHp > 0) return fail(state, cantUse)

        const next: RunState = {
          ...state,
          inventory: inv,
          party: state.party.map((p) =>
            p.uid === action.pokemonUid ? revivePokemon(p) : p,
          ),
        }
        saveRun(next)
        return ok(next, { kind: 'success', message: `${target.name} was revived!` })
      }

      if (item.kind === 'battle-buff') {
        const next: RunState = {
          ...state,
          inventory: inv,
          pendingBattleBuffs: [...state.pendingBattleBuffs, createBattleBuff(action.itemId)],
        }
        saveRun(next)
        return ok(next, { kind: 'success', message: `${item.name} activated for next battle!` })
      }

      return fail(state, cantUse)
    }

    case 'SELECT_NODE': {
      const node = state.map.find((n) => n.id === action.nodeId)
      if (!node || node.completed) {
        return fail(state, "That route isn't available.")
      }

      const available = getAvailableNodes(state.map, state.currentNodeId)
      if (!available.some((n) => n.id === action.nodeId)) {
        return fail(state, "That route isn't available.")
      }

      if (node.type === 'rest') {
        const healed = state.party.map((p) => ({
          ...p,
          currentHp: p.maxHp,
        }))
        const updatedMap = markNodeComplete(state.map, node.id)
        const next: RunState = {
          ...state,
          party: healed,
          map: updatedMap,
          currentNodeId: node.id,
        }
        saveRun(next)
        return ok(next, { kind: 'success', message: 'Team fully healed!' })
      }

      if (node.type === 'catch') {
        const speciesId = pickCatchSpecies(state.seed, state.map.indexOf(node))
        const rng = seededRandom(state.seed + state.map.indexOf(node) * 3571)
        const level = scaleCatchLevel(state.party, rng)
        const wild = await createPokemonInstance(speciesId, level)
        const next: RunState = {
          ...state,
          screen: 'catch',
          battleNodeId: node.id,
          catchOffer: wild,
        }
        return ok(next)
      }

      if (node.type === 'wild' || node.type === 'trainer' || node.type === 'boss') {
        const battleRng = seededRandom(state.seed + state.map.indexOf(node) * 5323)
        const starterTypes = state.party[0]?.types ?? []

        let speciesIds = node.enemySpeciesIds ?? []
        if (shouldBiasEarlyMatchup(node.row) && starterTypes.length > 0) {
          if (node.type === 'wild') {
            speciesIds = [pickWildSpecies(node.row, battleRng, starterTypes)]
          } else if (node.type === 'trainer') {
            speciesIds = pickTrainerTeam(node.row, battleRng, starterTypes)
          }
        }

        const enemyParty: PokemonInstance[] = []
        for (let i = 0; i < speciesIds.length; i++) {
          const id = speciesIds[i]
          const lvl = scaleEnemyLevel(state.party, node.type, i, battleRng)
          enemyParty.push(await createPokemonInstance(id, lvl))
        }

        const buffedParty = applyBattleBuffs(state.party, state.pendingBattleBuffs)
        const battle = await initBattle(buffedParty, enemyParty, node.type)
        const next: RunState = {
          ...state,
          screen: 'battle',
          battleNodeId: node.id,
          battle,
          pendingBattleBuffs: [],
        }
        saveRun(next)
        return ok(next)
      }

      return fail(state, "That route isn't available.")
    }

    case 'BATTLE_UPDATED': {
      const next = { ...state, battle: action.battle }
      saveRun(next)
      return ok(next)
    }

    case 'BATTLE_END': {
      const updatedMap = markNodeComplete(state.map, action.postBattle.nodeId)
      const node = state.map.find((n) => n.id === action.postBattle.nodeId)
      const isBoss = node?.type === 'boss'
      const goldGained = state.battle?.goldReward ?? 0

      const postBattle: PostBattleResult = {
        ...action.postBattle,
        goldGained,
      }

      let next: RunState = {
        ...state,
        screen: isBoss ? 'victory' : 'post-battle',
        party: action.party,
        map: updatedMap,
        currentNodeId: action.postBattle.nodeId,
        battle: null,
        postBattle,
        gold: state.gold + goldGained,
        badges: isBoss ? state.badges + 1 : state.badges,
      }

      if (isBoss) clearRun()
      else saveRun(next)
      return ok(next)
    }

    case 'RETURN_TO_MAP': {
      const next: RunState = { ...state, screen: 'map', postBattle: null }
      saveRun(next)
      return ok(next)
    }

    case 'CATCH_POKEMON': {
      const offer = state.catchOffer
      const party = offer
        ? applyCatchToParty(state.party, offer, action.accept, action.replaceUid)
        : state.party

      if (state.catchFromItem) {
        const next: RunState = {
          ...state,
          screen: 'market',
          party,
          catchOffer: null,
          catchFromItem: false,
        }
        saveRun(next)
        return ok(next)
      }

      const nodeId = state.battleNodeId
      if (!nodeId) return ok({ ...state, screen: 'map', catchOffer: null })

      const updatedMap = markNodeComplete(state.map, nodeId)
      const next: RunState = {
        ...state,
        screen: 'map',
        party,
        map: updatedMap,
        currentNodeId: nodeId,
        battleNodeId: null,
        catchOffer: null,
      }
      saveRun(next)
      return ok(next)
    }

    case 'GAME_OVER':
      clearRun()
      return ok({ ...initialState, screen: 'game-over', inventory: emptyInventory() })

    case 'VICTORY':
      return ok({ ...initialState, screen: 'victory', inventory: emptyInventory() })

    case 'RESET':
      clearRun()
      return ok({ ...initialState, inventory: emptyInventory() })

    default:
      return ok(state)
  }
}

function markNodeComplete(map: MapNode[], nodeId: string): MapNode[] {
  return map.map((n) => (n.id === nodeId ? { ...n, completed: true } : n))
}
