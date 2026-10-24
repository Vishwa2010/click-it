import { View, Text, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useState } from 'react'
import { StackScreenProps } from '@react-navigation/stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AuthStackParamList } from '../../navigation/types'
import { supabase } from '../../lib/supabase'
import { colors, fonts, type, hitSlop } from '../../theme'
import Button from '../../components/ui/Button'
import TextField from '../../components/ui/TextField'
import Banner from '../../components/ui/Banner'
import { openLegal, PRIVACY_URL, TERMS_URL } from '../../lib/legal'
import BrandMark from '../../components/ui/BrandMark'

type Props = StackScreenProps<AuthStackParamList, 'SignUp'>

export default function SignUpScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  async function handleSignUp() {
    if (!email.trim() || !password || !confirm) {
      setError('Please fill in all fields.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError(null)
    setPendingEmail(null)
    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      // The confirmation link lands on our hosted "Email confirmed" page
      options: { emailRedirectTo: 'https://vishwa2010.github.io/click-it/email-confirmed.html' },
    })
    setLoading(false)
    if (authError) {
      setError(authError.message)
      return
    }
    // Email confirmation is on: no session until the user taps the link in their inbox
    if (!data.session) {
      setPendingEmail(email.trim())
      return
    }
    // RootNavigator's auth listener will pick up the new session and route
    // to Onboarding because the user row won't have a username yet
  }

  const mismatch = confirm.length > 0 && confirm !== password

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <BrandMark />

        <View style={styles.hero}>
          <Text style={type.display}>Start{'\n'}exploring.</Text>
          <Text style={[type.body, styles.sub]}>Create an account to pin spots and claim them as Founder.</Text>
        </View>

        <View style={styles.form}>
          {error && <Banner tone="error" message={error} />}
          {pendingEmail && (
            <Banner
              tone="success"
              title="Check your email"
              message={`We sent a confirmation link to ${pendingEmail}. Tap it, then come back and log in.`}
            />
          )}

          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            hint={password.length > 0 && password.length < 8 ? `${8 - password.length} more characters` : undefined}
          />
          <TextField
            label="Confirm password"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Repeat your password"
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            invalid={mismatch}
            hint={mismatch ? 'Passwords don’t match yet' : undefined}
            returnKeyType="go"
            onSubmitEditing={handleSignUp}
          />

          <Button label="Create account" onPress={handleSignUp} loading={loading} style={styles.submit} />
          <Text style={[type.caption, styles.legal]}>
            By creating an account you agree to the{' '}
            <Text style={styles.legalLink} onPress={() => openLegal(TERMS_URL)} accessibilityRole="link">
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text style={styles.legalLink} onPress={() => openLegal(PRIVACY_URL)} accessibilityRole="link">
              Privacy Policy
            </Text>
            .
          </Text>
        </View>

        <Pressable
          onPress={() => navigation.navigate('Login')}
          style={({ pressed }) => [styles.switchRow, pressed && styles.pressed]}
          hitSlop={hitSlop}
          accessibilityRole="link"
        >
          <Text style={type.small}>
            Already have an account? <Text style={styles.switchLink}>Log in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.paper },
  container: { flexGrow: 1, paddingHorizontal: 24 },
  hero: { marginTop: 48, marginBottom: 32 },
  sub: { marginTop: 12 },
  form: { gap: 18 },
  submit: { marginTop: 6 },
  legal: { textAlign: 'center', lineHeight: 18 },
  legalLink: { color: colors.ink, fontFamily: fonts.bold, textDecorationLine: 'underline' },
  switchRow: { alignItems: 'center', marginTop: 28, paddingVertical: 8 },
  switchLink: { color: colors.ink, fontFamily: fonts.bold, textDecorationLine: 'underline' },
  pressed: { opacity: 0.6 },
})
