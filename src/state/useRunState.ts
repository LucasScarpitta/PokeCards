import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getInitialRunState,
  handleRunAction,
  type RunAction,
} from './runStore'
import { loadRun } from './persistence'
import type { RunState } from '../models/types'

type Dispatch = (action: RunAction) => Promise<void>

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
    setLoading(true)
    try {
      const next = await handleRunAction(stateRef.current, action)
      setState(next)
    } finally {
      setLoading(false)
    }
  }, [])

  return [state, dispatch, loading]
}
