import { supabase, isSupabaseConfigured } from './supabase'
import { uploadPhoto } from './cloudinary'
import { SpotDifficulty, SpotTag } from '../types/spot'

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
  newSpot: NewSpotInput | null
}

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
    const { data, error } = await supabase
      .from('spots')
      .insert({
        name: input.newSpot.name,
        description: input.newSpot.description,
        latitude: input.newSpot.latitude,
        longitude: input.newSpot.longitude,
        tags: input.newSpot.tags,
        difficulty: input.newSpot.difficulty,
      })
      .select('id')
      .single()
    if (error || !data) throw new Error(error?.message ?? 'Could not create the spot.')
    spotId = (data as { id: string }).id
  }

  const { error: photoError } = await supabase.from('spot_photos').insert({
    spot_id: spotId,
    photo_url: photoUrl,
    taken_at: input.takenAt,
    camera: input.camera,
    lens: input.lens,
  })
  if (photoError) throw new Error(photoError.message)

  return { spotId: spotId as string, isNewSpot: !input.existingSpotId }
}
