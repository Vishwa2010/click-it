import { View, StyleSheet } from 'react-native'
import { Camera } from 'lucide-react-native'
import { SpotRank } from '../types/spot'
import { colors, spotRankColors } from '../theme'

// Kept as a named export for existing imports
export const RANK_COLORS = spotRankColors

interface Props {
  rank: SpotRank
  selected?: boolean
}

export default function SpotPin({ rank, selected = false }: Props) {
  return (
    <View style={[styles.pin, selected && styles.selected]}>
      <Camera size={18} color={selected ? colors.onInk : colors.ink} strokeWidth={2.2} />
      <View style={[styles.dot, { backgroundColor: spotRankColors[rank] }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  pin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.ink,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  selected: {
    backgroundColor: colors.ink,
    transform: [{ scale: 1.15 }],
  },
  dot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.card,
  },
})
