import { formatBuffSummary } from '../game/items'
import { getAvailableNodes } from '../game/map'
import type { MapNode, RunState } from '../models/types'

interface RunMapViewProps {
  state: RunState
  onSelectNode: (nodeId: string) => void
  onOpenMarket: () => void
  loading?: boolean
}

const NODE_ICONS: Record<MapNode['type'], string> = {
  wild: 'W',
  trainer: 'T',
  rest: 'R',
  catch: 'C',
  boss: 'B',
}

export function RunMapView({ state, onSelectNode, onOpenMarket, loading }: RunMapViewProps) {
  const available = getAvailableNodes(state.map, state.currentNodeId)
  const maxRow = Math.max(...state.map.map((n) => n.row))

  return (
    <div className="run-map">
      <header className="map-header">
        <div className="map-header-top">
          <div>
            <h1>Route Map</h1>
            <p>Choose your next destination. Clear nodes to reach the Gym Leader.</p>
          </div>
          <div className="map-hud">
            <span className="gold-display compact">
              <span className="gold-label">Gold</span>
              <span className="gold-amount">{state.gold} G</span>
            </span>
            <button type="button" className="btn primary" onClick={onOpenMarket} disabled={loading}>
              PokéMarket
            </button>
          </div>
        </div>
        {state.pendingBattleBuffs.length > 0 && (
          <p className="buff-banner compact">
            Next battle: {formatBuffSummary(state.pendingBattleBuffs)}
          </p>
        )}
      </header>

      <div className="map-grid" style={{ gridTemplateRows: `repeat(${maxRow + 1}, 1fr)` }}>
        {state.map.map((node) => {
          const isAvailable = available.some((n) => n.id === node.id)
          const isCurrent = state.currentNodeId === node.id

          return (
            <button
              key={node.id}
              type="button"
              className={`map-node type-${node.type} ${node.completed ? 'completed' : ''} ${isAvailable ? 'available' : ''} ${isCurrent ? 'current' : ''}`}
              style={{ gridRow: node.row + 1, gridColumn: node.col + 1 }}
              onClick={() => isAvailable && onSelectNode(node.id)}
              disabled={!isAvailable || loading}
            >
              <span className="node-icon">{NODE_ICONS[node.type]}</span>
              <span className="node-label">{node.label}</span>
              {node.completed && <span className="node-done">✓</span>}
            </button>
          )
        })}
      </div>

      <PartySummary party={state.party} />
    </div>
  )
}

function PartySummary({ party }: { party: RunState['party'] }) {
  return (
    <div className="party-summary">
      <h3>Your Team ({party.length}/6)</h3>
      <div className="party-summary-row">
        {party.map((mon) => (
          <div key={mon.uid} className="party-summary-mon">
            <img src={mon.spriteUrl} alt={mon.name} />
            <span>{mon.name} Lv.{mon.level}</span>
            <span className="mon-hp">{mon.currentHp}/{mon.maxHp} HP</span>
            <span className="moves-count">{mon.unlockedMoveIds.length} cards</span>
          </div>
        ))}
      </div>
    </div>
  )
}
