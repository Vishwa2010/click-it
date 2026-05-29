import { View, Text, StyleSheet } from 'react-native'
import { SpotRank } from '../types/spot'

export const RANK_COLORS: Record<SpotRank, string> = {
  undiscovered: '#A8B2C1',
  hidden_gem: '#2ECC71',
  popular: '#3498DB',
  iconic: '#F39C12',
  legendary: '#E74C3C',
}

interface Props {
  rank: SpotRank
  selected?: boolean
}

export default function SpotPin({ rank, selected = false }: Props) {
  const color = RANK_COLORS[rank]
  return (
    <View style={[styles.pin, { backgroundColor: color + 'CC' }, selected && styles.selected]}>
      <Text style={styles.icon}>📷</Text>
      <View style={[styles.dot, { backgroundColor: color }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  pin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 6,
  },
  selected: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
    transform: [{ scale: 1.18 }],
  },
  icon: { fontSize: 20, lineHeight: 24 },
  dot: {
    position: 'absolute',
    bottom: -6,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#1A1A2E',
  },
})
