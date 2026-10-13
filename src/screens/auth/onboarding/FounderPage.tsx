import { useEffect, useRef } from 'react'
import { View, Text, Animated, Easing, StyleSheet } from 'react-native'
import { Flag, Trophy, Sparkles, MapPin } from 'lucide-react-native'
import { C, shared, useReducedMotion } from './shared'
import { fonts } from '../../../theme'

const RANKS = [
  { name: 'Bronze', color: C.bronze },
  { name: 'Silver', color: C.silver },
  { name: 'Gold', color: C.gold },
  { name: 'Elite', color: C.elite },
  { name: 'Legend', color: C.primary },
]

export default function FounderPage() {
  const reduced = useReducedMotion()
  const badge = useRef(new Animated.Value(0)).current
  const shine = useRef(new Animated.Value(0)).current
  const ranks = useRef(RANKS.map(() => new Animated.Value(0))).current

  useEffect(() => {
    if (reduced) {
      badge.setValue(1)
      ranks.forEach((r) => r.setValue(1))
      return
    }
    Animated.sequence([
      Animated.spring(badge, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      Animated.stagger(90, ranks.map((r) => Animated.timing(r, { toValue: 1, duration: 260, useNativeDriver: true }))),
    ]).start()
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shine, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(1200),
        Animated.timing(shine, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [reduced, badge, shine, ranks])

  return (
    <View>
      <Text style={shared.eyebrow}>FIRST ONE THERE WINS</Text>
      <Text style={shared.title}>Pin it first.{'\n'}Own it forever.</Text>
      <Text style={shared.subtitle}>
        Find a spot nobody has pinned and you become its Founder — your name stays on it for everyone who visits.
      </Text>

      <Animated.View
        style={[
          shared.card,
          styles.founderCard,
          {
            opacity: badge,
            transform: [{ scale: badge.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
          },
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.shine,
            { transform: [{ translateX: shine.interpolate({ inputRange: [0, 1], outputRange: [-240, 420] }) }, { rotate: '20deg' }] },
          ]}
        />
        <View style={styles.badge}>
          <Flag size={30} color={C.onPrimary} strokeWidth={2.4} />
        </View>
        <View style={styles.founderText}>
          <View style={styles.row}>
            <MapPin size={14} color={C.textSecondary} />
            <Text style={styles.spotName}>Hidden Pier at Sunset</Text>
          </View>
          <Text style={styles.founded}>
            Founded by <Text style={styles.you}>@you</Text>
          </Text>
          <View style={styles.xp}>
            <Sparkles size={14} color={C.accent} />
            <Text style={styles.xpText}>+100 XP</Text>
          </View>
        </View>
      </Animated.View>

      <View style={styles.rankHeader}>
        <Trophy size={18} color={C.text} />
        <Text style={styles.rankTitle}>Climb the ranks</Text>
      </View>
      <View style={styles.ranks}>
        {RANKS.map((r, i) => (
          <Animated.View
            key={r.name}
            style={[
              styles.rank,
              { borderColor: r.color, opacity: ranks[i], transform: [{ translateY: ranks[i].interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] },
            ]}
          >
            <Text style={[styles.rankText, { color: r.color }]}>{r.name}</Text>
          </Animated.View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  founderCard: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, overflow: 'hidden', borderColor: C.primary, borderWidth: 1.5 },
  shine: { position: 'absolute', top: -40, bottom: -40, width: 60, backgroundColor: 'rgba(26,23,20,0.05)' },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  founderText: { flex: 1, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  spotName: { color: C.textSecondary, fontFamily: fonts.regular, fontSize: 14 },
  founded: { color: C.text, fontSize: 18, fontFamily: fonts.extrabold },
  you: { color: C.primary },
  xp: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  xpText: { color: C.accent, fontSize: 14, fontFamily: fonts.bold },
  rankHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 28, marginBottom: 12 },
  rankTitle: { color: C.text, fontSize: 18, fontFamily: fonts.bold },
  ranks: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rank: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  rankText: { fontSize: 14, fontFamily: fonts.extrabold },
})
