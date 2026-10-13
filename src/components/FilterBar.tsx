import { View, ScrollView, Pressable, Text, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Layers, Leaf, Building, Landmark, Sunset, Gem, Antenna, LucideIcon } from 'lucide-react-native'
import { colors, fonts, radius } from '../theme'
import { haptics } from '../lib/haptics'

export const FILTERS = ['All', 'Nature', 'Urban', 'Architecture', 'Golden Hour', 'Hidden Gems', 'Rooftop']

const FILTER_ICONS: Record<string, LucideIcon> = {
  All: Layers,
  Nature: Leaf,
  Urban: Building,
  Architecture: Landmark,
  'Golden Hour': Sunset,
  'Hidden Gems': Gem,
  Rooftop: Antenna,
}

interface Props {
  activeFilter: string
  onFilterChange: (filter: string) => void
}

export default function FilterBar({ activeFilter, onFilterChange }: Props) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + 8 }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {FILTERS.map((filter) => {
          const active = activeFilter === filter
          const Icon = FILTER_ICONS[filter]
          return (
            <Pressable
              key={filter}
              onPress={() => {
                haptics.select()
                onFilterChange(filter)
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [styles.pill, active && styles.pillActive, pressed && styles.pressed]}
            >
              {Icon && <Icon size={15} color={active ? colors.onInk : colors.ink} strokeWidth={2.2} />}
              <Text style={[styles.label, active && styles.labelActive]}>{filter}</Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', top: 0, left: 0, right: 0 },
  row: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  pill: {
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  pillActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  pressed: { opacity: 0.8 },
  label: { color: colors.ink, fontSize: 14, fontFamily: fonts.semibold },
  labelActive: { color: colors.onInk },
})
