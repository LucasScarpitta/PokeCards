import type { MapNode, NodeType, PokemonType } from '../models/types'
import {
  CATCH_POOL,
  pickBossSpecies,
  pickRandom,
  pickTrainerTeam,
  pickWildSpecies,
  seededRandom,
} from './rng'

const ROWS = 5
const COLS = 3

const NODE_LABELS: Record<Exclude<NodeType, 'boss'>, string[]> = {
  wild: ['Tall Grass', 'Forest Path', 'Rocky Trail', 'Dark Cave', 'Seaside Route', 'Murky Swamp'],
  trainer: ['Young Trainer', 'Ace Trainer', 'Rival', 'Hiker', 'Bug Catcher'],
  rest: ['Pokémon Center', 'Camp Site', 'Safe Haven'],
  catch: ['Mystery Patch', 'Hidden Grove', 'Rare Spot'],
}

interface GridCell {
  type: NodeType
  label: string
}

function nodeId(row: number, col: number): string {
  return `n-${row}-${col}`
}

function cellAt(grid: (GridCell | null)[][], row: number, col: number): GridCell | null {
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null
  return grid[row][col]
}

function pickWeightedType(row: number, rng: () => number): Exclude<NodeType, 'boss'> {
  const tables: Record<number, [Exclude<NodeType, 'boss'>, number][]> = {
    1: [
      ['wild', 4],
      ['rest', 2],
      ['catch', 2],
      ['trainer', 1],
    ],
    2: [
      ['wild', 3],
      ['trainer', 3],
      ['rest', 2],
      ['catch', 1],
    ],
    3: [
      ['wild', 3],
      ['trainer', 3],
      ['catch', 2],
      ['rest', 1],
    ],
  }

  const entries = tables[row] ?? tables[3]
  const total = entries.reduce((sum, [, w]) => sum + w, 0)
  let roll = rng() * total

  for (const [type, weight] of entries) {
    roll -= weight
    if (roll <= 0) return type
  }

  return 'wild'
}

function buildGrid(rng: () => number): (GridCell | null)[][] {
  const usedLabels = new Set<string>()
  const grid: (GridCell | null)[][] = []

  const pickLabel = (type: Exclude<NodeType, 'boss'>): string => {
    const pool = [...NODE_LABELS[type]]
    const available = pool.filter((l) => !usedLabels.has(l))
    const source = available.length > 0 ? available : pool
    const label = pickRandom(source, rng)
    usedLabels.add(label)
    return label
  }

  for (let row = 0; row < ROWS; row++) {
    const line: (GridCell | null)[] = []
    for (let col = 0; col < COLS; col++) {
      const isStart = row === 0 && col === 1
      const isBoss = row === ROWS - 1 && col === 1
      const isMiddleColumnOnly = row === 0 || row === ROWS - 1

      if (isMiddleColumnOnly && !isStart && !isBoss) {
        line.push(null)
        continue
      }

      if (isStart) {
        line.push({ type: 'wild', label: 'Tall Grass' })
      } else if (isBoss) {
        line.push({ type: 'boss', label: 'Gym Leader' })
      } else {
        const type = pickWeightedType(row, rng)
        line.push({ type, label: pickLabel(type) })
      }
    }
    grid.push(line)
  }

  return grid
}

export function generateMap(seed: number, starterTypes?: PokemonType[]): MapNode[] {
  const rng = seededRandom(seed)
  const grid = buildGrid(rng)
  const nodes: MapNode[] = []

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = cellAt(grid, row, col)
      if (!cell) continue

      const id = nodeId(row, col)
      let enemySpeciesIds: number[] | undefined

      if (cell.type === 'wild') {
        enemySpeciesIds = [pickWildSpecies(row, rng, starterTypes)]
      } else if (cell.type === 'trainer') {
        enemySpeciesIds = pickTrainerTeam(row, rng, starterTypes)
      } else if (cell.type === 'boss') {
        enemySpeciesIds = [pickBossSpecies(row, rng)]
      }

      nodes.push({
        id,
        type: cell.type,
        label: cell.label,
        completed: false,
        connections: [],
        enemySpeciesIds,
        row,
        col,
      })
    }
  }

  return nodes
}

export function getStartNodeId(map: MapNode[]): string {
  return map.find((n) => n.row === 0)?.id ?? map[0].id
}

/** Each row unlocks all nodes in the next row — pick any of the 3 options. */
export function getAvailableNodes(map: MapNode[], currentNodeId: string | null): MapNode[] {
  if (!currentNodeId) {
    return map.filter((n) => n.row === 0 && !n.completed)
  }

  const current = map.find((n) => n.id === currentNodeId)
  if (!current) return []

  const nextRow = current.row + 1
  return map.filter((n) => n.row === nextRow && !n.completed)
}

export function pickCatchSpecies(seed: number, index: number): number {
  const rng = seededRandom(seed + index * 7919)
  return pickRandom(CATCH_POOL, rng)
}
