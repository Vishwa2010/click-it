// Pure walk planning (no Expo/React Native imports, so it can be unit-tested in Node)
import { Spot } from '../types/spot'
import { distanceMeters } from './geo'
import { Coords, nextGoldenHour } from './goldenHour'

const WALK_KMH = 4.8
const STOP_MIN = 15 // time spent shooting at each stop
const MAX_STOPS = 8

export interface Leg {
  spot: Spot
  walkMin: number // from the previous stop (or the start)
  meters: number
}

export interface PlannedWalk {
  legs: Leg[]
  totalMin: number
  totalMeters: number
  leaveBy: Date | null // leave then to reach the last stop as golden hour starts
  line: [number, number][] // [lng, lat] path for the map
  routed: boolean // true when the line follows real walking paths
}

const walkMinutes = (m: number) => (m / 1000 / WALK_KMH) * 60

// Greedy nearest-next walk from the start that fits inside the time budget
export function planWalk(start: Coords, spots: Spot[], budgetMin: number): Omit<PlannedWalk, 'line' | 'routed'> {
  const maxReach = (WALK_KMH * 1000 * budgetMin) / 60 / 2 // can't usefully go further than half the budget out
  let pool = spots.filter((s) => distanceMeters(start.latitude, start.longitude, s.latitude, s.longitude) <= maxReach)
  const legs: Leg[] = []
  let here = start
  let used = 0
  while (pool.length && legs.length < MAX_STOPS) {
    const next = pool
      .map((s) => ({ s, m: distanceMeters(here.latitude, here.longitude, s.latitude, s.longitude) }))
      .sort((a, b) => a.m - b.m)[0]
    const cost = walkMinutes(next.m) + STOP_MIN
    if (used + cost > budgetMin) break
    legs.push({ spot: next.s, walkMin: Math.round(walkMinutes(next.m)), meters: Math.round(next.m) })
    used += cost
    here = { latitude: next.s.latitude, longitude: next.s.longitude }
    pool = pool.filter((s) => s.id !== next.s.id)
  }
  const totalMeters = legs.reduce((t, l) => t + l.meters, 0)
  let leaveBy: Date | null = null
  if (legs.length) {
    const last = legs[legs.length - 1].spot
    const golden = nextGoldenHour({ latitude: last.latitude, longitude: last.longitude })
    // arrive at the last stop right as its golden hour begins
    const arriveMin = used - STOP_MIN
    const t = new Date(golden.start.getTime() - arriveMin * 60000)
    leaveBy = t.getTime() > Date.now() ? t : null
  }
  return { legs, totalMin: Math.round(used), totalMeters, leaveBy }
}

