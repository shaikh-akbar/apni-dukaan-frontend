import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Filters kept in the URL (?q=…&page=2) so lists are shareable and survive refresh.
 * Changing any filter other than `page` resets to page 1.
 */
export function useQueryState(defaults = {}) {
  const [params, setParams] = useSearchParams()
  const values = useMemo(() => {
    const out = { ...defaults }
    for (const [k, v] of params.entries()) out[k] = v
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  const set = useCallback(
    (patch) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [k, v] of Object.entries(patch)) {
            if (v === undefined || v === null || v === '') next.delete(k)
            else next.set(k, v)
          }
          if (!('page' in patch)) next.delete('page')
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  const reset = useCallback(() => setParams(new URLSearchParams(), { replace: true }), [setParams])
  return [values, set, reset]
}
