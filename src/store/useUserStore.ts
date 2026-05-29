import { create } from 'zustand'
import { Session } from '@supabase/supabase-js'
import { User } from '../types/user'

type AuthStatus = 'loading' | 'unauthenticated' | 'onboarding' | 'authenticated'

interface UserStore {
  session: Session | null
  user: User | null
  authStatus: AuthStatus
  setSession: (session: Session | null) => void
  setUser: (user: User | null) => void
  setAuthStatus: (status: AuthStatus) => void
  reset: () => void
}

export const useUserStore = create<UserStore>((set) => ({
  session: null,
  user: null,
  authStatus: 'loading',
  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setAuthStatus: (authStatus) => set({ authStatus }),
  reset: () => set({ session: null, user: null, authStatus: 'unauthenticated' }),
}))
