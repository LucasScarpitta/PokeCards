import type { PokemonInstance } from '../models/types'

interface EnemyTeamBallsProps {
  party: PokemonInstance[]
  activeIndex: number
}

export function EnemyTeamBalls({ party, activeIndex }: EnemyTeamBallsProps) {
  const remaining = party.filter((p) => p.currentHp > 0).length

  return (
    <div
      className="enemy-team-balls"
      aria-label={`Enemy team: ${remaining} of ${party.length} Pokémon remaining`}
    >
      {party.map((mon, i) => {
        const fainted = mon.currentHp <= 0
        const active = i === activeIndex && !fainted
        return (
          <span
            key={mon.uid}
            className={`pokeball-indicator ${fainted ? 'fainted' : ''} ${active ? 'active' : ''}`}
            title={fainted ? `${mon.name} (fainted)` : mon.name}
            aria-hidden="true"
          />
        )
      })}
    </div>
  )
}
