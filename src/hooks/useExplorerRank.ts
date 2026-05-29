import { useMemo } from 'react'
import { ExplorerRank } from '../types/user'
import { getRankFromXP, getXPToNextRank, getProgressToNextRank } from '../lib/xp'

interface ExplorerRankInfo {
  rank: ExplorerRank
  xpToNext: number
  progress: number
}

export function useExplorerRank(xp: number): ExplorerRankInfo {
  return useMemo(() => ({
    rank: getRankFromXP(xp),
    xpToNext: getXPToNextRank(xp),
    progress: getProgressToNextRank(xp),
  }), [xp])
}
