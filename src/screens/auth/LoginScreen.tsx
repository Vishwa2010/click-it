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
import BrandMark from '../../components/ui/BrandMark'

type Props = StackScreenProps<AuthStackParamList, 'Login'>

export default function LoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    setError(null)
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (authError) {
      const msg = authError.message.toLowerCase()
      if (msg.includes('email not confirmed')) {
        setError('Please confirm your email first — check your inbox for the link from ClickIt.')
      } else if (msg.includes('invalid login credentials')) {
        // Supabase gives the same error for both cases — ask the database which one it is
        const { data: registered, error: lookupError } = await supabase.rpc('email_registered', {
          p_email: email.trim(),
        })
        if (lookupError) {
          setError('Email or password is incorrect.')
        } else if (registered) {
          setError('Incorrect password. Please try again.')
        } else {
          setError('No account found with this email. Tap Create an account below.')
        }
      } else {
        setError(authError.message)
      }
    }
    setLoading(false)
    // On success, RootNavigator's onAuthStateChange listener will switch the tree
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <BrandMark />

        <View style={styles.hero}>
          <Text style={type.display}>Welcome{'\n'}back.</Text>
          <Text style={[type.body, styles.sub]}>Find the shot. Own the spot.</Text>
        </View>

        <View style={styles.form}>
          {error && <Banner tone="error" message={error} />}

          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={handleLogin}
          />

          <Button label="Log in" onPress={handleLogin} loading={loading} style={styles.submit} />
        </View>

        <Pressable
          onPress={() => navigation.navigate('SignUp')}
          style={({ pressed }) => [styles.switchRow, pressed && styles.pressed]}
          hitSlop={hitSlop}
          accessibilityRole="link"
        >
          <Text style={type.small}>
            New to ClickIt? <Text style={styles.switchLink}>Create an account</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.paper },
  container: { flexGrow: 1, paddingHorizontal: 24 },
  hero: { marginTop: 56, marginBottom: 36 },
  sub: { marginTop: 12 },
  form: { gap: 18 },
  submit: { marginTop: 6 },
  switchRow: { alignItems: 'center', marginTop: 28, paddingVertical: 8 },
  switchLink: { color: colors.ink, fontFamily: fonts.bold, textDecorationLine: 'underline' },
  pressed: { opacity: 0.6 },
})
