import type { PokemonType } from '../models/types'
import { getSpeciesTypes } from './speciesTypes'

type Chart = Partial<Record<PokemonType, Partial<Record<PokemonType, number>>>>

const TYPE_CHART: Chart = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
}

function attackMultiplier(attackType: PokemonType, defenderTypes: PokemonType[]): number {
  return defenderTypes.reduce((mult, def) => mult * (TYPE_CHART[attackType]?.[def] ?? 1), 1)
}

/** True if this species likely has STAB that is super effective vs the starter. */
export function isOffensiveThreatToStarter(
  speciesId: number,
  starterTypes: PokemonType[],
): boolean {
  const enemyTypes = getSpeciesTypes(speciesId)
  return enemyTypes.some((atk) => attackMultiplier(atk, starterTypes) >= 2)
}

export function isTeamOffensiveThreat(
  speciesIds: number[],
  starterTypes: PokemonType[],
): boolean {
  return speciesIds.some((id) => isOffensiveThreatToStarter(id, starterTypes))
}

export function pickBiasedSpecies(
  pool: number[],
  starterTypes: PokemonType[],
  rng: () => number,
  bias = 0.85,
): number {
  const neutral = pool.filter((id) => !isOffensiveThreatToStarter(id, starterTypes))

  if (neutral.length > 0 && rng() < bias) {
    return neutral[Math.floor(rng() * neutral.length)]
  }

  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = pool[Math.floor(rng() * pool.length)]
    if (!isOffensiveThreatToStarter(candidate, starterTypes)) return candidate
  }

  return pool[Math.floor(rng() * pool.length)]
}

export function pickBiasedTrainerTeam(
  teams: number[][],
  starterTypes: PokemonType[],
  rng: () => number,
  bias = 0.85,
): number[] {
  const neutralTeams = teams.filter((team) => !isTeamOffensiveThreat(team, starterTypes))

  if (neutralTeams.length > 0 && rng() < bias) {
    return neutralTeams[Math.floor(rng() * neutralTeams.length)]
  }

  for (let attempt = 0; attempt < 6; attempt++) {
    const team = teams[Math.floor(rng() * teams.length)]
    if (!isTeamOffensiveThreat(team, starterTypes)) return team
  }

  return teams[Math.floor(rng() * teams.length)]
}

/** Rows 0–2 are treated as early-route battles. */
export const EARLY_BATTLE_MAX_ROW = 2

export function shouldBiasEarlyMatchup(row: number): boolean {
  return row <= EARLY_BATTLE_MAX_ROW
}
