import { useEffect, useRef } from 'react'
import { View, Text, Animated, Easing, StyleSheet } from 'react-native'
import { Clock, MapPin, Users, X, Sparkles } from 'lucide-react-native'
import { C, shared, useReducedMotion } from './shared'
import { colors, fonts } from '../../../theme'

const MISSES = [
  { Icon: Clock, title: 'Arrived 20 minutes late', body: 'Golden hour was over. The light was flat.' },
  { Icon: MapPin, title: 'Wrong side of the bridge', body: 'The famous angle was 200 m away.' },
  { Icon: Users, title: 'Packed with tourists', body: 'Locals shoot it at 6 AM. Nobody told you.' },
]

export default function MissedPage() {
  const reduced = useReducedMotion()
  const anims = useRef(MISSES.map(() => new Animated.Value(0))).current
  const fix = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (reduced) {
      anims.forEach((a) => a.setValue(1))
      fix.setValue(1)
      return
    }
    Animated.sequence([
      Animated.stagger(
        220,
        anims.map((a) => Animated.timing(a, { toValue: 1, duration: 380, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }))
      ),
      Animated.timing(fix, { toValue: 1, duration: 400, delay: 150, useNativeDriver: true }),
    ]).start()
  }, [reduced, anims, fix])

  return (
    <View>
      <Text style={shared.eyebrow}>SOUND FAMILIAR?</Text>
      <Text style={shared.title}>You’ve been missing the shot.</Text>
      <Text style={shared.subtitle}>Great photos aren’t luck. They’re a place and a minute — and most people get one of them wrong.</Text>

      <View style={styles.list}>
        {MISSES.map(({ Icon, title, body }, i) => (
          <Animated.View
            key={title}
            style={[
              shared.card,
              styles.miss,
              {
                opacity: anims[i],
                transform: [{ translateX: anims[i].interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }],
              },
            ]}
          >
            <View style={styles.missIcon}>
              <Icon size={22} color={C.textSecondary} />
            </View>
            <View style={styles.missText}>
              <Text style={styles.missTitle}>{title}</Text>
              <Text style={styles.missBody}>{body}</Text>
            </View>
            <View style={styles.x}>
              <X size={16} color={C.error} strokeWidth={3} />
            </View>
          </Animated.View>
        ))}
      </View>

      <Animated.View style={[styles.fix, { opacity: fix }]}>
        <Sparkles size={20} color={C.primary} />
        <Text style={styles.fixText}>ClickIt fixes all three.</Text>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  miss: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  missIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  missText: { flex: 1, gap: 2 },
  missTitle: { color: C.text, fontSize: 16, fontFamily: fonts.bold },
  missBody: { color: C.textSecondary, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  x: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.errorTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fix: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 28 },
  fixText: { color: C.primary, fontSize: 18, fontFamily: fonts.extrabold },
})
