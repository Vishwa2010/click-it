import { useCallback, useState } from 'react'
import { View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { Trophy, Timer, Crown, CalendarClock, Swords, ChevronRight, Check } from 'lucide-react-native'
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native'
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { StackNavigationProp } from '@react-navigation/stack'
import { TabParamList, RootStackParamList } from '../navigation/types'
import { fetchMyDuels } from '../lib/duelsApi'
import { fetchUsernames } from '../lib/spotsApi'
import { Duel } from '../types/duel'
import { supabase } from '../lib/supabase'
import { useUserStore } from '../store/useUserStore'
import { Challenge } from '../types/challenge'
import { ExplorerRank } from '../types/user'
import { colors, fonts, radius, type, card, explorerRankColors } from '../theme'
import Banner from '../components/ui/Banner'
import Button from '../components/ui/Button'
import { haptics } from '../lib/haptics'

interface Joined {
  progress: number
  completed_at: string | null
}

interface Leader {
  id: string
  username: string
  xp: number
  explorer_rank: ExplorerRank
}

// What counts toward each challenge, and where in the app to do it
const HOW_TO: Record<string, { unit: string; tip: string; cta: string; tab: 'Map' | 'Upload' }> = {
  found_spots: { unit: 'new spots founded', tip: 'Pin a spot nobody has pinned yet.', cta: 'Pin a spot', tab: 'Upload' },
  upload_photos: { unit: 'photos uploaded', tip: 'Upload photos to any spot.', cta: 'Upload a photo', tab: 'Upload' },
  visit_spots: { unit: 'spots visited', tip: 'Open a spot and tap Navigate to log a visit.', cta: 'Find a spot', tab: 'Map' },
  golden_hour_photos: { unit: 'golden-hour photos', tip: 'Upload photos taken during golden hour.', cta: 'Upload a photo', tab: 'Upload' },
}
const FALLBACK_HOW = { unit: 'done', tip: 'Keep exploring to make progress.', cta: 'Open the map', tab: 'Map' as const }

function timeLeft(endIso: string): string {
  const ms = new Date(endIso).getTime() - Date.now()
  if (ms <= 0) return 'Ended'
  const days = Math.floor(ms / 86400000)
  const hours = Math.floor((ms % 86400000) / 3600000)
  return days > 0 ? `${days}d ${hours}h left` : `${hours}h left`
}

type Nav = CompositeNavigationProp<BottomTabNavigationProp<TabParamList, 'Challenges'>, StackNavigationProp<RootStackParamList>>

export default function ChallengesScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<Nav>()
  const [duels, setDuels] = useState<Duel[]>([])
  const [duelNames, setDuelNames] = useState<Record<string, string>>({})
  const user = useUserStore((s) => s.user)
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [joined, setJoined] = useState<Record<string, Joined>>({})
  const [leaders, setLeaders] = useState<Leader[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState<string | null>(null)
  const [justJoined, setJustJoined] = useState<string | null>(null)
  const [joinError, setJoinError] = useState<{ id: string; message: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const nowIso = new Date().toISOString()
    const [c, j, l] = await Promise.all([
      supabase.from('challenges').select('*').gte('end_date', nowIso).order('start_date'),
      user ? supabase.from('user_challenges').select('challenge_id, progress, completed_at').eq('user_id', user.id) : Promise.resolve({ data: [], error: null }),
      supabase.from('users').select('id, username, xp, explorer_rank').order('xp', { ascending: false }).limit(10),
    ])
    if (c.error || j.error || l.error) {
      setError('Couldn’t load challenges. Pull down to try again.')
    } else {
      setChallenges((c.data ?? []) as Challenge[])
      setJoined(Object.fromEntries(((j.data ?? []) as ({ challenge_id: string } & Joined)[]).map((r) => [r.challenge_id, r])))
      setLeaders((l.data ?? []) as Leader[])
    }
    if (user) {
      const mine = await fetchMyDuels(user.id)
      setDuels(mine)
      setDuelNames(await fetchUsernames(mine.flatMap((d) => [d.challenger_id, d.opponent_id])))
    }
    setLoading(false)
  }, [user])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  async function join(id: string) {
    setJoining(id)
    setJoinError(null)
    const { error: insertError } = await supabase.from('user_challenges').insert({ challenge_id: id })
    setJoining(null)
    // 23505 = already joined (e.g. from another device) — treat as success
    if (insertError && insertError.code !== '23505') {
      haptics.warning()
      setJoinError({ id, message: 'Couldn’t join that challenge. Check your connection and try again.' })
      return
    }
    haptics.success()
    setJustJoined(id)
    setJoined((j) => ({ ...j, [id]: j[id] ?? { progress: 0, completed_at: null } }))
  }

  const now = Date.now()
  const active = challenges.filter((c) => new Date(c.start_date).getTime() <= now)
  const upcoming = challenges.filter((c) => new Date(c.start_date).getTime() > now)

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 20, paddingBottom: 40, gap: 16 }}
      refreshControl={<RefreshControl refreshing={loading && challenges.length + leaders.length > 0} onRefresh={load} tintColor={colors.ink} />}
    >
      <View>
        <Text style={type.eyebrow}>Compete</Text>
        <Text style={[type.display, styles.title]}>Challenges.</Text>
      </View>

      {error && <Banner tone="error" message={error} />}

      {loading && challenges.length + leaders.length === 0 ? (
        <ActivityIndicator color={colors.ink} style={styles.loading} />
      ) : (
        <>
          <View style={styles.sectionHead}>
            <Swords size={18} color={colors.ink} />
            <Text style={type.headline}>Active</Text>
          </View>
          {active.length === 0 ? (
            <View style={[card, styles.empty]}>
              <Text style={type.bodyStrong}>No active challenges right now</Text>
              <Text style={type.small}>New challenges drop regularly — check back soon.</Text>
            </View>
          ) : (
            active.map((c) => {
              const mine = joined[c.id]
              const how = HOW_TO[c.requirement_type] ?? FALLBACK_HOW
              const pct = mine ? Math.min(1, mine.progress / Math.max(1, c.requirement_count)) : 0
              return (
                <View key={c.id} style={[card, styles.challenge, mine?.completed_at ? styles.done : null]}>
                  <View style={styles.rowBetween}>
                    <Text style={[type.subhead, styles.flex1]}>{c.title}</Text>
                    {mine && !mine.completed_at && (
                      <View style={styles.joinedChip}>
                        <Check size={12} color={colors.onInk} strokeWidth={3} />
                        <Text style={styles.joinedText}>Joined</Text>
                      </View>
                    )}
                    <Text style={styles.xp}>+{c.xp_reward} XP</Text>
                  </View>
                  {c.description ? <Text style={type.small}>{c.description}</Text> : null}
                  <View style={styles.metaRow}>
                    <Timer size={14} color={colors.muted} />
                    <Text style={type.caption}>{timeLeft(c.end_date)}</Text>
                  </View>
                  {mine ? (
                    <>
                      <View style={styles.progressRow}>
                        <View style={styles.track}>
                          <View style={[styles.fill, { width: `${Math.max(3, pct * 100)}%` }]} />
                        </View>
                        <Text style={type.smallStrong}>
                          {mine.completed_at ? 'Completed' : `${mine.progress} of ${c.requirement_count}`}
                        </Text>
                      </View>
                      {!mine.completed_at && (
                        <>
                          {justJoined === c.id && (
                            <Banner tone="success" message={`You’re in! ${how.tip} Progress counts from now.`} />
                          )}
                          <View style={styles.howRow}>
                            <Text style={[type.caption, styles.flex1]}>
                              {mine.progress} {how.unit} · {how.tip}
                            </Text>
                            <Pressable
                              onPress={() => navigation.navigate('Tabs', { screen: how.tab })}
                              style={({ pressed }) => [styles.howBtn, pressed && styles.pressed]}
                              accessibilityRole="button"
                            >
                              <Text style={styles.howBtnText}>{how.cta}</Text>
                              <ChevronRight size={14} color={colors.ink} />
                            </Pressable>
                          </View>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <Button label="Join challenge" onPress={() => join(c.id)} loading={joining === c.id} />
                      {joinError?.id === c.id && <Banner tone="error" message={joinError.message} />}
                    </>
                  )}
                </View>
              )
            })
          )}

          {upcoming.length > 0 && (
            <>
              <View style={styles.sectionHead}>
                <CalendarClock size={18} color={colors.ink} />
                <Text style={type.headline}>Coming up</Text>
              </View>
              {upcoming.map((c) => (
                <View key={c.id} style={[card, styles.challenge, styles.upcoming]}>
                  <Text style={type.subhead}>{c.title}</Text>
                  <Text style={type.caption}>
                    Starts {new Date(c.start_date).toLocaleDateString([], { month: 'short', day: 'numeric' })} · +{c.xp_reward} XP
                  </Text>
                </View>
              ))}
            </>
          )}

          {duels.length > 0 && (
            <>
              <View style={styles.sectionHead}>
                <Swords size={18} color={colors.ink} />
                <Text style={type.headline}>Your duels</Text>
              </View>
              {[...duels]
                .sort((a, b) => Number(b.status === 'pending' && b.opponent_id === user?.id) - Number(a.status === 'pending' && a.opponent_id === user?.id))
                .map((d) => {
                  const invite = d.status === 'pending' && d.opponent_id === user?.id
                  const rival = d.challenger_id === user?.id ? d.opponent_id : d.challenger_id
                  return (
                    <Pressable
                      key={d.id}
                      onPress={() => navigation.navigate('ShotDuel', { duelId: d.id })}
                      style={({ pressed }) => [card, styles.duelRow, invite && styles.invite, pressed && styles.pressed]}
                      accessibilityRole="button"
                    >
                      <View style={styles.flex1}>
                        <Text style={type.subhead}>vs @{duelNames[rival] ?? 'photographer'}</Text>
                        <Text style={type.caption}>
                          {invite ? 'You’ve been challenged — tap to answer' : d.status === 'pending' ? 'Waiting for them to accept' : `Voting · ${d.challenger_votes + d.opponent_votes} votes`}
                        </Text>
                      </View>
                      <ChevronRight size={20} color={colors.ink2} />
                    </Pressable>
                  )
                })}
            </>
          )}

          <View style={styles.sectionHead}>
            <Trophy size={18} color={colors.ink} />
            <Text style={type.headline}>Leaderboard</Text>
          </View>
          <View style={[card, styles.board]}>
            {leaders.length === 0 ? (
              <Text style={[type.small, styles.boardEmpty]}>No explorers yet.</Text>
            ) : (
              leaders.map((l, i) => {
                const me = l.id === user?.id
                return (
                  <View key={l.id} style={[styles.leader, i > 0 && styles.leaderBorder, me && styles.me]}>
                    <View style={styles.place}>
                      {i === 0 ? <Crown size={18} color={explorerRankColors.gold} /> : <Text style={styles.placeNum}>{i + 1}</Text>}
                    </View>
                    <Text style={[styles.leaderName, me && styles.meText]} numberOfLines={1}>
                      @{l.username}{me ? ' (you)' : ''}
                    </Text>
                    <View style={[styles.rankDot, { backgroundColor: explorerRankColors[l.explorer_rank] }]} />
                    <Text style={styles.leaderXp}>{l.xp.toLocaleString()} XP</Text>
                  </View>
                )
              })
            )}
          </View>
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  title: { marginTop: 6 },
  loading: { marginTop: 60 },
  flex1: { flex: 1 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  empty: { padding: 16, gap: 4, borderRadius: radius.md },
  challenge: { padding: 16, gap: 10, borderRadius: radius.lg },
  done: { borderColor: colors.success, borderWidth: 1.5 },
  upcoming: { opacity: 0.85, gap: 4 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  xp: { color: colors.accent, fontSize: 14, fontFamily: fonts.bold },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.sunk, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.ink, borderRadius: 4 },
  joinedChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.success, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  joinedText: { color: colors.onInk, fontSize: 12, fontFamily: fonts.bold },
  howRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  howBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 44, paddingLeft: 12, paddingRight: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  howBtnText: { color: colors.ink, fontSize: 13, fontFamily: fonts.semibold },
  board: { borderRadius: radius.lg, overflow: 'hidden' },
  duelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: radius.lg },
  invite: { borderColor: colors.ink, borderWidth: 1.5 },
  pressed: { opacity: 0.8 },
  boardEmpty: { padding: 16 },
  leader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, minHeight: 52 },
  leaderBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  me: { backgroundColor: colors.sunk },
  place: { width: 24, alignItems: 'center' },
  placeNum: { color: colors.ink2, fontSize: 15, fontFamily: fonts.bold },
  leaderName: { flex: 1, color: colors.ink, fontSize: 15, fontFamily: fonts.semibold },
  meText: { fontFamily: fonts.extrabold },
  rankDot: { width: 10, height: 10, borderRadius: 5 },
  leaderXp: { color: colors.ink, fontSize: 14, fontFamily: fonts.bold },
})
