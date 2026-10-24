import { supabase, isSupabaseConfigured } from './supabase'
import { uploadPhoto } from './cloudinary'
import * as Location from 'expo-location'
import { SpotDifficulty, SpotTag } from '../types/spot'
import { getShotWindow } from './suncalc'

export interface NewSpotInput {
  name: string
  description: string
  latitude: number
  longitude: number
  tags: SpotTag[]
  difficulty: SpotDifficulty
}

export interface PublishInput {
  photoUri: string // compressed, EXIF-free JPEG
  takenAt: string | null
  camera: string
  lens: string
  existingSpotId: string | null
  // Coordinates of the existing spot, for the golden-hour check
  spotCoords?: { latitude: number; longitude: number } | null
  newSpot: NewSpotInput | null
}

// City/country for the spot's profile stats; best effort — empty if lookup fails
async function placeFor(latitude: number, longitude: number): Promise<{ city: string; country: string }> {
  try {
    const [p] = await Location.reverseGeocodeAsync({ latitude, longitude })
    return { city: p?.city ?? p?.subregion ?? '', country: p?.country ?? '' }
  } catch {
    return { city: '', country: '' }
  }
}

// True when the photo's capture time falls in the spot's morning or evening golden hour (±15 min)
function isGoldenHourShot(takenAt: string | null, latitude: number, longitude: number): boolean {
  if (!takenAt) return false
  const taken = new Date(takenAt)
  if (Number.isNaN(taken.getTime())) return false
  const w = getShotWindow(latitude, longitude, taken)
  const slack = 15 * 60000
  const t = taken.getTime()
  return (
    (t >= w.morningGoldenStart.getTime() - slack && t <= w.morningGoldenEnd.getTime() + slack) ||
    (t >= w.eveningGoldenStart.getTime() - slack && t <= w.eveningGoldenEnd.getTime() + slack)
  )
}

// Postgres "undefined column" — the newer migration hasn't been run yet; retry without the new fields
const isMissingColumn = (code?: string) => code === '42703' || code === 'PGRST204'

export interface PublishResult {
  spotId: string
  isNewSpot: boolean
}

// Uploads the photo, creates the spot if needed, then attaches the photo to it.
// Counters (photo_count, spots_founded, cover photo) are maintained by database triggers.
export async function publishSpotPhoto(input: PublishInput): Promise<PublishResult> {
  if (!isSupabaseConfigured) {
    throw new Error('Publishing is not set up yet (missing Supabase keys).')
  }
  if (!input.existingSpotId && !input.newSpot) {
    throw new Error('Choose a spot or create a new one.')
  }

  const photoUrl = await uploadPhoto(input.photoUri)

  let spotId = input.existingSpotId
  if (!spotId && input.newSpot) {
    const base = {
      name: input.newSpot.name,
      description: input.newSpot.description,
      latitude: input.newSpot.latitude,
      longitude: input.newSpot.longitude,
      tags: input.newSpot.tags,
      difficulty: input.newSpot.difficulty,
    }
    const place = await placeFor(input.newSpot.latitude, input.newSpot.longitude)
    let res = await supabase.from('spots').insert({ ...base, ...place }).select('id').single()
    if (res.error && isMissingColumn(res.error.code)) res = await supabase.from('spots').insert(base).select('id').single()
    if (res.error || !res.data) throw new Error(res.error?.message ?? 'Could not create the spot.')
    spotId = (res.data as { id: string }).id
  }

  const coords = input.newSpot ?? input.spotCoords
  const photo = {
    spot_id: spotId,
    photo_url: photoUrl,
    taken_at: input.takenAt,
    camera: input.camera,
    lens: input.lens,
  }
  const golden = coords ? isGoldenHourShot(input.takenAt, coords.latitude, coords.longitude) : false
  let photoRes = await supabase.from('spot_photos').insert({ ...photo, golden_hour: golden })
  if (photoRes.error && isMissingColumn(photoRes.error.code)) photoRes = await supabase.from('spot_photos').insert(photo)
  if (photoRes.error) throw new Error(photoRes.error.message)

  return { spotId: spotId as string, isNewSpot: !input.existingSpotId }
}
