import { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, Image, ScrollView, Pressable, ActivityIndicator, StyleSheet, Alert, useWindowDimensions } from 'react-native'
import { StackScreenProps } from '@react-navigation/stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, Swords, Crown, Timer, Check } from 'lucide-react-native'
import { RootStackParamList } from '../navigation/types'
import { useUserStore } from '../store/useUserStore'
import { fetchSpotPhotos, fetchUsernames, fetchSpot } from '../lib/spotsApi'
import { fetchDuel, createDuel, answerDuel, voteDuel, settleDuel, fetchBusyRivals, DuelDetail, DUEL_HOURS } from '../lib/duelsApi'
import { SpotPhoto } from '../types/spot'
import { colors, fonts, radius, type, card, hitSlop } from '../theme'
import { haptics } from '../lib/haptics'
import Button from '../components/ui/Button'
import Banner from '../components/ui/Banner'

type Props = StackScreenProps<RootStackParamList, 'ShotDuel'>

function timeLeft(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return 'Voting closed'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h left` : `${h}h ${m}m left`
}

// Grid of photos to pick from (yours, for starting or accepting a duel)
function PhotoPicker({ photos, selected, onSelect }: { photos: SpotPhoto[]; selected: string | null; onSelect: (url: string) => void }) {
  const { width } = useWindowDimensions()
  const size = (width - 40 - 16) / 3
  return (
    <View style={styles.pickGrid}>
      {photos.map((p) => (
        <Pressable
          key={p.id}
          onPress={() => onSelect(p.photo_url)}
          style={[styles.pick, { width: size, height: size }, selected === p.photo_url && styles.pickOn]}
          accessibilityRole="button"
          accessibilityState={{ selected: selected === p.photo_url }}
          accessibilityLabel="Your photo"
        >
          <Image source={{ uri: p.photo_url }} style={styles.pickImg} />
          {selected === p.photo_url && (
            <View style={styles.pickCheck}>
              <Check size={14} color={colors.onInk} strokeWidth={3} />
            </View>
          )}
        </Pressable>
      ))}
    </View>
  )
}

export default function ShotDuelScreen({ route, navigation }: Props) {
  const { duelId, spotId } = route.params
  const insets = useSafeAreaInsets()
  const userId = useUserStore((s) => s.user?.id)

  const [detail, setDetail] = useState<DuelDetail | null>(null)
  const [spotName, setSpotName] = useState('')
  const [spotPhotos, setSpotPhotos] = useState<SpotPhoto[]>([])
  const [names, setNames] = useState<Record<string, string>>({})
  const [opponent, setOpponent] = useState<string | null>(null)
  const [busyRivals, setBusyRivals] = useState<Set<string>>(new Set())
  const [myPhoto, setMyPhoto] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const duelSpotId = detail?.duel.spot_id ?? spotId

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let d: DuelDetail | null = null
      if (duelId) {
        d = await fetchDuel(duelId, userId)
        // Past the deadline (voting over, or an invite nobody answered)? settle it, then show the result
        if (d && (d.duel.status === 'voting' || d.duel.status === 'pending') && new Date(d.duel.expires_at).getTime() <= Date.now()) {
          await settleDuel(duelId)
          d = await fetchDuel(duelId, userId)
        }
        if (!d) throw new Error('This duel couldn’t be found.')
        setDetail(d)
      }
      const sid = d?.duel.spot_id ?? spotId
      if (sid) {
        const [photos, spot] = await Promise.all([fetchSpotPhotos(sid), d ? Promise.resolve(null) : fetchSpot(sid)])
        setSpotPhotos(photos)
        setSpotName(d?.spotName ?? spot?.name ?? 'this spot')
        setNames(await fetchUsernames(photos.map((p) => p.user_id)))
        if (!d && userId) setBusyRivals(await fetchBusyRivals(userId, sid))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t load this duel.')
    } finally {
      setLoading(false)
    }
  }, [duelId, spotId, userId])

  useEffect(() => {
    load()
  }, [load])

  const myPhotos = useMemo(() => spotPhotos.filter((p) => p.user_id === userId), [spotPhotos, userId])
  const rivals = useMemo(
    () => [...new Set(spotPhotos.filter((p) => p.user_id !== userId && !busyRivals.has(p.user_id)).map((p) => p.user_id))],
    [spotPhotos, userId, busyRivals]
  )

  async function run(action: () => Promise<void>, success?: () => void) {
    setBusy(true)
    setError(null)
    try {
      await action()
      haptics.success()
      success?.()
    } catch (e) {
      haptics.warning()
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
      <Pressable onPress={() => navigation.goBack()} hitSlop={hitSlop} style={styles.headerBtn} accessibilityRole="button" accessibilityLabel="Back">
        <ChevronLeft size={28} color={colors.ink} />
      </Pressable>
      <Text style={type.headline}>Shot Duel</Text>
      <View style={styles.headerBtn} />
    </View>
  )

  if (loading && !detail && spotPhotos.length === 0) {
    return (
      <View style={styles.container}>
        {header}
        <ActivityIndicator color={colors.ink} style={styles.loading} />
      </View>
    )
  }

  // ── Start a duel ──
  if (!detail) {
    return (
      <View style={styles.container}>
        {header}
        <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 120 }]}>
          <View style={styles.hero}>
            <Swords size={28} color={colors.ink} />
            <Text style={type.title}>Challenge a photographer</Text>
            <Text style={type.body}>
              Pick someone who has shot {spotName}. You each put up one photo, the community votes for {DUEL_HOURS} hours, and the winner earns +150 XP.
            </Text>
          </View>
          {error && <Banner tone="error" message={error} />}
          {myPhotos.length === 0 ? (
            <Banner tone="info" title="Post a photo here first" message="You need your own shot of this spot to start a duel." />
          ) : rivals.length === 0 ? (
            <Banner tone="info" title="No rivals yet" message={busyRivals.size > 0
                ? 'You already have a duel going with everyone who has shot this spot.'
                : 'Nobody else has posted a photo here yet. Check back once others have shot this spot.'} />
          ) : (
            <>
              <Text style={type.eyebrow}>1 · Opponent</Text>
              <View style={styles.rivals}>
                {rivals.map((id) => (
                  <Pressable
                    key={id}
                    onPress={() => setOpponent(id)}
                    style={[styles.rival, opponent === id && styles.rivalOn]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: opponent === id }}
                  >
                    <Text style={[styles.rivalText, opponent === id && styles.rivalTextOn]}>@{names[id] ?? 'photographer'}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={type.eyebrow}>2 · Your photo</Text>
              <PhotoPicker photos={myPhotos} selected={myPhoto} onSelect={setMyPhoto} />
            </>
          )}
        </ScrollView>
        {myPhotos.length > 0 && rivals.length > 0 && (
          <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
            <Button
              label="Send challenge"
              disabled={!opponent || !myPhoto}
              loading={busy}
              onPress={() =>
                run(async () => {
                  const id = await createDuel(duelSpotId as string, opponent as string, myPhoto as string)
                  navigation.replace('ShotDuel', { duelId: id })
                })
              }
            />
          </View>
        )}
      </View>
    )
  }

  // ── View / answer / vote ──
  const { duel, usernames, myVote } = detail
  const isChallenger = duel.challenger_id === userId
  const isOpponent = duel.opponent_id === userId
  const total = duel.challenger_votes + duel.opponent_votes
  const winner =
    duel.status === 'completed' && total > 0 && duel.challenger_votes !== duel.opponent_votes
      ? duel.challenger_votes > duel.opponent_votes ? 'challenger' : 'opponent'
      : null
  const inviteOpen = duel.status === 'pending' && new Date(duel.expires_at).getTime() > Date.now()
  const canVote = duel.status === 'voting' && !isChallenger && !isOpponent && !myVote && new Date(duel.expires_at).getTime() > Date.now()

  const side = (s: 'challenger' | 'opponent') => {
    const uid = s === 'challenger' ? duel.challenger_id : duel.opponent_id
    const url = s === 'challenger' ? duel.challenger_photo_url : duel.opponent_photo_url
    const votes = s === 'challenger' ? duel.challenger_votes : duel.opponent_votes
    const pct = total > 0 ? Math.round((votes / total) * 100) : 0
    return (
      <View style={[card, styles.side, winner === s && styles.sideWin, myVote === s && styles.sideMine]}>
        {url ? (
          <Image source={{ uri: url }} style={styles.sideImg} accessibilityLabel={`Photo by ${usernames[uid] ?? 'photographer'}`} />
        ) : (
          <View style={[styles.sideImg, styles.sideEmpty]}>
            <Text style={type.caption}>Waiting for photo</Text>
          </View>
        )}
        <View style={styles.sideBody}>
          <View style={styles.sideName}>
            {winner === s && <Crown size={14} color={colors.ink} />}
            <Text style={styles.sideUser} numberOfLines={1}>@{usernames[uid] ?? 'photographer'}</Text>
          </View>
          {duel.status !== 'pending' && <Text style={type.caption}>{votes} votes · {pct}%</Text>}
          {canVote && (
            <Button
              label="Vote"
              onPress={() => run(async () => { await voteDuel(duel.id, s) }, load)}
              loading={busy}
              style={styles.voteBtn}
            />
          )}
          {myVote === s && <Text style={styles.yourVote}>Your vote</Text>}
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {header}
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 120 }]}>
        <Text style={type.eyebrow}>{detail.spotName}</Text>
        <Text style={type.title}>
          @{usernames[duel.challenger_id] ?? '…'} vs @{usernames[duel.opponent_id] ?? '…'}
        </Text>
        <View style={styles.status}>
          <Timer size={14} color={colors.ink2} />
          <Text style={type.small}>
            {duel.status === 'pending'
              ? isOpponent ? `You’ve been challenged — ${timeLeft(duel.expires_at).replace('left', 'to answer')}` : 'Waiting for the opponent to accept'
              : duel.status === 'voting'
                ? timeLeft(duel.expires_at)
                : winner
                  ? `Winner: @${usernames[winner === 'challenger' ? duel.challenger_id : duel.opponent_id] ?? 'photographer'} (+150 XP)`
                  : duel.opponent_photo_url ? 'Duel over — it’s a tie' : 'Duel closed — the invite wasn’t accepted'}
          </Text>
        </View>
        {error && <Banner tone="error" message={error} />}

        <View style={styles.sides}>
          {side('challenger')}
          {side('opponent')}
        </View>

        {inviteOpen && isOpponent && (
          <>
            <Text style={type.eyebrow}>Accept with one of your photos</Text>
            {myPhotos.length === 0 ? (
              <Banner tone="info" message="Post a photo of this spot first, then come back to accept." />
            ) : (
              <PhotoPicker photos={myPhotos} selected={myPhoto} onSelect={setMyPhoto} />
            )}
          </>
        )}
      </ScrollView>

      {inviteOpen && isOpponent && (
        <View style={[styles.footer, styles.footerRow, { paddingBottom: insets.bottom + 12 }]}>
          <Button
            label="Decline"
            variant="secondary"
            onPress={() =>
              Alert.alert('Decline this duel?', undefined, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Decline', style: 'destructive', onPress: () => run(() => answerDuel(duel.id, null), load) },
              ])
            }
            disabled={busy}
            style={styles.flex1}
          />
          <Button
            label="Accept"
            onPress={() => run(() => answerDuel(duel.id, myPhoto), load)}
            disabled={!myPhoto}
            loading={busy}
            style={styles.flex1}
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  loading: { marginTop: 80 },
  flex1: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerBtn: { width: 44, height: 44, justifyContent: 'center' },
  body: { padding: 20, gap: 16 },
  hero: { gap: 8 },
  rivals: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rival: { minHeight: 40, paddingHorizontal: 14, justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  rivalOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  rivalText: { color: colors.ink, fontSize: 14, fontFamily: fonts.semibold },
  rivalTextOn: { color: colors.onInk },
  pickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pick: { borderRadius: radius.sm, overflow: 'hidden', borderWidth: 3, borderColor: 'transparent' },
  pickOn: { borderColor: colors.ink },
  pickImg: { width: '100%', height: '100%' },
  pickCheck: { position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.ink, justifyContent: 'center', alignItems: 'center' },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -6 },
  sides: { flexDirection: 'row', gap: 10 },
  side: { flex: 1, overflow: 'hidden', borderRadius: radius.lg },
  sideWin: { borderColor: colors.ink, borderWidth: 2 },
  sideMine: { borderColor: colors.accent, borderWidth: 2 },
  sideImg: { width: '100%', aspectRatio: 3 / 4 },
  sideEmpty: { backgroundColor: colors.sunk, justifyContent: 'center', alignItems: 'center' },
  sideBody: { padding: 10, gap: 6 },
  sideName: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sideUser: { color: colors.ink, fontSize: 14, fontFamily: fonts.bold, flexShrink: 1 },
  voteBtn: { minHeight: 44 },
  yourVote: { color: colors.accent, fontSize: 12, fontFamily: fonts.bold },
  footer: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: colors.paper, borderTopWidth: 1, borderTopColor: colors.line },
  footerRow: { flexDirection: 'row', gap: 10 },
})
