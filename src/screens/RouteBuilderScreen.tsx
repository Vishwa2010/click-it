import { useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native'
import { StackScreenProps } from '@react-navigation/stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import MapboxGL from '@rnmapbox/maps'
import { ChevronLeft, Footprints, Clock, Sunset, Navigation } from 'lucide-react-native'
import { RootStackParamList } from '../navigation/types'
import { useSpotsStore } from '../store/useSpotsStore'
import { useLocation } from '../hooks/useLocation'
import { planWalk, routeLine, PlannedWalk } from '../lib/route'
import { formatDistance } from '../lib/geo'
import { formatTime } from '../lib/goldenHour'
import { openDirections, isMapboxConfigured } from '../lib/maps'
import { logNavigation } from '../lib/spotsApi'
import { colors, fonts, radius, type, card, hitSlop } from '../theme'
import WarmMapStyle from '../components/map/WarmMapStyle'
import Banner from '../components/ui/Banner'
import Button from '../components/ui/Button'
import { haptics } from '../lib/haptics'

type Props = StackScreenProps<RootStackParamList, 'RouteBuilder'>

const BUDGETS = [60, 120, 180]
// Solid for real walking paths, dashed when we could only draw straight lines
const ROUTED_LINE = { lineColor: colors.ink, lineWidth: 4, lineCap: 'round' as const, lineJoin: 'round' as const }
const STRAIGHT_LINE = { ...ROUTED_LINE, lineDasharray: [2, 1.5] }
const DEFAULT_START = { latitude: 40.7128, longitude: -74.006 }

export default function RouteBuilderScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets()
  const { location, loading: locating } = useLocation()
  const spots = useSpotsStore((s) => s.spots)
  const loadSpots = useSpotsStore((s) => s.load)
  const [budget, setBudget] = useState(120)
  const [walk, setWalk] = useState<PlannedWalk | null>(null)
  const [routing, setRouting] = useState(false)
  const [styleReady, setStyleReady] = useState(false)

  useEffect(() => {
    loadSpots()
  }, [loadSpots])

  const start = location ?? DEFAULT_START
  const plan = useMemo(() => planWalk(start, spots, budget), [start, spots, budget])

  // Fetch the walking path whenever the stops change
  useEffect(() => {
    let cancelled = false
    setRouting(true)
    routeLine(start, plan.legs).then(({ line, routed }) => {
      if (!cancelled) {
        setWalk({ ...plan, line, routed })
        setRouting(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [plan, start])

  const bounds = useMemo(() => {
    const pts = walk?.line.length ? walk.line : [[start.longitude, start.latitude] as [number, number]]
    const lngs = pts.map((p) => p[0])
    const lats = pts.map((p) => p[1])
    return {
      ne: [Math.max(...lngs), Math.max(...lats)] as [number, number],
      sw: [Math.min(...lngs), Math.min(...lats)] as [number, number],
      paddingTop: 50, paddingBottom: 50, paddingLeft: 40, paddingRight: 40,
    }
  }, [walk, start])

  const line = useMemo<GeoJSON.Feature>(
    () => ({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: walk?.line ?? [] } }),
    [walk]
  )

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={hitSlop} style={styles.headerBtn} accessibilityRole="button" accessibilityLabel="Back">
          <ChevronLeft size={28} color={colors.ink} />
        </Pressable>
        <Text style={type.headline}>Photo walk</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 110 }]}>
        <Text style={type.title}>Plan a photo walk.</Text>
        <Text style={type.body}>
          The nearest spots, in walking order, timed so you reach the last one at golden hour.
        </Text>

        <View style={styles.chips} accessibilityRole="radiogroup">
          {BUDGETS.map((b) => (
            <Pressable
              key={b}
              onPress={() => {
                haptics.select()
                setBudget(b)
              }}
              style={[styles.chip, budget === b && styles.chipOn]}
              accessibilityRole="radio"
              accessibilityState={{ checked: budget === b }}
            >
              <Clock size={15} color={budget === b ? colors.onInk : colors.ink} />
              <Text style={[styles.chipText, budget === b && styles.chipTextOn]}>{b / 60} hour{b > 60 ? 's' : ''}</Text>
            </Pressable>
          ))}
        </View>

        {!location && !locating && (
          <Banner tone="info" message="Location is off, so the walk starts from central New York. Turn on location for walks near you." />
        )}

        {isMapboxConfigured && (
          <View style={styles.mapWrap}>
            <MapboxGL.MapView
              style={StyleSheet.absoluteFill}
              styleURL="mapbox://styles/mapbox/light-v11"
              scaleBarEnabled={false}
              compassEnabled={false}
              onDidFinishLoadingStyle={() => setStyleReady(true)}
            >
              {styleReady && <WarmMapStyle />}
              <MapboxGL.Camera bounds={bounds} animationDuration={600} />
              {walk && walk.line.length > 1 && (
                <MapboxGL.ShapeSource id="walk-line" shape={line}>
                  <MapboxGL.LineLayer
                    id="walk-line-layer"
                    style={walk.routed ? ROUTED_LINE : STRAIGHT_LINE}
                  />
                </MapboxGL.ShapeSource>
              )}
              <MapboxGL.MarkerView coordinate={[start.longitude, start.latitude]} anchor={{ x: 0.5, y: 0.5 }}>
                <View style={styles.startDot} />
              </MapboxGL.MarkerView>
              {plan.legs.map((l, i) => (
                <MapboxGL.MarkerView key={l.spot.id} coordinate={[l.spot.longitude, l.spot.latitude]} anchor={{ x: 0.5, y: 0.5 }} allowOverlap>
                  <View style={styles.stopPin}>
                    <Text style={styles.stopNum}>{i + 1}</Text>
                  </View>
                </MapboxGL.MarkerView>
              ))}
            </MapboxGL.MapView>
            {routing && <ActivityIndicator style={styles.mapSpinner} color={colors.ink} />}
          </View>
        )}

        {plan.legs.length === 0 ? (
          <View style={[card, styles.empty]}>
            <Text style={type.bodyStrong}>No spots within reach</Text>
            <Text style={type.small}>
              {spots.length === 0 ? 'There are no spots on ClickIt yet — pin one to start the map.' : 'Try a longer walk, or explore another area.'}
            </Text>
          </View>
        ) : (
          <>
            <View style={[card, styles.summary]}>
              <View style={styles.summaryItem}>
                <Footprints size={16} color={colors.ink} />
                <Text style={type.smallStrong}>{plan.legs.length} stops · {formatDistance(plan.totalMeters)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Clock size={16} color={colors.ink} />
                <Text style={type.smallStrong}>about {Math.round(plan.totalMin / 5) * 5} min</Text>
              </View>
              {plan.leaveBy && (
                <View style={styles.summaryItem}>
                  <Sunset size={16} color={colors.accent} />
                  <Text style={[type.smallStrong, styles.accent]}>Leave by {formatTime(plan.leaveBy)} for golden hour</Text>
                </View>
              )}
            </View>

            {plan.legs.map((l, i) => (
              <View key={l.spot.id} style={[card, styles.stop]}>
                <View style={styles.stopIndex}>
                  <Text style={styles.stopIndexText}>{i + 1}</Text>
                </View>
                <Pressable style={styles.flex1} onPress={() => navigation.navigate('Spot', { spotId: l.spot.id })} accessibilityRole="link">
                  <Text style={type.subhead} numberOfLines={1}>{l.spot.name}</Text>
                  <Text style={type.caption}>
                    {l.walkMin} min walk · {formatDistance(l.meters)}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    logNavigation(l.spot.id)
                    openDirections(l.spot.latitude, l.spot.longitude)
                  }}
                  hitSlop={hitSlop}
                  style={styles.navBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`Directions to ${l.spot.name}`}
                >
                  <Navigation size={18} color={colors.ink} />
                </Pressable>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {plan.legs.length > 0 && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Button
            label="Start walk"
            icon={<Navigation size={18} color={colors.onInk} />}
            onPress={() => {
              const first = plan.legs[0].spot
              logNavigation(first.id)
              openDirections(first.latitude, first.longitude)
            }}
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerBtn: { width: 44, height: 44, justifyContent: 'center' },
  body: { padding: 20, gap: 14 },
  flex1: { flex: 1, gap: 2 },
  accent: { color: colors.accent },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { color: colors.ink, fontSize: 14, fontFamily: fonts.semibold },
  chipTextOn: { color: colors.onInk },
  mapWrap: { height: 240, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  mapSpinner: { position: 'absolute', top: 12, right: 12 },
  startDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.accent, borderWidth: 3, borderColor: colors.card },
  stopPin: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.ink, borderWidth: 2, borderColor: colors.card, justifyContent: 'center', alignItems: 'center' },
  stopNum: { color: colors.onInk, fontSize: 13, fontFamily: fonts.extrabold },
  empty: { padding: 16, gap: 4, borderRadius: radius.md },
  summary: { padding: 14, gap: 8, borderRadius: radius.md },
  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stop: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md },
  stopIndex: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.sunk, justifyContent: 'center', alignItems: 'center' },
  stopIndexText: { color: colors.ink, fontSize: 14, fontFamily: fonts.extrabold },
  navBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.line, justifyContent: 'center', alignItems: 'center' },
  footer: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: colors.paper, borderTopWidth: 1, borderTopColor: colors.line },
})
