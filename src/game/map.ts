import type { MapNode, NodeType } from '../models/types'
import { BOSS_SPECIES, CATCH_POOL, seededRandom, TRAINER_POOL, WILD_POOL, pickRandom } from './rng'

interface NodeTemplate {
  type: NodeType
  label: string
  row: number
  col: number
  connections: number[]
}

function nodeId(row: number, col: number): string {
  return `n-${row}-${col}`
}

export function generateMap(seed: number): MapNode[] {
  const rng = seededRandom(seed)
  const nodes: MapNode[] = []

  const layout: NodeTemplate[] = [
    { type: 'wild', label: 'Tall Grass', row: 0, col: 1, connections: [1, 2] },
    { type: 'rest', label: 'Pokémon Center', row: 1, col: 0, connections: [4] },
    { type: 'wild', label: 'Forest Path', row: 1, col: 1, connections: [4, 5] },
    { type: 'catch', label: 'Mystery Patch', row: 1, col: 2, connections: [5] },
    { type: 'trainer', label: 'Young Trainer', row: 2, col: 0, connections: [7] },
    { type: 'wild', label: 'Rocky Trail', row: 2, col: 1, connections: [7, 8] },
    { type: 'rest', label: 'Camp Site', row: 2, col: 2, connections: [8] },
    { type: 'trainer', label: 'Ace Trainer', row: 3, col: 0, connections: [10] },
    { type: 'catch', label: 'Hidden Grove', row: 3, col: 1, connections: [10] },
    { type: 'wild', label: 'Dark Cave', row: 3, col: 2, connections: [10] },
    { type: 'boss', label: 'Gym Leader', row: 4, col: 1, connections: [] },
  ]

  const starterLevel = 5

  /** Rows 0–1 stay near starter level; depth grows ~1 level every 2 rows after that. */
  function enemyLevel(row: number, slotBonus = 0): number {
    const depth = Math.max(0, Math.floor((row - 1) / 2))
    return starterLevel + depth + slotBonus + Math.floor(rng() * 2)
  }

  for (let i = 0; i < layout.length; i++) {
    const t = layout[i]
    const id = nodeId(t.row, t.col)
    const conns = t.connections.map((idx) => nodeId(layout[idx].row, layout[idx].col))

    let enemySpeciesIds: number[] | undefined
    let enemyLevels: number[] | undefined

    if (t.type === 'wild') {
      const species = pickRandom(WILD_POOL, rng)
      enemySpeciesIds = [species]
      enemyLevels = [enemyLevel(t.row)]
    } else if (t.type === 'trainer') {
      const team = pickRandom(TRAINER_POOL, rng)
      enemySpeciesIds = team
      enemyLevels = team.map((_, j) => enemyLevel(t.row, j))
    } else if (t.type === 'boss') {
      const boss = pickRandom(BOSS_SPECIES, rng)
      enemySpeciesIds = [boss]
      enemyLevels = [starterLevel + 7]
    }

    nodes.push({
      id,
      type: t.type,
      label: t.label,
      completed: false,
      connections: conns,
      enemySpeciesIds,
      enemyLevels,
      row: t.row,
      col: t.col,
    })
  }

  return nodes
}

export function getStartNodeId(map: MapNode[]): string {
  return map.find((n) => n.row === 0)?.id ?? map[0].id
}

export function getAvailableNodes(map: MapNode[], currentNodeId: string | null): MapNode[] {
  if (!currentNodeId) {
    return map.filter((n) => n.row === 0)
  }
  const current = map.find((n) => n.id === currentNodeId)
  if (!current) return []
  return map.filter((n) => current.connections.includes(n.id) && !n.completed)
}

export function pickCatchSpecies(seed: number, index: number): number {
  const rng = seededRandom(seed + index * 7919)
  return pickRandom(CATCH_POOL, rng)
}

export function pickCatchLevel(seed: number, index: number, row: number): number {
  const rng = seededRandom(seed + index * 3571)
  const depth = Math.max(0, Math.floor((row - 1) / 2))
  return 5 + depth + Math.floor(rng() * 2)
}
