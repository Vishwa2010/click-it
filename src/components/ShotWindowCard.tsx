import { useState } from 'react'
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native'
import { Sun, Moon, Sunrise, Sunset } from 'lucide-react-native'
import { colors, fonts, type, card } from '../theme'
import { formatHHMM } from '../lib/goldenHour'
import { ShotWindow } from '../lib/suncalc'

interface Props {
  window: ShotWindow
  communityStart: string
  communityEnd: string
  now?: Date
}

const ARC_DOTS = 25
const ARC_HEIGHT = 90

function fmt(d: Date): string {
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function isGolden(t: number, w: ShotWindow): boolean {
  return (
    (t >= w.morningGoldenStart.getTime() && t <= w.morningGoldenEnd.getTime()) ||
    (t >= w.eveningGoldenStart.getTime() && t <= w.eveningGoldenEnd.getTime())
  )
}

function statusLabel(now: Date, w: ShotWindow): string {
  const t = now.getTime()
  if (isGolden(t, w)) return 'Golden hour now'
  if (t >= w.blueHourStart.getTime() && t <= w.blueHourEnd.getTime()) return 'Blue hour now'
  if (t < w.morningGoldenStart.getTime()) return `Golden hour at ${fmt(w.morningGoldenStart)}`
  if (t < w.eveningGoldenStart.getTime()) return `Golden hour at ${fmt(w.eveningGoldenStart)}`
  return 'Next golden hour tomorrow'
}

export default function ShotWindowCard({ window: w, communityStart, communityEnd, now = new Date() }: Props) {
  const [width, setWidth] = useState(0)

  const sunrise = w.sunrise.getTime()
  const sunset = w.sunset.getTime()
  const radiusX = width / 2 - 8
  const radiusY = ARC_HEIGHT - 12

  // Position along the arc for a timestamp between sunrise (left) and sunset (right)
  const pointAt = (t: number) => {
    const progress = Math.min(1, Math.max(0, (t - sunrise) / (sunset - sunrise)))
    const angle = Math.PI * (1 - progress)
    return {
      x: width / 2 + radiusX * Math.cos(angle),
      y: ARC_HEIGHT - radiusY * Math.sin(angle),
    }
  }

  const nowT = now.getTime()
  const sunUp = nowT >= sunrise && nowT <= sunset
  const sun = pointAt(nowT)

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Shot Window</Text>
        <Text style={styles.status}>{statusLabel(now, w)}</Text>
      </View>

      <View style={styles.arc} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 &&
          Array.from({ length: ARC_DOTS }, (_, i) => {
            const t = sunrise + ((sunset - sunrise) * i) / (ARC_DOTS - 1)
            const p = pointAt(t)
            return (
              <View
                key={i}
                style={[
                  styles.dot,
                  { left: p.x - 3, top: p.y - 3 },
                  isGolden(t, w) && styles.dotGolden,
                ]}
              />
            )
          })}
        {width > 0 && sunUp && (
          <View style={[styles.sun, { left: sun.x - 14, top: sun.y - 14 }]}>
            <Sun size={18} color={colors.onInk} strokeWidth={2.4} />
          </View>
        )}
        {!sunUp && (
          <View style={styles.moon}>
            <Moon size={22} color={colors.ink2} />
          </View>
        )}
        <View style={styles.horizon} />
      </View>

      <View style={styles.horizonLabels}>
        <View style={styles.horizonItem}>
          <Sunrise size={14} color={colors.muted} />
          <Text style={styles.horizonLabel}>{fmt(w.sunrise)}</Text>
        </View>
        <View style={styles.horizonItem}>
          <Text style={styles.horizonLabel}>{fmt(w.sunset)}</Text>
          <Sunset size={14} color={colors.muted} />
        </View>
      </View>

      <View style={styles.rows}>
        <Row label="Morning golden" value={`${fmt(w.morningGoldenStart)} – ${fmt(w.morningGoldenEnd)}`} accent />
        <Row label="Evening golden" value={`${fmt(w.eveningGoldenStart)} – ${fmt(w.eveningGoldenEnd)}`} accent />
        <Row label="Blue hour" value={`${fmt(w.blueHourStart)} – ${fmt(w.blueHourEnd)}`} />
        <Row label="Community pick" value={`${formatHHMM(communityStart)} – ${formatHHMM(communityEnd)}`} />
      </View>
    </View>
  )
}

function Row({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, accent && styles.rowValueAccent]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { ...card, padding: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { ...type.headline },
  status: { color: colors.accent, fontSize: 13, fontFamily: fonts.bold },
  arc: { height: ARC_HEIGHT, position: 'relative' },
  dot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.line,
  },
  dotGolden: { backgroundColor: colors.accent },
  sun: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moon: { position: 'absolute', alignSelf: 'center', top: ARC_HEIGHT / 2 - 14 },
  horizon: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: colors.line,
  },
  horizonLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 14 },
  horizonItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  horizonLabel: { ...type.caption },
  rows: { gap: 10, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { color: colors.ink2, fontSize: 14, fontFamily: fonts.regular },
  rowValue: { color: colors.ink, fontSize: 14, fontFamily: fonts.semibold },
  rowValueAccent: { color: colors.accent, fontFamily: fonts.bold },
})
