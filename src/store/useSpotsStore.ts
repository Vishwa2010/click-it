import { create } from 'zustand'
import { Spot } from '../types/spot'

interface SpotsStore {
  spots: Spot[]
  setSpots: (spots: Spot[]) => void
  addSpot: (spot: Spot) => void
}

export const useSpotsStore = create<SpotsStore>((set) => ({
  spots: [],
  setSpots: (spots) => set({ spots }),
  addSpot: (spot) => set((state) => ({ spots: [...state.spots, spot] })),
}))
