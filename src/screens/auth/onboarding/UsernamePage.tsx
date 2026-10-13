import { View, Text, TextInput, ActivityIndicator, StyleSheet } from 'react-native'
import { Check as CheckIcon, Trophy, X } from 'lucide-react-native'
import { C, shared, usernameRules, UsernameStatus } from './shared'
import { colors, fonts } from '../../../theme'

interface Props {
  username: string
  onChange: (value: string) => void
  status: UsernameStatus
  error: string | null
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <View style={styles.check}>
      <View style={[styles.checkDot, ok && styles.checkDotOk]}>
        {ok ? <CheckIcon size={13} color={C.success} strokeWidth={3.5} /> : <View style={styles.checkBullet} />}
      </View>
      <Text style={[styles.checkLabel, ok && styles.checkLabelOk]}>{label}</Text>
    </View>
  )
}

export default function UsernamePage({ username, onChange, status, error }: Props) {
  const rules = usernameRules(username)
  const availabilityLabel =
    status === 'taken'
      ? 'Already taken — try another'
      : status === 'error'
        ? 'Couldn’t check availability'
        : 'Available'

  return (
    <View>
      <Text style={shared.eyebrow}>CLAIM YOUR NAME</Text>
      <Text style={shared.title}>Pick your handle</Text>
      <Text style={shared.subtitle}>This is how other photographers will see you on the map.</Text>

      <Text style={shared.label}>Username</Text>
      <View style={[styles.inputWrap, status === 'taken' && styles.inputTaken, status === 'available' && styles.inputOk]}>
        <Text style={styles.at}>@</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={(v) => onChange(v.replace(/\s/g, ''))}
          placeholder="golden_hour_chaser"
          placeholderTextColor="rgba(168,178,193,0.6)"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          maxLength={30}
          returnKeyType="done"
          accessibilityLabel="Username"
        />
        <View style={styles.inputStatus} accessibilityLiveRegion="polite">
          {status === 'checking' && <ActivityIndicator size="small" color={C.textSecondary} />}
          {status === 'available' && <CheckIcon size={20} color={C.success} strokeWidth={3} accessibilityLabel="Available" />}
          {status === 'taken' && <X size={20} color={C.error} strokeWidth={3} accessibilityLabel="Taken" />}
        </View>
      </View>

      <View style={styles.checks}>
        <Check ok={rules.length} label="3–30 characters" />
        <Check ok={rules.chars} label="Letters, numbers and underscores only" />
      </View>

      {(status === 'taken' || status === 'error') && rules.length && rules.chars && (
        <Text style={styles.error}>{availabilityLabel}</Text>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      {username.length > 0 && (
        <View style={styles.preview}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{username.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.previewName}>@{username}</Text>
            <View style={styles.rankRow}>
              <Trophy size={13} color={C.bronze} />
              <Text style={styles.previewRank}>Bronze Explorer</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 16,
  },
  inputOk: { borderColor: C.success },
  inputTaken: { borderColor: C.error },
  at: { color: C.textSecondary, fontFamily: fonts.regular, fontSize: 16, marginRight: 2 },
  inputStatus: { width: 24, alignItems: 'center' },
  input: { flex: 1, color: C.text, fontFamily: fonts.regular, fontSize: 16, paddingVertical: 14 },
  checks: { gap: 10, marginTop: 16 },
  check: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkDotOk: { backgroundColor: colors.successTint },
  checkBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.textSecondary },
  checkLabel: { color: C.textSecondary, fontFamily: fonts.regular, fontSize: 15 },
  checkLabelOk: { color: C.text },
  error: { color: C.error, fontFamily: fonts.regular, fontSize: 14, marginTop: 14 },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 28,
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: C.onPrimary, fontSize: 18, fontFamily: fonts.extrabold },
  previewName: { color: C.text, fontSize: 16, fontFamily: fonts.bold },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  previewRank: { color: C.bronze, fontSize: 13, fontFamily: fonts.semibold },
})
