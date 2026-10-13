import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { Camera, Navigation, Flag } from 'lucide-react-native'
import Button from '../../components/ui/Button'
import { Spot, SpotTag } from '../../types/spot'
import { RANK_COLORS } from '../../components/SpotPin'
import { RANK_LABELS } from '../../components/SpotCard'
import { UploadDraft, TAG_OPTIONS, DIFFICULTY_OPTIONS, COLORS } from './types'
import { colors, fonts } from '../../theme'

interface Props {
  draft: UploadDraft
  nearbySpot: Spot | null
  onChange: (patch: Partial<UploadDraft>) => void
  // user dismissed the "Add to [spot]?" suggestion
  declinedNearby: boolean
  onDeclineNearby: () => void
}

function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.pill, active && styles.pillActive, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: active }}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  )
}

function Field(props: {
  label: string
  value: string
  onChangeText: (v: string) => void
  placeholder: string
  multiline?: boolean
  maxLength: number
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        style={[styles.input, props.multiline && styles.inputMultiline]}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor="rgba(168,178,193,0.6)"
        multiline={props.multiline}
        maxLength={props.maxLength}
      />
    </View>
  )
}

export default function DetailsStep({ draft, nearbySpot, onChange, declinedNearby, onDeclineNearby }: Props) {
  const toggleTag = (tag: SpotTag) =>
    onChange({ tags: draft.tags.includes(tag) ? draft.tags.filter((t) => t !== tag) : [...draft.tags, tag] })

  const askAboutNearby = nearbySpot && !draft.existingSpot && !declinedNearby

  return (
    <View style={styles.gap}>
      {askAboutNearby && nearbySpot && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Add to {nearbySpot.name}?</Text>
          <Text style={styles.cardHint}>This spot is already pinned within 50 m of your photo.</Text>
          <View style={styles.spotRow}>
            <Text style={styles.spotName} numberOfLines={1}>{nearbySpot.name}</Text>
            <Text style={[styles.rank, { color: RANK_COLORS[nearbySpot.rank], borderColor: RANK_COLORS[nearbySpot.rank] }]}>
              {RANK_LABELS[nearbySpot.rank]}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Camera size={14} color={COLORS.textSecondary} />
            <Text style={styles.cardHint}>{nearbySpot.photo_count} photos</Text>
            <Navigation size={14} color={COLORS.textSecondary} />
            <Text style={styles.cardHint}>{nearbySpot.navigation_count} visits</Text>
          </View>
          <View style={styles.row}>
            <Button label="New spot" variant="secondary" onPress={onDeclineNearby} style={styles.flex1} />
            <Button label="Add to it" onPress={() => onChange({ existingSpot: nearbySpot })} style={styles.flex1} />
          </View>
        </View>
      )}

      {draft.existingSpot ? (
        <View style={[styles.card, styles.cardAccent]}>
          <Text style={styles.cardTitle}>Adding to {draft.existingSpot.name}</Text>
          <Text style={styles.cardHint}>Your photo joins this spot’s gallery.</Text>
          <Pressable onPress={() => { onChange({ existingSpot: null }); onDeclineNearby() }}>
            <Text style={styles.link}>Create a new spot instead</Text>
          </Pressable>
        </View>
      ) : !askAboutNearby ? (
        <>
          <View style={[styles.card, styles.cardAccent]}>
            <View style={styles.statRow}>
              <Flag size={18} color={COLORS.text} />
              <Text style={styles.cardTitle}>New spot — you’ll be the Founder</Text>
            </View>
          </View>
          <Field
            label="SPOT NAME"
            value={draft.name}
            onChangeText={(name) => onChange({ name })}
            placeholder="e.g. Hidden Pier at Sunset"
            maxLength={80}
          />
          <Field
            label="DESCRIPTION"
            value={draft.description}
            onChangeText={(description) => onChange({ description })}
            placeholder="What makes this shot special? Any access tips?"
            multiline
            maxLength={1000}
          />
          <View style={styles.field}>
            <Text style={styles.label}>TAGS</Text>
            <View style={styles.pills}>
              {TAG_OPTIONS.map((t) => (
                <Pill key={t.value} label={t.label} active={draft.tags.includes(t.value)} onPress={() => toggleTag(t.value)} />
              ))}
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>DIFFICULTY</Text>
            <View style={styles.pills}>
              {DIFFICULTY_OPTIONS.map((d) => (
                <Pill key={d.value} label={d.label} active={draft.difficulty === d.value} onPress={() => onChange({ difficulty: d.value })} />
              ))}
            </View>
          </View>
        </>
      ) : null}

      {!askAboutNearby && (
        <>
          <Field
            label="CAMERA BODY"
            value={draft.camera}
            onChangeText={(camera) => onChange({ camera })}
            placeholder="e.g. Sony A7 IV"
            maxLength={60}
          />
          <Field
            label="LENS"
            value={draft.lens}
            onChangeText={(lens) => onChange({ lens })}
            placeholder="e.g. 24-70mm f/2.8"
            maxLength={60}
          />
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  gap: { gap: 16 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    gap: 8,
  },
  cardAccent: { borderColor: COLORS.primary, borderWidth: 1.5 },
  cardTitle: { color: COLORS.text, fontSize: 18, fontFamily: fonts.semibold },
  cardHint: { color: COLORS.textSecondary, fontFamily: fonts.regular, fontSize: 12 },
  spotRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  spotName: { color: COLORS.text, fontSize: 14, fontFamily: fonts.semibold, flexShrink: 1 },
  rank: { fontSize: 11, fontFamily: fonts.semibold, borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  row: { flexDirection: 'row', gap: 10, marginTop: 4 },
  link: { color: COLORS.primary, fontSize: 14, fontFamily: fonts.semibold },
  field: { gap: 8 },
  label: { color: COLORS.textSecondary, fontFamily: fonts.regular, fontSize: 12, letterSpacing: 0.5 },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    fontFamily: fonts.regular, fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputMultiline: { minHeight: 88, textAlignVertical: 'top' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  pillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pillText: { color: COLORS.textSecondary, fontFamily: fonts.regular, fontSize: 14 },
  pillTextActive: { color: COLORS.onPrimary, fontFamily: fonts.semibold },
  pressed: { opacity: 0.75 },
  flex1: { flex: 1 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
})
