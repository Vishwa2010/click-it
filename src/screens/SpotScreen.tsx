import { useMemo } from 'react'
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
} from 'react-native'
import { StackScreenProps } from '@react-navigation/stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, Swords, Footprints, Camera, Navigation, Aperture, ImageOff, Compass } from 'lucide-react-native'
import { RootStackParamList } from '../navigation/types'
import { SpotPhoto } from '../types/spot'
import { useSpot } from '../hooks/useSpot'
import { useShotWindow } from '../hooks/useShotWindow'
import { openDirections } from '../lib/maps'
import { logNavigation } from '../lib/spotsApi'
import { RANK_LABELS, DIFFICULTY_LABELS } from '../components/SpotCard'
import ShotWindowCard from '../components/ShotWindowCard'
import PhotoGallery from '../components/PhotoGallery'
import Button from '../components/ui/Button'
import Banner from '../components/ui/Banner'
import { colors, fonts, radius, type, spotRankColors, hitSlop, card } from '../theme'

type Props = StackScreenProps<RootStackParamList, 'Spot'>

// Most-used lens across the spot's photos, e.g. "35mm f/1.4 (voted by 4 photographers)"
function topLens(photos: SpotPhoto[]): { lens: string; count: number } | null {
  const counts = new Map<string, number>()
  for (const p of photos) {
    if (p.lens) counts.set(p.lens, (counts.get(p.lens) ?? 0) + 1)
  }
  let best: { lens: string; count: number } | null = null
  for (const [lens, count] of counts) {
    if (!best || count > best.count) best = { lens, count }
  }
  return best
}

