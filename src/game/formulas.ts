import type { MoveCard, PokemonInstance, PokemonStats, PokemonType } from '../models/types'
import type { TypeChart } from '../models/types'

export function xpForLevel(level: number): number {
  return level ** 3
}

export function xpToNextLevel(level: number): number {
  if (level >= 100) return 0
  return xpForLevel(level + 1) - xpForLevel(level)
}

export function computeStats(base: PokemonStats, level: number): PokemonStats {
  const calc = (baseStat: number, isHp: boolean) => {
    if (isHp) {
      return Math.floor((2 * baseStat * level) / 100 + level + 10)
    }
    return Math.floor((2 * baseStat * level) / 100 + 5)
  }

  return {
    hp: calc(base.hp, true),
    attack: calc(base.attack, false),
    defense: calc(base.defense, false),
    specialAttack: calc(base.specialAttack, false),
    specialDefense: calc(base.specialDefense, false),
    speed: calc(base.speed, false),
  }
}

export function hasStab(moveType: PokemonType, pokemonTypes: PokemonType[]): boolean {
  return pokemonTypes.includes(moveType)
}

export function calcDamage(
  attacker: PokemonInstance,
  defender: PokemonInstance,
  move: MoveCard,
  typeChart: TypeChart,
): number {
  const level = attacker.level
  const power = move.power

  const atk =
    move.damageClass === 'physical'
      ? attacker.stats.attack
      : attacker.stats.specialAttack
  const def =
    move.damageClass === 'physical'
      ? defender.stats.defense
      : defender.stats.specialDefense

  const base = Math.floor(((2 * level) / 5 + 2) * power * (atk / def)) / 50 + 2

  let modifier = 1
  if (hasStab(move.type, attacker.types)) modifier *= 1.5

  const effectiveness = defender.types.reduce((mult, t) => {
    return mult * (typeChart[move.type]?.[t] ?? 1)
  }, 1)
  modifier *= effectiveness

  const random = 0.85 + Math.random() * 0.15
  modifier *= random

  return Math.max(1, Math.floor(base * modifier))
}

export function battleGoldReward(enemyLevel: number, nodeType: string): number {
  const base = enemyLevel * 8
  if (nodeType === 'trainer') return Math.floor(base * 1.5)
  if (nodeType === 'boss') return Math.floor(base * 3)
  return base
}

export function battleXpReward(enemyLevel: number, nodeType: string): number {
  const base = enemyLevel * 30
  if (nodeType === 'trainer') return Math.floor(base * 1.5)
  if (nodeType === 'boss') return Math.floor(base * 2)
  return base
}

export function rollHit(accuracy: number | null): boolean {
  if (accuracy === null) return true
  return Math.random() * 100 < accuracy
}
