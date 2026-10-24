import Constants from 'expo-constants'
import { Coords } from './goldenHour'
import { Leg } from './walkPlan'

export { planWalk } from './walkPlan'
export type { Leg, PlannedWalk } from './walkPlan'

const TOKEN = (Constants.expoConfig?.extra?.mapboxAccessToken as string | undefined) || ''

// Real walking path from Mapbox Directions; falls back to straight lines between stops
export async function routeLine(start: Coords, legs: Leg[]): Promise<{ line: [number, number][]; routed: boolean }> {
  const pts: [number, number][] = [[start.longitude, start.latitude], ...legs.map((l) => [l.spot.longitude, l.spot.latitude] as [number, number])]
  if (!TOKEN || pts.length < 2) return { line: pts, routed: false }
  try {
    const coords = pts.map((p) => `${p[0]},${p[1]}`).join(';')
    const res = await fetch(`https://api.mapbox.com/directions/v5/mapbox/walking/${coords}?geometries=geojson&overview=full&access_token=${TOKEN}`)
    if (!res.ok) return { line: pts, routed: false }
    const data = (await res.json()) as { routes?: { geometry: { coordinates: [number, number][] } }[] }
    const geometry = data.routes?.[0]?.geometry.coordinates
    return geometry?.length ? { line: geometry, routed: true } : { line: pts, routed: false }
  } catch {
    return { line: pts, routed: false }
  }
}
