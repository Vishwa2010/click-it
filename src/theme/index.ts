// ClickIt design tokens — beige & black, "paper and ink".
// Every screen pulls colours, type and spacing from here; don't hard-code hex values in components.
// All text/background pairs below meet WCAG AA (4.5:1) — checked when the palette was chosen.
import { TextStyle } from 'react-native'
import { SpotRank } from '../types/spot'
import { ExplorerRank } from '../types/user'

export const colors = {
  paper: '#F5F0E8', // app background
  sunk: '#EDE7DC', // inputs, wells, inactive chips
  card: '#FFFDF9', // raised cards and sheets
  ink: '#1A1714', // primary text, primary buttons, active states
  ink2: '#5C554C', // secondary text
  muted: '#6F675C', // captions, placeholders, inactive icons
  line: '#DDD5C8', // hairline borders and dividers
  onInk: '#F5F0E8', // text/icons on ink surfaces
  accent: '#A84A26', // the single accent — used sparingly (live/golden-hour moments)
  success: '#3D6B37',
  error: '#A3361F',
  errorTint: 'rgba(163,54,31,0.08)',
  successTint: 'rgba(61,107,55,0.1)',
  accentTint: 'rgba(168,74,38,0.08)',
  scrim: 'rgba(26,23,20,0.45)',
}

export const spotRankColors: Record<SpotRank, string> = {
  undiscovered: '#6F675C',
  hidden_gem: '#4A6B3F',
  popular: '#3E5C76',
  iconic: '#8A5F12',
  legendary: '#9B3423',
}

export const explorerRankColors: Record<ExplorerRank, string> = {
  bronze: '#8C5A2B',
  silver: '#6E6E6E',
  gold: '#876A14',
  elite: '#5B4A7A',
  legend: '#1A1714',
}

export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
}

// Custom fonts carry their weight in the family name, so styles set fontFamily (never fontWeight)
export const type = {
  display: { fontFamily: fonts.extrabold, fontSize: 44, lineHeight: 46, letterSpacing: -1.5, color: colors.ink },
  title: { fontFamily: fonts.extrabold, fontSize: 30, lineHeight: 35, letterSpacing: -0.8, color: colors.ink },
  headline: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 26, letterSpacing: -0.3, color: colors.ink },
  subhead: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 23, color: colors.ink },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, color: colors.ink2 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 24, color: colors.ink },
  small: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.ink2 },
  smallStrong: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.ink },
  caption: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.muted },
  eyebrow: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 16, letterSpacing: 1.6, color: colors.muted, textTransform: 'uppercase' },
  button: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 20, letterSpacing: 0.1 },
  stat: { fontFamily: fonts.extrabold, fontSize: 36, lineHeight: 40, letterSpacing: -1.2, color: colors.ink },
} satisfies Record<string, TextStyle>

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 }

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 }

// Minimum tap target (Apple HIG / skill touch-target rule)
export const TOUCH = 44

export const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 }

export const card = {
  backgroundColor: colors.card,
  borderRadius: radius.lg,
  borderWidth: 1,
  borderColor: colors.line,
}
