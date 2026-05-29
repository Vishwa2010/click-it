import { ExplorerRank } from '../types/user'

export const XP_REWARDS = {
  PIN_NEW_SPOT: 100,
  ADD_TO_EXISTING_SPOT: 20,
  PHOTO_UPVOTED: 10,
  SPOT_NAVIGATED_TO: 50,
  CHALLENGE_COMPLETED_SMALL: 200,
  CHALLENGE_COMPLETED_LARGE: 500,
  DUEL_WON: 150,
  NEW_COUNTRY: 300,
  NEW_CITY: 100,
  LOCAL_EXPERT_EARNED: 400,
} as const

export const RANK_THRESHOLDS: Record<ExplorerRank, number> = {
  bronze: 0,
  silver: 1000,
  gold: 5000,
  elite: 15000,
  legend: 40000,
}

export function getRankFromXP(xp: number): ExplorerRank {
  if (xp >= 40000) return 'legend'
  if (xp >= 15000) return 'elite'
  if (xp >= 5000) return 'gold'
  if (xp >= 1000) return 'silver'
  return 'bronze'
}

export function getXPToNextRank(xp: number): number {
  const thresholds = [1000, 5000, 15000, 40000]
  const next = thresholds.find(t => t > xp)
  return next ? next - xp : 0
}

export function getProgressToNextRank(xp: number): number {
  const rank = getRankFromXP(xp)
  const current = RANK_THRESHOLDS[rank]
  const thresholds = [1000, 5000, 15000, 40000]
  const next = thresholds.find(t => t > xp)
  if (!next) return 1
  return (xp - current) / (next - current)
}
