export interface ExifGPS {
  latitude: number
  longitude: number
}

export interface SafeExifData {
  gps: ExifGPS | null
  takenAt: string | null
}

export function stripExifKeepGPS(exifData: Record<string, unknown>): SafeExifData {
  const gpsLat = exifData['GPSLatitude']
  const gpsLon = exifData['GPSLongitude']

  let gps: ExifGPS | null = null
  if (typeof gpsLat === 'number' && typeof gpsLon === 'number') {
    gps = { latitude: gpsLat, longitude: gpsLon }
  }

  const takenAt = typeof exifData['DateTimeOriginal'] === 'string'
    ? exifData['DateTimeOriginal']
    : null

  return { gps, takenAt }
}
