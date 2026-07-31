import type { PokemonType } from '../models/types'
import {
  pickBiasedSpecies,
  pickBiasedTrainerTeam,
  shouldBiasEarlyMatchup,
} from './matchup'

export function createSeed(): number {
  return Math.floor(Math.random() * 2147483647)
}

export function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

export function pickRandom<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]
}

export function pickNUnique<T>(arr: T[], n: number, rng: () => number): T[] {
  const copy = [...arr]
  const result: T[] = []
  while (result.length < n && copy.length > 0) {
    const idx = Math.floor(rng() * copy.length)
    result.push(copy.splice(idx, 1)[0])
  }
  return result
}

// Early-route wild Pokémon
export const WILD_POOL = [
  16, 19, 21, 23, 27, 29, 32, 35, 39, 41, 43, 46, 48, 50, 52, 54, 56, 58,
  60, 63, 66, 69, 74, 77, 81, 84, 86, 88, 92, 95, 96, 98, 100, 104, 109, 111,
]

// Mid-route wild Pokémon (row 3+)
export const WILD_POOL_MID = [
  30, 33, 37, 42, 44, 45, 47, 49, 53, 55, 57, 61, 64, 67, 70, 73, 75, 79,
  82, 85, 89, 93, 97, 101, 105, 110, 114, 118, 123, 125, 126, 127,
]

export const TRAINER_POOL_EARLY: number[][] = [
  [66, 69], [43, 46], [52, 54], [63, 96], [74, 95],
]

export const TRAINER_POOL_MID: number[][] = [
  [58, 77], [81, 100], [67, 75], [82, 89], [99, 112], [106, 107],
]

// Stage-2 / ace Pokémon appropriate for the first gym leader
export const EARLY_BOSS_POOL = [
  2, 5, 8, 64, 67, 93, 99, 106, 112, 118,
]

export const CATCH_POOL = [
  25, 133, 147, 152, 155, 158, 172, 175, 179, 187, 194, 203, 215, 220, 228,
]

export function pickWildSpecies(
  row: number,
  rng: () => number,
  starterTypes?: PokemonType[],
): number {
  const pool = row >= 3 ? WILD_POOL_MID : WILD_POOL
  if (starterTypes && shouldBiasEarlyMatchup(row)) {
    return pickBiasedSpecies(pool, starterTypes, rng)
  }
  return pickRandom(pool, rng)
}

export function pickTrainerTeam(
  row: number,
  rng: () => number,
  starterTypes?: PokemonType[],
): number[] {
  const pool = row >= 3 ? TRAINER_POOL_MID : TRAINER_POOL_EARLY
  if (starterTypes && shouldBiasEarlyMatchup(row)) {
    return pickBiasedTrainerTeam(pool, starterTypes, rng)
  }
  return pickRandom(pool, rng)
}

export function pickBossSpecies(row: number, rng: () => number): number {
  if (row <= 4) return pickRandom(EARLY_BOSS_POOL, rng)
  return pickRandom(EARLY_BOSS_POOL, rng)
}
