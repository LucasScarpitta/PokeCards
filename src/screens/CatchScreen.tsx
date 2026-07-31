import { useState } from 'react'
import type { PokemonInstance, PokemonType } from '../models/types'
import { TYPE_COLORS, typeLabel } from '../styles/typeColors'

interface CatchScreenProps {
  offer: PokemonInstance
  party: PokemonInstance[]
  fromItem?: boolean
  onAccept: (replaceUid?: string) => void
  onDecline: () => void
  loading?: boolean
}

export function CatchScreen({
  offer,
  party,
  fromItem,
  onAccept,
  onDecline,
  loading,
}: CatchScreenProps) {
  const full = party.length >= 6
  const [replaceUid, setReplaceUid] = useState<string | null>(null)

  return (
    <div className="screen catch-screen">
      <div className="encounter-card">
        <h1>{fromItem ? 'Gotcha!' : `A wild ${offer.name} appeared!`}</h1>
        {fromItem && (
          <p className="catch-intro">
            Your Poké Ball caught a Lv.{offer.level} {offer.name}.
          </p>
        )}
        <img className="catch-sprite" src={offer.spriteUrl} alt={offer.name} />
        <p>Lv.{offer.level} · {offer.unlockedMoveIds.length} move cards</p>
        <div className="starter-types">
          {offer.types.map((t) => (
            <TypeBadge key={t} type={t} />
          ))}
        </div>

        {full ? (
          <>
            <p className="catch-prompt">
              Your team is full. Select a Pokémon to replace, or keep your current team.
            </p>
            <div className="replace-grid">
              {party.map((mon) => (
                <button
                  key={mon.uid}
                  type="button"
                  className={`replace-slot ${replaceUid === mon.uid ? 'selected' : ''}`}
                  onClick={() => setReplaceUid(mon.uid)}
                  disabled={loading}
                >
                  {replaceUid === mon.uid && (
                    <span className="replace-check" aria-hidden="true">✓</span>
                  )}
                  <img src={mon.spriteUrl} alt={mon.name} />
                  <span>{mon.name}</span>
                  <span className="replace-level">Lv.{mon.level}</span>
                  <span className="replace-hp">
                    {mon.currentHp}/{mon.maxHp} HP
                  </span>
                </button>
              ))}
            </div>
            <div className="catch-actions">
              <button
                type="button"
                className="btn primary"
                disabled={!replaceUid || loading}
                onClick={() => replaceUid && onAccept(replaceUid)}
              >
                Replace
              </button>
              <button type="button" className="btn secondary" onClick={onDecline} disabled={loading}>
                Keep current team
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="catch-prompt">Add this Pokémon to your team?</p>
            <div className="catch-actions">
              <button type="button" className="btn primary" onClick={() => onAccept()} disabled={loading}>
                Add to team
              </button>
              <button type="button" className="btn secondary" onClick={onDecline} disabled={loading}>
                Leave
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function TypeBadge({ type }: { type: PokemonType }) {
  return (
    <span className="type-badge" style={{ background: TYPE_COLORS[type], color: '#fff' }}>
      {typeLabel(type)}
    </span>
  )
}
