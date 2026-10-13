import { useEffect, useState } from 'react'
import { getShotWindow } from './suncalc'

export interface Coords {
  latitude: number
  longitude: number
}

// Pass a time zone to show a place's local time (e.g. the New York fallback) instead of the device's
export function formatTime(d: Date, timeZone?: string): string {
  try {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZone })
  } catch {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }
}

export const DEFAULT_TIME_ZONE = 'America/New_York'

export function formatCountdown(ms: number): string {
  const totalMin = Math.max(0, Math.round(ms / 60000))
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h > 0 ? `${h}h ${m}m` : `${m} min`
}

export interface GoldenHour {
  start: Date
  end: Date
  isNow: boolean
  minutesOfGoldenLightToday: number
}

// The current or next golden hour at these coordinates (rolls over to tomorrow morning after sunset)
export function nextGoldenHour(coords: Coords, now: Date = new Date()): GoldenHour {
  const today = getShotWindow(coords.latitude, coords.longitude, now)
  const minutes =
    (today.morningGoldenEnd.getTime() - today.morningGoldenStart.getTime() +
      today.eveningGoldenEnd.getTime() - today.eveningGoldenStart.getTime()) / 60000
  const t = now.getTime()
  const windows: [Date, Date][] = [
    [today.morningGoldenStart, today.morningGoldenEnd],
    [today.eveningGoldenStart, today.eveningGoldenEnd],
  ]
  for (const [start, end] of windows) {
    if (t < end.getTime()) {
      return { start, end, isNow: t >= start.getTime(), minutesOfGoldenLightToday: Math.round(minutes) }
    }
  }
  const tomorrow = getShotWindow(coords.latitude, coords.longitude, new Date(t + 24 * 3600 * 1000))
  return {
    start: tomorrow.morningGoldenStart,
    end: tomorrow.morningGoldenEnd,
    isNow: false,
    minutesOfGoldenLightToday: Math.round(minutes),
  }
}

// Re-render on an interval so countdowns stay live
export function useNow(intervalMs = 30000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

// "18:30" → "6:30 PM" in the device's locale; leaves unparseable values untouched
export function formatHHMM(value: string): string {
  const [h, m] = value.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return value
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return formatTime(d)
}
