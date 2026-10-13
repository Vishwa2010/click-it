import { useMemo } from 'react'
import Supercluster from 'supercluster'
import { Spot } from '../types/spot'

export interface Viewport {
  // [west, south, east, north]
  bbox: [number, number, number, number]
  zoom: number
}

export type MapItem =
  | { kind: 'spot'; spot: Spot }
  | { kind: 'cluster'; id: number; coordinate: [number, number]; count: number; expansionZoom: number }

const WORLD: Viewport = { bbox: [-180, -85, 180, 85], zoom: 12 }

// Groups nearby pins into count bubbles when zoomed out (CLAUDE.md: "pins cluster when zoomed out").
// Runs in JS with supercluster so clusters can be styled like the rest of the map UI.
export function useSpotClusters(spots: Spot[], viewport: Viewport | null): MapItem[] {
  const index = useMemo(() => {
    const sc = new Supercluster<{ spotId: string }>({ radius: 56, maxZoom: 16 })
    sc.load(
      spots.map((s) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [s.longitude, s.latitude] },
        properties: { spotId: s.id },
      }))
    )
    return sc
  }, [spots])

  return useMemo(() => {
    const { bbox, zoom } = viewport ?? WORLD
    const byId = new Map(spots.map((s) => [s.id, s]))
    return index.getClusters(bbox, Math.round(zoom)).flatMap<MapItem>((f) => {
      const [lng, lat] = f.geometry.coordinates
      if ('cluster' in f.properties && f.properties.cluster) {
        const id = f.properties.cluster_id
        return [{
          kind: 'cluster',
          id,
          coordinate: [lng, lat],
          count: f.properties.point_count,
          expansionZoom: Math.min(index.getClusterExpansionZoom(id), 17),
        }]
      }
      const spot = byId.get((f.properties as { spotId: string }).spotId)
      return spot ? [{ kind: 'spot', spot }] : []
    })
  }, [index, spots, viewport])
}
