export type SpotRank =
  | 'undiscovered'
  | 'hidden_gem'
  | 'popular'
  | 'iconic'
  | 'legendary'

export type SpotDifficulty =
  | 'easy'
  | 'moderate'
  | 'hard'
  | 'permit_required'

export type SpotTag =
  | 'sunset'
  | 'sunrise'
  | 'cityscape'
  | 'nature'
  | 'waterfall'
  | 'architecture'
  | 'street_art'
  | 'rooftop'
  | 'hidden_gem'
  | 'night'

export interface Spot {
  id: string
  name: string
  description: string
  latitude: number
  longitude: number
  founder_id: string
  rank: SpotRank
  difficulty: SpotDifficulty
  tags: SpotTag[]
  cover_photo_url: string
  photo_count: number
  navigation_count: number
  best_time_start: string
  best_time_end: string
  gear_recommendation: string
  created_at: string
}

export interface SpotPhoto {
  id: string
  spot_id: string
  user_id: string
  photo_url: string
  taken_at: string
  camera: string
  lens: string
  upvotes: number
  created_at: string
}
