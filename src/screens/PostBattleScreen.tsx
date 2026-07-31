import type { PostBattleResult } from '../models/types'
import { TYPE_COLORS, typeLabel } from '../styles/typeColors'

interface PostBattleScreenProps {
  result: PostBattleResult
  onContinue: () => void
  loading?: boolean
}

export function PostBattleScreen({ result, onContinue, loading }: PostBattleScreenProps) {
  return (
    <div className="screen post-battle-screen">
      <h1>Victory!</h1>

      <div className="reward-cards">
        <div className="reward-card reward-card-1">
          <span className="reward-label">XP</span>
          <span className="reward-value">+{result.xpGained}</span>
        </div>
        <div className="reward-card reward-card-2">
          <span className="reward-label">Gold</span>
          <span className="reward-value">+{result.goldGained} G</span>
        </div>
      </div>

      {result.levelUps.length > 0 ? (
        <div className="level-ups">
          <h2>Level Ups</h2>
          {result.levelUps.map((lu) => (
            <div key={lu.pokemonUid} className="level-up-card">
              <p>
                <strong>{lu.pokemonName}</strong> reached Lv.{lu.newLevel}!
              </p>
              {lu.newMoves.length > 0 && (
                <div className="new-cards">
                  <span>New cards unlocked:</span>
                  <div className="new-cards-row">
                    {lu.newMoves.map((m) => (
                      <span
                        key={m.moveId}
                        className="move-card mini-move-card"
                        style={{ borderColor: TYPE_COLORS[m.type] }}
                      >
                        <span className="card-name">{m.name}</span>
                        <span
                          className="card-type"
                          style={{ background: TYPE_COLORS[m.type] }}
                        >
                          {typeLabel(m.type)}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p>No level ups this battle.</p>
      )}

      <button type="button" className="btn primary" onClick={onContinue} disabled={loading}>
        Continue
      </button>
    </div>
  )
}
