import { colors } from '../../theme'
import { Spot, SpotDifficulty, SpotTag } from '../../types/spot'
import { ExifGPS } from '../../lib/exif'

export interface PickedPhoto {
  uri: string
  width: number
  height: number
}

export interface UploadDraft {
  photo: PickedPhoto | null
  takenAt: string | null
  coords: ExifGPS | null
  coordsSource: 'exif' | 'manual' | null
  existingSpot: Spot | null // set when adding to an existing spot
  name: string
  description: string
  tags: SpotTag[]
  difficulty: SpotDifficulty
  camera: string
  lens: string
}

export const EMPTY_DRAFT: UploadDraft = {
  photo: null,
  takenAt: null,
  coords: null,
  coordsSource: null,
  existingSpot: null,
  name: '',
  description: '',
  tags: [],
  difficulty: 'easy',
  camera: '',
  lens: '',
}

export const TAG_OPTIONS: { value: SpotTag; label: string }[] = [
  { value: 'sunset', label: 'Sunset' },
  { value: 'sunrise', label: 'Sunrise' },
  { value: 'cityscape', label: 'Cityscape' },
  { value: 'nature', label: 'Nature' },
  { value: 'waterfall', label: 'Waterfall' },
  { value: 'architecture', label: 'Architecture' },
  { value: 'street_art', label: 'Street Art' },
  { value: 'rooftop', label: 'Rooftop' },
  { value: 'hidden_gem', label: 'Hidden Gem' },
  { value: 'night', label: 'Night' },
]

export const DIFFICULTY_OPTIONS: { value: SpotDifficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'hard', label: 'Hard' },
  { value: 'permit_required', label: 'Permit Required' },
]

export const COLORS = {
  primary: colors.ink,
  onPrimary: colors.onInk,
  background: colors.paper,
  surface: colors.sunk,
  card: colors.card,
  text: colors.ink,
  textSecondary: colors.ink2,
  border: colors.line,
}
