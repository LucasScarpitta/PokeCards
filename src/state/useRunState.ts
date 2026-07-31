import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getInitialRunState,
  handleRunAction,
  type RunAction,
} from './runStore'
import { loadRun } from './persistence'
import { showToast } from './toastStore'
import type { RunState } from '../models/types'

type Dispatch = (action: RunAction) => Promise<void>

const LOADING_DEBOUNCE_MS = 150

export function useRunState(): [RunState, Dispatch, boolean] {
  const [state, setState] = useState<RunState>(getInitialRunState)
  const [loading, setLoading] = useState(false)
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    const saved = loadRun()
    if (saved) setState(saved)
  }, [])

  const dispatch = useCallback(async (action: RunAction) => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      if (!cancelled) setLoading(true)
    }, LOADING_DEBOUNCE_MS)

    try {
      const result = await handleRunAction(stateRef.current, action)
      setState(result.state)
      if (result.toast) {
        showToast(result.toast)
      }
    } catch {
      showToast({
        kind: 'error',
        message: 'Something went wrong. Try again.',
      })
    } finally {
      cancelled = true
      window.clearTimeout(timer)
      setLoading(false)
    }
  }, [])

  return [state, dispatch, loading]
}
