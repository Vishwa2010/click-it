import { useEffect, useMemo, useRef } from 'react'
import { View, Text, Animated, Easing, StyleSheet, useWindowDimensions } from 'react-native'
import { colors, fonts, explorerRankColors, spotRankColors } from '../theme'

interface Props {
  xp: number
  confetti: boolean
}

// Earthy confetti that sits in the beige & black palette
const CONFETTI_COLORS = [colors.ink, colors.accent, explorerRankColors.gold, spotRankColors.hidden_gem, spotRankColors.popular, colors.line]
const PIECES = 42

export default function XpCelebration({ xp, confetti }: Props) {
  const { width, height } = useWindowDimensions()
  const pop = useRef(new Animated.Value(0)).current
  const away = useRef(new Animated.Value(0)).current
  const fall = useRef(new Animated.Value(0)).current

  // Random but stable layout for each confetti piece
  const pieces = useMemo(
    () =>
      Array.from({ length: PIECES }, (_, i) => ({
        x: Math.random() * width,
        drift: (Math.random() - 0.5) * 120,
        delay: Math.random() * 0.35,
        spin: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 360),
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + Math.random() * 6,
      })),
    [width]
  )

  useEffect(() => {
    Animated.sequence([
      Animated.spring(pop, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
      Animated.delay(900),
      Animated.timing(away, { toValue: 1, duration: 700, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start()
    if (confetti) {
      Animated.timing(fall, { toValue: 1, duration: 2600, easing: Easing.out(Easing.quad), useNativeDriver: true }).start()
    }
  }, [pop, away, fall, confetti])

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Animated.View
        style={[
          styles.badge,
          {
            opacity: Animated.multiply(pop, away.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })),
            transform: [
              { translateY: away.interpolate({ inputRange: [0, 1], outputRange: [0, -160] }) },
              { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
            ],
          },
        ]}
      >
        <Text style={styles.xp}>+{xp} XP</Text>
      </Animated.View>

      {confetti &&
        pieces.map((p, i) => {
          const progress = fall.interpolate({
            inputRange: [0, p.delay, 1],
            outputRange: [0, 0, 1],
            extrapolate: 'clamp',
          })
          return (
            <Animated.View
              key={i}
              style={[
                styles.piece,
                {
                  left: p.x,
                  width: p.size,
                  height: p.size * 1.6,
                  backgroundColor: p.color,
                  opacity: progress.interpolate({ inputRange: [0, 0.05, 0.85, 1], outputRange: [0, 1, 1, 0] }),
                  transform: [
                    { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-40, height * 0.9] }) },
                    { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] }) },
                    { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin}deg`] }) },
                  ],
                },
              ]}
            />
          )
        })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  badge: {
    backgroundColor: colors.ink,
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 14,
    shadowColor: colors.ink,
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  xp: { color: colors.onInk, fontSize: 32, fontFamily: fonts.extrabold },
  piece: { position: 'absolute', top: 0, borderRadius: 2 },
})
