import { useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { supabase } from '../lib/supabase'
import { useUserStore } from '../store/useUserStore'
import { Spot, SpotPhoto } from '../types/spot'
import { User } from '../types/user'

interface ProfileData {
  founded: Spot[]
  photos: SpotPhoto[]
  earnedBadgeIds: Set<string>
  loading: boolean
  error: string | null
}

const EMPTY: ProfileData = { founded: [], photos: [], earnedBadgeIds: new Set(), loading: true, error: null }

// Loads everything the Profile screen shows, and refreshes each time the tab comes into focus
export function useProfileData(userId: string | undefined): ProfileData & { reload: () => Promise<void> } {
  const setUser = useUserStore((s) => s.setUser)
  const [state, setState] = useState<ProfileData>(EMPTY)

  const load = useCallback(async () => {
    if (!userId) return
    setState((s) => ({ ...s, loading: true, error: null }))
    const [profile, founded, photos, badges] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).maybeSingle(),
      supabase.from('spots_public').select('*').eq('founder_id', userId).order('created_at', { ascending: false }),
      supabase.from('spot_photos').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(60),
      supabase.from('user_badges').select('badge_id').eq('user_id', userId),
    ])
    const error = profile.error ?? founded.error ?? photos.error ?? badges.error
    if (error) {
      setState((s) => ({ ...s, loading: false, error: 'Couldn’t load your profile. Pull down to try again.' }))
      return
    }
    // Keep XP, rank and counters fresh (they change server-side)
    if (profile.data) setUser(profile.data as User)
    setState({
      founded: (founded.data ?? []) as Spot[],
      photos: (photos.data ?? []) as SpotPhoto[],
      earnedBadgeIds: new Set((badges.data ?? []).map((b: { badge_id: string }) => b.badge_id)),
      loading: false,
      error: null,
    })
  }, [userId, setUser])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  return { ...state, reload: load }
}
