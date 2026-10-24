import { create } from 'zustand'
import { Spot } from '../types/spot'
import { fetchSpots } from '../lib/spotsApi'

type Status = 'idle' | 'loading' | 'ready' | 'error'

interface SpotsStore {
  spots: Spot[]
  status: Status
  error: string | null
  lastLoaded: number
  // Loads from Supabase; skips if fresh (unless forced) so tab switches stay instant
  load: (force?: boolean) => Promise<void>
}

const FRESH_MS = 60_000

// One shared copy of the spots, used by the map, carousel and upload's nearby-spot check
export const useSpotsStore = create<SpotsStore>((set, get) => ({
  spots: [],
  status: 'idle',
  error: null,
  lastLoaded: 0,
  load: async (force = false) => {
    const { status, lastLoaded } = get()
    if (status === 'loading') return
    if (!force && status === 'ready' && Date.now() - lastLoaded < FRESH_MS) return
    set({ status: 'loading', error: null })
    try {
      const spots = await fetchSpots()
      set({ spots, status: 'ready', lastLoaded: Date.now() })
    } catch (e) {
      set({ status: 'error', error: e instanceof Error ? e.message : 'Couldn’t load spots.' })
    }
  },
}))
