import { useEffect, useState } from 'react'
import Constants from 'expo-constants'
import { Coords } from './goldenHour'

const API_KEY = (Constants.expoConfig?.extra?.openweatherApiKey as string | undefined) || ''
const CACHE_MS = 10 * 60 * 1000

export type Sky = 'clear' | 'clouds' | 'rain' | 'drizzle' | 'snow' | 'storm' | 'fog'

export interface Weather {
  sky: Sky
  description: string // e.g. "clear sky"
  cloudPercent: number
  tempC: number
}

const cache = new Map<string, { at: number; data: Weather }>()

function skyFrom(main: string): Sky {
  switch (main) {
    case 'Clear': return 'clear'
    case 'Clouds': return 'clouds'
    case 'Rain': return 'rain'
    case 'Drizzle': return 'drizzle'
    case 'Snow': return 'snow'
    case 'Thunderstorm': return 'storm'
    default: return 'fog' // Mist, Haze, Fog, Smoke, Dust…
  }
}

// Current conditions from OpenWeatherMap, cached per ~1km area for 10 minutes. Null when unavailable.
export async function fetchWeather({ latitude, longitude }: Coords): Promise<Weather | null> {
  if (!API_KEY) return null
  const key = `${latitude.toFixed(2)},${longitude.toFixed(2)}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.data
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
    )
    if (!res.ok) return null
    const d = (await res.json()) as {
      weather?: { main: string; description: string }[]
      clouds?: { all: number }
      main?: { temp: number }
    }
    const w = d.weather?.[0]
    if (!w || d.main?.temp === undefined) return null
    const data: Weather = { sky: skyFrom(w.main), description: w.description, cloudPercent: d.clouds?.all ?? 0, tempC: d.main.temp }
    cache.set(key, { at: Date.now(), data })
    return data
  } catch {
    return null
  }
}

export function useWeather(coords: Coords): Weather | null {
  const [weather, setWeather] = useState<Weather | null>(null)
  const lat = coords.latitude.toFixed(2)
  const lon = coords.longitude.toFixed(2)
  useEffect(() => {
    let cancelled = false
    fetchWeather({ latitude: Number(lat), longitude: Number(lon) }).then((w) => !cancelled && setWeather(w))
    return () => {
      cancelled = true
    }
  }, [lat, lon])
  return weather
}

// Temperature in the user's usual unit (°F for US-style locales)
export function formatTemp(tempC: number): string {
  let locale = 'en-US'
  try {
    locale = Intl.NumberFormat().resolvedOptions().locale
  } catch {
    // keep default
  }
  return /-(US|LR|MM)\b/.test(locale) ? `${Math.round(tempC * 9 / 5 + 32)}°` : `${Math.round(tempC)}°`
}
