import { useEffect, useState } from 'react'
import { AccessibilityInfo, StyleSheet } from 'react-native'
import {
  Antenna,
  Building,
  Droplets,
  Gem,
  Landmark,
  Leaf,
  LucideIcon,
  Moon,
  Palette,
  Sunrise,
  Sunset,
} from 'lucide-react-native'
import { SpotTag } from '../../../types/spot'
import { colors, explorerRankColors, fonts, type } from '../../../theme'
export { nextGoldenHour, useNow, formatTime, formatCountdown, DEFAULT_TIME_ZONE } from '../../../lib/goldenHour'
export type { GoldenHour } from '../../../lib/goldenHour'

export const C = {
  primary: colors.ink,
  onPrimary: colors.onInk,
  accent: colors.accent,
  background: colors.paper,
  surface: colors.sunk,
  card: colors.card,
  text: colors.ink,
  textSecondary: colors.ink2,
  border: colors.line,
  success: colors.success,
  error: colors.error,
  bronze: explorerRankColors.bronze,
  silver: explorerRankColors.silver,
  gold: explorerRankColors.gold,
  elite: explorerRankColors.elite,
}

export const INTERESTS: { tag: SpotTag; label: string; Icon: LucideIcon }[] = [
  { tag: 'sunset', label: 'Sunset', Icon: Sunset },
  { tag: 'sunrise', label: 'Sunrise', Icon: Sunrise },
  { tag: 'cityscape', label: 'Cityscape', Icon: Building },
  { tag: 'nature', label: 'Nature', Icon: Leaf },
  { tag: 'waterfall', label: 'Waterfall', Icon: Droplets },
  { tag: 'architecture', label: 'Architecture', Icon: Landmark },
  { tag: 'street_art', label: 'Street Art', Icon: Palette },
  { tag: 'rooftop', label: 'Rooftop', Icon: Antenna },
  { tag: 'hidden_gem', label: 'Hidden Gem', Icon: Gem },
  { tag: 'night', label: 'Night', Icon: Moon },
]

export const MAX_INTERESTS = 3

export { usernameRules } from '../../../hooks/useUsernameAvailability'
export type { UsernameStatus } from '../../../hooks/useUsernameAvailability'

export type { Coords } from '../../../lib/goldenHour'
import type { Coords } from '../../../lib/goldenHour'

// Fallback when location isn't shared — labelled as New York wherever it's shown
export const DEFAULT_COORDS: Coords = { latitude: 40.7128, longitude: -74.006 }

// Respect the iOS/Android "Reduce Motion" setting — skip looping and decorative animation
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    let mounted = true
    AccessibilityInfo.isReduceMotionEnabled().then((v) => mounted && setReduced(v))
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced)
    return () => {
      mounted = false
      sub.remove()
    }
  }, [])
  return reduced
}

export const shared = StyleSheet.create({
  eyebrow: { ...type.eyebrow, marginBottom: 10 },
  hero: { ...type.display },
  title: { ...type.title, marginBottom: 10 },
  subtitle: { ...type.body, marginBottom: 28 },
  label: { ...type.eyebrow, marginBottom: 8 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
})
// fonts re-exported so pages can use one import
export { fonts }
