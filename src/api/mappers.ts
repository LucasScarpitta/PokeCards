import {
  FALLBACK_VERSION_GROUPS,
  fetchMove,
  fetchPokemon,
  moveIdFromUrl,
  VERSION_GROUP,
} from './pokeapi'
import { computeStats, xpForLevel } from '../game/formulas'
import type {
  LearnsetEntry,
  MoveCard,
  PokemonInstance,
  PokemonStats,
  PokemonType,
} from '../models/types'

function formatName(name: string): string {
  return name
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function parseType(name: string): PokemonType {
  return name as PokemonType
}

function parseStats(raw: { base_stat: number; stat: { name: string } }[]): PokemonStats {
  const map = Object.fromEntries(raw.map((s) => [s.stat.name, s.base_stat]))
  return {
    hp: map.hp ?? 1,
    attack: map.attack ?? 1,
    defense: map.defense ?? 1,
    specialAttack: map['special-attack'] ?? 1,
    specialDefense: map['special-defense'] ?? 1,
    speed: map.speed ?? 1,
  }
}

export function extractLearnset(
  moves: Awaited<ReturnType<typeof fetchPokemon>>['moves'],
): LearnsetEntry[] {
  const byMove = new Map<number, { moveName: string; level: number }>()

  for (const entry of moves) {
    const moveId = moveIdFromUrl(entry.move.url)
    const levelUpDetails = entry.version_group_details.filter(
      (d) => d.move_learn_method.name === 'level-up',
    )

    let bestLevel: number | null = null
    for (const vg of [VERSION_GROUP, ...FALLBACK_VERSION_GROUPS]) {
      const match = levelUpDetails.find((d) => d.version_group.name === vg)
      if (match) {
        bestLevel =
          bestLevel === null
            ? match.level_learned_at
            : Math.min(bestLevel, match.level_learned_at)
        break
      }
    }

    if (bestLevel === null) {
      const any = levelUpDetails.sort(
        (a, b) => a.level_learned_at - b.level_learned_at,
      )[0]
      if (any) bestLevel = any.level_learned_at
    }

    if (bestLevel !== null) {
      const existing = byMove.get(moveId)
      if (!existing || bestLevel < existing.level) {
        byMove.set(moveId, { moveName: entry.move.name, level: bestLevel })
      }
    }
  }

  return [...byMove.entries()]
    .map(([moveId, { moveName, level }]) => ({ moveId, moveName, level }))
    .sort((a, b) => a.level - b.level || a.moveId - b.moveId)
}

export async function mapMoveToCard(moveId: number): Promise<MoveCard | null> {
  const move = await fetchMove(moveId)
  if (move.power === null || move.damage_class.name === 'status') return null

  return {
    moveId: move.id,
    name: formatName(move.name),
    type: parseType(move.type.name),
    power: move.power,
    accuracy: move.accuracy,
    damageClass: move.damage_class.name as MoveCard['damageClass'],
  }
}

export async function getUnlockedMoveIds(
  learnset: LearnsetEntry[],
  level: number,
): Promise<number[]> {
  const candidates = learnset.filter((e) => e.level <= level)
  const cards: number[] = []

  for (const entry of candidates) {
    const card = await mapMoveToCard(entry.moveId)
    if (card) cards.push(entry.moveId)
  }

  return [...new Set(cards)]
}

export async function createPokemonInstance(
  speciesId: number,
  level: number,
  uid?: string,
): Promise<PokemonInstance> {
  const data = await fetchPokemon(speciesId)
  const learnset = extractLearnset(data.moves)
  const baseStats = parseStats(data.stats)
  const types = data.types
    .sort((a, b) => a.slot - b.slot)
    .map((t) => parseType(t.type.name))

  const unlockedMoveIds = await getUnlockedMoveIds(learnset, level)

  const stats = computeStats(baseStats, level)
  const spriteUrl =
    data.sprites.other?.['official-artwork']?.front_default ??
    data.sprites.front_default ??
    ''

  return {
    uid: uid ?? crypto.randomUUID(),
    speciesId: data.id,
    name: formatName(data.name),
    level,
    xp: xpForLevel(level),
    types,
    baseStats,
    stats,
    currentHp: stats.hp,
    maxHp: stats.hp,
    spriteUrl,
    unlockedMoveIds,
    learnset,
  }
}

export { formatName }
