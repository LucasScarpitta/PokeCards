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

// Common wild Pokémon species IDs for early routes
export const WILD_POOL = [
  16, 19, 21, 23, 27, 29, 32, 35, 39, 41, 43, 46, 48, 50, 52, 54, 56, 58,
  60, 63, 66, 69, 74, 77, 81, 84, 86, 88, 92, 95, 96, 98, 100, 104, 109, 111,
]

export const TRAINER_POOL = [
  [66, 69], [58, 77], [43, 46], [52, 54], [63, 96], [74, 95], [81, 100],
]

export const BOSS_SPECIES = [6, 9, 3, 130, 149, 248] // Charizard, Blastoise, Venusaur, Gyarados, Dragonite, Tyranitar

export const CATCH_POOL = [
  25, 133, 147, 152, 155, 158, 172, 175, 179, 187, 194, 203, 215, 220, 228,
]
