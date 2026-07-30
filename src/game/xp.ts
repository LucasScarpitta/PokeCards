import { getUnlockedMoveIds, mapMoveToCard } from '../api/mappers'
import { computeStats, xpForLevel } from './formulas'
import type { LevelUpInfo, MoveCard, PokemonInstance } from '../models/types'

export async function syncUnlockedMoves(
  pokemon: PokemonInstance,
): Promise<PokemonInstance> {
  const unlockedMoveIds = await getUnlockedMoveIds(pokemon.learnset, pokemon.level)
  return { ...pokemon, unlockedMoveIds }
}

export async function applyXp(
  pokemon: PokemonInstance,
  xpGain: number,
): Promise<{ pokemon: PokemonInstance; levelUp: LevelUpInfo | null }> {
  let current = { ...pokemon, xp: pokemon.xp + xpGain }
  let levelUp: LevelUpInfo | null = null

  while (current.level < 100 && current.xp >= xpForLevel(current.level + 1)) {
    const oldLevel = current.level
    const newLevel = oldLevel + 1
    const oldMoveIds = new Set(current.unlockedMoveIds)

    const newStats = computeStats(current.baseStats, newLevel)

    // Recompute from base by reverse isn't ideal — store base in learnset flow
    // We'll recalc from species base via mapper on level up
    const hpRatio = current.currentHp / current.maxHp

    current = {
      ...current,
      level: newLevel,
      stats: newStats,
      maxHp: newStats.hp,
      currentHp: Math.min(newStats.hp, Math.floor(newStats.hp * hpRatio) + Math.floor(newStats.hp * 0.2)),
    }

    current = await syncUnlockedMoves(current)

    const newMoveIds = current.unlockedMoveIds.filter((id) => !oldMoveIds.has(id))
    const newMoves: MoveCard[] = []
    for (const id of newMoveIds) {
      const card = await mapMoveToCard(id)
      if (card) newMoves.push(card)
    }

    if (newMoves.length > 0 || newLevel > oldLevel) {
      levelUp = {
        pokemonUid: current.uid,
        pokemonName: current.name,
        oldLevel,
        newLevel,
        newMoves,
      }
    }
  }

  return { pokemon: current, levelUp }
}

export async function applyXpToParty(
  party: PokemonInstance[],
  xpGain: number,
): Promise<{ party: PokemonInstance[]; levelUps: LevelUpInfo[] }> {
  const levelUps: LevelUpInfo[] = []
  const updated: PokemonInstance[] = []

  for (const mon of party) {
    if (mon.currentHp <= 0) {
      updated.push(mon)
      continue
    }
    const result = await applyXp(mon, xpGain)
    updated.push(result.pokemon)
    if (result.levelUp) levelUps.push(result.levelUp)
  }

  return { party: updated, levelUps }
}
