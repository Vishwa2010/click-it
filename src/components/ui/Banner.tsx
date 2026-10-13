import { View, Text, StyleSheet } from 'react-native'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react-native'
import { colors, fonts, radius } from '../../theme'

type Tone = 'error' | 'success' | 'info'

interface Props {
  tone: Tone
  title?: string
  message: string
}

const TONES = {
  error: { fg: colors.error, bg: colors.errorTint, Icon: AlertCircle },
  success: { fg: colors.success, bg: colors.successTint, Icon: CheckCircle2 },
  info: { fg: colors.ink, bg: colors.sunk, Icon: Info },
}

// Inline message shown near the thing it's about (skill: error-feedback)
export default function Banner({ tone, title, message }: Props) {
  const { fg, bg, Icon } = TONES[tone]
  return (
    <View style={[styles.wrap, { backgroundColor: bg }]} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Icon size={20} color={fg} />
      <View style={styles.text}>
        {title ? <Text style={[styles.title, { color: fg }]}>{title}</Text> : null}
        <Text style={[styles.message, { color: tone === 'info' ? colors.ink2 : fg }]}>{message}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 10, borderRadius: radius.md, padding: 14, alignItems: 'flex-start' },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontFamily: fonts.bold },
  message: { fontSize: 14, lineHeight: 20, fontFamily: fonts.medium },
})
