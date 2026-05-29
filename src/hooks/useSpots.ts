import { useState, useEffect } from 'react'
import { Spot } from '../types/spot'

interface SpotsState {
  spots: Spot[]
  loading: boolean
  error: string | null
}

export function useSpots(): SpotsState {
  const [state, setState] = useState<SpotsState>({
    spots: [],
    loading: false,
    error: null,
  })

  useEffect(() => {
    // Supabase fetch will be implemented in step 3
    setState((s) => ({ ...s, loading: false }))
  }, [])

  return state
}
