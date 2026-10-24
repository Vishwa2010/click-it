import { useEffect, useRef, useState } from 'react'
import { View, Text, Animated, Easing, StyleSheet } from 'react-native'
import { MapPin, Navigation, Camera } from 'lucide-react-native'
import { C, shared, useReducedMotion } from './shared'
import { colors, fonts } from '../../../theme'

// DUMBO, Brooklyn — the classic Manhattan Bridge frame
const TARGET = { lat: 40.7033, lon: -73.9903 }
const GRID = 6

export default function AddressPage() {
  const reduced = useReducedMotion()
  const drop = useRef(new Animated.Value(0)).current
  const count = useRef(new Animated.Value(0)).current
  const pulse = useRef(new Animated.Value(0)).current
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (reduced) {
      drop.setValue(1)
      setProgress(1)
      return
    }
    const id = count.addListener(({ value }) => setProgress(value))
    // Coordinates tick in while the pin is still landing
    Animated.parallel([
      Animated.spring(drop, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
      Animated.timing(count, { toValue: 1, duration: 1300, delay: 250, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start()
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1600, useNativeDriver: true }))
    loop.start()
    return () => {
      count.removeListener(id)
      loop.stop()
    }
  }, [reduced, drop, count, pulse])

  const lat = (TARGET.lat * progress).toFixed(5)
  const lon = (TARGET.lon * progress).toFixed(5)

  return (
    <View>
      <Text style={shared.eyebrow}>EXACT, NOT “SOMEWHERE NEAR”</Text>
      <Text style={shared.title}>Every great shot has an address.</Text>
      <Text style={shared.subtitle}>Each spot is pinned to the exact GPS point by the photographer who took the shot.</Text>

      <View style={[shared.card, styles.map]}>
        {Array.from({ length: GRID }, (_, i) => (
          <View key={`h${i}`} style={[styles.gridH, { top: `${((i + 1) * 100) / (GRID + 1)}%` }]} />
        ))}
        {Array.from({ length: GRID }, (_, i) => (
          <View key={`v${i}`} style={[styles.gridV, { left: `${((i + 1) * 100) / (GRID + 1)}%` }]} />
        ))}
        <View style={styles.river} />

        <View style={styles.pinWrap}>
          {!reduced && (
            <Animated.View
              style={[
                styles.pulse,
                {
                  opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
                  transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 2.2] }) }],
                },
              ]}
            />
          )}
          <Animated.View
            style={{
              transform: [{ translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [-160, 0] }) }],
            }}
          >
            <MapPin size={44} color={C.primary} fill={C.card} strokeWidth={2.4} />
          </Animated.View>
        </View>
      </View>

      <View style={[shared.card, styles.coords]}>
        <Navigation size={18} color={C.text} />
        <Text style={styles.coordText} accessibilityLabel="Coordinates 40.70330, -73.99030">
          {lat}, {lon}
        </Text>
      </View>

      <View style={styles.meta}>
        <Camera size={16} color={C.textSecondary} />
        <Text style={styles.metaText}>DUMBO, Brooklyn · Best 6:30–8:00 PM · 24-70mm</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  map: { height: 220, overflow: 'hidden', backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center' },
  gridH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.line },
  gridV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: colors.line },
  river: {
    position: 'absolute',
    left: -40,
    right: -40,
    top: '58%',
    height: 34,
    backgroundColor: 'rgba(62,92,118,0.14)',
    transform: [{ rotate: '-12deg' }],
  },
  pinWrap: { alignItems: 'center', justifyContent: 'center' },
  pulse: { position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: C.primary, top: 22 },
  coords: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, marginTop: 12 },
  coordText: { color: C.text, fontSize: 22, fontFamily: fonts.extrabold, fontVariant: ['tabular-nums'], letterSpacing: 0.5 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 },
  metaText: { color: C.textSecondary, fontFamily: fonts.regular, fontSize: 14 },
})
