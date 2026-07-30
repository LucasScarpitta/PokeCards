const CACHE_PREFIX = 'pokecards-cache:'
const CACHE_VERSION = 1
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

interface CacheEntry<T> {
  v: number
  ts: number
  data: T
}

function storageKey(key: string): string {
  return `${CACHE_PREFIX}${key}`
}

export function getCached<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(storageKey(key))
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry<T>
    if (entry.v !== CACHE_VERSION) return null
    if (Date.now() - entry.ts > MAX_AGE_MS) return null
    return entry.data
  } catch {
    return null
  }
}

export function setCached<T>(key: string, data: T): void {
  const entry: CacheEntry<T> = { v: CACHE_VERSION, ts: Date.now(), data }
  try {
    localStorage.setItem(storageKey(key), JSON.stringify(entry))
  } catch {
    // quota exceeded — ignore
  }
}

const memoryCache = new Map<string, unknown>()

export function getMemoryCached<T>(key: string): T | null {
  return (memoryCache.get(key) as T | undefined) ?? null
}

export function setMemoryCached<T>(key: string, data: T): void {
  memoryCache.set(key, data)
}

export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  const mem = getMemoryCached<T>(key)
  if (mem) return mem

  const stored = getCached<T>(key)
  if (stored) {
    setMemoryCached(key, stored)
    return stored
  }

  const data = await fetcher()
  setCached(key, data)
  setMemoryCached(key, data)
  return data
}
