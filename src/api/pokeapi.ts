import { cachedFetch } from './cache'

const BASE = 'https://pokeapi.co/api/v2'

export const VERSION_GROUP = 'scarlet-violet'
export const FALLBACK_VERSION_GROUPS = [
  'scarlet-violet',
  'sword-shield',
  'ultra-sun-ultra-moon',
  'sun-moon',
  'x-y',
  'black-white',
  'diamond-pearl',
]

export interface ApiPokemon {
  id: number
  name: string
  sprites: {
    front_default: string | null
    other?: {
      'official-artwork'?: { front_default: string | null }
    }
  }
  types: { slot: number; type: { name: string } }[]
  stats: { base_stat: number; stat: { name: string } }[]
  moves: {
    move: { name: string; url: string }
    version_group_details: {
      level_learned_at: number
      move_learn_method: { name: string }
      version_group: { name: string }
    }[]
  }[]
}

export interface ApiMove {
  id: number
  name: string
  power: number | null
  accuracy: number | null
  type: { name: string }
  damage_class: { name: string }
}

export interface ApiType {
  name: string
  damage_relations: {
    double_damage_to: { name: string }[]
    half_damage_to: { name: string }[]
    no_damage_to: { name: string }[]
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`PokeAPI ${res.status}: ${url}`)
  return res.json() as Promise<T>
}

export function moveIdFromUrl(url: string): number {
  const parts = url.split('/').filter(Boolean)
  return Number(parts[parts.length - 1])
}

export async function fetchPokemon(id: number): Promise<ApiPokemon> {
  return cachedFetch(`pokemon:${id}`, () =>
    fetchJson<ApiPokemon>(`${BASE}/pokemon/${id}`),
  )
}

export async function fetchMove(id: number): Promise<ApiMove> {
  return cachedFetch(`move:${id}`, () =>
    fetchJson<ApiMove>(`${BASE}/move/${id}`),
  )
}

export async function fetchType(name: string): Promise<ApiType> {
  return cachedFetch(`type:${name}`, () =>
    fetchJson<ApiType>(`${BASE}/type/${name}`),
  )
}

export async function prefetchTypes(): Promise<void> {
  const types = [
    'normal', 'fire', 'water', 'electric', 'grass', 'ice',
    'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
    'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
  ]
  await Promise.all(types.map((t) => fetchType(t)))
}
