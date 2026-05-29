import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { Spot } from '../types/spot'
import { RANK_COLORS } from './SpotPin'

const RANK_LABELS: Record<string, string> = {
  undiscovered: 'Undiscovered',
  hidden_gem: 'Hidden Gem',
  popular: 'Popular',
  iconic: 'Iconic',
  legendary: 'Legendary',
}

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: '🟢 Easy',
  moderate: '🟡 Moderate',
  hard: '🔴 Hard',
  permit_required: '📋 Permit',
}

interface Props {
  spot: Spot
  onClose?: () => void
  onNavigate?: () => void
  onViewSpot?: () => void
}

export default function SpotCard({ spot, onClose, onNavigate, onViewSpot }: Props) {
  const rankColor = RANK_COLORS[spot.rank]

  return (
    <View style={styles.card}>
      <View style={styles.handle} />

      {spot.cover_photo_url ? (
        <Image source={{ uri: spot.cover_photo_url }} style={styles.photo} resizeMode="cover" />
      ) : (
        <View style={styles.photoPlaceholder}>
          <Text style={styles.photoPlaceholderIcon}>📸</Text>
          <Text style={styles.photoPlaceholderText}>No photo yet</Text>
        </View>
      )}

      {onClose && (
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      )}

      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{spot.name}</Text>
          <View style={[styles.rankBadge, { borderColor: rankColor }]}>
            <Text style={[styles.rankLabel, { color: rankColor }]}>
              {RANK_LABELS[spot.rank]}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.meta}>{DIFFICULTY_LABELS[spot.difficulty]}</Text>
          <Text style={styles.separator}>·</Text>
          <Text style={styles.meta}>🕐 {spot.best_time_start}–{spot.best_time_end}</Text>
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.stat}>📷 {spot.photo_count}</Text>
          <Text style={styles.stat}>🧭 {spot.navigation_count}</Text>
          {spot.gear_recommendation ? (
            <Text style={styles.stat} numberOfLines={1}>🔭 {spot.gear_recommendation}</Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.btnOutline} onPress={onNavigate} activeOpacity={0.8}>
            <Text style={styles.btnOutlineText}>Navigate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnPrimary} onPress={onViewSpot} activeOpacity={0.8}>
            <Text style={styles.btnPrimaryText}>View Spot →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#16213E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  photo: { width: '100%', height: 160 },
  photoPlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: '#0F3460',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  photoPlaceholderIcon: { fontSize: 40 },
  photoPlaceholderText: { color: '#A8B2C1', fontSize: 13 },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  body: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  name: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', flex: 1 },
  rankBadge: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  rankLabel: { fontSize: 11, fontWeight: '600' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  meta: { color: '#A8B2C1', fontSize: 13 },
  separator: { color: '#A8B2C1', fontSize: 13 },
  statsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
  },
  stat: { color: '#A8B2C1', fontSize: 12 },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  btnOutline: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  btnPrimary: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#FF6B35',
  },
  btnOutlineText: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
})
