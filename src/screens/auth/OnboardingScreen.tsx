import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useUserStore } from '../../store/useUserStore'
import { SpotTag } from '../../types/spot'
import { User } from '../../types/user'

const ALL_TAGS: { tag: SpotTag; label: string; emoji: string }[] = [
  { tag: 'sunset', label: 'Sunset', emoji: '🌅' },
  { tag: 'sunrise', label: 'Sunrise', emoji: '🌄' },
  { tag: 'cityscape', label: 'Cityscape', emoji: '🏙' },
  { tag: 'nature', label: 'Nature', emoji: '🌿' },
  { tag: 'waterfall', label: 'Waterfall', emoji: '💧' },
  { tag: 'architecture', label: 'Architecture', emoji: '🏛' },
  { tag: 'street_art', label: 'Street Art', emoji: '🎨' },
  { tag: 'rooftop', label: 'Rooftop', emoji: '🏗' },
  { tag: 'hidden_gem', label: 'Hidden Gem', emoji: '💎' },
  { tag: 'night', label: 'Night', emoji: '🌃' },
]

export default function OnboardingScreen() {
  const setUser = useUserStore((s) => s.setUser)

  const [username, setUsername] = useState('')
  const [selected, setSelected] = useState<SpotTag[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleTag(tag: SpotTag) {
    setSelected((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag)
      if (prev.length >= 3) return prev
      return [...prev, tag]
    })
  }

  async function handleFinish() {
    const trimmed = username.trim()
    if (!trimmed) {
      setError('Please choose a username.')
      return
    }
    if (trimmed.length < 3) {
      setError('Username must be at least 3 characters.')
      return
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setError('Username can only contain letters, numbers, and underscores.')
      return
    }
    if (selected.length < 3) {
      setError('Pick exactly 3 interests to personalise your feed.')
      return
    }

    setLoading(true)
    setError(null)

    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      setError('Session expired. Please log in again.')
      setLoading(false)
      return
    }

    const now = new Date().toISOString()
    const profile: User = {
      id: authUser.id,
      username: trimmed,
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
      created_at: now,
    }

    const { error: dbError } = await supabase
      .from('users')
      .upsert({ ...profile, interest_tags: selected })

    setLoading(false)

    if (dbError) {
      if (dbError.code === '23505') {
        setError('That username is already taken. Try another.')
      } else {
        setError(dbError.message)
      }
      return
    }

    setUser(profile)
    // RootNavigator's auth listener re-evaluates and routes to main tabs
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <Text style={styles.step}>Step 1 of 1</Text>
          <Text style={styles.stepDots}>● ●</Text>
        </View>

        <Text style={styles.title}>Set up your profile</Text>
        <Text style={styles.subtitle}>
          Choose a username and tell us what you love to shoot.
        </Text>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="e.g. golden_hour_chaser"
          placeholderTextColor="#A8B2C1"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={30}
        />
        <Text style={styles.hint}>Letters, numbers, and underscores only.</Text>

        <View style={styles.sectionHeader}>
          <Text style={styles.label}>
            Interests{' '}
            <Text style={styles.countBadge}>{selected.length}/3</Text>
          </Text>
          <Text style={styles.hint}>Pick exactly 3</Text>
        </View>

        <View style={styles.tagsGrid}>
          {ALL_TAGS.map(({ tag, label, emoji }) => {
            const active = selected.includes(tag)
            const maxed = selected.length >= 3 && !active
            return (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagPill,
                  active && styles.tagPillActive,
                  maxed && styles.tagPillDisabled,
                ]}
                onPress={() => toggleTag(tag)}
                activeOpacity={0.75}
                disabled={maxed}
              >
                <Text style={styles.tagEmoji}>{emoji}</Text>
                <Text style={[styles.tagLabel, active && styles.tagLabelActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            (loading || selected.length < 3) && styles.buttonDisabled,
          ]}
          onPress={handleFinish}
          disabled={loading || selected.length < 3}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Let&apos;s Go →</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#1A1A2E' },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 48,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  step: { color: '#A8B2C1', fontSize: 12 },
  stepDots: { color: '#FF6B35', fontSize: 10, letterSpacing: 4 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: '#A8B2C1', fontSize: 14, marginBottom: 32, lineHeight: 20 },
  errorBanner: {
    backgroundColor: 'rgba(231,76,60,0.15)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(231,76,60,0.3)',
  },
  errorText: { color: '#E74C3C', fontSize: 14 },
  label: {
    color: '#A8B2C1',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  countBadge: { color: '#FF6B35', fontWeight: '700' },
  input: {
    backgroundColor: '#0F3460',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 6,
  },
  hint: { color: '#A8B2C1', fontSize: 11, marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 36,
    marginTop: 4,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F3460',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 6,
  },
  tagPillActive: {
    backgroundColor: 'rgba(255,107,53,0.15)',
    borderColor: '#FF6B35',
  },
  tagPillDisabled: { opacity: 0.4 },
  tagEmoji: { fontSize: 16 },
  tagLabel: { color: '#A8B2C1', fontSize: 13 },
  tagLabelActive: { color: '#FF6B35', fontWeight: '600' },
  button: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
})
