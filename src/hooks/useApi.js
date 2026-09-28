import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'

/**
 * GET a resource and keep it in state. Re-fetches when `path` or `query` change.
 * Pass path = null to skip. Returns { data, error, loading, reload, setData }.
 *
 * `loading` is derived (the last settled request key differs from the current one), so the
 * effect only sets state from the async callbacks. Previous data stays visible while the next
 * page/filter loads, which avoids layout jumps in tables.
 */
export function useApi(path, query) {
  const [tick, setTick] = useState(0)
  const qs = JSON.stringify(query || {})
  const key = path ? `${path}?${qs}#${tick}` : null
  const [state, setState] = useState({ key: null, data: null, error: null })

  useEffect(() => {
    if (!key) return
    const ctrl = new AbortController()
    api
      .get(path, JSON.parse(qs), { signal: ctrl.signal })
      .then((data) => setState({ key, data, error: null }))
      .catch((error) => {
        if (error.name !== 'AbortError') setState((s) => ({ key, data: s.data, error }))
      })
    return () => ctrl.abort()
  }, [key, path, qs])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  const setData = useCallback(
    (updater) => setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater })),
    [],
  )
  return {
    data: state.data,
    error: state.key === key ? state.error : null,
    loading: !!key && state.key !== key,
    reload,
    setData,
  }
}

/** Debounce a value (for search inputs). */
export function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}
