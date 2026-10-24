import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle, Linking } from 'react-native'
import { Sun, Cloud, CloudRain, CloudDrizzle, CloudSnow, CloudLightning, CloudFog, LucideIcon } from 'lucide-react-native'
import { Coords, formatCountdown, nextGoldenHour, useNow } from '../lib/goldenHour'
import { Sky, formatTemp, useWeather } from '../lib/weather'
import { colors, fonts, radius, hitSlop } from '../theme'

interface Props {
  coords: Coords
  isUserLocation: boolean
  style?: StyleProp<ViewStyle>
}

const SKY_ICON: Record<Sky, LucideIcon> = {
  clear: Sun,
  clouds: Cloud,
  rain: CloudRain,
  drizzle: CloudDrizzle,
  snow: CloudSnow,
  storm: CloudLightning,
  fog: CloudFog,
}

const OVERCAST = 60 // % cloud cover above which golden light is unlikely

// Live golden-hour status + current weather for the area the map is centred on
export default function ConditionsWidget({ coords, isUserLocation, style }: Props) {
  const now = useNow()
  const weather = useWeather(coords)
  const golden = nextGoldenHour(coords, now)
  const where = isUserLocation ? 'near you' : 'here'
  const overcast = !!weather && (weather.cloudPercent >= OVERCAST || (weather.sky !== 'clear' && weather.sky !== 'clouds'))

  const title = golden.isNow ? (overcast ? 'Golden hour · overcast' : 'Perfect light now') : 'Golden hour'
  const timing = golden.isNow ? `${where}` : `${where} in ${formatCountdown(golden.start.getTime() - now.getTime())}`
  const conditions = weather ? `${weather.description.charAt(0).toUpperCase()}${weather.description.slice(1)} · ${formatTemp(weather.tempC)}` : null
  const Icon = weather ? SKY_ICON[weather.sky] : Sun
  const live = golden.isNow && !overcast

  return (
    <View
      style={[styles.widget, style]}
      pointerEvents="box-none"
    >
      <View style={[styles.iconWrap, live && styles.iconLive]}>
        <Icon size={18} color={live ? colors.onInk : colors.ink} strokeWidth={2.2} />
      </View>
      <View>
        <View accessible accessibilityRole="text" accessibilityLabel={[title, timing, conditions].filter(Boolean).join(', ')}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.sub} numberOfLines={1}>
            {timing}
            {conditions ? ` · ${conditions}` : ''}
          </Text>
        </View>
        {/* Required attribution for OpenWeather's free plan: visible, linked to openweathermap.org */}
        {weather && (
          <Pressable
            onPress={() => Linking.openURL('https://openweathermap.org/').catch(() => {})}
            hitSlop={hitSlop}
            accessibilityRole="link"
          >
            <Text style={styles.credit}>Weather data provided by OpenWeather</Text>
          </Pressable>
        )}
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
  credit: { color: colors.muted, fontSize: 10, fontFamily: fonts.medium, marginTop: 2, textDecorationLine: 'underline' },
})
