import MapboxGL from '@rnmapbox/maps'
import { colors } from '../../theme'

// Re-colours Mapbox's light-v11 base layers at runtime — green land, blue oceans and seas —
// and wraps the globe in a starry night sky, without a custom Mapbox Studio style.
// Layer ids come from the light-v11 style; `existing` restyles a layer instead of adding one.
const MAP = {
  land: '#DDE8CF',
  park: '#BCD7A6',
  water: '#86BEE3',
  waterLabel: '#1E4A6E',
  building: '#CFDABF',
  road: '#FFFFFF',
  path: '#C4D0B4',
  label: colors.ink2,
  labelMinor: '#4F5A47',
  halo: '#DDE8CF',
  boundary: '#93A88A',
}

// Seen when zoomed out on the globe: near-black space with stars, a thin blue haze at the horizon
const SKY = {
  spaceColor: '#05070F',
  starIntensity: 0.7,
  color: '#CFE4F5',
  highColor: '#24476E',
  horizonBlend: 0.04,
  range: [1, 10],
}

const ROADS = ['road-simple', 'bridge-simple', 'tunnel-simple']
const PATHS = ['road-path', 'road-path-trail', 'road-pedestrian', 'road-steps', 'bridge-path', 'tunnel-path']
const MAJOR_LABELS = ['settlement-major-label', 'settlement-minor-label', 'state-label', 'country-label']
const MINOR_LABELS = ['road-label-simple', 'poi-label', 'settlement-subdivision-label', 'natural-point-label']
const WATER_LABELS = ['water-point-label', 'water-line-label']

export default function WarmMapStyle() {
  return (
    <>
      <MapboxGL.Atmosphere style={SKY} />
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
      {WATER_LABELS.map((id) => (
        <MapboxGL.SymbolLayer key={id} id={id} existing style={{ textColor: MAP.waterLabel, textHaloColor: MAP.water }} />
      ))}
    </>
  )
}
