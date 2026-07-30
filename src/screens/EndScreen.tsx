interface EndScreenProps {
  variant: 'game-over' | 'victory'
  onRestart: () => void
}

export function EndScreen({ variant, onRestart }: EndScreenProps) {
  const isVictory = variant === 'victory'

  return (
    <div className={`screen end-screen ${variant}`}>
      <h1>{isVictory ? 'You are the Champion!' : 'Game Over'}</h1>
      <p>
        {isVictory
          ? 'You defeated the Gym Leader and cleared the route!'
          : 'Your team was wiped out. Better luck on the next run.'}
      </p>
      <button type="button" className="btn primary" onClick={onRestart}>
        {isVictory ? 'Play Again' : 'Try Again'}
      </button>
    </div>
  )
}
