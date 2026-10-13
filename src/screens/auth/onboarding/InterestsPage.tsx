import { useRef } from 'react'
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native'
import { Check, LucideIcon } from 'lucide-react-native'
import { SpotTag } from '../../../types/spot'
import { C, shared, INTERESTS, MAX_INTERESTS } from './shared'
import { colors, fonts } from '../../../theme'
import { haptics } from '../../../lib/haptics'

interface Props {
  selected: SpotTag[]
  onToggle: (tag: SpotTag) => void
}

function vibe(selected: SpotTag[]): string {
  if (selected.length === 0) return 'Tap what you love to shoot.'
  const has = (t: SpotTag) => selected.includes(t)
  if ((has('sunset') || has('sunrise')) && has('cityscape')) return 'Skyline at golden hour — classic.'
  if (has('night') && (has('cityscape') || has('rooftop'))) return 'City lights after dark. Nice.'
  if (has('nature') || has('waterfall')) return 'Chasing light in the wild.'
  if (has('street_art') || has('architecture')) return 'Finding art in the streets.'
  if (has('hidden_gem')) return 'Off the beaten path — our favourite kind.'
  return 'Good taste. We’ll tune your map to it.'
}

function Pill({ label, Icon, active, disabled, onPress }: {
  label: string
  Icon: LucideIcon
  active: boolean
  disabled: boolean
  onPress: () => void
}) {
  const scale = useRef(new Animated.Value(1)).current
  const bounce = () => {
    scale.setValue(0.88)
    Animated.spring(scale, { toValue: 1, friction: 4, tension: 220, useNativeDriver: true }).start()
  }
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={() => {
          haptics.select()
          bounce()
          onPress()
        }}
        disabled={disabled}
        style={[styles.pill, active && styles.pillActive, disabled && styles.pillDisabled]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: active, disabled }}
      >
        <Icon size={18} color={active ? C.onPrimary : C.textSecondary} />
        <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
        {active && <Check size={15} color={C.onPrimary} strokeWidth={3.5} />}
      </Pressable>
    </Animated.View>
  )
}

export default function InterestsPage({ selected, onToggle }: Props) {
  return (
    <View>
      <Text style={shared.eyebrow}>YOUR STYLE</Text>
      <Text style={shared.title}>What do you love to shoot?</Text>
      <Text style={shared.subtitle}>Pick {MAX_INTERESTS}. We’ll put spots you’ll love first on your map.</Text>

      <View style={styles.counterRow}>
        {Array.from({ length: MAX_INTERESTS }, (_, i) => (
          <View key={i} style={[styles.slot, i < selected.length && styles.slotFilled]} />
        ))}
        <Text style={styles.counter}>
          {selected.length}/{MAX_INTERESTS}
        </Text>
      </View>
      <Text style={styles.vibe}>{vibe(selected)}</Text>

      <View style={styles.grid}>
        {INTERESTS.map(({ tag, label, Icon }) => {
          const active = selected.includes(tag)
          return (
            <Pill
              key={tag}
              label={label}
              Icon={Icon}
              active={active}
              disabled={!active && selected.length >= MAX_INTERESTS}
              onPress={() => onToggle(tag)}
            />
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  slot: { width: 36, height: 6, borderRadius: 3, backgroundColor: C.border },
  slotFilled: { backgroundColor: C.primary },
  counter: { color: C.primary, fontSize: 14, fontFamily: fonts.bold, marginLeft: 6 },
  vibe: { color: C.text, fontFamily: fonts.regular, fontSize: 16, fontStyle: 'italic', marginBottom: 20, minHeight: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.card,
    borderRadius: 24,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.line,
    minHeight: 44,
  },
  pillActive: { backgroundColor: C.primary, borderColor: C.primary },
  pillDisabled: { opacity: 0.4 },
  pillText: { color: C.textSecondary, fontFamily: fonts.regular, fontSize: 15 },
  pillTextActive: { color: C.onPrimary, fontFamily: fonts.semibold },
})
