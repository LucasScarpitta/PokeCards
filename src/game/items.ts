import type { BattleBuff, Inventory, ItemId, PokemonInstance } from '../models/types'
import { CATCH_POOL, pickRandom, seededRandom } from './rng'

export type ItemKind = 'heal' | 'battle-buff' | 'revive' | 'pokeball'

export interface ShopItem {
  id: ItemId
  name: string
  description: string
  price: number
  kind: ItemKind
  healAmount?: number
}

export const SHOP_CATALOG: ShopItem[] = [
  {
    id: 'potion',
    name: 'Potion',
    description: 'Restores 40 HP to one Pokémon.',
    price: 50,
    kind: 'heal',
    healAmount: 40,
  },
  {
    id: 'super-potion',
    name: 'Super Potion',
    description: 'Restores 80 HP to one Pokémon.',
    price: 100,
    kind: 'heal',
    healAmount: 80,
  },
  {
    id: 'revive',
    name: 'Revive',
    description: 'Revives a fainted Pokémon with half its max HP.',
    price: 150,
    kind: 'revive',
  },
  {
    id: 'pokeball',
    name: 'Poké Ball',
    description: 'Catches a random Pokémon at your starter\'s level. Price rises after each purchase.',
    price: 50,
    kind: 'pokeball',
  },
  {
    id: 'x-attack',
    name: 'X Attack',
    description: '+30% Attack and Sp. Atk for the next battle.',
    price: 80,
    kind: 'battle-buff',
  },
  {
    id: 'x-defend',
    name: 'X Defend',
    description: '+30% Defense and Sp. Def for the next battle.',
    price: 80,
    kind: 'battle-buff',
  },
]

export function emptyInventory(): Inventory {
  return {
    potion: 0,
    'super-potion': 0,
    'x-attack': 0,
    'x-defend': 0,
    pokeball: 0,
    revive: 0,
  }
}

export function normalizeInventory(inventory: Partial<Inventory> | undefined): Inventory {
  const base = emptyInventory()
  if (!inventory) return base
  for (const key of Object.keys(base) as ItemId[]) {
    base[key] = inventory[key] ?? 0
  }
  return base
}

export function getPokeballPrice(pokeballsBought: number): number {
  return 50 + pokeballsBought * 25
}

export function getItemPrice(itemId: ItemId, pokeballsBought: number): number {
  if (itemId === 'pokeball') return getPokeballPrice(pokeballsBought)
  return getShopItem(itemId).price
}

export function getShopItem(id: ItemId): ShopItem {
  return SHOP_CATALOG.find((i) => i.id === id)!
}

export function addToInventory(inventory: Inventory, itemId: ItemId, qty = 1): Inventory {
  return { ...inventory, [itemId]: inventory[itemId] + qty }
}

export function removeFromInventory(
  inventory: Inventory,
  itemId: ItemId,
  qty = 1,
): Inventory | null {
  if (inventory[itemId] < qty) return null
  return { ...inventory, [itemId]: inventory[itemId] - qty }
}

export function healPokemon(pokemon: PokemonInstance, amount: number): PokemonInstance {
  if (pokemon.currentHp <= 0) return pokemon
  return {
    ...pokemon,
    currentHp: Math.min(pokemon.maxHp, pokemon.currentHp + amount),
  }
}

export function revivePokemon(pokemon: PokemonInstance): PokemonInstance {
  if (pokemon.currentHp > 0) return pokemon
  return {
    ...pokemon,
    currentHp: Math.max(1, Math.floor(pokemon.maxHp / 2)),
  }
}

export function pickPokeballSpecies(seed: number, roll: number): number {
  const rng = seededRandom(seed + roll * 7919)
  return pickRandom(CATCH_POOL, rng)
}

export function starterLevel(party: PokemonInstance[]): number {
  return party[0]?.level ?? 5
}

export function createBattleBuff(itemId: ItemId): BattleBuff {
  const item = getShopItem(itemId)
  if (itemId === 'x-attack') {
    return {
      itemId,
      name: item.name,
      attackMult: 1.3,
      specialAttackMult: 1.3,
      defenseMult: 1,
      specialDefenseMult: 1,
    }
  }
  return {
    itemId,
    name: item.name,
    attackMult: 1,
    specialAttackMult: 1,
    defenseMult: 1.3,
    specialDefenseMult: 1.3,
  }
}

function combineMultipliers(buffs: BattleBuff[]) {
  return buffs.reduce(
    (acc, buff) => ({
      attackMult: acc.attackMult * buff.attackMult,
      specialAttackMult: acc.specialAttackMult * buff.specialAttackMult,
      defenseMult: acc.defenseMult * buff.defenseMult,
      specialDefenseMult: acc.specialDefenseMult * buff.specialDefenseMult,
    }),
    {
      attackMult: 1,
      specialAttackMult: 1,
      defenseMult: 1,
      specialDefenseMult: 1,
    },
  )
}

function scaleStat(value: number, mult: number): number {
  return Math.floor(value * mult)
}

export function applyBattleBuffs(
  party: PokemonInstance[],
  buffs: BattleBuff[],
): PokemonInstance[] {
  if (buffs.length === 0) return party

  const mult = combineMultipliers(buffs)

  return party.map((mon) => ({
    ...mon,
    stats: {
      ...mon.stats,
      attack: scaleStat(mon.stats.attack, mult.attackMult),
      specialAttack: scaleStat(mon.stats.specialAttack, mult.specialAttackMult),
      defense: scaleStat(mon.stats.defense, mult.defenseMult),
      specialDefense: scaleStat(mon.stats.specialDefense, mult.specialDefenseMult),
    },
  }))
}

export function formatBuffSummary(buffs: BattleBuff[]): string {
  if (buffs.length === 0) return ''
  return buffs.map((b) => b.name).join(', ')
}

export function inventoryCount(inventory: Inventory): number {
  return Object.values(inventory).reduce((sum, n) => sum + n, 0)
}

export function pokeballSpeciesRoll(state: {
  seed: number
  party: PokemonInstance[]
  badges: number
  itemRollCounter: number
}): number {
  return state.seed + state.party.length * 997 + state.badges * 13 + state.itemRollCounter * 31
}
