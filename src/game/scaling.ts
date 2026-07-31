import type { NodeType, PokemonInstance } from '../models/types'

export function partyAverageLevel(party: PokemonInstance[]): number {
  if (party.length === 0) return 5
  const sum = party.reduce((s, p) => s + p.level, 0)
  return Math.round(sum / party.length)
}

export function scaleEnemyLevel(
  party: PokemonInstance[],
  nodeType: NodeType,
  slotIndex: number,
  rng: () => number = Math.random,
): number {
  const avg = partyAverageLevel(party)
  const minLevel = 1

  if (nodeType === 'wild') {
    const variance = Math.floor(rng() * 2)
    return Math.max(minLevel, avg - 1 + variance)
  }

  if (nodeType === 'trainer') {
    return Math.max(minLevel, avg + slotIndex)
  }

  if (nodeType === 'boss') {
    return Math.max(minLevel, avg + 1)
  }

  return Math.max(minLevel, avg)
}

export function scaleCatchLevel(party: PokemonInstance[], rng: () => number = Math.random): number {
  const avg = partyAverageLevel(party)
  const variance = Math.floor(rng() * 2)
  return Math.max(1, avg - 1 + variance)
}
