import { ReactNode } from 'react'
import { Pressable, Text, ActivityIndicator, StyleSheet, View, StyleProp, ViewStyle } from 'react-native'
import { colors, radius, type, TOUCH } from '../../theme'
import { haptics } from '../../lib/haptics'

type Variant = 'primary' | 'secondary' | 'ghost'

interface Props {
  label: string
  onPress: () => void
  variant?: Variant
  disabled?: boolean
  loading?: boolean
  icon?: ReactNode
  style?: StyleProp<ViewStyle>
  accessibilityHint?: string
}

// Ink-filled primary, outlined secondary, text-only ghost. Pressable with visible press feedback.
export default function Button({ label, onPress, variant = 'primary', disabled, loading, icon, style, accessibilityHint }: Props) {
  const inactive = disabled || loading
  const fg = variant === 'primary' ? colors.onInk : colors.ink
  return (
    <Pressable
      onPress={() => {
        if (variant === 'primary') haptics.tap()
        onPress()
      }}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !inactive && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text style={[type.button, { color: fg }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    minHeight: TOUCH + 10,
    borderRadius: radius.md,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.ink },
  secondary: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.ink },
  ghost: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.75, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.35 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
})
