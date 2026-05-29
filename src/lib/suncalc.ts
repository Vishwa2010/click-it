export interface ShotWindow {
  morningGoldenStart: Date
  morningGoldenEnd: Date
  eveningGoldenStart: Date
  eveningGoldenEnd: Date
  blueHourStart: Date
  blueHourEnd: Date
  sunrise: Date
  sunset: Date
}

export function getShotWindow(latitude: number, longitude: number, date: Date = new Date()): ShotWindow {
  const times = getSunTimes(latitude, longitude, date)
  return times
}

function getSunTimes(lat: number, lon: number, date: Date): ShotWindow {
  const d = new Date(date)
  d.setHours(12, 0, 0, 0)

  const J2000 = 2451545.0
  const julianDate = date.getTime() / 86400000 + 2440587.5
  const n = julianDate - J2000

  const solarNoon = 12 - (lon / 15)
  const declination = 23.45 * Math.sin((360 / 365) * (n - 81) * (Math.PI / 180))
  const latRad = lat * (Math.PI / 180)
  const decRad = declination * (Math.PI / 180)

  const hourAngle = Math.acos(
    (Math.cos(90.833 * Math.PI / 180) - Math.sin(latRad) * Math.sin(decRad)) /
    (Math.cos(latRad) * Math.cos(decRad))
  ) * (180 / Math.PI)

  const sunriseHour = solarNoon - hourAngle / 15
  const sunsetHour = solarNoon + hourAngle / 15

  const toDate = (hour: number): Date => {
    const result = new Date(date)
    result.setHours(Math.floor(hour), Math.round((hour % 1) * 60), 0, 0)
    return result
  }

  return {
    sunrise: toDate(sunriseHour),
    morningGoldenStart: toDate(sunriseHour),
    morningGoldenEnd: toDate(sunriseHour + 1),
    eveningGoldenStart: toDate(sunsetHour - 1),
    eveningGoldenEnd: toDate(sunsetHour),
    blueHourStart: toDate(sunsetHour),
    blueHourEnd: toDate(sunsetHour + 0.5),
    sunset: toDate(sunsetHour),
  }
}

export function formatShotWindowLabel(window: ShotWindow): string {
  const fmt = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
  return `${fmt(window.eveningGoldenStart)} – ${fmt(window.eveningGoldenEnd)}`
}
