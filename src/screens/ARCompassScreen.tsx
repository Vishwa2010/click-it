import { useEffect, useMemo, useState } from 'react'
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native'
import { StackScreenProps } from '@react-navigation/stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as Location from 'expo-location'
import { ChevronLeft, Camera as CameraIcon, MapPin, Compass } from 'lucide-react-native'
import { RootStackParamList } from '../navigation/types'
import { useSpotsStore } from '../store/useSpotsStore'
import { useLocation } from '../hooks/useLocation'
import { distanceMeters, formatDistance } from '../lib/geo'
import { colors, fonts, radius, type, hitSlop } from '../theme'
import Button from '../components/ui/Button'

type Props = StackScreenProps<RootStackParamList, 'ARCompass'>

const RANGE_M = 5000
const FOV = 60 // degrees of the view the camera roughly covers

function bearingTo(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = (d: number) => (d * Math.PI) / 180
  const y = Math.sin(r(lon2 - lon1)) * Math.cos(r(lat2))
  const x = Math.cos(r(lat1)) * Math.sin(r(lat2)) - Math.sin(r(lat1)) * Math.cos(r(lat2)) * Math.cos(r(lon2 - lon1))
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

// -180..180: how far a bearing is to the right (+) or left (-) of where you're facing
const relative = (bearing: number, heading: number) => ((bearing - heading + 540) % 360) - 180

export default function ARCompassScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets()
  const { width, height } = useWindowDimensions()
  const { location } = useLocation()
  const spots = useSpotsStore((s) => s.spots)
  const loadSpots = useSpotsStore((s) => s.load)
  const [permission, requestPermission] = useCameraPermissions()
  const [heading, setHeading] = useState<number | null>(null)
  const [cameraOn, setCameraOn] = useState(false)

  useEffect(() => {
    loadSpots()
  }, [loadSpots])

  // Compass heading (unavailable on simulators / devices without a magnetometer)
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null
    Location.watchHeadingAsync((h) => setHeading(h.trueHeading >= 0 ? h.trueHeading : h.magHeading))
      .then((s) => {
        sub = s
      })
      .catch(() => setHeading(null))
    return () => sub?.remove()
  }, [])

  const nearby = useMemo(() => {
    if (!location) return []
    return spots
      .map((spot) => ({
        spot,
        meters: distanceMeters(location.latitude, location.longitude, spot.latitude, spot.longitude),
        bearing: bearingTo(location.latitude, location.longitude, spot.latitude, spot.longitude),
      }))
      .filter((s) => s.meters <= RANGE_M)
      .sort((a, b) => a.meters - b.meters)
      .slice(0, 15)
  }, [spots, location])

  const facing = heading ?? 0
  const inView = nearby.filter((n) => Math.abs(relative(n.bearing, facing)) <= FOV / 2 + 5)
  const useCamera = cameraOn && permission?.granted

  async function enableCamera() {
    const res = permission?.granted ? permission : await requestPermission()
    if (res?.granted) setCameraOn(true)
  }

  // Radar: you at the centre, spots placed by bearing (rotated so "up" is where you face) and distance
  const radarSize = Math.min(width - 40, 320)

  return (
    <View style={styles.container}>
      {useCamera ? <CameraView style={StyleSheet.absoluteFill} facing="back" /> : null}

      <View style={[styles.header, { paddingTop: insets.top + 4 }, useCamera && styles.headerOnCamera]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={hitSlop} style={styles.roundBtn} accessibilityRole="button" accessibilityLabel="Back">
          <ChevronLeft size={24} color={colors.ink} />
        </Pressable>
        <View style={styles.headingPill}>
          <Compass size={14} color={colors.ink} />
          <Text style={styles.headingText}>{heading === null ? 'No compass' : `${Math.round(facing)}°`}</Text>
        </View>
        <View style={styles.roundSpacer} />
      </View>

      {!location ? (
        <View style={styles.center}>
          <Text style={type.title}>Turn on location</Text>
          <Text style={[type.body, styles.centerText]}>The AR Compass needs to know where you are to point you to nearby spots.</Text>
        </View>
      ) : useCamera ? (
        // Labels float across the camera at each spot's real direction; closer spots sit lower
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {inView.map((n, i) => {
            const x = width / 2 + (relative(n.bearing, facing) / (FOV / 2)) * (width / 2)
            const y = height * 0.62 - Math.min(1, n.meters / RANGE_M) * height * 0.4 - (i % 3) * 8
            return (
              <Pressable
                key={n.spot.id}
                onPress={() => navigation.navigate('Spot', { spotId: n.spot.id })}
                style={[styles.arLabel, { left: Math.max(8, Math.min(width - 168, x - 80)), top: y }]}
                accessibilityRole="button"
                accessibilityLabel={`${n.spot.name}, ${formatDistance(n.meters)} away`}
              >
                <MapPin size={14} color={colors.onInk} />
                <View style={styles.flex1}>
                  <Text style={styles.arName} numberOfLines={1}>{n.spot.name}</Text>
                  <Text style={styles.arDist}>{formatDistance(n.meters)}</Text>
                </View>
              </Pressable>
            )
          })}
          {inView.length === 0 && (
            <View style={styles.hintWrap}>
              <Text style={styles.hint}>{nearby.length ? 'Turn around — spots are nearby in another direction' : 'No spots within 5 km'}</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.center}>
          <Text style={type.eyebrow}>AR Compass</Text>
          <Text style={[type.title, styles.centerText]}>{nearby.length} spot{nearby.length === 1 ? '' : 's'} within 5 km</Text>
          <View style={[styles.radar, { width: radarSize, height: radarSize, borderRadius: radarSize / 2 }]}>
            <View style={[styles.ring, { width: radarSize * 0.66, height: radarSize * 0.66, borderRadius: radarSize }]} />
            <View style={[styles.ring, { width: radarSize * 0.33, height: radarSize * 0.33, borderRadius: radarSize }]} />
            <View style={styles.me} />
            {nearby.map((n) => {
              const angle = ((relative(n.bearing, facing) - 90) * Math.PI) / 180
              const r = (Math.min(1, n.meters / RANGE_M) * radarSize) / 2 - 8
              return (
                <Pressable
                  key={n.spot.id}
                  onPress={() => navigation.navigate('Spot', { spotId: n.spot.id })}
                  hitSlop={hitSlop}
                  style={[styles.blip, { left: radarSize / 2 + r * Math.cos(angle) - 7, top: radarSize / 2 + r * Math.sin(angle) - 7 }]}
                  accessibilityRole="button"
                  accessibilityLabel={`${n.spot.name}, ${formatDistance(n.meters)}`}
                />
              )
            })}
          </View>
          <Text style={[type.small, styles.centerText]}>
            {heading === null
              ? 'This device has no compass, so the radar points north-up.'
              : 'Up is the direction you’re facing. Tap a dot to open the spot.'}
          </Text>
          <Button
            label="Use camera"
            icon={<CameraIcon size={18} color={colors.onInk} />}
            onPress={enableCamera}
            style={styles.cameraBtn}
            accessibilityHint="Asks for camera access to show spots over the live view"
          />
          {permission && !permission.granted && !permission.canAskAgain && (
            <Text style={[type.caption, styles.centerText]}>Camera access is off — turn it on in Settings to use the live view.</Text>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  flex1: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8, zIndex: 2 },
  headerOnCamera: { position: 'absolute', left: 0, right: 0, top: 0 },
  roundBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, justifyContent: 'center', alignItems: 'center' },
  roundSpacer: { width: 40 },
  headingPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.card, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: colors.line },
  headingText: { color: colors.ink, fontSize: 13, fontFamily: fonts.bold },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 14 },
  centerText: { textAlign: 'center' },
  radar: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, justifyContent: 'center', alignItems: 'center', marginVertical: 8 },
  ring: { position: 'absolute', borderWidth: 1, borderColor: colors.line },
  me: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.card },
  blip: { position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: colors.ink, borderWidth: 2, borderColor: colors.card },
  cameraBtn: { alignSelf: 'stretch' },
  arLabel: {
    position: 'absolute',
    width: 160,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(26,23,20,0.85)',
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  arName: { color: colors.onInk, fontSize: 13, fontFamily: fonts.bold },
  arDist: { color: colors.onInk, fontSize: 11, fontFamily: fonts.medium, opacity: 0.85 },
  hintWrap: { position: 'absolute', left: 24, right: 24, bottom: 80, alignItems: 'center' },
  hint: { color: colors.onInk, backgroundColor: 'rgba(26,23,20,0.75)', fontFamily: fonts.semibold, fontSize: 14, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, overflow: 'hidden' },
})
