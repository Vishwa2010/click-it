import { useEffect, useRef } from 'react'
import { View, Text, Pressable, ActivityIndicator, Animated, Easing, StyleSheet } from 'react-native'
import { Sun, Timer, MapPin, Check } from 'lucide-react-native'
import { C, shared, Coords, DEFAULT_COORDS, DEFAULT_TIME_ZONE, formatCountdown, formatTime, nextGoldenHour, useNow, useReducedMotion } from './shared'
import { colors, fonts } from '../../../theme'

export type LocationChoice = 'undecided' | 'requesting' | 'granted' | 'denied' | 'skipped'

interface Props {
  choice: LocationChoice
  coords: Coords | null
  onEnable: () => void
}

export default function TimingPage({ choice, coords, onEnable }: Props) {
  const reduced = useReducedMotion()
  const now = useNow()
  const glow = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (reduced) return
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [reduced, glow])

  const here = coords ?? DEFAULT_COORDS
  const place = coords ? 'near you' : 'in New York'
  const tz = coords ? undefined : DEFAULT_TIME_ZONE
  const golden = nextGoldenHour(here, now)

  return (
    <View>
      <Text style={shared.eyebrow}>TIMING IS EVERYTHING</Text>
      <Text style={shared.title}>Show up at the right minute.</Text>
      <Text style={shared.subtitle}>
        Light changes the shot. ClickIt tells you when each spot looks its best — down to the minute.
      </Text>

      <View style={[shared.card, styles.sunCard]}>
        <Animated.View
          style={[
            styles.sunGlow,
            {
              opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] }),
              transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] }) }],
            },
          ]}
        />
        <Sun size={48} color={C.accent} strokeWidth={2} />
        <Text style={styles.goldenLabel}>{golden.isNow ? `Golden hour ${place}` : `Next golden hour ${place}`}</Text>
        <Text style={styles.goldenTime}>
          {formatTime(golden.start, tz)} – {formatTime(golden.end, tz)}
        </Text>
        <View style={styles.countdown}>
          <Timer size={16} color={C.accent} />
          <Text style={styles.countdownText}>
            {golden.isNow ? 'Happening right now' : `Starts in ${formatCountdown(golden.start.getTime() - now.getTime())}`}
          </Text>
        </View>
      </View>

      {choice === 'granted' ? (
        <View style={[styles.status, styles.statusOk]}>
          <Check size={18} color={C.success} strokeWidth={3} />
          <Text style={styles.statusOkText}>Using your location</Text>
        </View>
      ) : choice === 'denied' ? (
        <Text style={styles.note}>Location is off — showing New York. You can turn it on later in Settings.</Text>
      ) : (
        <>
          <Pressable
            style={({ pressed }) => [styles.enable, pressed && styles.pressed]}
            onPress={onEnable}
            disabled={choice === 'requesting'}
            accessibilityRole="button"
          >
            {choice === 'requesting' ? (
              <ActivityIndicator color={C.primary} />
            ) : (
              <>
                <MapPin size={18} color={C.primary} />
                <Text style={styles.enableText}>See golden hour where I am</Text>
              </>
            )}
          </Pressable>
          <Text style={styles.note}>Only used while you’re using ClickIt — to show spots and light near you.</Text>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  sunCard: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20, overflow: 'hidden' },
  sunGlow: {
    position: 'absolute',
    top: 16,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(168,74,38,0.12)',
  },
  goldenLabel: { color: C.textSecondary, fontFamily: fonts.regular, fontSize: 14, marginTop: 14 },
  goldenTime: { color: C.text, fontSize: 32, fontFamily: fonts.extrabold, letterSpacing: -0.5, marginTop: 4 },
  countdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: colors.accentTint,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  countdownText: { color: C.accent, fontSize: 14, fontFamily: fonts.bold },
  enable: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.primary,
    backgroundColor: 'transparent',
    marginTop: 20,
  },
  pressed: { opacity: 0.7 },
  enableText: { color: C.primary, fontSize: 16, fontFamily: fonts.bold },
  note: { color: C.textSecondary, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 12 },
  status: { flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center', borderRadius: 12, padding: 14, marginTop: 20 },
  statusOk: { backgroundColor: colors.successTint },
  statusOkText: { color: C.success, fontSize: 16, fontFamily: fonts.bold },
})
