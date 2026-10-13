export interface ExifGPS {
  latitude: number
  longitude: number
}

export interface SafeExifData {
  gps: ExifGPS | null
  takenAt: string | null
}

// EXIF GPS values arrive as a decimal number, a "deg,min,sec" string, or rationals like "40/1,42/1,1188/100"
function toDegrees(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (Array.isArray(value)) return toDegrees(value.join(','))
  if (typeof value !== 'string') return null
  const parts = value.split(',').map((part) => {
    const [num, den] = part.trim().split('/').map(Number)
    return den ? num / den : num
  })
  if (parts.some((n) => !Number.isFinite(n))) return null
  const [deg = 0, min = 0, sec = 0] = parts
  return deg + min / 60 + sec / 3600
}

function signed(value: number, ref: unknown, negativeRef: 'S' | 'W'): number {
  return typeof ref === 'string' && ref.toUpperCase() === negativeRef ? -Math.abs(value) : value
}

function readGPS(exif: Record<string, unknown>): ExifGPS | null {
  // iOS nests GPS under "{GPS}"; Android uses flat GPSLatitude / GPSLatitudeRef keys
  const nested = exif['{GPS}']
  const gps = nested && typeof nested === 'object' ? (nested as Record<string, unknown>) : null

  const lat = toDegrees(gps ? gps['Latitude'] : exif['GPSLatitude'])
  const lon = toDegrees(gps ? gps['Longitude'] : exif['GPSLongitude'])
  if (lat === null || lon === null) return null

  const latitude = signed(lat, gps ? gps['LatitudeRef'] : exif['GPSLatitudeRef'], 'S')
  const longitude = signed(lon, gps ? gps['LongitudeRef'] : exif['GPSLongitudeRef'], 'W')
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null
  if (latitude === 0 && longitude === 0) return null
  return { latitude, longitude }
}

// "2026:10:06 18:15:00" → "2026-10-06T18:15:00" (local time at the spot)
function readTakenAt(exif: Record<string, unknown>): string | null {
  const nested = exif['{Exif}']
  const source = nested && typeof nested === 'object' ? (nested as Record<string, unknown>) : exif
  const raw = source['DateTimeOriginal']
  if (typeof raw !== 'string') return null
  const match = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/.exec(raw)
  return match ? `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}` : null
}

// Privacy: only GPS position and capture time are kept — camera serials, device info etc. are dropped
export function stripExifKeepGPS(exifData: Record<string, unknown> | null | undefined): SafeExifData {
  if (!exifData) return { gps: null, takenAt: null }
  return { gps: readGPS(exifData), takenAt: readTakenAt(exifData) }
}
