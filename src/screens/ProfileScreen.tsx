import { useState } from 'react'
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  RefreshControl,
  StyleSheet,
  Alert,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native'
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { StackNavigationProp } from '@react-navigation/stack'
import { Flag, Globe2, Building, Image as ImageIcon, Settings, Trophy, MapPinPlus, ImageOff, Camera, Pencil, Bookmark } from 'lucide-react-native'
import { TabParamList, RootStackParamList } from '../navigation/types'
import { useUserStore } from '../store/useUserStore'
import { useProfileData } from '../hooks/useProfileData'
import { supabase } from '../lib/supabase'
import { shotAlertsEnabled, setShotAlerts } from '../lib/shotAlerts'
import { RANK_THRESHOLDS, getProgressToNextRank, getXPToNextRank } from '../lib/xp'
import { colors, fonts, radius, type, card, explorerRankColors, hitSlop } from '../theme'
import { ExplorerRank } from '../types/user'
import { RANK_LABELS } from '../components/SpotCard'
import ProfileWorldMap from '../components/profile/ProfileWorldMap'
import BadgeGrid from '../components/profile/BadgeGrid'
import Banner from '../components/ui/Banner'
import Button from '../components/ui/Button'

type Nav = CompositeNavigationProp<BottomTabNavigationProp<TabParamList, 'Profile'>, StackNavigationProp<RootStackParamList>>

