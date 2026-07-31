interface LoadingOverlayProps {
  visible: boolean
}

export function LoadingOverlay({ visible }: LoadingOverlayProps) {
  if (!visible) return null

  return (
    <div className="loading-overlay" aria-busy="true" aria-label="Loading">
      <div className="spinner" />
    </div>
  )
}
