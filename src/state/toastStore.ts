export type ToastKind = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: string
  kind: ToastKind
  message: string
}

type Listener = (toasts: ToastMessage[]) => void

let toasts: ToastMessage[] = []
const listeners = new Set<Listener>()

function notify() {
  listeners.forEach((l) => l([...toasts]))
}

export function showToast(opts: {
  kind: ToastKind
  message: string
  duration?: number
}) {
  const id = crypto.randomUUID()
  toasts = [...toasts, { id, kind: opts.kind, message: opts.message }]
  notify()
  setTimeout(() => dismissToast(id), opts.duration ?? 4000)
}

export function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id)
  notify()
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener)
  listener([...toasts])
  return () => listeners.delete(listener)
}
