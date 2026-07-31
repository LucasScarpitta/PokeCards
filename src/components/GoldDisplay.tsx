interface GoldDisplayProps {
  amount: number
  compact?: boolean
}

export function GoldDisplay({ amount, compact }: GoldDisplayProps) {
  return (
    <div className={`gold-display ${compact ? 'compact' : ''}`}>
      <span className="gold-label">Gold</span>
      <span className="gold-amount">{amount} G</span>
    </div>
  )
}
