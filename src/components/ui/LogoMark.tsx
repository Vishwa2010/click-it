import Svg, { Polygon, Circle } from 'react-native-svg'
import { colors } from '../../theme'
import { LOGO_VIEWBOX, LOGO_STAR_POINTS, LOGO_DISK_R, LOGO_RING_R, LOGO_RING_WIDTH, LOGO_DOT_R } from './logoGeometry'

interface Props {
  size: number
  color?: string
  background?: string
}

// The ClickIt logo, drawn as vectors so it stays sharp at any size
export default function LogoMark({ size, color = colors.ink, background = colors.paper }: Props) {
  const c = LOGO_VIEWBOX / 2
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${LOGO_VIEWBOX} ${LOGO_VIEWBOX}`} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Polygon points={LOGO_STAR_POINTS} fill={color} />
      <Circle cx={c} cy={c} r={LOGO_DISK_R} fill={background} />
      <Circle cx={c} cy={c} r={LOGO_RING_R} fill="none" stroke={color} strokeWidth={LOGO_RING_WIDTH} />
      <Circle cx={c} cy={c} r={LOGO_DOT_R} fill={color} />
    </Svg>
  )
}
