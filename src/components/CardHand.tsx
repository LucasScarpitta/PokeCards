import type { MoveCard } from '../models/types'
import { TYPE_COLORS, typeLabel } from '../styles/typeColors'

interface CardHandProps {
  hand: MoveCard[]
  onPlay: (index: number) => void
  disabled?: boolean
}

export function CardHand({ hand, onPlay, disabled }: CardHandProps) {
  if (hand.length === 0) {
    return <p className="empty-hand">No move cards unlocked yet.</p>
  }

  return (
    <div className="card-hand">
      {hand.map((card, i) => (
        <button
          key={`${card.moveId}-${i}`}
          type="button"
          className="move-card"
          style={{ borderColor: TYPE_COLORS[card.type] }}
          onClick={() => onPlay(i)}
          disabled={disabled}
        >
          <span className="card-power">{card.power}</span>
          <span className="card-name">{card.name}</span>
          <span
            className="card-type"
            style={{ background: TYPE_COLORS[card.type] }}
          >
            {typeLabel(card.type)}
          </span>
        </button>
      ))}
    </div>
  )
}
