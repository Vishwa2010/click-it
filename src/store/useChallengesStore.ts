import { create } from 'zustand'
import { Challenge } from '../types/challenge'

interface ChallengesStore {
  challenges: Challenge[]
  setChallenges: (challenges: Challenge[]) => void
}

export const useChallengesStore = create<ChallengesStore>((set) => ({
  challenges: [],
  setChallenges: (challenges) => set({ challenges }),
}))
