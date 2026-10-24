import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, LucideIcon } from 'lucide-react-native'
import { colors, radius, type, hitSlop } from '../../theme'

interface Props {
  Icon: LucideIcon
  eyebrow: string
  title: string
  body: string
  onBack?: () => void
}

// Placeholder for screens not built yet — never leave a screen blank (CLAUDE.md)
export default function ComingSoon({ Icon, eyebrow, title, body, onBack }: Props) {
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.container, { paddingTop: insets.top + (onBack ? 8 : 32) }]}>
      {onBack && (
        <Pressable
          onPress={onBack}
          hitSlop={hitSlop}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ChevronLeft size={28} color={colors.ink} />
        </Pressable>
      )}
      <Text style={type.eyebrow}>{eyebrow}</Text>
      <Text style={[type.display, styles.title]}>{title}</Text>
      <Text style={type.body}>{body}</Text>
      <View style={styles.badge}>
        <Icon size={20} color={colors.ink} />
        <Text style={type.smallStrong}>Coming soon</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: 24 },
  title: { marginTop: 10, marginBottom: 14 },
  back: { width: 44, height: 44, justifyContent: 'center', marginLeft: -8, marginBottom: 16 },
  pressed: { opacity: 0.6 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    marginTop: 28,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.ink,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
})
