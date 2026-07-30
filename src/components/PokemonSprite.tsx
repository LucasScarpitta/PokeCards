import type { PokemonInstance } from '../models/types'

interface HpBarProps {
  current: number
  max: number
  label?: string
}

export function HpBar({ current, max, label }: HpBarProps) {
  const pct = max > 0 ? Math.max(0, (current / max) * 100) : 0
  const color = pct > 50 ? 'var(--hp-high)' : pct > 20 ? 'var(--hp-mid)' : 'var(--hp-low)'

  return (
    <div className="hp-bar">
      {label && <span className="hp-label">{label}</span>}
      <div className="hp-track">
        <div className="hp-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="hp-text">
        {current}/{max}
      </span>
    </div>
  )
}

interface PokemonSpriteProps {
  pokemon: PokemonInstance
  side?: 'player' | 'enemy'
}

export function PokemonSprite({ pokemon, side = 'player' }: PokemonSpriteProps) {
  return (
    <div className={`pokemon-sprite ${side}`}>
      <img src={pokemon.spriteUrl} alt={pokemon.name} />
      <div className="pokemon-info">
        <strong>{pokemon.name}</strong>
        <span>Lv.{pokemon.level}</span>
      </div>
      <HpBar current={pokemon.currentHp} max={pokemon.maxHp} />
    </div>
  )
}
