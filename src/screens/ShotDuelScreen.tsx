import { Swords } from 'lucide-react-native'
import { StackScreenProps } from '@react-navigation/stack'
import ComingSoon from '../components/ui/ComingSoon'
import { RootStackParamList } from '../navigation/types'

type Props = StackScreenProps<RootStackParamList, 'ShotDuel'>

export default function ShotDuelScreen({ navigation }: Props) {
  return (
    <ComingSoon
      onBack={() => navigation.goBack()}
      Icon={Swords}
      eyebrow="HEAD TO HEAD"
      title="Shot Duels."
      body="Challenge another photographer at the same spot. The community votes on the better shot."
    />
  )
}
