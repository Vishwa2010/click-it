import { useMemo, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import MapboxGL from '@rnmapbox/maps'
import { Spot } from '../../types/spot'
import WarmMapStyle from '../map/WarmMapStyle'
import { isMapboxConfigured } from '../../lib/maps'
import { colors, fonts } from '../../theme'

interface Props {
  spots: Spot[]
  height: number
}

// Personal world map: one dot per founded spot. Static (no gestures) — it's a cover, not a tool.
export default function ProfileWorldMap({ spots, height }: Props) {
  const [styleReady, setStyleReady] = useState(false)
  const shape = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: 'FeatureCollection',
      features: spots.map((s) => ({
        type: 'Feature',
        id: s.id,
        geometry: { type: 'Point', coordinates: [s.longitude, s.latitude] },
        properties: {},
      })),
    }),
    [spots]
  )

  // Frame the user's spots; fall back to a world view when there are none
  const camera = useMemo(() => {
    if (spots.length === 0) return { centerCoordinate: [-30, 30] as [number, number], zoomLevel: 0.4 }
    const lngs = spots.map((s) => s.longitude)
    const lats = spots.map((s) => s.latitude)
    return {
      bounds: {
        ne: [Math.max(...lngs), Math.max(...lats)] as [number, number],
        sw: [Math.min(...lngs), Math.min(...lats)] as [number, number],
        // keep dots clear of the settings button (top-right) and the avatar (bottom-centre)
        paddingTop: 90,
        paddingBottom: 90,
        paddingLeft: 50,
        paddingRight: 90,
      },
    }
  }, [spots])

  if (!isMapboxConfigured) {
    return <View style={[styles.fallback, { height }]} />
  }

  return (
    <View style={{ height }} accessibilityLabel={`Map of ${spots.length} spots you founded`}>
      <MapboxGL.MapView
        style={StyleSheet.absoluteFill}
        styleURL="mapbox://styles/mapbox/light-v11"
        projection="globe"
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        compassEnabled={false}
        scaleBarEnabled={false}
        logoPosition={{ bottom: 44, left: 12 }}
        attributionPosition={{ bottom: 44, right: 12 }}
        onDidFinishLoadingStyle={() => setStyleReady(true)}
      >
        {styleReady && <WarmMapStyle />}
        {/* Controlled (not defaultSettings) so it re-frames once the spots finish loading */}
        <MapboxGL.Camera {...camera} maxZoomLevel={12} animationDuration={0} />
        <MapboxGL.ShapeSource id="founded-spots" shape={shape}>
          <MapboxGL.CircleLayer
            id="founded-spots-dots"
            style={{ circleColor: colors.ink, circleRadius: 6, circleStrokeColor: colors.card, circleStrokeWidth: 2 }}
          />
        </MapboxGL.ShapeSource>
      </MapboxGL.MapView>
      {spots.length === 0 && (
        <View style={styles.emptyOverlay} pointerEvents="none">
          <Text style={styles.emptyText}>Your map is empty — every spot you found lands here</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  fallback: { backgroundColor: colors.sunk },
  emptyOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 40, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyText: {
    color: colors.ink,
    fontSize: 14,
    fontFamily: fonts.semibold,
    textAlign: 'center',
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    overflow: 'hidden',
  },
})
