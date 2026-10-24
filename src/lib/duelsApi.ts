import { supabase } from './supabase'
import { Duel } from '../types/duel'

export const DUEL_HOURS = 72 // voting window from when the duel is created

export interface DuelDetail {
  duel: Duel
  spotName: string
  usernames: Record<string, string>
  myVote: 'challenger' | 'opponent' | null
}

export async function fetchDuel(duelId: string, userId: string | undefined): Promise<DuelDetail | null> {
  const { data, error } = await supabase.from('duels').select('*').eq('id', duelId).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  const duel = data as Duel
  const [spot, users, vote] = await Promise.all([
    supabase.from('spots_public').select('name').eq('id', duel.spot_id).maybeSingle(),
    supabase.from('users').select('id, username').in('id', [duel.challenger_id, duel.opponent_id]),
    userId
      ? supabase.from('duel_votes').select('voted_for').eq('duel_id', duelId).eq('voter_id', userId).maybeSingle()
      : Promise.resolve({ data: null }),
  ])
  return {
    duel,
    spotName: (spot.data as { name: string } | null)?.name ?? 'this spot',
    usernames: Object.fromEntries(((users.data ?? []) as { id: string; username: string }[]).map((u) => [u.id, u.username])),
    myVote: ((vote.data as { voted_for: 'challenger' | 'opponent' } | null)?.voted_for) ?? null,
  }
}

export async function createDuel(spotId: string, opponentId: string, photoUrl: string): Promise<string> {
  const expires = new Date(Date.now() + DUEL_HOURS * 3600 * 1000).toISOString()
  const { data, error } = await supabase
    .from('duels')
    .insert({ spot_id: spotId, opponent_id: opponentId, challenger_photo_url: photoUrl, expires_at: expires })
    .select('id')
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Couldn’t start the duel.')
  return (data as { id: string }).id
}

export async function answerDuel(duelId: string, photoUrl: string | null): Promise<void> {
  const patch = photoUrl ? { status: 'voting', opponent_photo_url: photoUrl } : { status: 'completed' }
  const { error } = await supabase.from('duels').update(patch).eq('id', duelId)
  if (error) throw new Error(error.message)
}

export async function voteDuel(duelId: string, side: 'challenger' | 'opponent'): Promise<void> {
  const { error } = await supabase.from('duel_votes').insert({ duel_id: duelId, voted_for: side })
  if (error) throw new Error(error.code === '23505' ? 'You’ve already voted in this duel.' : error.message)
}

// Safe for anyone to call; the database only settles once, after the deadline
export async function settleDuel(duelId: string): Promise<void> {
  await supabase.rpc('settle_duel', { p_duel: duelId })
}

const isOver = (d: Duel) => new Date(d.expires_at).getTime() <= Date.now()

async function openDuels(userId: string, spotId?: string): Promise<Duel[]> {
  let q = supabase
    .from('duels')
    .select('*')
    .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
    .in('status', ['pending', 'voting'])
  if (spotId) q = q.eq('spot_id', spotId)
  const { data } = await q.order('created_at', { ascending: false })
  return (data ?? []) as Duel[]
}

// Your open duels; any past their deadline are settled first so they don't linger as "live"
export async function fetchMyDuels(userId: string): Promise<Duel[]> {
  const duels = await openDuels(userId)
  const stale = duels.filter(isOver)
  if (stale.length === 0) return duels
  await Promise.all(stale.map((d) => settleDuel(d.id)))
  return openDuels(userId)
}

// People you already have an open duel with at this spot (so you can't challenge them twice)
export async function fetchBusyRivals(userId: string, spotId: string): Promise<Set<string>> {
  const duels = (await openDuels(userId, spotId)).filter((d) => !isOver(d))
  return new Set(duels.map((d) => (d.challenger_id === userId ? d.opponent_id : d.challenger_id)))
}
