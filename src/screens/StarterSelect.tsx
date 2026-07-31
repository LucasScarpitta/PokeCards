import { useEffect, useState } from 'react'
import { createPokemonInstance } from '../api/mappers'
import type { PokemonInstance, PokemonType } from '../models/types'
import { TYPE_COLORS, typeLabel } from '../styles/typeColors'
import { ScreenHeader } from '../components/ScreenHeader'

const STARTERS = [
  { id: 1, name: 'Bulbasaur' },
  { id: 4, name: 'Charmander' },
  { id: 7, name: 'Squirtle' },
]

interface StarterSelectProps {
  onSelect: (speciesId: number) => void
  loading?: boolean
}

export function StarterSelect({ onSelect, loading }: StarterSelectProps) {
  const [starters, setStarters] = useState<PokemonInstance[]>([])
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState(false)

  const loadStarters = () => {
    setFetching(true)
    setError(false)
    Promise.all(STARTERS.map((s) => createPokemonInstance(s.id, 5)))
      .then(setStarters)
      .catch(() => setError(true))
      .finally(() => setFetching(false))
  }

  useEffect(() => {
    loadStarters()
  }, [])

  return (
    <div className="screen starter-screen">
      <ScreenHeader
        title="Choose Your Starter"
        subtitle="Your partner learns new move cards as it levels up."
      />

      {fetching && (
        <div className="starter-grid">
          {STARTERS.map((s) => (
            <div key={s.id} className="starter-card skeleton-card" aria-hidden="true">
              <div className="skeleton-block skeleton-sprite" />
              <div className="skeleton-block skeleton-title" />
              <div className="skeleton-block skeleton-text" />
            </div>
          ))}
        </div>
      )}

      {error && !fetching && (
        <div className="error-panel">
          <p>Could not load starters from PokéAPI.</p>
          <button type="button" className="btn primary" onClick={loadStarters}>
            Retry
          </button>
        </div>
      )}

      {!fetching && !error && (
        <div className="starter-grid">
          {starters.map((mon) => (
            <button
              key={mon.speciesId}
              type="button"
              className="starter-card"
              onClick={() => onSelect(mon.speciesId)}
              disabled={loading}
            >
              <img src={mon.spriteUrl} alt={mon.name} />
              <h2>{mon.name}</h2>
              <div className="starter-types">
                {mon.types.map((t) => (
                  <TypeBadge key={t} type={t} />
                ))}
              </div>
              <p>{mon.unlockedMoveIds.length} starting move cards</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function TypeBadge({ type }: { type: PokemonType }) {
  return (
    <span
      className="type-badge"
      style={{ background: TYPE_COLORS[type], color: '#fff' }}
    >
      {typeLabel(type)}
    </span>
  )
}
