import { Compass } from 'lucide-react-native'
import ComingSoon from '../components/ui/ComingSoon'

export default function ExploreScreen() {
  return (
    <ComingSoon
      Icon={Compass}
      eyebrow="DISCOVER"
      title="Explore."
      body="Spots with perfect light right now, look-alike Spot Twins around the world, and what’s trending this week."
    />
  )
}
