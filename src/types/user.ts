export type ExplorerRank =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'elite'
  | 'legend'

export interface User {
  id: string
  username: string
  avatar_url: string
  bio: string
  explorer_rank: ExplorerRank
  xp: number
  spots_founded: number
  spots_visited: number
  countries_visited: number
  cities_visited: number
  photos_uploaded: number
  followers_count: number
  following_count: number
  created_at: string
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  earned_at: string
}
