import { useState, useEffect } from 'react'
import * as Location from 'expo-location'

export interface LocationCoords {
  latitude: number
  longitude: number
}

interface LocationState {
  location: LocationCoords | null
  error: string | null
  loading: boolean
}

export function useLocation(): LocationState {
  const [state, setState] = useState<LocationState>({
    location: null,
    error: null,
    loading: true,
  })

  useEffect(() => {
    let cancelled = false

    async function requestLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (cancelled) return

      if (status !== Location.PermissionStatus.GRANTED) {
        setState({ location: null, error: 'Location permission denied', loading: false })
        return
      }

      try {
        const result = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })
        if (!cancelled) {
          setState({
            location: {
              latitude: result.coords.latitude,
              longitude: result.coords.longitude,
            },
            error: null,
            loading: false,
          })
        }
      } catch {
        if (!cancelled) {
          setState({ location: null, error: 'Unable to get location', loading: false })
        }
      }
    }

    requestLocation()
    return () => { cancelled = true }
  }, [])

  return state
}
