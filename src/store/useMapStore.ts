import { create } from 'zustand'

interface MapStore {
  selectedSpotId: string | null
  setSelectedSpotId: (id: string | null) => void
  activeFilter: string
  setActiveFilter: (filter: string) => void
}

export const useMapStore = create<MapStore>((set) => ({
  selectedSpotId: null,
  setSelectedSpotId: (id) => set({ selectedSpotId: id }),
  activeFilter: 'All',
  setActiveFilter: (filter) => set({ activeFilter: filter }),
}))
