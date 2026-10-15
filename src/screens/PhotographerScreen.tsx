import { useCallback, useEffect, useState } from 'react'
import { View, Text, Image, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native'
import { StackScreenProps } from '@react-navigation/stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, Trophy, Flag, Globe2, Building, Image as ImageIcon, ImageOff } from 'lucide-react-native'
import { RootStackParamList } from '../navigation/types'
import { supabase } from '../lib/supabase'
import { isFollowing, setFollowing } from '../lib/spotsApi'
import { useUserStore } from '../store/useUserStore'
import { haptics } from '../lib/haptics'
import { User } from '../types/user'
import { Spot } from '../types/spot'
import { colors, fonts, radius, type, card, explorerRankColors, hitSlop } from '../theme'
import ProfileWorldMap from '../components/profile/ProfileWorldMap'
import BadgeGrid from '../components/profile/BadgeGrid'
import Banner from '../components/ui/Banner'
import Button from '../components/ui/Button'

type Props = StackScreenProps<RootStackParamList, 'Photographer'>

const RANK_NAMES = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', elite: 'Elite', legend: 'Legend' } as const
const COVER = 200
const AVATAR = 88

// Another photographer's public profile (read-only)
export default function PhotographerScreen({ route, navigation }: Props) {
  const { userId } = route.params
  const insets = useSafeAreaInsets()
  const [person, setPerson] = useState<User | null>(null)
  const [spots, setSpots] = useState<Spot[]>([])
  const [earned, setEarned] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const me = useUserStore((st) => st.user?.id)
  const [following, setFollowingState] = useState(false)
  const [followBusy, setFollowBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const [u, s, b] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).maybeSingle(),
      supabase.from('spots_public').select('*').eq('founder_id', userId).order('created_at', { ascending: false }),
      supabase.from('user_badges').select('badge_id').eq('user_id', userId),
    ])
    if (u.error || !u.data) {
      setError('This photographer couldn’t be found.')
    } else {
      setPerson(u.data as User)
      setSpots((s.data ?? []) as Spot[])
      setEarned(new Set((b.data ?? []).map((r: { badge_id: string }) => r.badge_id)))
      if (me && me !== userId) setFollowingState(await isFollowing(userId, me))
    }
    setLoading(false)
  }, [userId, me])

  async function toggleFollow() {
    if (!person) return
    const on = !following
    haptics.select()
    setFollowBusy(true)
    setFollowingState(on)
    setPerson({ ...person, followers_count: Math.max(0, person.followers_count + (on ? 1 : -1)) })
    const ok = await setFollowing(userId, on)
    setFollowBusy(false)
    if (!ok) {
      haptics.warning()
      setFollowingState(!on)
      setPerson((cur) => (cur ? { ...cur, followers_count: Math.max(0, cur.followers_count + (on ? -1 : 1)) } : cur))
    }
  }

  useEffect(() => {
    load()
  }, [load])

  const back = (
    <Pressable
      onPress={() => navigation.goBack()}
      hitSlop={hitSlop}
      style={({ pressed }) => [styles.back, { top: insets.top + 8 }, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Back"
    >
      <ChevronLeft size={24} color={colors.ink} />
    </Pressable>
  )

  if (!person) {
    return (
      <View style={[styles.container, styles.center]}>
        {back}
        {loading ? (
          <ActivityIndicator color={colors.ink} />
        ) : (
          <View style={styles.gap}>
            <Banner tone="error" message={error ?? 'Something went wrong.'} />
            <Button label="Try again" variant="secondary" onPress={load} />
          </View>
        )}
      </View>
    )
  }

  const rankColor = explorerRankColors[person.explorer_rank]
  const stats = [
    { Icon: Flag, value: person.spots_founded, label: 'Spots' },
    { Icon: Globe2, value: person.countries_visited, label: 'Countries' },
    { Icon: Building, value: person.cities_visited, label: 'Cities' },
    { Icon: ImageIcon, value: person.photos_uploaded, label: 'Photos' },
  ]

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <ProfileWorldMap spots={spots} height={COVER + insets.top} />
        <View style={styles.body}>
          <View style={styles.identity}>
            <View style={[styles.avatar, { borderColor: rankColor }]}>
              {person.avatar_url ? (
                <Image source={{ uri: person.avatar_url }} style={styles.avatarImg} accessibilityLabel={`${person.username}’s photo`} />
              ) : (
                <Text style={styles.avatarText}>{person.username.charAt(0).toUpperCase()}</Text>
              )}
            </View>
            <Text style={type.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
              @{person.username}
            </Text>
            <View style={[styles.rank, { borderColor: rankColor }]}>
              <Trophy size={13} color={rankColor} />
              <Text style={[styles.rankText, { color: rankColor }]}>
                {RANK_NAMES[person.explorer_rank]} Explorer · {person.xp.toLocaleString()} XP
              </Text>
            </View>
            {person.bio ? <Text style={[type.body, styles.bio]}>{person.bio}</Text> : null}
            <Text style={type.small}>
              <Text style={styles.strong}>{person.followers_count}</Text> followers · <Text style={styles.strong}>{person.following_count}</Text> following
            </Text>
            {me && me !== userId && (
              <Button
                label={following ? 'Following' : 'Follow'}
                variant={following ? 'secondary' : 'primary'}
                onPress={toggleFollow}
                disabled={followBusy}
                style={styles.follow}
              />
            )}
          </View>

          <View style={styles.stats}>
            {stats.map(({ Icon, value, label }) => (
              <View key={label} style={[card, styles.stat]} accessibilityLabel={`${value} ${label}`}>
                <Icon size={18} color={colors.ink2} />
                <Text style={styles.statValue}>{value}</Text>
                <Text style={type.caption}>{label}</Text>
              </View>
            ))}
          </View>

          <Text style={[type.headline, styles.section]}>Badges</Text>
          <BadgeGrid user={person} earned={earned} />

          <Text style={[type.headline, styles.section]}>Spots founded · {spots.length}</Text>
          {spots.length === 0 ? (
            <Text style={type.small}>No spots founded yet.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
              {spots.map((spot) => (
                <Pressable
                  key={spot.id}
                  onPress={() => navigation.push('Spot', { spotId: spot.id })}
                  style={({ pressed }) => [card, styles.spotCard, pressed && styles.pressed]}
                  accessibilityRole="button"
                >
                  {spot.cover_photo_url ? (
                    <Image source={{ uri: spot.cover_photo_url }} style={styles.spotImg} />
                  ) : (
                    <View style={[styles.spotImg, styles.imgEmpty]}>
                      <ImageOff size={20} color={colors.muted} />
                    </View>
                  )}
                  <Text style={styles.spotName} numberOfLines={1}>{spot.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>
      {back}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  gap: { gap: 12, alignSelf: 'stretch' },
  pressed: { opacity: 0.75 },
  back: {
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
  body: { paddingHorizontal: 20, gap: 14 },
  identity: { alignItems: 'center', marginTop: -AVATAR / 2, gap: 8 },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: colors.ink,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 4,
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { color: colors.onInk, fontSize: 34, fontFamily: fonts.extrabold },
  rank: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  rankText: { fontSize: 12, fontFamily: fonts.bold },
  bio: { textAlign: 'center' },
  strong: { color: colors.ink, fontFamily: fonts.bold },
  follow: { alignSelf: 'stretch', marginTop: 6 },
  stats: { flexDirection: 'row', gap: 8, marginTop: 6 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 4, borderRadius: radius.md },
  statValue: { color: colors.ink, fontSize: 22, fontFamily: fonts.extrabold },
  section: { marginTop: 10 },
  hList: { gap: 10, paddingRight: 20 },
  spotCard: { width: 150, padding: 8, gap: 4, borderRadius: radius.md },
  spotImg: { width: '100%', height: 96, borderRadius: radius.sm },
  imgEmpty: { backgroundColor: colors.sunk, justifyContent: 'center', alignItems: 'center' },
  spotName: { color: colors.ink, fontSize: 14, fontFamily: fonts.bold, marginTop: 4 },
})
