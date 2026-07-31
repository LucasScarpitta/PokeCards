import type { RunState } from '../models/types'

interface EndScreenProps {
  variant: 'game-over' | 'victory'
  state: RunState
  onRestart: () => void
  loading?: boolean
}

export function EndScreen({ variant, state, onRestart, loading }: EndScreenProps) {
  const isVictory = variant === 'victory'
  const hasStats = state.party.length > 0 || state.gold > 0 || state.badges > 0

  return (
    <div className={`screen end-screen ${variant}`}>
      <h1>{isVictory ? 'You are the Champion!' : 'Game Over'}</h1>
      <p>
        {isVictory
          ? 'You defeated the Gym Leader and cleared the route!'
          : 'Your team was wiped out. Better luck on the next run.'}
      </p>

      {hasStats && (
        <div className="run-stats">
          {state.gold > 0 && <p>Gold earned: <strong>{state.gold} G</strong></p>}
          {state.party.length > 0 && (
            <p>Team size: <strong>{state.party.length}</strong></p>
          )}
          {state.badges > 0 && (
            <p>Badges: <strong>{'★'.repeat(state.badges)}</strong></p>
          )}
        </div>
      )}

      <button type="button" className="btn primary" onClick={onRestart} disabled={loading}>
        {isVictory ? 'Play Again' : 'Try Again'}
      </button>
    </div>
  )
}
