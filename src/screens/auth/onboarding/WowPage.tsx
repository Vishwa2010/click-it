import { ReactNode, useEffect, useRef, useState } from 'react'
import { View, Text, Animated, Easing, StyleSheet } from 'react-native'
import { Timer, Sun, Flag, Users, MapPin, Sparkles } from 'lucide-react-native'
import { supabase } from '../../../lib/supabase'
import { SpotTag } from '../../../types/spot'
import {
  C,
  shared,
  Coords,
  DEFAULT_COORDS,
  INTERESTS,
  formatCountdown,
  nextGoldenHour,
  useNow,
  useReducedMotion,
} from './shared'
import { colors, fonts } from '../../../theme'

interface Props {
  username: string
  interests: SpotTag[]
  coords: Coords | null
  error: string | null
}

interface CommunityStats {
  spots: number
  photographers: number
}

// Real numbers only — live counts from the database
function useCommunityStats(): { stats: CommunityStats | null; loading: boolean } {
  const [stats, setStats] = useState<CommunityStats | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let cancelled = false
    Promise.all([
      supabase.from('spots_public').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }),
    ])
      .then(([spots, users]) => {
        if (cancelled) return
        if (spots.error || users.error) setStats(null)
        else setStats({ spots: spots.count ?? 0, photographers: users.count ?? 0 })
      })
      .catch(() => !cancelled && setStats(null))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])
  return { stats, loading }
}

function CountUp({ value, prefix = '', suffix = '', style }: {
  value: number
  prefix?: string
  suffix?: string
  style: object
}) {
  const reduced = useReducedMotion()
  const anim = useRef(new Animated.Value(0)).current
  const [shown, setShown] = useState(0)
  useEffect(() => {
    if (reduced) {
      setShown(value)
      return
    }
    const id = anim.addListener(({ value: v }) => setShown(Math.round(v)))
    anim.setValue(0)
    Animated.timing(anim, { toValue: value, duration: 1200, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start()
    return () => anim.removeListener(id)
  }, [value, reduced, anim])
  return (
    <Text style={style} accessibilityLabel={`${prefix}${value}${suffix}`}>
      {prefix}
      {shown.toLocaleString()}
      {suffix}
    </Text>
  )
}

function Tile({ index, half = false, children }: { index: number; half?: boolean; children: ReactNode }) {
  const reduced = useReducedMotion()
  const a = useRef(new Animated.Value(reduced ? 1 : 0)).current
  useEffect(() => {
    if (reduced) return
    Animated.timing(a, { toValue: 1, duration: 420, delay: 150 + index * 120, easing: Easing.out(Easing.back(1.3)), useNativeDriver: true }).start()
  }, [a, index, reduced])
  return (
    <Animated.View
      style={[
        shared.card,
        styles.tile,
        half && styles.half,
        { opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] },
      ]}
    >
      {children}
    </Animated.View>
  )
}

export default function WowPage({ username, interests, coords, error }: Props) {
  const now = useNow()
  const { stats, loading } = useCommunityStats()
  const golden = nextGoldenHour(coords ?? DEFAULT_COORDS, now)
  const place = coords ? 'near you' : 'in New York'
  const picks = INTERESTS.filter((i) => interests.includes(i.tag)).map((i) => i.label)
  // A morning golden hour is followed by the evening one; an evening one by tomorrow morning
  const nextChance = golden.start.getHours() < 12 ? 'this evening' : 'tomorrow morning'

  return (
    <View>
      <Text style={shared.eyebrow}>RIGHT NOW</Text>
      <Text style={[shared.title, styles.title]}>Here’s what you’re missing,</Text>
      <Text style={styles.handle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
        @{username}
      </Text>

      <Tile index={0}>
        <View style={styles.heroTop}>
          <Timer size={20} color={C.accent} />
          <Text style={styles.heroLabel}>{golden.isNow ? `Golden hour is on ${place}` : `Golden hour ${place} starts in`}</Text>
        </View>
        <Text style={styles.heroValue}>
          {golden.isNow ? 'Right now' : formatCountdown(golden.start.getTime() - now.getTime())}
        </Text>
        <Text style={styles.heroBody}>
          {golden.isNow ? 'The best light of the day is happening — and it won’t last.' : `It lasts about an hour. Miss it and the next chance is ${nextChance}.`}
        </Text>
      </Tile>

      <View style={styles.grid}>
        <Tile index={1} half>
          <Sun size={20} color={C.accent} />
          <CountUp value={golden.minutesOfGoldenLightToday} style={styles.value} />
          <Text style={styles.caption}>minutes of golden light today</Text>
        </Tile>

        {stats && (
          <Tile index={2} half>
            <Flag size={20} color={C.primary} />
            <CountUp value={stats.spots + 1} prefix="#" style={styles.value} />
            <Text style={styles.caption}>{stats.spots === 0 ? 'you’d be the very first Founder' : 'your Founder number, if you pin today'}</Text>
          </Tile>
        )}

        {stats && (
          <Tile index={3} half>
            <MapPin size={20} color={C.primary} />
            <CountUp value={stats.spots} style={styles.value} />
            <Text style={styles.caption}>{stats.spots === 1 ? 'spot pinned so far' : 'spots pinned so far'}</Text>
          </Tile>
        )}

        {stats && (
          <Tile index={4} half>
            <Users size={20} color={C.primary} />
            <CountUp value={stats.photographers} style={styles.value} />
            <Text style={styles.caption}>{stats.photographers === 1 ? 'explorer so far' : 'explorers so far'}</Text>
          </Tile>
        )}
      </View>

      {loading && <Text style={styles.loading}>Loading live stats…</Text>}

      {stats && (
        <Text style={styles.early}>The map is wide open. Early explorers claim the best spots.</Text>
      )}

      {picks.length > 0 && (
        <View style={styles.tuned}>
          <Sparkles size={18} color={C.primary} />
          <Text style={styles.tunedText}>
            Your map is tuned for <Text style={styles.tunedStrong}>{picks.join(', ')}</Text>.
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  title: { marginBottom: 0 },
  handle: { color: C.primary, fontSize: 32, fontFamily: fonts.extrabold, letterSpacing: -0.5, marginBottom: 8 },
  tile: { padding: 18, marginTop: 12 },
  half: { width: '48.5%', padding: 14 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroLabel: { color: C.text, fontSize: 16, fontFamily: fonts.bold },
  heroValue: { color: C.accent, fontSize: 56, fontFamily: fonts.extrabold, letterSpacing: -2, marginVertical: 4 },
  heroBody: { color: C.textSecondary, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  value: { color: C.text, fontSize: 32, fontFamily: fonts.extrabold, letterSpacing: -1, marginTop: 6 },
  caption: { color: C.textSecondary, fontFamily: fonts.regular, fontSize: 14, lineHeight: 19, marginTop: 2 },
  early: { color: C.text, fontSize: 16, fontFamily: fonts.bold, marginTop: 16, lineHeight: 22 },
  loading: { color: C.textSecondary, fontFamily: fonts.regular, fontSize: 14, textAlign: 'center', marginTop: 16 },
  tuned: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20, paddingHorizontal: 4 },
  tunedText: { color: C.textSecondary, fontFamily: fonts.regular, fontSize: 16, flex: 1, lineHeight: 22 },
  tunedStrong: { color: C.text, fontFamily: fonts.bold },
  errorBox: {
    marginTop: 16,
    backgroundColor: colors.errorTint,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.errorTint,
  },
  errorText: { color: C.error, fontFamily: fonts.regular, fontSize: 15 },
})
