import { View, Text, StyleSheet } from 'react-native'
import SpotCard from '../../components/SpotCard'
import Button from '../../components/ui/Button'
import { Spot } from '../../types/spot'
import { UploadDraft, COLORS } from './types'
import { colors, fonts } from '../../theme'

export type PublishState =
  | { status: 'idle' }
  | { status: 'publishing'; message: string }
  | { status: 'error'; message: string }
  | { status: 'done'; spotId: string; xp: number }

interface Props {
  draft: UploadDraft
  state: PublishState
  xpReward: number
  onPublish: () => void
}

// The card exactly as it will appear when the pin is tapped on the map
function previewSpot(draft: UploadDraft): Spot {
  if (draft.existingSpot) return draft.existingSpot
  return {
    id: 'preview',
    name: draft.name.trim() || 'Untitled spot',
    description: draft.description.trim(),
    latitude: draft.coords?.latitude ?? 0,
    longitude: draft.coords?.longitude ?? 0,
    founder_id: '',
    rank: 'undiscovered',
    difficulty: draft.difficulty,
    tags: draft.tags,
    cover_photo_url: draft.photo?.uri ?? '',
    photo_count: 1,
    navigation_count: 0,
    best_time_start: '',
    best_time_end: '',
    gear_recommendation: draft.lens.trim(),
    created_at: new Date().toISOString(),
  }
}

export default function ConfirmStep({ draft, state, xpReward, onPublish }: Props) {
  const busy = state.status === 'publishing'
  return (
    <View style={styles.gap}>
      <Text style={styles.heading}>Preview</Text>
      <Text style={styles.hint}>This is how your pin will look on the map.</Text>
      <View style={styles.previewWrap} pointerEvents="none">
        <SpotCard spot={previewSpot(draft)} />
      </View>

      <View style={styles.reward}>
        <Text style={styles.rewardText}>
          {draft.existingSpot ? 'Adding to an existing spot' : 'Founding a new spot'} earns{' '}
          <Text style={styles.rewardXp}>+{xpReward} XP</Text>
        </Text>
      </View>

      {state.status === 'error' && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{state.message}</Text>
        </View>
      )}

      {busy && <Text style={styles.busyText}>{state.message}</Text>}
      <Button label={state.status === 'error' ? 'Try again' : 'Publish'} onPress={onPublish} loading={busy} />
    </View>
  )
}

const styles = StyleSheet.create({
  busyText: { color: COLORS.textSecondary, fontFamily: fonts.medium, fontSize: 14, textAlign: 'center' },
  gap: { gap: 12 },
  heading: { color: COLORS.text, fontSize: 18, fontFamily: fonts.semibold },
  hint: { color: COLORS.textSecondary, fontFamily: fonts.regular, fontSize: 12, marginTop: -6 },
  // SpotCard is a bottom sheet with only top corners rounded — round all corners for the preview
  previewWrap: { borderRadius: 24, overflow: 'hidden' },
  reward: {
    backgroundColor: colors.accentTint,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
  },
  rewardText: { color: COLORS.text, fontFamily: fonts.regular, fontSize: 14, textAlign: 'center' },
  rewardXp: { color: COLORS.primary, fontFamily: fonts.bold },
  errorBox: { backgroundColor: colors.errorTint, borderRadius: 12, padding: 12 },
  errorText: { color: colors.error, fontFamily: fonts.regular, fontSize: 14, textAlign: 'center' },
})
