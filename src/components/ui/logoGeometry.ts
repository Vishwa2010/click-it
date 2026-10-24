// ClickIt logo: an 8-point star (longest points north/south) behind a paper disk
// holding a ring and a dot. Measured from the original artwork, in a 400 × 400 box.
export const LOGO_VIEWBOX = 400
const C = 200
const TIPS = [175, 158, 167, 158, 175, 158, 167, 158] // N, NE, E, SE, S, SW, W, NW
const INNER = 66

export const LOGO_STAR_POINTS = TIPS.flatMap((tip, i) => {
  const a = ((-90 + i * 45) * Math.PI) / 180
  const b = ((-90 + i * 45 + 22.5) * Math.PI) / 180
  return [
    `${(C + tip * Math.cos(a)).toFixed(2)},${(C + tip * Math.sin(a)).toFixed(2)}`,
    `${(C + INNER * Math.cos(b)).toFixed(2)},${(C + INNER * Math.sin(b)).toFixed(2)}`,
  ]
}).join(' ')

export const LOGO_DISK_R = 73
export const LOGO_RING_R = 43
export const LOGO_RING_WIDTH = 12.5
export const LOGO_DOT_R = 13
