import { View, Pressable, StyleSheet, Animated, Alert, Linking } from 'react-native'
import { Plus, LocateFixed } from 'lucide-react-native'
import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native'
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { StackNavigationProp } from '@react-navigation/stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import MapboxGL from '@rnmapbox/maps'
import { TabParamList, RootStackParamList } from '../navigation/types'
import { Spot, SpotTag } from '../types/spot'
import { MOCK_SPOTS } from '../lib/mockData'
import SpotPin from '../components/SpotPin'
import FilterBar from '../components/FilterBar'
import SpotCard from '../components/SpotCard'
import ConditionsWidget from '../components/ConditionsWidget'
import WarmMapStyle from '../components/map/WarmMapStyle'
import NearbyCarousel, { CAROUSEL_HEIGHT, NearbySpot } from '../components/map/NearbyCarousel'
import { useLocation } from '../hooks/useLocation'
import { openDirections } from '../lib/maps'
import { distanceMeters, formatDistance } from '../lib/geo'
import { colors, hitSlop } from '../theme'

const DEFAULT_COORDS: [number, number] = [-74.006, 40.7128]
const SPOT_ZOOM = 14
const SHEET_HEIGHT = 420

const FILTER_TAGS: Record<string, SpotTag[]> = {
  All: [],
  Nature: ['nature', 'waterfall'],
  Urban: ['cityscape', 'street_art'],
  Architecture: ['architecture'],
  'Golden Hour': ['sunset', 'sunrise'],
  'Hidden Gems': ['hidden_gem'],
  Rooftop: ['rooftop'],
}

// Layout: filter chips on top, a status row under them, carousel + FAB at the bottom.
// Each floating layer has its own lane so nothing overlaps (skill: fixed-positioning).
const BOTTOM_GAP = 14
const STATUS_ROW_TOP = 64

type MapNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Map'>,
  StackNavigationProp<RootStackParamList>
>

