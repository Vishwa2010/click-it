import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error'

export function usernameRules(name: string) {
  return {
    length: name.length >= 3 && name.length <= 30,
    chars: name.length > 0 && /^[a-zA-Z0-9_]+$/.test(name),
  }
}

// Live "is this handle free?" check, debounced while typing. Your own current name counts as available.
export function useUsernameAvailability(username: string): { status: UsernameStatus; markTaken: () => void } {
  const [status, setStatus] = useState<UsernameStatus>('idle')

  useEffect(() => {
    const rules = usernameRules(username)
    if (!rules.length || !rules.chars) {
      setStatus('idle')
      return
    }
    setStatus('checking')
    let cancelled = false
    const timer = setTimeout(async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      const { data, error } = await supabase.from('users').select('id').eq('username', username).maybeSingle()
      if (cancelled) return
      if (error) setStatus('error')
      else setStatus(data && data.id !== authUser?.id ? 'taken' : 'available')
    }, 450)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [username])

  // For when the save itself reports the name was taken in the meantime
  const markTaken = useCallback(() => setStatus('taken'), [])

  return { status, markTaken }
}
