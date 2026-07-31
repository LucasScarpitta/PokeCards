import { loadRun } from '../state/persistence'

interface HomeScreenProps {
  onNewRun: () => void
  onContinue: () => void
  loading?: boolean
}

export function HomeScreen({ onNewRun, onContinue, loading }: HomeScreenProps) {
  const hasSave = !!loadRun()

  return (
    <div className="screen home-screen">
      <div className="home-deco" aria-hidden="true">
        <span className="home-card home-card-1" />
        <span className="home-card home-card-2" />
        <span className="home-card home-card-3" />
      </div>
      <div className="home-hero">
        <p className="eyebrow">Pokémon Roguelike</p>
        <h1>PokeCards</h1>
        <p className="tagline">
          Battle with move cards unlocked as your Pokémon level up. Data powered by PokéAPI.
        </p>
        <div className="home-actions">
          <button type="button" className="btn primary" onClick={onNewRun} disabled={loading}>
            New Run
          </button>
          {hasSave && (
            <button type="button" className="btn secondary" onClick={onContinue} disabled={loading}>
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
