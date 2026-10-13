import { useState, useEffect, useCallback } from 'react'
import { Spot, SpotPhoto } from '../types/spot'
import { Duel } from '../types/duel'
import { fetchSpot, fetchSpotPhotos, fetchUsernames, fetchActiveDuel } from '../lib/spotsApi'
import { useSpotsStore } from '../store/useSpotsStore'

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

export function useSpot(spotId: string): SpotState & { reload: () => Promise<void> } {
  // Show what the map already knows instantly, then fill in photos/names from the network
  const cached = useSpotsStore((s) => s.spots.find((x) => x.id === spotId) ?? null)
  const [state, setState] = useState<SpotState>({ ...INITIAL, spot: cached })

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const [spot, photos, activeDuel] = await Promise.all([fetchSpot(spotId), fetchSpotPhotos(spotId), fetchActiveDuel(spotId)])
      if (!spot) {
        setState({ ...INITIAL, loading: false, error: 'This spot could not be found. It may have been removed.' })
        return
      }
      const usernames = await fetchUsernames([
        spot.founder_id,
        ...photos.map((p) => p.user_id),
        ...(activeDuel ? [activeDuel.challenger_id, activeDuel.opponent_id] : []),
      ])
      setState({
        spot,
        photos,
        activeDuel,
        founderName: usernames[spot.founder_id] ?? null,
        usernames,
        loading: false,
        error: null,
      })
    } catch {
      setState((s) => ({ ...s, loading: false, error: 'Couldn’t load this spot. Check your connection and try again.' }))
    }
  }, [spotId])

  useEffect(() => {
    load()
  }, [load])

  return { ...state, reload: load }
}
