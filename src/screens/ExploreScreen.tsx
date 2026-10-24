import { useCallback, useMemo } from 'react'
import { View, Text, ScrollView, Pressable, Image, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CompositeNavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native'
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { StackNavigationProp } from '@react-navigation/stack'
import { Sun, TrendingUp, Sparkles, ImageOff, Navigation, MapPinPlus, Footprints, Compass } from 'lucide-react-native'
import { TabParamList, RootStackParamList } from '../navigation/types'
import { useSpotsStore } from '../store/useSpotsStore'
import { nextGoldenHour, formatCountdown, useNow } from '../lib/goldenHour'
import { RANK_LABELS } from '../components/SpotCard'
import { Spot } from '../types/spot'
import { colors, fonts, radius, type, card, spotRankColors } from '../theme'
import Banner from '../components/ui/Banner'
import Button from '../components/ui/Button'

type Nav = CompositeNavigationProp<BottomTabNavigationProp<TabParamList, 'Explore'>, StackNavigationProp<RootStackParamList>>

const SOON_MS = 3 * 3600 * 1000 // "golden hour soon" window

function Thumb({ spot, size }: { spot: Spot; size: number }) {
  return spot.cover_photo_url ? (
    <Image source={{ uri: spot.cover_photo_url }} style={{ width: size, height: size, borderRadius: radius.md }} accessibilityLabel={`Photo of ${spot.name}`} />
  ) : (
    <View style={[styles.thumbEmpty, { width: size, height: size }]}>
      <ImageOff size={20} color={colors.muted} />
    </View>
  )
}

function Section({ Icon, title, children }: { Icon: typeof Sun; title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Icon size={18} color={colors.ink} />
        <Text style={type.headline}>{title}</Text>
      </View>
      {children}
    </View>
  )
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<Nav>()
  const now = useNow()
  const spots = useSpotsStore((s) => s.spots)
  const status = useSpotsStore((s) => s.status)
  const error = useSpotsStore((s) => s.error)
  const load = useSpotsStore((s) => s.load)

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  // Spots whose golden hour is on now or starts within the next few hours, soonest first
  const goldenSoon = useMemo(
    () =>
      spots
        .map((spot) => ({ spot, golden: nextGoldenHour({ latitude: spot.latitude, longitude: spot.longitude }, now) }))
        .filter(({ golden }) => golden.isNow || golden.start.getTime() - now.getTime() < SOON_MS)
        .sort((a, b) => (a.golden.isNow ? -1 : 0) - (b.golden.isNow ? -1 : 0) || a.golden.start.getTime() - b.golden.start.getTime())
        .slice(0, 10),
    [spots, now]
  )
  const trending = useMemo(() => [...spots].sort((a, b) => b.navigation_count - a.navigation_count).slice(0, 8), [spots])
  const newest = useMemo(() => [...spots].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 8), [spots])
  const open = (spot: Spot) => navigation.navigate('Spot', { spotId: spot.id })

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={status === 'loading' && spots.length > 0} onRefresh={() => load(true)} tintColor={colors.ink} />}
    >
      <View style={styles.pad}>
        <Text style={type.eyebrow}>Discover</Text>
        <Text style={[type.display, styles.title]}>Explore.</Text>
        <View style={styles.tools}>
          <Pressable
            onPress={() => navigation.navigate('RouteBuilder')}
            style={({ pressed }) => [card, styles.tool, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityHint="Plans a walk through nearby spots, timed for golden hour"
          >
            <Footprints size={20} color={colors.ink} />
            <Text style={type.bodyStrong}>Photo walk</Text>
            <Text style={type.caption}>Nearby spots, timed for golden hour</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('ARCompass')}
            style={({ pressed }) => [card, styles.tool, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityHint="Points you toward spots around you"
          >
            <Compass size={20} color={colors.ink} />
            <Text style={type.bodyStrong}>AR Compass</Text>
            <Text style={type.caption}>See which way the spots are</Text>
          </Pressable>
        </View>
      </View>

      {status === 'error' && (
        <View style={[styles.pad, styles.gap]}>
          <Banner tone="error" message={error ?? 'Couldn’t load spots.'} />
          <Button label="Retry" variant="secondary" onPress={() => load(true)} />
        </View>
      )}

      {status === 'loading' && spots.length === 0 ? (
        <ActivityIndicator color={colors.ink} style={styles.loading} />
      ) : spots.length === 0 && status === 'ready' ? (
        <View style={styles.pad}>
          <Pressable
            onPress={() => navigation.navigate('Upload')}
            style={({ pressed }) => [card, styles.empty, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <View style={styles.emptyIcon}>
              <MapPinPlus size={22} color={colors.onInk} />
            </View>
            <View style={styles.flex1}>
              <Text style={type.bodyStrong}>Nothing to explore yet</Text>
              <Text style={type.small}>Be the first to pin a spot — it’ll show up here for everyone →</Text>
            </View>
          </Pressable>
        </View>
      ) : (
        <>
          <Section Icon={Sun} title="Golden hour soon">
            {goldenSoon.length === 0 ? (
              <Text style={[type.small, styles.pad]}>No spots have golden hour in the next few hours.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
                {goldenSoon.map(({ spot, golden }) => (
                  <Pressable
                    key={spot.id}
                    onPress={() => open(spot)}
                    style={({ pressed }) => [card, styles.goldCard, pressed && styles.pressed]}
                    accessibilityRole="button"
                  >
                    <Thumb spot={spot} size={136} />
                    <Text style={styles.cardName} numberOfLines={1}>{spot.name}</Text>
                    <Text style={[styles.countdown, golden.isNow && styles.live]}>
                      {golden.isNow ? 'Golden hour now' : `In ${formatCountdown(golden.start.getTime() - now.getTime())}`}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </Section>

          <Section Icon={TrendingUp} title="Trending">
            <View style={[styles.pad, styles.gap]}>
              {trending.map((spot, i) => (
                <Pressable
                  key={spot.id}
                  onPress={() => open(spot)}
                  style={({ pressed }) => [card, styles.row, pressed && styles.pressed]}
                  accessibilityRole="button"
                >
                  <Text style={styles.rankNum}>{i + 1}</Text>
                  <Thumb spot={spot} size={56} />
                  <View style={styles.flex1}>
                    <Text style={styles.cardName} numberOfLines={1}>{spot.name}</Text>
                    <View style={styles.meta}>
                      <View style={[styles.dot, { backgroundColor: spotRankColors[spot.rank] }]} />
                      <Text style={type.caption}>{RANK_LABELS[spot.rank]}</Text>
                      <Navigation size={12} color={colors.muted} />
                      <Text style={type.caption}>{spot.navigation_count} visits</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </Section>

          <Section Icon={Sparkles} title="Newest spots">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
              {newest.map((spot) => (
                <Pressable
                  key={spot.id}
                  onPress={() => open(spot)}
                  style={({ pressed }) => [card, styles.newCard, pressed && styles.pressed]}
                  accessibilityRole="button"
                >
                  <Thumb spot={spot} size={112} />
                  <Text style={styles.cardName} numberOfLines={1}>{spot.name}</Text>
                  <Text style={type.caption}>{spot.photo_count} photos</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Section>
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  pad: { paddingHorizontal: 20 },
  gap: { gap: 10 },
  flex1: { flex: 1, gap: 4 },
  title: { marginTop: 6, marginBottom: 8 },
  loading: { marginTop: 60 },
  pressed: { opacity: 0.8 },
  tools: { flexDirection: 'row', gap: 10, marginTop: 4 },
  tool: { flex: 1, padding: 14, gap: 4, borderRadius: radius.lg },
  section: { marginTop: 24, gap: 12 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20 },
  hList: { paddingHorizontal: 20, gap: 10 },
  thumbEmpty: { borderRadius: radius.md, backgroundColor: colors.sunk, justifyContent: 'center', alignItems: 'center' },
  goldCard: { width: 152, padding: 8, gap: 4, borderRadius: radius.lg },
  newCard: { width: 128, padding: 8, gap: 4, borderRadius: radius.lg },
  cardName: { color: colors.ink, fontSize: 15, fontFamily: fonts.bold, marginTop: 4 },
  countdown: { color: colors.ink2, fontSize: 13, fontFamily: fonts.semibold },
  live: { color: colors.accent },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: radius.lg },
  rankNum: { width: 22, textAlign: 'center', color: colors.ink, fontSize: 18, fontFamily: fonts.extrabold },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  empty: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radius.md, marginTop: 16 },
  emptyIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.ink, justifyContent: 'center', alignItems: 'center' },
})
