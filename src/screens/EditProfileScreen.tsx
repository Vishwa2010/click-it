import { useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Image,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native'
import { StackScreenProps } from '@react-navigation/stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { ChevronLeft, Camera, Check, X, Trash2 } from 'lucide-react-native'
import { RootStackParamList } from '../navigation/types'
import { useUserStore } from '../store/useUserStore'
import { supabase } from '../lib/supabase'
import { uploadPhoto } from '../lib/cloudinary'
import { preparePhotoForUpload } from '../lib/photo'
import { useUsernameAvailability, usernameRules } from '../hooks/useUsernameAvailability'
import { INTERESTS, MAX_INTERESTS } from './auth/onboarding/shared'
import { SpotTag } from '../types/spot'
import { User } from '../types/user'
import { colors, fonts, radius, type, hitSlop, TOUCH } from '../theme'
import Button from '../components/ui/Button'
import Banner from '../components/ui/Banner'
import TextField from '../components/ui/TextField'
import { haptics } from '../lib/haptics'

type Props = StackScreenProps<RootStackParamList, 'EditProfile'>

const BIO_MAX = 300 // matches the users.bio check constraint
const AVATAR_EDGE = 512 // avatars are shown small — no need to upload more

interface Form {
  username: string
  bio: string
  avatarUri: string // remote URL, a local picked file, or '' for none
  interests: SpotTag[]
}

export default function EditProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets()
  const user = useUserStore((s) => s.user)
  const setUser = useUserStore((s) => s.setUser)

  const [initial, setInitial] = useState<Form | null>(null)
  const [form, setForm] = useState<Form | null>(null)
  const [picked, setPicked] = useState<{ width: number; height: number } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const saved = useRef(false)

  const { status: nameStatus, markTaken } = useUsernameAvailability(form?.username ?? '')

  // interest_tags isn't on the User type, so load the editable fields fresh
  useEffect(() => {
    if (!user) return
    let cancelled = false
    supabase
      .from('users')
      .select('username, bio, avatar_url, interest_tags')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data, error: loadError }) => {
        if (cancelled) return
        if (loadError || !data) {
          setError('Couldn’t load your profile. Go back and try again.')
          return
        }
        const f: Form = {
          username: data.username ?? '',
          bio: data.bio ?? '',
          avatarUri: data.avatar_url ?? '',
          interests: (data.interest_tags ?? []) as SpotTag[],
        }
        setInitial(f)
        setForm(f)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  const dirty = useMemo(
    () => !!form && !!initial && JSON.stringify(form) !== JSON.stringify(initial),
    [form, initial]
  )

  // Never lose edits silently: confirm before leaving with unsaved changes
  useEffect(
    () =>
      navigation.addListener('beforeRemove', (e) => {
        if (!dirty || saved.current) return
        e.preventDefault()
        Alert.alert('Discard changes?', 'Your edits to your profile haven’t been saved.', [
          { text: 'Keep editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
        ])
      }),
    [navigation, dirty]
  )

  if (!form || !user) {
    return (
      <View style={[styles.container, styles.center]}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={hitSlop}
          style={[styles.headerBtn, styles.floatingBack, { top: insets.top + 4 }]}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ChevronLeft size={28} color={colors.ink} />
        </Pressable>
        {error ? <Banner tone="error" message={error} /> : <ActivityIndicator color={colors.ink} />}
      </View>
    )
  }

  const update = (patch: Partial<Form>) => setForm((f) => (f ? { ...f, ...patch } : f))
  const rules = usernameRules(form.username)
  const nameChanged = form.username !== initial?.username
  const nameOk = rules.length && rules.chars && (!nameChanged || nameStatus === 'available')
  const interestsOk = form.interests.length === MAX_INTERESTS
  const canSave = dirty && nameOk && interestsOk && !saving

  const nameHint = !rules.chars && form.username.length > 0
    ? 'Letters, numbers and underscores only'
    : !rules.length
      ? '3–30 characters'
      : nameChanged && nameStatus === 'taken'
        ? 'That handle is taken — try another'
        : nameChanged && nameStatus === 'error'
          ? 'Couldn’t check availability right now'
          : null

  async function pickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Photo access is off', 'Allow photo access in Settings to choose a profile photo.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', allowsEditing: true, aspect: [1, 1], quality: 1 })
    if (result.canceled || !result.assets.length) return
    const a = result.assets[0]
    setPicked({ width: a.width, height: a.height })
    update({ avatarUri: a.uri })
  }

  function toggleInterest(tag: SpotTag) {
    if (!form) return
    haptics.select()
    const has = form.interests.includes(tag)
    if (!has && form.interests.length >= MAX_INTERESTS) return
    update({ interests: has ? form.interests.filter((t) => t !== tag) : [...form.interests, tag] })
  }

  async function save() {
    if (!form || !user || !canSave) return
    setSaving(true)
    setError(null)
    try {
      let avatarUrl = form.avatarUri
      // A newly picked photo is a local file: shrink it, strip metadata, upload
      if (picked && form.avatarUri && !form.avatarUri.startsWith('http')) {
        const prepared = await preparePhotoForUpload(form.avatarUri, picked.width, picked.height, AVATAR_EDGE)
        avatarUrl = await uploadPhoto(prepared.uri)
      }
      const { data, error: saveError } = await supabase
        .from('users')
        .update({ username: form.username, bio: form.bio.trim(), avatar_url: avatarUrl, interest_tags: form.interests })
        .eq('id', user.id)
        .select('*')
        .single()
      if (saveError) {
        haptics.warning()
        if (saveError.code === '23505') {
          markTaken()
          setError('Someone just took that username. Pick another.')
        } else {
          setError(saveError.message)
        }
        return
      }
      setUser(data as User)
      haptics.success()
      saved.current = true
      navigation.goBack()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t save your profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={hitSlop}
          style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ChevronLeft size={28} color={colors.ink} />
        </Pressable>
        <Text style={type.headline}>Edit profile</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive">
        {/* Photo */}
        <View style={styles.avatarBlock}>
          <Pressable onPress={pickAvatar} accessibilityRole="button" accessibilityLabel="Change profile photo">
            <View style={styles.avatar}>
              {form.avatarUri ? (
                <Image source={{ uri: form.avatarUri }} style={styles.avatarImg} accessibilityLabel="Your profile photo" />
              ) : (
                <Text style={styles.avatarText}>{(form.username || '?').charAt(0).toUpperCase()}</Text>
              )}
            </View>
            <View style={styles.avatarBadge}>
              <Camera size={16} color={colors.onInk} />
            </View>
          </Pressable>
          <View style={styles.avatarActions}>
            <Pressable onPress={pickAvatar} hitSlop={hitSlop} style={({ pressed }) => pressed && styles.pressed}>
              <Text style={styles.link}>Change photo</Text>
            </Pressable>
            {form.avatarUri ? (
              <Pressable
                onPress={() => update({ avatarUri: '' })}
                hitSlop={hitSlop}
                style={({ pressed }) => [styles.removeRow, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <Trash2 size={14} color={colors.error} />
                <Text style={[styles.link, styles.remove]}>Remove</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {error && <Banner tone="error" message={error} />}

        {/* Username with live availability */}
        <View style={styles.field}>
          <Text style={type.eyebrow}>Username</Text>
          <View style={[styles.inputRow, nameHint && nameChanged ? styles.inputInvalid : null]}>
            <Text style={styles.at}>@</Text>
            <TextInput
              value={form.username}
              onChangeText={(v) => update({ username: v.replace(/\s/g, '') })}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
              style={styles.input}
              accessibilityLabel="Username"
            />
            <View style={styles.status}>
              {nameChanged && nameStatus === 'checking' && <ActivityIndicator size="small" color={colors.muted} />}
              {nameChanged && nameStatus === 'available' && <Check size={20} color={colors.success} strokeWidth={3} />}
              {nameChanged && nameStatus === 'taken' && <X size={20} color={colors.error} strokeWidth={3} />}
            </View>
          </View>
          {nameHint ? <Text style={[type.caption, styles.errorText]}>{nameHint}</Text> : null}
        </View>

        {/* Bio */}
        <View>
          <TextField
            label="Bio"
            value={form.bio}
            onChangeText={(v) => update({ bio: v })}
            placeholder="What do you love to shoot? Where?"
            multiline
            maxLength={BIO_MAX}
            hint={`${form.bio.length}/${BIO_MAX}`}
          />
        </View>

        {/* Interests */}
        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={type.eyebrow}>Interests</Text>
            <Text style={[type.caption, !interestsOk && styles.errorText]}>
              {form.interests.length}/{MAX_INTERESTS}
            </Text>
          </View>
          <View style={styles.pills}>
            {INTERESTS.map(({ tag, label, Icon }) => {
              const active = form.interests.includes(tag)
              const disabled = !active && form.interests.length >= MAX_INTERESTS
              return (
                <Pressable
                  key={tag}
                  onPress={() => toggleInterest(tag)}
                  disabled={disabled}
                  style={({ pressed }) => [styles.pill, active && styles.pillActive, disabled && styles.pillDisabled, pressed && styles.pressed]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active, disabled }}
                >
                  <Icon size={16} color={active ? colors.onInk : colors.ink2} />
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
                </Pressable>
              )
            })}
          </View>
          {!interestsOk && <Text style={type.caption}>Pick exactly {MAX_INTERESTS} to tune your map.</Text>}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button label={dirty ? 'Save changes' : 'No changes'} onPress={save} disabled={!canSave} loading={saving} />
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  pressed: { opacity: 0.6 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerBtn: { width: TOUCH, height: TOUCH, justifyContent: 'center' },
  floatingBack: { position: 'absolute', left: 12 },
  body: { padding: 20, gap: 22, paddingBottom: 40 },
  avatarBlock: { alignItems: 'center', gap: 12 },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { color: colors.onInk, fontSize: 40, fontFamily: fonts.extrabold },
  avatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.ink,
    borderWidth: 3,
    borderColor: colors.paper,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarActions: { flexDirection: 'row', gap: 20, alignItems: 'center' },
  link: { color: colors.ink, fontSize: 15, fontFamily: fonts.bold, textDecorationLine: 'underline' },
  removeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  remove: { color: colors.error },
  field: { gap: 8 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TOUCH + 8,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: 16,
  },
  inputInvalid: { borderColor: colors.error },
  at: { color: colors.muted, fontSize: 16, fontFamily: fonts.medium, marginRight: 2 },
  input: { flex: 1, color: colors.ink, fontSize: 16, fontFamily: fonts.medium, paddingVertical: 12 },
  status: { width: 24, alignItems: 'center' },
  errorText: { color: colors.error },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  pillActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  pillDisabled: { opacity: 0.4 },
  pillText: { color: colors.ink, fontSize: 14, fontFamily: fonts.semibold },
  pillTextActive: { color: colors.onInk },
  footer: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: colors.paper, borderTopWidth: 1, borderTopColor: colors.line },
})
