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
  // '*' picks up newer columns (city/country) when the database has them
  const { data, error } = await supabase.from('spots_public').select('*').eq('id', id).maybeSingle()
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
    .gt('expires_at', new Date().toISOString())
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

// ── Social actions (rules enforced by RLS + triggers in Supabase) ──

export async function fetchMyUpvotes(photoIds: string[], userId: string): Promise<Set<string>> {
  if (photoIds.length === 0) return new Set()
  const { data } = await supabase.from('photo_upvotes').select('photo_id').eq('user_id', userId).in('photo_id', photoIds)
  return new Set((data ?? []).map((r: { photo_id: string }) => r.photo_id))
}

export async function setUpvote(photoId: string, on: boolean): Promise<boolean> {
  const { error } = on
    ? await supabase.from('photo_upvotes').insert({ photo_id: photoId })
    : await supabase.from('photo_upvotes').delete().eq('photo_id', photoId)
  return !error
}

export async function isSpotSaved(spotId: string, userId: string): Promise<boolean> {
  const { data } = await supabase.from('spot_saves').select('spot_id').eq('spot_id', spotId).eq('user_id', userId).maybeSingle()
  return !!data
}

export async function setSpotSaved(spotId: string, on: boolean): Promise<boolean> {
  const { error } = on
    ? await supabase.from('spot_saves').insert({ spot_id: spotId })
    : await supabase.from('spot_saves').delete().eq('spot_id', spotId)
  return !error
}

export async function isFollowing(targetId: string, userId: string): Promise<boolean> {
  const { data } = await supabase.from('followers').select('following_id').eq('follower_id', userId).eq('following_id', targetId).maybeSingle()
  return !!data
}

export async function setFollowing(targetId: string, on: boolean): Promise<boolean> {
  const { error } = on
    ? await supabase.from('followers').insert({ following_id: targetId })
    : await supabase.from('followers').delete().eq('following_id', targetId)
  return !error
}
