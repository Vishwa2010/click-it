import MapboxGL from '@rnmapbox/maps'
import { colors } from '../../theme'

// Re-colours Mapbox's light-v11 base layers into the ClickIt "paper & ink" palette at runtime,
// so the map matches the app without a custom Mapbox Studio style.
// Layer ids come from the light-v11 style; `existing` restyles a layer instead of adding one.
const MAP = {
  land: '#EEE7DB',
  park: '#E0DCC6',
  water: '#CBD3D1',
  building: '#E4DACB',
  road: '#FBF8F2',
  path: '#D8CDBC',
  label: colors.ink2,
  labelMinor: colors.muted,
  halo: '#EEE7DB',
  boundary: '#C9BEAE',
}

const ROADS = ['road-simple', 'bridge-simple', 'tunnel-simple']
const PATHS = ['road-path', 'road-path-trail', 'road-pedestrian', 'road-steps', 'bridge-path', 'tunnel-path']
const MAJOR_LABELS = ['settlement-major-label', 'settlement-minor-label', 'state-label', 'country-label']
const MINOR_LABELS = ['road-label-simple', 'poi-label', 'settlement-subdivision-label', 'water-point-label', 'water-line-label', 'natural-point-label']

export default function WarmMapStyle() {
  return (
    <>
      <MapboxGL.BackgroundLayer id="land" existing style={{ backgroundColor: MAP.land }} />
      <MapboxGL.FillLayer id="national-park" existing style={{ fillColor: MAP.park }} />
      <MapboxGL.FillLayer id="landuse" existing style={{ fillColor: MAP.park }} />
      <MapboxGL.FillLayer id="water" existing style={{ fillColor: MAP.water }} />
      <MapboxGL.LineLayer id="waterway" existing style={{ lineColor: MAP.water }} />
      <MapboxGL.FillLayer id="building" existing style={{ fillColor: MAP.building, fillOutlineColor: MAP.path }} />
      {ROADS.map((id) => (
        <MapboxGL.LineLayer key={id} id={id} existing style={{ lineColor: MAP.road }} />
      ))}
      {PATHS.map((id) => (
        <MapboxGL.LineLayer key={id} id={id} existing style={{ lineColor: MAP.path }} />
      ))}
      <MapboxGL.LineLayer id="admin-1-boundary" existing style={{ lineColor: MAP.boundary }} />
      <MapboxGL.LineLayer id="admin-0-boundary" existing style={{ lineColor: MAP.boundary }} />
      {MAJOR_LABELS.map((id) => (
        <MapboxGL.SymbolLayer key={id} id={id} existing style={{ textColor: MAP.label, textHaloColor: MAP.halo }} />
      ))}
      {MINOR_LABELS.map((id) => (
        <MapboxGL.SymbolLayer key={id} id={id} existing style={{ textColor: MAP.labelMinor, textHaloColor: MAP.halo }} />
      ))}
    </>
  )
}
