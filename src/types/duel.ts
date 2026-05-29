export type DuelStatus = 'pending' | 'active' | 'voting' | 'completed'

export interface Duel {
  id: string
  spot_id: string
  challenger_id: string
  opponent_id: string
  challenger_photo_url?: string
  opponent_photo_url?: string
  challenger_votes: number
  opponent_votes: number
  status: DuelStatus
  expires_at: string
  created_at: string
}
