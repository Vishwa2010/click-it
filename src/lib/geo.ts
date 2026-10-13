import { Spot } from '../types/spot'

const EARTH_RADIUS_M = 6371000

export function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a))
}

// Closest spot within `radius` meters, or null
export function findNearbySpot(spots: Spot[], latitude: number, longitude: number, radius = 50): Spot | null {
  let best: { spot: Spot; d: number } | null = null
  for (const spot of spots) {
    const d = distanceMeters(latitude, longitude, spot.latitude, spot.longitude)
    if (d <= radius && (!best || d < best.d)) best = { spot, d }
  }
  return best ? best.spot : null
}

// "350 m" / "2.4 km" / "1,240 mi" — miles for US-style locales
export function formatDistance(meters: number): string {
  let locale = 'en-US'
  try {
    locale = Intl.NumberFormat().resolvedOptions().locale
  } catch {
    // keep default
  }
  const imperial = /-(US|LR|MM)\b/.test(locale)
  if (imperial) {
    const miles = meters / 1609.344
    if (miles < 0.1) return `${Math.round(meters * 3.28084)} ft`
    return miles < 10 ? `${miles.toFixed(1)} mi` : `${Math.round(miles).toLocaleString()} mi`
  }
  if (meters < 1000) return `${Math.round(meters)} m`
  const km = meters / 1000
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km).toLocaleString()} km`
}
