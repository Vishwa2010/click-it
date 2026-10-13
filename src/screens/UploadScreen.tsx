import { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, Pressable, RefreshControl, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { ChevronLeft, Flag, ImagePlus } from 'lucide-react-native'
import Button from '../components/ui/Button'
import { CompositeScreenProps } from '@react-navigation/native'
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import { StackScreenProps } from '@react-navigation/stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TabParamList, RootStackParamList } from '../navigation/types'
import { useSpotsStore } from '../store/useSpotsStore'
import { supabase } from '../lib/supabase'
import { User } from '../types/user'
import { findNearbySpot } from '../lib/geo'
import { preparePhotoForUpload } from '../lib/photo'
import { publishSpotPhoto } from '../lib/publish'
import { XP_REWARDS } from '../lib/xp'
import { useUserStore } from '../store/useUserStore'
import XpCelebration from '../components/XpCelebration'
import PhotoStep from './upload/PhotoStep'
import DetailsStep from './upload/DetailsStep'
import ConfirmStep, { PublishState } from './upload/ConfirmStep'
import { UploadDraft, EMPTY_DRAFT, COLORS } from './upload/types'
import { colors, fonts, hitSlop } from '../theme'
import { haptics } from '../lib/haptics'
import { usePullToRefresh } from '../hooks/usePullToRefresh'

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Upload'>,
  StackScreenProps<RootStackParamList>
>

type Step = 1 | 2 | 3
const STEP_TITLES: Record<Step, string> = { 1: 'Photo', 2: 'Spot details', 3: 'Confirm' }

export default function UploadScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets()
  const user = useUserStore((s) => s.user)
  const setUser = useUserStore((s) => s.setUser)
  const loadSpots = useSpotsStore((s) => s.load)
  // Captured when publishing, so the celebration reflects the state before the new spot counted
  const [firstSpot, setFirstSpot] = useState(false)
  const prefillSpotId = route.params?.spotId

  // Spots come from mock data until the map is wired to Supabase
  const spots = useSpotsStore((s) => s.spots)
  useEffect(() => {
    loadSpots()
  }, [loadSpots])
  // Pulling refreshes nearby spots for the "Add to [spot]?" check; your draft stays as it is
  const { refreshing, onRefresh } = usePullToRefresh(useCallback(() => loadSpots(true), [loadSpots]))
  const prefillSpot = useMemo(() => spots.find((s) => s.id === prefillSpotId) ?? null, [spots, prefillSpotId])

  const [step, setStep] = useState<Step>(1)
  const [draft, setDraft] = useState<UploadDraft>({ ...EMPTY_DRAFT, existingSpot: prefillSpot })
  const [declinedNearby, setDeclinedNearby] = useState(false)
  const [publish, setPublish] = useState<PublishState>({ status: 'idle' })

  // "I shot this" from a spot screen starts a fresh upload pre-filled with that spot
  useEffect(() => {
    setStep(1)
    setDraft({ ...EMPTY_DRAFT, existingSpot: prefillSpot })
    setDeclinedNearby(false)
    setPublish({ status: 'idle' })
  }, [prefillSpot])

  const nearbySpot = useMemo(
    () => (draft.coords ? findNearbySpot(spots, draft.coords.latitude, draft.coords.longitude, 50) : null),
    [spots, draft.coords]
  )

  // Spot to suggest on step 2: the one "I shot this" came from, else one pinned within 50 m
  const suggestedSpot = prefillSpot ?? nearbySpot

  const update = (patch: Partial<UploadDraft>) => setDraft((d) => ({ ...d, ...patch }))
  const isNew = !draft.existingSpot
  const xpReward = isNew ? XP_REWARDS.PIN_NEW_SPOT : XP_REWARDS.ADD_TO_EXISTING_SPOT

  const canContinue =
    step === 1
      ? Boolean(draft.photo && draft.coords)
      : step === 2
        ? Boolean(draft.existingSpot) ||
          (!(suggestedSpot && !declinedNearby) && draft.name.trim().length >= 2 && draft.tags.length > 0)
        : false

  const blockedReason =
    step === 1
      ? !draft.photo
        ? null
        : 'Drop a pin on the map to continue'
      : step === 2 && !draft.existingSpot
        ? suggestedSpot && !declinedNearby
          ? 'Choose an option above'
          : 'Add a name and at least one tag'
        : null

  async function handlePublish() {
    if (!draft.photo || !draft.coords) return
    try {
      setPublish({ status: 'publishing', message: 'Compressing photo…' })
      const prepared = await preparePhotoForUpload(draft.photo.uri, draft.photo.width, draft.photo.height)
      setPublish({ status: 'publishing', message: 'Publishing…' })
      const result = await publishSpotPhoto({
        photoUri: prepared.uri,
        takenAt: draft.takenAt,
        camera: draft.camera.trim(),
        lens: draft.lens.trim(),
        existingSpotId: draft.existingSpot?.id ?? null,
        newSpot: draft.existingSpot
          ? null
          : {
              name: draft.name.trim(),
              description: draft.description.trim(),
              latitude: draft.coords.latitude,
              longitude: draft.coords.longitude,
              tags: draft.tags,
              difficulty: draft.difficulty,
            },
      })
      setFirstSpot(result.isNewSpot && (user?.spots_founded ?? 0) === 0)
      // XP is awarded by the database; read back what was actually earned
      let earned: number = xpReward
      if (user) {
        const { data: fresh } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle()
        if (fresh) {
          earned = Math.max(0, (fresh as User).xp - user.xp) || xpReward
          setUser(fresh as User)
        }
      }
      loadSpots(true)
      haptics.success()
      setPublish({ status: 'done', spotId: result.spotId, xp: earned })
    } catch (e) {
      haptics.warning()
      setPublish({ status: 'error', message: e instanceof Error ? e.message : 'Publishing failed. Please try again.' })
    }
  }

  function reset() {
    navigation.setParams({ spotId: undefined })
    setStep(1)
    setDraft(EMPTY_DRAFT)
    setDeclinedNearby(false)
    setPublish({ status: 'idle' })
  }

  if (publish.status === 'done') {
    return (
      <View style={[styles.container, styles.doneWrap, { paddingTop: insets.top + 24 }]}>
        <View style={styles.doneIcon}>
          {isNew ? <Flag size={32} color={COLORS.onPrimary} /> : <ImagePlus size={32} color={COLORS.onPrimary} />}
        </View>
        <Text style={styles.doneTitle}>{isNew ? 'Spot founded!' : 'Photo added!'}</Text>
        <Text style={styles.doneText}>
          {isNew ? 'You’re the Founder of this spot. Others can now find your shot.' : 'Your shot is now in the spot’s gallery.'}
        </Text>
        <Button label="View spot" onPress={() => navigation.navigate('Spot', { spotId: publish.spotId })} style={styles.fullWidth} />
        <Button label="Pin another" variant="secondary" onPress={reset} style={styles.fullWidth} />
        <XpCelebration xp={publish.xp} confetti={firstSpot} />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
          disabled={step === 1 || publish.status === 'publishing'}
          style={({ pressed }) => [styles.headerSide, pressed && styles.pressed]}
          hitSlop={hitSlop}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          {step > 1 && <ChevronLeft size={28} color={COLORS.text} />}
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{STEP_TITLES[step]}</Text>
          <View style={styles.dots}>
            {([1, 2, 3] as Step[]).map((s) => (
              <View key={s} style={[styles.dot, s <= step && styles.dotActive]} />
            ))}
          </View>
        </View>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 120 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.text} />}
      >
        {step === 1 && <PhotoStep draft={draft} onChange={update} />}
        {step === 2 && (
          <DetailsStep
            draft={draft}
            nearbySpot={suggestedSpot}
            onChange={update}
            declinedNearby={declinedNearby}
            onDeclineNearby={() => setDeclinedNearby(true)}
          />
        )}
        {step === 3 && <ConfirmStep draft={draft} state={publish} xpReward={xpReward} onPublish={handlePublish} />}
      </ScrollView>

      {step < 3 && draft.photo && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          {!canContinue && blockedReason && <Text style={styles.blocked}>{blockedReason}</Text>}
          <Button label="Continue" onPress={() => setStep((s) => (s + 1) as Step)} disabled={!canContinue} />
        </View>
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerSide: { width: 72, minHeight: 44, justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center', gap: 6 },
  headerTitle: { color: COLORS.text, fontSize: 18, fontFamily: fonts.bold },
  pressed: { opacity: 0.6 },
  fullWidth: { alignSelf: 'stretch' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 24, height: 4, borderRadius: 2, backgroundColor: colors.line },
  dotActive: { backgroundColor: COLORS.primary },
  body: { padding: 16 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  blocked: { color: COLORS.textSecondary, fontFamily: fonts.regular, fontSize: 12, textAlign: 'center' },
  doneWrap: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 12 },
  doneIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  doneTitle: { color: COLORS.text, fontSize: 30, fontFamily: fonts.extrabold, letterSpacing: -0.8 },
  doneText: { color: COLORS.textSecondary, fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, textAlign: 'center', marginBottom: 12 },
})
