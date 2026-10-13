import { Trophy } from 'lucide-react-native'
import ComingSoon from '../components/ui/ComingSoon'

export default function ChallengesScreen() {
  return (
    <ComingSoon
      Icon={Trophy}
      eyebrow="COMPETE"
      title="Challenges."
      body="Weekly missions, progress bars and a monthly leaderboard. Finish them to earn XP and badges."
    />
  )
}
