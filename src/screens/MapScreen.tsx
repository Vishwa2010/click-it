import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Linking,
  Platform,
} from 'react-native'
import { useState, useMemo, useRef } from 'react'
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
import { useLocation } from '../hooks/useLocation'

const DEFAULT_COORDS: [number, number] = [-74.006, 40.7128]

const FILTER_TAGS: Record<string, SpotTag[]> = {
  All: [],
  Nature: ['nature', 'waterfall'],
  Urban: ['cityscape', 'street_art'],
  Architecture: ['architecture'],
  'Golden Hour': ['sunset', 'sunrise'],
  'Hidden Gems': ['hidden_gem'],
  Rooftop: ['rooftop'],
}

type MapNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Map'>,
  StackNavigationProp<RootStackParamList>
>

export default function MapScreen() {
  const navigation = useNavigation<MapNavProp>()
  const insets = useSafeAreaInsets()
  const { location } = useLocation()

  const [activeFilter, setActiveFilter] = useState('All')
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null)

  const slideAnim = useRef(new Animated.Value(420)).current
  const backdropAnim = useRef(new Animated.Value(0)).current

  const centerCoordinate = useMemo<[number, number]>(
    () => (location ? [location.longitude, location.latitude] : DEFAULT_COORDS),
    [location]
  )

  const filteredSpots = useMemo(() => {
    const tags = FILTER_TAGS[activeFilter] ?? []
    if (tags.length === 0) return MOCK_SPOTS
    return MOCK_SPOTS.filter((s) => s.tags.some((t) => (tags as string[]).includes(t)))
  }, [activeFilter])

  function openSheet(spot: Spot) {
    setSelectedSpot(spot)
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start()
  }

  function closeSheet() {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 420, duration: 220, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setSelectedSpot(null))
  }

  function handleNavigate() {
    if (!selectedSpot) return
    const { latitude, longitude } = selectedSpot
    const url =
      Platform.OS === 'ios'
        ? `maps://app?daddr=${latitude},${longitude}`
        : `geo:${latitude},${longitude}?q=${latitude},${longitude}`
    Linking.openURL(url)
  }

  function handleViewSpot() {
    if (!selectedSpot) return
    const spotId = selectedSpot.id
    closeSheet()
    setTimeout(() => navigation.navigate('Spot', { spotId }), 230)
  }

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={StyleSheet.absoluteFill}
        styleURL="mapbox://styles/mapbox/dark-v11"
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled
        compassPosition={{ top: insets.top + 68, right: 16 }}
      >
        <MapboxGL.Camera
          zoomLevel={13}
          centerCoordinate={centerCoordinate}
          animationMode="flyTo"
          animationDuration={1200}
        />

        {filteredSpots.map((spot) => (
          <MapboxGL.PointAnnotation
            key={spot.id}
            id={`spot-${spot.id}`}
            coordinate={[spot.longitude, spot.latitude]}
            onSelected={() => openSheet(spot)}
          >
            <SpotPin rank={spot.rank} selected={selectedSpot?.id === spot.id} />
          </MapboxGL.PointAnnotation>
        ))}
      </MapboxGL.MapView>

      <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      <ConditionsWidget />

      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 28 }]}
        onPress={() => navigation.navigate('Upload')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Dimmed backdrop — always mounted so animation can play out */}
      <Animated.View
        style={[styles.backdrop, { opacity: backdropAnim }]}
        pointerEvents={selectedSpot ? 'auto' : 'none'}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeSheet} activeOpacity={1} />
      </Animated.View>

      {/* Bottom sheet — always mounted */}
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom },
          { transform: [{ translateY: slideAnim }] },
        ]}
        pointerEvents={selectedSpot ? 'auto' : 'none'}
      >
        {selectedSpot && (
          <SpotCard
            spot={selectedSpot}
            onClose={closeSheet}
            onNavigate={handleNavigate}
            onViewSpot={handleViewSpot}
          />
        )}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A2E' },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 8,
  },
  fabIcon: { color: '#FFFFFF', fontSize: 30, lineHeight: 34, fontWeight: '300' },
})
