import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from 'react-native'
import { ReactElement, useEffect, useRef, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft } from 'lucide-react-native'
import * as Location from 'expo-location'
import { supabase } from '../../lib/supabase'
import { useUserStore } from '../../store/useUserStore'
import { SpotTag } from '../../types/spot'
import { User } from '../../types/user'
import { C, Coords, MAX_INTERESTS, usernameRules, UsernameStatus, useReducedMotion } from './onboarding/shared'
import HookPage from './onboarding/HookPage'
import MissedPage from './onboarding/MissedPage'
import AddressPage from './onboarding/AddressPage'
import TimingPage, { LocationChoice } from './onboarding/TimingPage'
import FounderPage from './onboarding/FounderPage'
import UsernamePage from './onboarding/UsernamePage'
import InterestsPage from './onboarding/InterestsPage'
import WowPage from './onboarding/WowPage'
import { fonts, hitSlop } from '../../theme'
import Button from '../../components/ui/Button'

// Story pages hook the user, then we collect what we need, then the payoff
const PAGES = ['hook', 'missed', 'address', 'timing', 'founder', 'username', 'interests', 'wow'] as const
type Page = (typeof PAGES)[number]
const FIRST_SETUP_PAGE = PAGES.indexOf('username')

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets()
  const reduced = useReducedMotion()
  const setUser = useUserStore((s) => s.setUser)
  const setAuthStatus = useUserStore((s) => s.setAuthStatus)

  const [index, setIndex] = useState(0)
  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [selected, setSelected] = useState<SpotTag[]>([])
  const [location, setLocation] = useState<LocationChoice>('undecided')
  const [coords, setCoords] = useState<Coords | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const page: Page = PAGES[index]
  const slide = useRef(new Animated.Value(1)).current
  const direction = useRef(1)

  // Slide each new page in from the direction of travel
  useEffect(() => {
    if (reduced) {
      slide.setValue(1)
      return
    }
    slide.setValue(0)
    Animated.timing(slide, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start()
  }, [index, slide, reduced])

  // Live username availability, debounced while typing
  useEffect(() => {
    setUsernameError(null)
    const rules = usernameRules(username)
    if (!rules.length || !rules.chars) {
      setUsernameStatus('idle')
      return
    }
    setUsernameStatus('checking')
    let cancelled = false
    const timer = setTimeout(async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      const { data, error } = await supabase.from('users').select('id').eq('username', username).maybeSingle()
      if (cancelled) return
      if (error) setUsernameStatus('error')
      else setUsernameStatus(data && data.id !== authUser?.id ? 'taken' : 'available')
    }, 450)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [username])

  function go(next: number) {
    direction.current = next > index ? 1 : -1
    setIndex(Math.max(0, Math.min(PAGES.length - 1, next)))
  }

  function toggleInterest(tag: SpotTag) {
    setSelected((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag)
      if (prev.length >= MAX_INTERESTS) return prev
      return [...prev, tag]
    })
  }

  async function enableLocation() {
    // Asked only after the page explains why (CLAUDE.md hard rule)
    setLocation('requesting')
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== Location.PermissionStatus.GRANTED) {
        setLocation('denied')
        return
      }
      setLocation('granted')
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
    } catch {
      setLocation((l) => (l === 'granted' ? l : 'denied'))
    }
  }

  async function finish() {
    setSaving(true)
    setSaveError(null)

    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      setSaving(false)
      setSaveError('Your session expired. Please log in again.')
      return
    }

    const profile: User = {
      id: authUser.id,
      username,
      avatar_url: '',
      bio: '',
      explorer_rank: 'bronze',
      xp: 0,
      spots_founded: 0,
      spots_visited: 0,
      countries_visited: 0,
      cities_visited: 0,
      photos_uploaded: 0,
      followers_count: 0,
      following_count: 0,
      created_at: new Date().toISOString(),
    }

    const { error: dbError } = await supabase.from('users').upsert({ ...profile, interest_tags: selected })
    setSaving(false)

    if (dbError) {
      if (dbError.code === '23505') {
        // Someone grabbed the name since we checked — send them back to pick another
        setUsernameStatus('taken')
        setUsernameError('Someone just took that username. Please pick another.')
        go(FIRST_SETUP_PAGE)
      } else {
        setSaveError(dbError.message)
      }
      return
    }

    setUser(profile)
    // Saving a profile doesn't fire an auth event, so switch to the main app directly
    setAuthStatus('authenticated')
  }

  const canContinue =
    page === 'username'
      ? usernameStatus === 'available'
      : page === 'interests'
        ? selected.length === MAX_INTERESTS
        : true

  const locationDecided = location === 'granted' || location === 'denied'
  const primaryLabel: Record<Page, string> = {
    hook: 'Show me →',
    missed: 'How?',
    address: 'Continue',
    timing: locationDecided ? 'Continue' : 'Not now',
    founder: 'Claim my name',
    username: 'Continue',
    interests: 'See what I’m missing',
    wow: 'Start exploring',
  }

  function onPrimary() {
    if (!canContinue || saving) return
    if (page === 'wow') {
      finish()
      return
    }
    if (page === 'timing' && location === 'undecided') setLocation('skipped')
    go(index + 1)
  }

  const pageBody: Record<Page, ReactElement> = {
    hook: <HookPage />,
    missed: <MissedPage />,
    address: <AddressPage />,
    timing: <TimingPage choice={location} coords={coords} onEnable={enableLocation} />,
    founder: <FounderPage />,
    username: <UsernamePage username={username} onChange={setUsername} status={usernameStatus} error={usernameError} />,
    interests: <InterestsPage selected={selected} onToggle={toggleInterest} />,
    wow: <WowPage username={username} interests={selected} coords={coords} error={saveError} />,
  }

  const isStory = index < FIRST_SETUP_PAGE

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => go(index - 1)}
            disabled={index === 0 || saving}
            style={({ pressed }) => [styles.headerSide, pressed && styles.pressed]}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            {index > 0 && <ChevronLeft size={28} color={C.text} />}
          </Pressable>

          <View style={styles.segments} accessibilityLabel={`Step ${index + 1} of ${PAGES.length}`}>
            {PAGES.map((p, i) => (
              <View key={p} style={[styles.segment, i <= index && styles.segmentOn]} />
            ))}
          </View>

          <Pressable
            onPress={() => (index === 0 ? supabase.auth.signOut() : isStory ? go(FIRST_SETUP_PAGE) : undefined)}
            disabled={!(index === 0 || isStory)}
            style={({ pressed }) => [styles.headerSide, styles.headerRight, pressed && styles.pressed]}
            hitSlop={hitSlop}
            accessibilityRole="button"
          >
            {isStory && <Text style={styles.skip}>{index === 0 ? 'Sign out' : 'Skip'}</Text>}
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Animated.View
          key={page}
          style={{
            opacity: slide,
            transform: [
              { translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [48 * direction.current, 0] }) },
            ],
          }}
        >
          {pageBody[page]}
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button label={primaryLabel[page]} onPress={onPrimary} disabled={!canContinue} loading={saving} />
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.background },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerSide: { width: 72, minHeight: 44, justifyContent: 'center' },
  headerRight: { alignItems: 'flex-end' },
  pressed: { opacity: 0.6 },
  skip: { color: C.textSecondary, fontSize: 15, fontFamily: fonts.semibold },
  segments: { flex: 1, flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: C.border },
  segmentOn: { backgroundColor: C.primary },
  body: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
  scroll: { flex: 1 },
  // Solid background so scrolled content never shows through the button
  footer: { paddingHorizontal: 24, paddingTop: 12, backgroundColor: C.background },
})
