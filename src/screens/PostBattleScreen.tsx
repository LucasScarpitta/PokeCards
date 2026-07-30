import type { PostBattleResult } from '../models/types'

interface PostBattleScreenProps {
  result: PostBattleResult
  onContinue: () => void
}

export function PostBattleScreen({ result, onContinue }: PostBattleScreenProps) {
  return (
    <div className="screen post-battle-screen">
      <h1>Victory!</h1>
      <p className="xp-gained">+{result.xpGained} XP for your team</p>
      <p className="gold-gained">+{result.goldGained} Gold</p>

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
                  <ul>
                    {lu.newMoves.map((m) => (
                      <li key={m.moveId}>{m.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p>No level ups this battle.</p>
      )}

      <button type="button" className="btn primary" onClick={onContinue}>
        Continue
      </button>
    </div>
  )
}
