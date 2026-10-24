import { View, Text, StyleSheet } from 'react-native'
import { Aperture } from 'lucide-react-native'
import { colors, fonts } from '../../theme'

// Small ClickIt wordmark used at the top of auth screens
export default function BrandMark() {
  return (
    <View style={styles.row} accessibilityRole="header" accessibilityLabel="ClickIt">
      <View style={styles.mark}>
        <Aperture size={18} color={colors.onInk} strokeWidth={2.4} />
      </View>
      <Text style={styles.word}>ClickIt</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  word: { color: colors.ink, fontSize: 20, fontFamily: fonts.extrabold, letterSpacing: -0.5 },
})