export default function MapScreen() {
  const navigation = useNavigation<MapNavProp>()
  const insets = useSafeAreaInsets()
  const { location } = useLocation()
  const cameraRef = useRef<MapboxGL.Camera>(null)
  const centeredOnUser = useRef(false)

  const [activeFilter, setActiveFilter] = useState('All')
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null)

  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current
  const backdropAnim = useRef(new Animated.Value(0)).current

  const origin = useMemo<[number, number]>(
    () => (location ? [location.longitude, location.latitude] : DEFAULT_COORDS),
    [location]
  )

  // Fly to the user once their location arrives; after that the user controls the camera
  useEffect(() => {
    if (location && !centeredOnUser.current) {
      centeredOnUser.current = true
      cameraRef.current?.setCamera({ centerCoordinate: origin, zoomLevel: 13, animationDuration: 1200, animationMode: 'flyTo' })
    }
  }, [location, origin])

  const filteredSpots = useMemo(() => {
    const tags = FILTER_TAGS[activeFilter] ?? []
    if (tags.length === 0) return MOCK_SPOTS
    return MOCK_SPOTS.filter((s) => s.tags.some((t) => (tags as string[]).includes(t)))
  }, [activeFilter])

  // Nearest first, measured from the user (or the default city when location is off)
  const nearby = useMemo<NearbySpot[]>(
    () =>
      filteredSpots
        .map((spot) => ({ spot, meters: distanceMeters(origin[1], origin[0], spot.latitude, spot.longitude) }))
        .sort((a, b) => a.meters - b.meters)
        .map(({ spot, meters }) => ({ spot, distance: formatDistance(meters) })),
    [filteredSpots, origin]
  )

  const openSheet = useCallback(
    (spot: Spot) => {
      setSelectedSpot(spot)
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start()
    },
    [slideAnim, backdropAnim]
  )

  function closeSheet() {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: SHEET_HEIGHT, duration: 220, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setSelectedSpot(null))
  }

  const focusSpot = useCallback(
    (spot: Spot) => {
      cameraRef.current?.setCamera({
        centerCoordinate: [spot.longitude, spot.latitude],
        zoomLevel: SPOT_ZOOM,
        // Centre the pin in the map area left visible above the spot sheet
        padding: { paddingTop: 0, paddingLeft: 0, paddingRight: 0, paddingBottom: SHEET_HEIGHT },
        animationDuration: 900,
        animationMode: 'flyTo',
      })
      openSheet(spot)
    },
    [openSheet]
  )

  function locateMe() {
    if (location) {
      cameraRef.current?.setCamera({ centerCoordinate: origin, zoomLevel: 14, animationDuration: 800, animationMode: 'flyTo' })
      return
    }
    Alert.alert('Location is off', 'Turn on location for ClickIt to see spots and golden hour near you.', [
      { text: 'Not now', style: 'cancel' },
      { text: 'Open Settings', onPress: () => Linking.openSettings() },
    ])
  }

  function handleNavigate() {
    if (!selectedSpot) return
    openDirections(selectedSpot.latitude, selectedSpot.longitude)
  }

  function handleViewSpot() {
    if (!selectedSpot) return
    const spotId = selectedSpot.id
    closeSheet()
    setTimeout(() => navigation.navigate('Spot', { spotId }), 230)
  }

  const carouselBottom = BOTTOM_GAP
  // Mapbox requires its logo + attribution to stay visible; tuck them just above the carousel
  const attributionBottom = carouselBottom + CAROUSEL_HEIGHT + 6

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={StyleSheet.absoluteFill}
        styleURL="mapbox://styles/mapbox/light-v11"
        compassEnabled={false}
        scaleBarEnabled={false}
        logoPosition={{ bottom: attributionBottom, left: 16 }}
        attributionPosition={{ bottom: attributionBottom, left: 104 }}
      >
        <WarmMapStyle />
        <MapboxGL.Camera ref={cameraRef} defaultSettings={{ centerCoordinate: origin, zoomLevel: 12 }} />
        {location && <MapboxGL.LocationPuck puckBearingEnabled={false} pulsing={{ isEnabled: true, color: colors.ink, radius: 28 }} />}

        {filteredSpots.map((spot) => (
          <MapboxGL.MarkerView
            key={spot.id}
            coordinate={[spot.longitude, spot.latitude]}
            anchor={{ x: 0.5, y: 0.5 }}
            allowOverlap
          >
            <Pressable
              onPress={() => focusSpot(spot)}
              hitSlop={hitSlop}
              accessibilityRole="button"
              accessibilityLabel={`${spot.name}, open spot card`}
            >
              <SpotPin rank={spot.rank} selected={selectedSpot?.id === spot.id} />
            </Pressable>
          </MapboxGL.MarkerView>
        ))}
      </MapboxGL.MapView>

      <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      <View style={[styles.statusRow, { top: insets.top + STATUS_ROW_TOP }]} pointerEvents="box-none">
        <ConditionsWidget coords={{ latitude: origin[1], longitude: origin[0] }} isUserLocation={Boolean(location)} />
        <Pressable
          style={({ pressed }) => [styles.roundBtn, pressed && styles.pressed]}
          onPress={locateMe}
          hitSlop={hitSlop}
          accessibilityRole="button"
          accessibilityLabel="Show my location"
        >
          <LocateFixed size={20} color={colors.ink} strokeWidth={2.2} />
        </Pressable>
      </View>

      <Pressable
        style={({ pressed }) => [styles.fab, { bottom: carouselBottom + CAROUSEL_HEIGHT + 14 }, pressed && styles.fabPressed]}
        onPress={() => navigation.navigate('Upload')}
        hitSlop={hitSlop}
        accessibilityRole="button"
        accessibilityLabel="Pin a new spot"
      >
        <Plus size={26} color={colors.onInk} strokeWidth={2.4} />
      </Pressable>

      <View style={[styles.carousel, { bottom: carouselBottom }]} pointerEvents="box-none">
        <NearbyCarousel
          items={nearby}
          selectedId={selectedSpot?.id ?? null}
          filterLabel={activeFilter}
          onSelect={focusSpot}
          onPinFirst={() => navigation.navigate('Upload')}
        />
      </View>

      {/* Dimmed backdrop — always mounted so animation can play out */}
      <Animated.View
        style={[styles.backdrop, { opacity: backdropAnim }]}
        pointerEvents={selectedSpot ? 'auto' : 'none'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} accessibilityLabel="Close spot card" />
      </Animated.View>

      {/* Bottom sheet — always mounted */}
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        pointerEvents={selectedSpot ? 'auto' : 'none'}
      >
        {selectedSpot && (
          <SpotCard spot={selectedSpot} onClose={closeSheet} onNavigate={handleNavigate} onViewSpot={handleViewSpot} />
        )}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  statusRow: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  pressed: { opacity: 0.75 },
  carousel: { position: 'absolute', left: 0, right: 0 },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.scrim,
  },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  fab: {
    position: 'absolute',
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  fabPressed: { opacity: 0.8, transform: [{ scale: 0.96 }] },
})
