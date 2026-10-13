import { useEffect, useRef, useState } from 'react'
import { View, Text, Animated, Easing, StyleSheet } from 'react-native'
import { MapPin } from 'lucide-react-native'
import { C, shared, useReducedMotion } from './shared'
import { fonts } from '../../../theme'

const LINES = [
  'The sunset everyone posted.',
  'The rooftop nobody tags.',
  'The angle that went viral.',
  'That waterfall from your feed.',
]

// Decorative pins drifting behind the headline
const PINS = [
  { left: '8%', top: 10, size: 22, delay: 0 },
  { left: '78%', top: 40, size: 30, delay: 400 },
  { left: '62%', top: 250, size: 18, delay: 800 },
  { left: '14%', top: 300, size: 26, delay: 1200 },
] as const

export default function HookPage() {
  const reduced = useReducedMotion()
  const spot = useRef(new Animated.Value(0)).current
  const line = useRef(new Animated.Value(1)).current
  const drift = useRef(new Animated.Value(0)).current
  const [lineIndex, setLineIndex] = useState(0)

  useEffect(() => {
    if (reduced) {
      spot.setValue(1)
      return
    }
    Animated.spring(spot, { toValue: 1, friction: 5, tension: 70, delay: 250, useNativeDriver: true }).start()
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [reduced, spot, drift])

  // Rotate the teaser line
  useEffect(() => {
    const id = setInterval(() => {
      if (reduced) {
        setLineIndex((i) => (i + 1) % LINES.length)
        return
      }
      Animated.timing(line, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setLineIndex((i) => (i + 1) % LINES.length)
        Animated.timing(line, { toValue: 1, duration: 260, useNativeDriver: true }).start()
      })
    }, 2400)
    return () => clearInterval(id)
  }, [reduced, line])

  return (
    <View style={styles.wrap}>
      {PINS.map((p, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={[
            styles.pin,
            {
              left: p.left,
              top: p.top,
              transform: [
                { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, i % 2 ? 12 : -12] }) },
              ],
            },
          ]}
        >
          <MapPin size={p.size} color={C.primary} strokeWidth={2.2} />
        </Animated.View>
      ))}

      <View style={styles.center}>
        <Text style={[shared.hero, styles.need]}>NEED TO{'\n'}FIND A</Text>
        <Animated.Text
          style={[
            styles.spot,
            {
              opacity: spot,
              transform: [{ scale: spot.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
            },
          ]}
          accessibilityRole="header"
        >
          SPOT?
        </Animated.Text>

        <Animated.Text style={[styles.line, { opacity: line }]}>{LINES[lineIndex]}</Animated.Text>
        <Text style={styles.sub}>ClickIt shows you exactly where it is — and when to be there.</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { minHeight: 480, justifyContent: 'center' },
  pin: { position: 'absolute', opacity: 0.35 },
  center: { alignItems: 'center' },
  need: { textAlign: 'center', fontFamily: fonts.extrabold, fontSize: 44, lineHeight: 48 },
  spot: {
    color: C.accent,
    fontSize: 88,
    fontFamily: fonts.extrabold,
    letterSpacing: -3,
    lineHeight: 96,
    textAlign: 'center',
  },
  line: { color: C.text, fontSize: 20, fontFamily: fonts.bold, textAlign: 'center', marginTop: 20, minHeight: 28 },
  sub: { color: C.textSecondary, fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, textAlign: 'center', marginTop: 12, maxWidth: 300 },
})
