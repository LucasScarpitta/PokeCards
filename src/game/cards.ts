import { mapMoveToCard } from '../api/mappers'
import type { MoveCard, PokemonInstance } from '../models/types'

export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export async function buildDeck(pokemon: PokemonInstance): Promise<MoveCard[]> {
  const cards: MoveCard[] = []
  for (const moveId of pokemon.unlockedMoveIds) {
    const card = await mapMoveToCard(moveId)
    if (card) cards.push(card)
  }
  return cards
}

export function drawHand(
  deck: MoveCard[],
  hand: MoveCard[],
  count = 4,
  rng: () => number = Math.random,
): { deck: MoveCard[]; hand: MoveCard[] } {
  let remaining = [...deck]
  const newHand = [...hand]

  while (newHand.length < count) {
    if (remaining.length === 0) {
      if (deck.length === 0) break
      remaining = shuffle(deck, rng)
    }
    const card = remaining.shift()!
    newHand.push(card)
  }

  return { deck: remaining, hand: newHand }
}

export function removeCardFromHand(hand: MoveCard[], index: number): MoveCard[] {
  return hand.filter((_, i) => i !== index)
}

export function returnCardToDeck(deck: MoveCard[], card: MoveCard): MoveCard[] {
  return [...deck, card]
}
