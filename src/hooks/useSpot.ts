import { useState, useEffect, useCallback } from 'react'
import { Spot, SpotPhoto } from '../types/spot'
import { Duel } from '../types/duel'
import { MOCK_SPOTS, MOCK_SPOT_PHOTOS, MOCK_DUELS, MOCK_PHOTOGRAPHERS } from '../lib/mockData'

interface SpotState {
  spot: Spot | null
  photos: SpotPhoto[]
  activeDuel: Duel | null
  founderName: string | null
  usernames: Record<string, string>
  loading: boolean
  error: string | null
}

const INITIAL: SpotState = {
  spot: null,
  photos: [],
  activeDuel: null,
  founderName: null,
  usernames: {},
  loading: true,
  error: null,
}

// Mock data for now — swap the body of load() for Supabase queries once the backend is connected
export function useSpot(spotId: string): SpotState & { reload: () => void } {
  const [state, setState] = useState<SpotState>(INITIAL)

  const load = useCallback(() => {
    setState(INITIAL)
    try {
      const spot = MOCK_SPOTS.find((s) => s.id === spotId) ?? null
      if (!spot) {
        setState({ ...INITIAL, loading: false, error: 'This spot could not be found.' })
        return
      }
      const usernames = Object.fromEntries(MOCK_PHOTOGRAPHERS.map((p) => [p.id, p.username]))
      setState({
        spot,
        photos: MOCK_SPOT_PHOTOS.filter((p) => p.spot_id === spotId),
        activeDuel:
          MOCK_DUELS.find((d) => d.spot_id === spotId && (d.status === 'active' || d.status === 'voting')) ?? null,
        founderName: usernames[spot.founder_id] ?? null,
        usernames,
        loading: false,
        error: null,
      })
    } catch {
      setState({ ...INITIAL, loading: false, error: 'Something went wrong loading this spot.' })
    }
  }, [spotId])

  useEffect(() => {
    load()
  }, [load])

  return { ...state, reload: load }
}
