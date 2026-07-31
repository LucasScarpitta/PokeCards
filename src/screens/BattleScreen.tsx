import { useCallback, useEffect, useRef, useState } from 'react'
import { playerPlayCard, playerSwitch } from '../game/battle'
import { applyXpToParty } from '../game/xp'
import { CardHand } from '../components/CardHand'
import { PartyTray } from '../components/PartyTray'
import { PokemonSprite } from '../components/PokemonSprite'
import { EnemyTeamBalls } from '../components/EnemyTeamBalls'
import type { BattleState, PostBattleResult, RunState } from '../models/types'

interface BattleScreenProps {
  state: RunState
  onBattleUpdate: (battle: BattleState) => void
  onBattleEnd: (party: RunState['party'], postBattle: Omit<PostBattleResult, 'goldGained'>) => void
  onGameOver: () => void
}

function turnBanner(battle: BattleState): string {
  if (battle.turn === 'ended') return 'Battle ended'
  if (battle.mustSwitch) return 'Choose a Pokémon'
  if (battle.turn === 'player') return 'Your turn'
  return 'Enemy turn...'
}

export function BattleScreen({
  state,
  onBattleUpdate,
  onBattleEnd,
  onGameOver,
}: BattleScreenProps) {
  const battle = state.battle!
  const [localBattle, setLocalBattle] = useState(battle)
  const [busy, setBusy] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLocalBattle(battle)
  }, [battle])

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [localBattle.log])

  const finishIfDone = useCallback(
    async (next: BattleState) => {
      if (next.turn !== 'ended') return false

      if (next.winner === 'enemy') {
        onGameOver()
        return true
      }

      const { party, levelUps } = await applyXpToParty(next.playerParty, next.xpReward)

      onBattleEnd(party, {
        xpGained: next.xpReward,
        levelUps,
        nodeId: state.battleNodeId!,
      })
      return true
    },
    [onBattleEnd, onGameOver, state.battleNodeId],
  )

  const handlePlay = async (index: number) => {
    if (busy || localBattle.turn !== 'player' || localBattle.mustSwitch) return
    setBusy(true)
    try {
      const next = await playerPlayCard(localBattle, index)
      setLocalBattle(next)
      onBattleUpdate(next)
      await finishIfDone(next)
    } finally {
      setBusy(false)
    }
  }

  const handleSwitch = async (index: number) => {
    if (busy || localBattle.turn !== 'player') return
    if (index === localBattle.playerActiveIndex && !localBattle.mustSwitch) return
    setBusy(true)
    try {
      const next = await playerSwitch(localBattle, index)
      setLocalBattle(next)
      onBattleUpdate(next)
      await finishIfDone(next)
    } finally {
      setBusy(false)
    }
  }

  const playerActive = localBattle.playerParty[localBattle.playerActiveIndex]
  const enemyActive = localBattle.enemyParty[localBattle.enemyActiveIndex]
  const lastLogIndex = localBattle.log.length - 1
  const showEnemyBalls =
    localBattle.nodeType === 'trainer' || localBattle.nodeType === 'boss'

  return (
    <div className="screen battle-screen">
      <div className={`battle-arena ${busy ? 'is-busy' : ''}`}>
        <div className="turn-banner" role="status">
          {turnBanner(localBattle)}
        </div>

        <div className="battle-field">
          <div className="battle-side battle-side-enemy">
            {showEnemyBalls && (
              <EnemyTeamBalls
                party={localBattle.enemyParty}
                activeIndex={localBattle.enemyActiveIndex}
              />
            )}
            <PokemonSprite pokemon={enemyActive} side="enemy" />
          </div>
          <PokemonSprite pokemon={playerActive} side="player" />
        </div>

        <div className="battle-log" ref={logRef} aria-live="polite" aria-relevant="additions">
          {localBattle.log.map((line, i) => (
            <p key={i} className={i === lastLogIndex ? 'log-latest' : undefined}>
              {line}
            </p>
          ))}
        </div>

        <PartyTray
          party={localBattle.playerParty}
          activeIndex={localBattle.playerActiveIndex}
          onSwitch={handleSwitch}
          disabled={busy || localBattle.turn !== 'player'}
          mustSwitch={localBattle.mustSwitch}
        />

        {!localBattle.mustSwitch && (
          <CardHand
            hand={localBattle.playerHand}
            onPlay={handlePlay}
            disabled={busy || localBattle.turn !== 'player'}
          />
        )}

        {busy && (
          <div className="battle-busy" aria-busy="true" aria-label="Resolving turn">
            <div className="spinner" />
          </div>
        )}
      </div>
    </div>
  )
}
