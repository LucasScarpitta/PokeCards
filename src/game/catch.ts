import type { PokemonInstance } from '../models/types'

export function applyCatchToParty(
  party: PokemonInstance[],
  offer: PokemonInstance,
  accept: boolean,
  replaceUid?: string,
): PokemonInstance[] {
  if (!accept) return party

  if (party.length < 6) {
    return [...party, offer]
  }

  if (!replaceUid) return party

  const index = party.findIndex((p) => p.uid === replaceUid)
  if (index === -1) return party

  const next = [...party]
  next[index] = offer
  return next
}
