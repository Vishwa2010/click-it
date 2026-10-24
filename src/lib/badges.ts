import { Flag, Compass, Camera, Sunset, Globe2, Building, Footprints, Users, LucideIcon } from 'lucide-react-native'
import { User } from '../types/user'

export interface BadgeDef {
  id: string // matches public.badges.id (seeded by supabase/migrations/*_badges.sql)
  name: string
  description: string
  Icon: LucideIcon
  // Progress toward the badge from the user's counters; null when there's no counter to show
  progress: (user: User) => { current: number; target: number } | null
}

const counter = (key: keyof User, target: number) => (user: User) => ({
  current: Math.min(Number(user[key]) || 0, target),
  target,
})

// Badges are awarded server-side (user_badges); this catalog only describes and visualises them
export const BADGES: BadgeDef[] = [
  { id: 'first_pin', name: 'First Pin', description: 'Found your first spot', Icon: Flag, progress: counter('spots_founded', 1) },
  { id: 'trailblazer', name: 'Trailblazer', description: 'Found 10 spots', Icon: Compass, progress: counter('spots_founded', 10) },
  { id: 'shutterbug', name: 'Shutterbug', description: 'Upload 25 photos', Icon: Camera, progress: counter('photos_uploaded', 25) },
  { id: 'golden_hour', name: 'Golden Hour', description: 'Shoot a spot in its golden hour', Icon: Sunset, progress: () => null },
  { id: 'explorer', name: 'Explorer', description: 'Visit 25 spots', Icon: Footprints, progress: counter('spots_visited', 25) },
  { id: 'city_hopper', name: 'City Hopper', description: 'Shoot in 10 cities', Icon: Building, progress: counter('cities_visited', 10) },
  { id: 'globetrotter', name: 'Globetrotter', description: 'Shoot in 5 countries', Icon: Globe2, progress: counter('countries_visited', 5) },
  { id: 'local_legend', name: 'Local Legend', description: 'Reach 100 followers', Icon: Users, progress: counter('followers_count', 100) },
]
