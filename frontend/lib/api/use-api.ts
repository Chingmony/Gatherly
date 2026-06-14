'use client'

import { useEffect, useState } from 'react'

/**
 * useApiData — run an async data fetcher in the browser (client-side) so that
 * the backend access_token cookie (Path=/api/v1) is sent with the request.
 * Server Components cannot reach authed event data because the cookie is never
 * forwarded to Next page routes; client-side fetches carry it correctly.
 */
export function useApiData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
): { data: T | undefined; loading: boolean; error: Error | null } {
  const [data, setData] = useState<T | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let active = true
    // Reset on mount/deps-change before the async fetch resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)
    fetcher()
      .then((result) => {
        if (!active) return
        setData(result)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (!active) return
        setError(err instanceof Error ? err : new Error(String(err)))
        setLoading(false)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error }
}
