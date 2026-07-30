import { useEffect, useState } from 'react'
import { createPokemonInstance } from '../api/mappers'
import type { PokemonInstance } from '../models/types'

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

  useEffect(() => {
    Promise.all(STARTERS.map((s) => createPokemonInstance(s.id, 5)))
      .then(setStarters)
      .finally(() => setFetching(false))
  }, [])

  return (
    <div className="screen starter-screen">
      <h1>Choose Your Starter</h1>
      <p>Your partner learns new move cards as it levels up.</p>

      {fetching ? (
        <p className="loading-text">Loading starters from PokéAPI...</p>
      ) : (
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
                  <span key={t} className={`type-badge type-${t}`}>
                    {t}
                  </span>
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
