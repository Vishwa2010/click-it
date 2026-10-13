import { supabase, isSupabaseConfigured } from './supabase'
import { Spot, SpotPhoto } from '../types/spot'
import { Duel } from '../types/duel'

// All spot reads go through spots_public, which hides exact coordinates of private-property spots
const SPOT_COLUMNS =
  'id, name, description, latitude, longitude, founder_id, rank, difficulty, tags, cover_photo_url, photo_count, navigation_count, best_time_start, best_time_end, gear_recommendation, created_at'

function notConfigured(): Error {
  return new Error('ClickIt isn’t connected to its database yet.')
}

// Rows from the database can have nulls where the app types expect strings
function normaliseSpot(row: Record<string, unknown>): Spot {
  return {
    ...(row as unknown as Spot),
    founder_id: (row.founder_id as string | null) ?? '',
    description: (row.description as string | null) ?? '',
    tags: ((row.tags as string[] | null) ?? []) as Spot['tags'],
    cover_photo_url: (row.cover_photo_url as string | null) ?? '',
  }
}

export async function fetchSpots(): Promise<Spot[]> {
  if (!isSupabaseConfigured) throw notConfigured()
  const { data, error } = await supabase
    .from('spots_public')
    .select(SPOT_COLUMNS)
    .order('navigation_count', { ascending: false })
    .limit(1000)
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => normaliseSpot(r as Record<string, unknown>))
}

export async function fetchSpot(id: string): Promise<Spot | null> {
  if (!isSupabaseConfigured) throw notConfigured()
  const { data, error } = await supabase.from('spots_public').select(SPOT_COLUMNS).eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? normaliseSpot(data as Record<string, unknown>) : null
}

export async function fetchSpotPhotos(spotId: string): Promise<SpotPhoto[]> {
  const { data, error } = await supabase
    .from('spot_photos')
    .select('*')
    .eq('spot_id', spotId)
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw new Error(error.message)
  return ((data ?? []) as SpotPhoto[]).map((p) => ({ ...p, taken_at: p.taken_at ?? '', camera: p.camera ?? '', lens: p.lens ?? '' }))
}

// Profiles are only readable when signed in; missing names fall back gracefully in the UI
export async function fetchUsernames(ids: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))]
  if (unique.length === 0) return {}
  const { data } = await supabase.from('users').select('id, username').in('id', unique)
  return Object.fromEntries((data ?? []).map((u: { id: string; username: string }) => [u.id, u.username]))
}

export async function fetchActiveDuel(spotId: string): Promise<Duel | null> {
  const { data } = await supabase
    .from('duels')
    .select('*')
    .eq('spot_id', spotId)
    .in('status', ['active', 'voting'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as Duel | null) ?? null
}

// Logged when someone taps Navigate — counts a visit and rewards the spot's founder (server-side)
export async function logNavigation(spotId: string): Promise<void> {
  if (!isSupabaseConfigured) return
  await supabase.from('spot_navigations').insert({ spot_id: spotId })
}
