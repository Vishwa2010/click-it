export type ChallengeStatus = 'active' | 'completed' | 'expired'

export interface Challenge {
  id: string
  title: string
  description: string
  xp_reward: number
  badge_id: string
  start_date: string
  end_date: string
  requirement_type: string
  requirement_count: number
  user_progress?: number
  status?: ChallengeStatus
}
