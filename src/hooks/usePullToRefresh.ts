import { useCallback, useState } from 'react'
import { haptics } from '../lib/haptics'

const MIN_SPIN_MS = 700 // long enough to see that a refresh happened, even on a fast network

// Every pull shows the spinner, gives a haptic tick and really reloads — independent of
// whatever "loading" state the screen tracks for its first load.
export function usePullToRefresh(reload: () => Promise<unknown> | void) {
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    haptics.select()
    const started = Date.now()
    try {
      await reload()
    } finally {
      const wait = MIN_SPIN_MS - (Date.now() - started)
      if (wait > 0) await new Promise((r) => setTimeout(r, wait))
      setRefreshing(false)
    }
  }, [reload])

  return { refreshing, onRefresh }
}
