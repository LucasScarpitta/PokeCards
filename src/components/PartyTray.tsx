import type { PokemonInstance } from '../models/types'

interface PartyTrayProps {
  party: PokemonInstance[]
  activeIndex: number
  onSwitch: (index: number) => void
  disabled?: boolean
  mustSwitch?: boolean
}

export function PartyTray({
  party,
  activeIndex,
  onSwitch,
  disabled,
  mustSwitch,
}: PartyTrayProps) {
  return (
    <div className="party-tray">
      <h3>{mustSwitch ? 'Choose next Pokémon' : 'Team'}</h3>
      <div className="party-slots">
        {party.map((mon, i) => {
          const fainted = mon.currentHp <= 0
          const active = i === activeIndex
          return (
            <button
              key={mon.uid}
              type="button"
              className={`party-slot ${active ? 'active' : ''} ${fainted ? 'fainted' : ''}`}
              onClick={() => onSwitch(i)}
              disabled={disabled || fainted || (active && !mustSwitch)}
              title={`${mon.name} Lv.${mon.level}`}
            >
              <img src={mon.spriteUrl} alt={mon.name} />
              {fainted && <span className="fainted-mark" aria-hidden="true">✕</span>}
              <span className="party-hp">
                {mon.currentHp}/{mon.maxHp}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
