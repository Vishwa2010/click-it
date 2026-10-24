import { View, Text, StyleSheet } from 'react-native'
import LogoMark from './LogoMark'
import { colors, fonts } from '../../theme'

// Small ClickIt wordmark used at the top of auth screens
export default function BrandMark() {
  return (
    <View style={styles.row} accessibilityRole="header" accessibilityLabel="ClickIt">
      <LogoMark size={36} />
      <Text style={styles.word}>ClickIt</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  word: { color: colors.ink, fontSize: 20, fontFamily: fonts.extrabold, letterSpacing: -0.5 },
})