export default function SpotScreen({ route, navigation }: Props) {
  const { spotId } = route.params
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()
  const { spot, photos, activeDuel, founderName, usernames, loading, error, reload } = useSpot(spotId)

  const today = useMemo(() => new Date(), [])
  const shotWindow = useShotWindow(spot?.latitude ?? 0, spot?.longitude ?? 0, today)
  const lens = useMemo(() => topLens(photos), [photos])

  const backButton = (
    <Pressable
      style={({ pressed }) => [styles.backBtn, { top: insets.top + 8 }, pressed && styles.pressed]}
      onPress={() => navigation.goBack()}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel="Back"
    >
      <ChevronLeft size={24} color={colors.ink} strokeWidth={2.4} />
    </Pressable>
  )

  // A spot opened from the map renders instantly from cache; only block when there's nothing to show
  if (loading && !spot) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.ink} />
      </View>
    )
  }

  if (!spot) {
    return (
      <View style={styles.centered}>
        {backButton}
        <Compass size={40} color={colors.muted} />
        <Text style={[type.body, styles.centerText]}>{error ?? 'This spot could not be found.'}</Text>
        <Button label="Try again" onPress={reload} style={styles.retry} />
      </View>
    )
  }

  const rankColor = spotRankColors[spot.rank]

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 104 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.ink} />}
      >
        {spot.cover_photo_url ? (
          <Image
            source={{ uri: spot.cover_photo_url }}
            style={{ width: '100%', height: height * 0.4 }}
            resizeMode="cover"
            accessibilityLabel={`Photo of ${spot.name}`}
          />
        ) : (
          <View style={[styles.heroPlaceholder, { height: height * 0.4 }]}>
            <ImageOff size={40} color={colors.muted} />
            <Text style={type.small}>No cover photo yet</Text>
          </View>
        )}

        <View style={styles.body}>
          {error && <Banner tone="error" message={error} />}
          {activeDuel && (
            <Pressable
              style={({ pressed }) => [styles.duelBanner, pressed && styles.pressed]}
              onPress={() => navigation.navigate('ShotDuel', { duelId: activeDuel.id })}
              accessibilityRole="button"
            >
              <Swords size={20} color={colors.onInk} />
              <View style={styles.duelText}>
                <Text style={styles.duelTitle}>Shot Duel live here</Text>
                <Text style={styles.duelMeta}>
                  {usernames[activeDuel.challenger_id] ?? 'Challenger'} {activeDuel.challenger_votes} –{' '}
                  {activeDuel.opponent_votes} {usernames[activeDuel.opponent_id] ?? 'Opponent'} · Tap to vote
                </Text>
              </View>
            </Pressable>
          )}

          <View>
            <View style={styles.titleRow}>
              <Text style={[type.title, styles.name]}>{spot.name}</Text>
            </View>
            <View style={styles.subRow}>
              <View style={[styles.rankBadge, { borderColor: rankColor }]}>
                <Text style={[styles.rankLabel, { color: rankColor }]}>{RANK_LABELS[spot.rank]}</Text>
              </View>
              {founderName && (
                <Pressable
                  onPress={() => navigation.navigate('Photographer', { userId: spot.founder_id })}
                  hitSlop={hitSlop}
                  accessibilityRole="link"
                >
                  <Text style={type.small}>
                    Founded by <Text style={styles.founderName}>@{founderName}</Text>
                  </Text>
                </Pressable>
              )}
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.meta}>
              <Footprints size={16} color={colors.ink2} />
              <Text style={styles.metaText}>{DIFFICULTY_LABELS[spot.difficulty]}</Text>
            </View>
            <View style={styles.meta}>
              <Camera size={16} color={colors.ink2} />
              <Text style={styles.metaText}>{spot.photo_count} photos</Text>
            </View>
            <View style={styles.meta}>
              <Navigation size={16} color={colors.ink2} />
              <Text style={styles.metaText}>{spot.navigation_count} visits</Text>
            </View>
          </View>

          {spot.description ? <Text style={type.body}>{spot.description}</Text> : null}

          {lens && (
            <View style={styles.gearPill}>
              <Aperture size={16} color={colors.ink} />
              <Text style={[type.small, styles.gearText]}>
                Best lens <Text style={styles.gearStrong}>{lens.lens}</Text> · voted by {lens.count} photographer
                {lens.count === 1 ? '' : 's'}
              </Text>
            </View>
          )}

          <ShotWindowCard window={shotWindow} communityStart={spot.best_time_start} communityEnd={spot.best_time_end} now={today} />

          <Text style={[type.headline, styles.section]}>Photos</Text>
          <PhotoGallery
            photos={photos}
            usernames={usernames}
            shotWindow={shotWindow}
            onPressPhotographer={(userId) => navigation.navigate('Photographer', { userId })}
          />
        </View>
      </ScrollView>

      {backButton}

      <View style={[styles.actions, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          label="Navigate"
          variant="secondary"
          onPress={() => {
            logNavigation(spot.id)
            openDirections(spot.latitude, spot.longitude)
          }}
          style={styles.action}
        />
        <Button
          label="I shot this"
          onPress={() => navigation.navigate('Tabs', { screen: 'Upload', params: { spotId: spot.id } })}
          style={styles.action}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  centered: { flex: 1, backgroundColor: colors.paper, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 14 },
  centerText: { textAlign: 'center' },
  retry: { alignSelf: 'stretch' },
  pressed: { opacity: 0.75 },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroPlaceholder: { width: '100%', backgroundColor: colors.sunk, justifyContent: 'center', alignItems: 'center', gap: 8 },
  body: { padding: 20, gap: 18 },
  duelBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    padding: 16,
  },
  duelText: { flex: 1, gap: 2 },
  duelTitle: { color: colors.onInk, fontSize: 16, fontFamily: fonts.bold },
  duelMeta: { color: colors.onInk, fontSize: 13, fontFamily: fonts.regular, opacity: 0.85 },
  titleRow: { flexDirection: 'row' },
  name: { flexShrink: 1 },
  subRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  rankBadge: { borderRadius: radius.pill, borderWidth: 1.5, paddingHorizontal: 10, paddingVertical: 3 },
  rankLabel: { fontSize: 12, fontFamily: fonts.bold },
  founderName: { color: colors.ink, fontFamily: fonts.bold },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: colors.ink2, fontSize: 14, fontFamily: fonts.medium },
  gearPill: {
    ...card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  gearText: { flexShrink: 1 },
  gearStrong: { color: colors.ink, fontFamily: fonts.bold },
  section: { marginBottom: -6 },
  actions: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.paper,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  action: { flex: 1 },
})
