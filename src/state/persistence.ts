const RUN_KEY = 'pokecards-run'

import type { RunState } from '../models/types'

export function loadRun(): RunState | null {
  try {
    const raw = localStorage.getItem(RUN_KEY)
    if (!raw) return null
    return JSON.parse(raw) as RunState
  } catch {
    return null
  }
}

export function saveRun(state: RunState): void {
  try {
    localStorage.setItem(RUN_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

export function clearRun(): void {
  localStorage.removeItem(RUN_KEY)
}