const RANK_ORDER: ExplorerRank[] = ['bronze', 'silver', 'gold', 'elite', 'legend']
const RANK_NAMES: Record<ExplorerRank, string> = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', elite: 'Elite', legend: 'Legend' }
const COVER_HEIGHT = 220
const AVATAR = 96

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={type.headline}>{title}</Text>
      {count !== undefined && <Text style={type.small}>{count}</Text>}
    </View>
  )
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<Nav>()
  const { width } = useWindowDimensions()
  const user = useUserStore((s) => s.user)
  const { founded, saved, photos, earnedBadgeIds, loading, error, reload } = useProfileData(user?.id)
  const [signingOut, setSigningOut] = useState(false)

  // Signing out is explicit and confirmed (CLAUDE.md: never act without confirmation)
  function confirmSignOut() {
    Alert.alert('Sign out?', 'You can log back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true)
          await supabase.auth.signOut()
          setSigningOut(false)
        },
      },
    ])
  }

  function toggleAlerts(on: boolean, userId: string) {
    if (!on) {
      setShotAlerts(false, userId)
      return
    }
    // Explain before iOS shows its permission prompt
    Alert.alert(
      'Golden-hour alerts',
      'Get a heads-up 45 minutes before golden hour at spots you’ve saved within 20 km of you.',
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Turn on',
          onPress: async () => {
            if (!(await setShotAlerts(true, userId))) {
              Alert.alert('Notifications are off', 'Allow notifications for ClickIt in Settings to get golden-hour alerts.')
            }
          },
        },
      ]
    )
  }

  async function openSettings() {
    const alertsOn = await shotAlertsEnabled()
    const userId = user?.id
    Alert.alert('Settings', undefined, [
      { text: 'Edit profile', onPress: () => navigation.navigate('EditProfile') },
      ...(userId
        ? [{ text: alertsOn ? 'Turn off golden-hour alerts' : 'Turn on golden-hour alerts', onPress: () => toggleAlerts(!alertsOn, userId) }]
        : []),
      { text: 'Sign out', style: 'destructive', onPress: confirmSignOut },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  if (!user) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Text style={type.body}>Your profile couldn’t be loaded.</Text>
        <Button label="Sign out" variant="secondary" onPress={confirmSignOut} loading={signingOut} />
      </View>
    )
  }

  const rankColor = explorerRankColors[user.explorer_rank]
  const rankIndex = RANK_ORDER.indexOf(user.explorer_rank)
  const nextRank = RANK_ORDER[rankIndex + 1]
  const progress = getProgressToNextRank(user.xp)
  const toNext = getXPToNextRank(user.xp)
  const since = user.created_at
    ? new Date(user.created_at).toLocaleDateString([], { month: 'short', year: 'numeric' })
    : null
  const photoSize = (width - 40 - 8) / 3
  const stats = [
    { Icon: Flag, value: user.spots_founded, label: 'Spots' },
    { Icon: Globe2, value: user.countries_visited, label: 'Countries' },
    { Icon: Building, value: user.cities_visited, label: 'Cities' },
    { Icon: ImageIcon, value: user.photos_uploaded, label: 'Photos' },
  ]

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 48 }}
      refreshControl={<RefreshControl refreshing={loading && !!founded.length} onRefresh={reload} tintColor={colors.ink} />}
    >
      {/* Cover: personal world map */}
      <View>
        <ProfileWorldMap spots={founded} height={COVER_HEIGHT + insets.top} />
        <Pressable
          onPress={openSettings}
          hitSlop={hitSlop}
          style={({ pressed }) => [styles.gear, { top: insets.top + 8 }, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          <Settings size={20} color={colors.ink} />
        </Pressable>
      </View>

      <View style={styles.body}>
        {/* Identity */}
        <View style={styles.identity}>
          <View style={[styles.avatar, { borderColor: rankColor }]}>
            {user.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatarImg} accessibilityLabel={`${user.username}’s photo`} />
            ) : (
              <Text style={styles.avatarText}>{user.username.charAt(0).toUpperCase()}</Text>
            )}
          </View>
          <Text style={[type.title, styles.handle]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
            @{user.username}
          </Text>
          <View style={styles.identityRow}>
            <View style={[styles.rank, { borderColor: rankColor }]}>
              <Trophy size={13} color={rankColor} />
              <Text style={[styles.rankText, { color: rankColor }]}>{RANK_NAMES[user.explorer_rank]} Explorer</Text>
            </View>
            {since && <Text style={type.caption}>Exploring since {since}</Text>}
          </View>
          {user.bio ? <Text style={[type.body, styles.bio]}>{user.bio}</Text> : null}
          <Button
            label="Edit profile"
            variant="secondary"
            onPress={() => navigation.navigate('EditProfile')}
            icon={<Pencil size={16} color={colors.ink} />}
            style={styles.editBtn}
          />
        </View>

        {error && <Banner tone="error" message={error} />}

        {/* XP progress to next rank */}
        <View style={[card, styles.xpCard]}>
          <View style={styles.xpTop}>
            <Text style={type.stat}>{user.xp.toLocaleString()}</Text>
            <Text style={type.smallStrong}>XP</Text>
          </View>
          <View
            style={styles.track}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
          >
            <View style={[styles.fill, { width: `${Math.max(2, progress * 100)}%` }]} />
          </View>
          <View style={styles.xpLabels}>
            <Text style={[styles.xpRank, { color: rankColor }]}>{RANK_NAMES[user.explorer_rank]}</Text>
            {nextRank ? (
              <Text style={type.caption}>
                {toNext.toLocaleString()} XP to{' '}
                <Text style={[styles.xpRank, { color: explorerRankColors[nextRank] }]}>{RANK_NAMES[nextRank]}</Text>
                {' '}({RANK_THRESHOLDS[nextRank].toLocaleString()})
              </Text>
            ) : (
              <Text style={type.caption}>Top rank reached</Text>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          {stats.map(({ Icon, value, label }) => (
            <View key={label} style={[card, styles.stat]} accessibilityLabel={`${value} ${label}`}>
              <Icon size={18} color={colors.ink2} />
              <Text style={styles.statValue}>{value}</Text>
              <Text style={type.caption}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Badges */}
        <SectionHeader title="Badges" count={earnedBadgeIds.size} />
        <BadgeGrid user={user} earned={earnedBadgeIds} />

        {/* Spots I founded */}
        <SectionHeader title="Spots I founded" count={founded.length} />
        {founded.length === 0 ? (
          <Pressable
            onPress={() => navigation.navigate('Upload')}
            style={({ pressed }) => [card, styles.emptyCard, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <View style={styles.emptyIcon}>
              <MapPinPlus size={22} color={colors.onInk} />
            </View>
            <View style={styles.flex1}>
              <Text style={type.bodyStrong}>No spots yet</Text>
              <Text style={type.small}>Pin your first spot and become its Founder →</Text>
            </View>
          </Pressable>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
            {founded.map((spot) => (
              <Pressable
                key={spot.id}
                onPress={() => navigation.navigate('Spot', { spotId: spot.id })}
                style={({ pressed }) => [card, styles.spotCard, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`${spot.name}, ${RANK_LABELS[spot.rank]}`}
              >
                {spot.cover_photo_url ? (
                  <Image source={{ uri: spot.cover_photo_url }} style={styles.spotImg} resizeMode="cover" />
                ) : (
                  <View style={[styles.spotImg, styles.imgEmpty]}>
                    <ImageOff size={20} color={colors.muted} />
                  </View>
                )}
                <Text style={styles.spotName} numberOfLines={1}>{spot.name}</Text>
                <Text style={type.caption}>{spot.photo_count} photos</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Saved spots */}
        <SectionHeader title="Saved spots" count={saved.length} />
        {saved.length === 0 ? (
          <View style={[card, styles.emptyCard]}>
            <View style={[styles.emptyIcon, styles.emptyIconMuted]}>
              <Bookmark size={22} color={colors.ink2} />
            </View>
            <View style={styles.flex1}>
              <Text style={type.bodyStrong}>Nothing saved yet</Text>
              <Text style={type.small}>Tap the bookmark on any spot to keep it here for later.</Text>
            </View>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
            {saved.map((spot) => (
              <Pressable
                key={spot.id}
                onPress={() => navigation.navigate('Spot', { spotId: spot.id })}
                style={({ pressed }) => [card, styles.spotCard, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={spot.name}
              >
                {spot.cover_photo_url ? (
                  <Image source={{ uri: spot.cover_photo_url }} style={styles.spotImg} resizeMode="cover" />
                ) : (
                  <View style={[styles.spotImg, styles.imgEmpty]}>
                    <ImageOff size={20} color={colors.muted} />
                  </View>
                )}
                <Text style={styles.spotName} numberOfLines={1}>{spot.name}</Text>
                <Text style={type.caption}>{spot.photo_count} photos</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* My photos */}
        <SectionHeader title="My photos" count={photos.length} />
        {photos.length === 0 ? (
          <View style={[card, styles.emptyCard]}>
            <View style={[styles.emptyIcon, styles.emptyIconMuted]}>
              <Camera size={22} color={colors.ink2} />
            </View>
            <View style={styles.flex1}>
              <Text style={type.bodyStrong}>No photos yet</Text>
              <Text style={type.small}>Your shots will show up here once you publish them.</Text>
            </View>
          </View>
        ) : (
          <View style={styles.photoGrid}>
            {photos.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => navigation.navigate('Spot', { spotId: p.spot_id })}
                style={({ pressed }) => pressed && styles.pressed}
                accessibilityRole="imagebutton"
                accessibilityLabel="Your photo — open its spot"
              >
                <Image source={{ uri: p.photo_url }} style={{ width: photoSize, height: photoSize, borderRadius: radius.sm }} />
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  center: { justifyContent: 'center', alignItems: 'center', gap: 16, paddingHorizontal: 24 },
  pressed: { opacity: 0.75 },
  flex1: { flex: 1 },
  gear: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: { paddingHorizontal: 20, gap: 16 },
  identity: { alignItems: 'center', marginTop: -AVATAR / 2 },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: colors.ink,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 12,
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { color: colors.onInk, fontSize: 38, fontFamily: fonts.extrabold },
  handle: { maxWidth: '100%' },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' },
  rank: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  rankText: { fontSize: 12, fontFamily: fonts.bold },
  bio: { textAlign: 'center', marginTop: 10 },
  editBtn: { marginTop: 16, minHeight: 44, alignSelf: 'stretch' },
  xpCard: { padding: 18, gap: 10 },
  xpTop: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  track: { height: 10, borderRadius: 5, backgroundColor: colors.sunk, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.ink, borderRadius: 5 },
  xpLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xpRank: { fontSize: 12, fontFamily: fonts.bold },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 4, borderRadius: radius.md },
  statValue: { color: colors.ink, fontSize: 22, fontFamily: fonts.extrabold },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 12, marginBottom: -4 },
  emptyCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radius.md },
  emptyIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.ink, justifyContent: 'center', alignItems: 'center' },
  emptyIconMuted: { backgroundColor: colors.sunk },
  hList: { gap: 10, paddingRight: 20 },
  spotCard: { width: 160, padding: 8, gap: 4, borderRadius: radius.md },
  spotImg: { width: '100%', height: 100, borderRadius: radius.sm },
  imgEmpty: { backgroundColor: colors.sunk, justifyContent: 'center', alignItems: 'center' },
  spotName: { color: colors.ink, fontSize: 14, fontFamily: fonts.bold, marginTop: 4 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
})
