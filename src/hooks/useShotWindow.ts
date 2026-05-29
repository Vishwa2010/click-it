import { useMemo } from 'react'
import { getShotWindow, ShotWindow } from '../lib/suncalc'

export function useShotWindow(
  latitude: number,
  longitude: number,
  date: Date = new Date()
): ShotWindow {
  return useMemo(
    () => getShotWindow(latitude, longitude, date),
    [latitude, longitude, date]
  )
}
