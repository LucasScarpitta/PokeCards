import { fetchType } from './pokeapi'
import type { PokemonType, TypeChart } from '../models/types'
import { POKEMON_TYPES } from '../models/types'
import { getMemoryCached, setMemoryCached } from './cache'

const CHART_KEY = 'type-chart'

export async function buildTypeChart(): Promise<TypeChart> {
  const existing = getMemoryCached<TypeChart>(CHART_KEY)
  if (existing) return existing

  const chart = {} as TypeChart
  for (const atk of POKEMON_TYPES) {
    chart[atk] = {}
    const typeData = await fetchType(atk)
    for (const def of typeData.damage_relations.double_damage_to) {
      chart[atk][def.name as PokemonType] = 2
    }
    for (const def of typeData.damage_relations.half_damage_to) {
      chart[atk][def.name as PokemonType] = 0.5
    }
    for (const def of typeData.damage_relations.no_damage_to) {
      chart[atk][def.name as PokemonType] = 0
    }
  }

  setMemoryCached(CHART_KEY, chart)
  return chart
}

export function getEffectiveness(
  chart: TypeChart,
  moveType: PokemonType,
  defenderTypes: PokemonType[],
): number {
  return defenderTypes.reduce((mult, defType) => {
    return mult * (chart[moveType]?.[defType] ?? 1)
  }, 1)
}
