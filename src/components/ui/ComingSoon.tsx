import { View, Text, Pressable, ScrollView, RefreshControl, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, LucideIcon } from 'lucide-react-native'
import { colors, radius, type, hitSlop } from '../../theme'
import { useCallback } from 'react'
import { usePullToRefresh } from '../../hooks/usePullToRefresh'

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
  // Nothing to reload yet, but pulling should still feel alive like every other screen
  const { refreshing, onRefresh } = usePullToRefresh(useCallback(async () => undefined, []))
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + (onBack ? 8 : 32), paddingHorizontal: 24, flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
    >
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
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
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
