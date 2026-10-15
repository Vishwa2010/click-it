import { useState, useEffect, useCallback, useRef } from 'react'
import { Spot, SpotPhoto } from '../types/spot'
import { Duel } from '../types/duel'
import { fetchSpot, fetchSpotPhotos, fetchUsernames, fetchActiveDuel, fetchMyUpvotes, setUpvote, isSpotSaved, setSpotSaved } from '../lib/spotsApi'
import { useUserStore } from '../store/useUserStore'
import { haptics } from '../lib/haptics'
import { useSpotsStore } from '../store/useSpotsStore'

interface SpotState {
  spot: Spot | null
  photos: SpotPhoto[]
  activeDuel: Duel | null
  founderName: string | null
  usernames: Record<string, string>
  upvoted: Set<string>
  saved: boolean
  loading: boolean
  error: string | null
}

const INITIAL: SpotState = {
  spot: null,
  photos: [],
  activeDuel: null,
  founderName: null,
  usernames: {},
  upvoted: new Set(),
  saved: false,
  loading: true,
  error: null,
}

interface SpotActions {
  reload: () => Promise<void>
  toggleUpvote: (photoId: string) => Promise<void>
  toggleSave: () => Promise<void>
}

export function useSpot(spotId: string): SpotState & SpotActions {
  // Show what the map already knows instantly, then fill in photos/names from the network
  const cached = useSpotsStore((s) => s.spots.find((x) => x.id === spotId) ?? null)
  const userId = useUserStore((s) => s.user?.id)
  const [state, setState] = useState<SpotState>({ ...INITIAL, spot: cached })

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const [spot, photos, activeDuel] = await Promise.all([fetchSpot(spotId), fetchSpotPhotos(spotId), fetchActiveDuel(spotId)])
      if (!spot) {
        setState({ ...INITIAL, loading: false, error: 'This spot could not be found. It may have been removed.' })
        return
      }
      const [upvoted, saved] = userId
        ? await Promise.all([fetchMyUpvotes(photos.map((p) => p.id), userId), isSpotSaved(spotId, userId)])
        : [new Set<string>(), false]
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
        upvoted,
        saved,
        loading: false,
        error: null,
      })
    } catch {
      setState((s) => ({ ...s, loading: false, error: 'Couldn’t load this spot. Check your connection and try again.' }))
    }
  }, [spotId, userId])

  useEffect(() => {
    load()
  }, [load])

  // Latest state for event handlers, so state updaters stay pure (no network calls inside them)
  const latest = useRef(state)
  latest.current = state

  const applyUpvote = (photoId: string, on: boolean) =>
    setState((s) => {
      const upvoted = new Set(s.upvoted)
      if (on) upvoted.add(photoId)
      else upvoted.delete(photoId)
      return {
        ...s,
        upvoted,
        photos: s.photos.map((p) => (p.id === photoId ? { ...p, upvotes: Math.max(0, p.upvotes + (on ? 1 : -1)) } : p)),
      }
    })

  // Optimistic: flip immediately, roll back if the server refuses
  const toggleUpvote = useCallback(async (photoId: string) => {
    haptics.select()
    const on = !latest.current.upvoted.has(photoId)
    applyUpvote(photoId, on)
    if (!(await setUpvote(photoId, on))) {
      haptics.warning()
      applyUpvote(photoId, !on)
    }
  }, [])

  const toggleSave = useCallback(async () => {
    haptics.select()
    const on = !latest.current.saved
    setState((s) => ({ ...s, saved: on }))
    if (!(await setSpotSaved(spotId, on))) {
      haptics.warning()
      setState((s) => ({ ...s, saved: !on }))
    }
  }, [spotId])

  return { ...state, reload: load, toggleUpvote, toggleSave }
}
