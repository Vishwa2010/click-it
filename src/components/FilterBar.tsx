import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export const FILTERS = [
  'All',
  'Nature',
  'Urban',
  'Architecture',
  'Golden Hour',
  'Hidden Gems',
  'Rooftop',
]

interface Props {
  activeFilter: string
  onFilterChange: (filter: string) => void
}

export default function FilterBar({ activeFilter, onFilterChange }: Props) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {FILTERS.map((filter) => {
          const active = activeFilter === filter
          return (
            <TouchableOpacity
              key={filter}
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => onFilterChange(filter)}
              activeOpacity={0.75}
            >
              <Text style={[styles.label, active && styles.labelActive]}>
                {filter}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  pill: {
    backgroundColor: 'rgba(15,52,96,0.92)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  pillActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  label: { color: '#A8B2C1', fontSize: 13, fontWeight: '500' },
  labelActive: { color: '#FFFFFF', fontWeight: '700' },
})
