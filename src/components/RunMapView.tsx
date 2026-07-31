import { formatBuffSummary } from '../game/items'
import { getAvailableNodes } from '../game/map'
import type { MapNode, RunState } from '../models/types'
import { HpBar } from './PokemonSprite'
import { GoldDisplay } from './GoldDisplay'

interface RunMapViewProps {
  state: RunState
  onSelectNode: (nodeId: string) => void
  onOpenMarket: () => void
  loading?: boolean
}

const NODE_META: Record<MapNode['type'], { icon: string; title: string }> = {
  wild: { icon: '🌿', title: 'Tall Grass' },
  trainer: { icon: '⚔', title: 'Trainer' },
  rest: { icon: '♥', title: 'Rest Stop' },
  catch: { icon: '◎', title: 'Catch' },
  boss: { icon: '★', title: 'Gym Leader' },
}

function nodeTitle(node: MapNode): string {
  const meta = NODE_META[node.type]
  const count = teamSize(node)
  if (count !== null) {
    return `${meta.title} · ${count} Pokémon`
  }
  return meta.title
}

function teamSize(node: MapNode): number | null {
  if (node.type !== 'trainer' && node.type !== 'boss') return null
  return node.enemySpeciesIds?.length ?? null
}

export function RunMapView({ state, onSelectNode, onOpenMarket, loading }: RunMapViewProps) {
  const available = getAvailableNodes(state.map, state.currentNodeId)
  const maxRow = Math.max(...state.map.map((n) => n.row))

  return (
    <div className="run-map screen">
      <header className="map-header map-header-sticky">
        <div className="map-header-top">
          <div>
            <h1>Route Map</h1>
            <p>After each step, pick any one of the three nodes in the next row.</p>
            {state.badges > 0 && (
              <p className="badge-display">Badges: {'★'.repeat(state.badges)}</p>
            )}
          </div>
          <div className="map-hud">
            <GoldDisplay amount={state.gold} compact />
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

      <p className="map-scroll-hint">Swipe to explore →</p>

      <div className="map-scroll-wrap">
        <div className="map-grid" style={{ gridTemplateRows: `repeat(${maxRow + 1}, 1fr)` }}>
          {state.map.map((node) => {
            const isAvailable = available.some((n) => n.id === node.id)
            const isCurrent = state.currentNodeId === node.id
            const meta = NODE_META[node.type]
            const enemies = teamSize(node)

            return (
              <button
                key={node.id}
                type="button"
                className={`map-node type-${node.type} ${node.completed ? 'completed' : ''} ${isAvailable ? 'available' : ''} ${isCurrent ? 'current' : ''}`}
                style={{ gridRow: node.row + 1, gridColumn: node.col + 1 }}
                onClick={() => isAvailable && onSelectNode(node.id)}
                disabled={!isAvailable || loading}
                title={nodeTitle(node)}
              >
                <span className="node-icon" aria-hidden="true">
                  {meta.icon}
                </span>
                <span className="node-label">{node.label}</span>
                {enemies !== null && (
                  <span className="node-team-size">{enemies} Pokémon</span>
                )}
                {node.completed && <span className="node-done">✓</span>}
              </button>
            )
          })}
        </div>
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
            <HpBar current={mon.currentHp} max={mon.maxHp} />
            <span className="moves-count">{mon.unlockedMoveIds.length} cards</span>
          </div>
        ))}
      </div>
    </div>
  )
}
