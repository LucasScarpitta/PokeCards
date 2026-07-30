import { useCallback, useEffect, useRef, useState } from 'react'
import { playerPlayCard, playerSwitch } from '../game/battle'
import { applyXpToParty } from '../game/xp'
import { CardHand } from '../components/CardHand'
import { PartyTray } from '../components/PartyTray'
import { PokemonSprite } from '../components/PokemonSprite'
import type { BattleState, PostBattleResult, RunState } from '../models/types'

interface BattleScreenProps {
  state: RunState
  onBattleUpdate: (battle: BattleState) => void
  onBattleEnd: (party: RunState['party'], postBattle: Omit<PostBattleResult, 'goldGained'>) => void
  onGameOver: () => void
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
    logRef.current?.scrollTo(0, logRef.current.scrollHeight)
  }, [localBattle.log])

  const finishIfDone = useCallback(
    async (next: BattleState) => {
      if (next.turn !== 'ended') return false

      if (next.winner === 'enemy') {
        onGameOver()
        return true
      }

      const { party, levelUps } = await applyXpToParty(
        next.playerParty,
        next.xpReward,
      )

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

  return (
    <div className="screen battle-screen">
      <div className="battle-arena">
        <div className="battle-field">
          <PokemonSprite pokemon={enemyActive} side="enemy" />
          <PokemonSprite pokemon={playerActive} side="player" />
        </div>

        <div className="battle-log" ref={logRef}>
          {localBattle.log.map((line, i) => (
            <p key={i}>{line}</p>
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
      </div>
    </div>
  )
}
