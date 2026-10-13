import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native'
import { Sun } from 'lucide-react-native'
import { Coords, formatCountdown, nextGoldenHour, useNow } from '../lib/goldenHour'
import { colors, fonts, radius } from '../theme'

interface Props {
  coords: Coords
  isUserLocation: boolean
  style?: StyleProp<ViewStyle>
}

// Live golden-hour status for the area the map is centred on
export default function ConditionsWidget({ coords, isUserLocation, style }: Props) {
  const now = useNow()
  const golden = nextGoldenHour(coords, now)
  const where = isUserLocation ? 'near you' : 'in this area'
  const title = golden.isNow ? 'Golden hour now' : 'Golden hour'
  const sub = golden.isNow ? `${where} · go shoot` : `${where} · in ${formatCountdown(golden.start.getTime() - now.getTime())}`

  return (
    <View style={[styles.widget, style]} pointerEvents="none" accessibilityRole="text" accessibilityLabel={`${title} ${sub}`}>
      <View style={[styles.iconWrap, golden.isNow && styles.iconLive]}>
        <Sun size={18} color={golden.isNow ? colors.onInk : colors.ink} strokeWidth={2.2} />
      </View>
      <View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{sub}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  widget: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingLeft: 6,
    paddingRight: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.sunk,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconLive: { backgroundColor: colors.accent },
  title: { color: colors.ink, fontSize: 14, fontFamily: fonts.bold },
  sub: { color: colors.ink2, fontSize: 12, fontFamily: fonts.medium, marginTop: 1 },
})
