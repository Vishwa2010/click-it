import { View, Text, Pressable, StyleSheet, Image } from 'react-native'
import { Camera, Clock, Navigation, Footprints, Aperture, X, ImageOff } from 'lucide-react-native'
import { Spot } from '../types/spot'
import { colors, fonts, radius, type, spotRankColors, hitSlop } from '../theme'
import Button from './ui/Button'
import { formatHHMM } from '../lib/goldenHour'

export const RANK_LABELS: Record<string, string> = {
  undiscovered: 'Undiscovered',
  hidden_gem: 'Hidden Gem',
  popular: 'Popular',
  iconic: 'Iconic',
  legendary: 'Legendary',
}

export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Easy',
  moderate: 'Moderate',
  hard: 'Hard',
  permit_required: 'Permit required',
}

interface Props {
  spot: Spot
  onClose?: () => void
  onNavigate?: () => void
  onViewSpot?: () => void
}

function Meta({ Icon, label }: { Icon: typeof Clock; label: string }) {
  return (
    <View style={styles.meta}>
      <Icon size={14} color={colors.ink2} />
      <Text style={styles.metaText} numberOfLines={1}>{label}</Text>
    </View>
  )
}

export default function SpotCard({ spot, onClose, onNavigate, onViewSpot }: Props) {
  const rankColor = spotRankColors[spot.rank]

  return (
    <View style={styles.card}>
      <View style={styles.handle} />

      <View style={styles.photoWrap}>
        {spot.cover_photo_url ? (
          <Image source={{ uri: spot.cover_photo_url }} style={styles.photo} resizeMode="cover" accessibilityLabel={`Photo of ${spot.name}`} />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <ImageOff size={28} color={colors.muted} />
            <Text style={type.caption}>No photo yet</Text>
          </View>
        )}
        {onClose && (
          <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={hitSlop} accessibilityRole="button" accessibilityLabel="Close">
            <X size={18} color={colors.ink} strokeWidth={2.4} />
          </Pressable>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={[type.headline, styles.name]} numberOfLines={1}>{spot.name}</Text>
          <View style={[styles.rankBadge, { borderColor: rankColor }]}>
            <Text style={[styles.rankLabel, { color: rankColor }]}>{RANK_LABELS[spot.rank]}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Meta Icon={Footprints} label={DIFFICULTY_LABELS[spot.difficulty]} />
          {spot.best_time_start && spot.best_time_end ? (
            <Meta Icon={Clock} label={`${formatHHMM(spot.best_time_start)}–${formatHHMM(spot.best_time_end)}`} />
          ) : null}
        </View>

        <View style={styles.metaRow}>
          <Meta Icon={Camera} label={`${spot.photo_count}`} />
          <Meta Icon={Navigation} label={`${spot.navigation_count}`} />
          {spot.gear_recommendation ? <Meta Icon={Aperture} label={spot.gear_recommendation} /> : null}
        </View>

        <View style={styles.actions}>
          <Button label="Navigate" variant="secondary" onPress={() => onNavigate?.()} style={styles.action} />
          <Button label="View spot" onPress={() => onViewSpot?.()} style={styles.action} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.line,
    paddingTop: 10,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.line,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  photoWrap: { paddingHorizontal: 16 },
  photo: { width: '100%', height: 168, borderRadius: radius.md },
  photoPlaceholder: { backgroundColor: colors.sunk, justifyContent: 'center', alignItems: 'center', gap: 6 },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 26,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, gap: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { flex: 1 },
  rankBadge: { borderRadius: radius.pill, borderWidth: 1.5, paddingHorizontal: 10, paddingVertical: 3 },
  rankLabel: { fontSize: 12, fontFamily: fonts.bold },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  metaText: { color: colors.ink2, fontSize: 14, fontFamily: fonts.medium },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  action: { flex: 1 },
})
