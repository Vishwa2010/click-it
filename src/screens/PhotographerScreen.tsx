import { Camera } from 'lucide-react-native'
import { StackScreenProps } from '@react-navigation/stack'
import ComingSoon from '../components/ui/ComingSoon'
import { RootStackParamList } from '../navigation/types'

type Props = StackScreenProps<RootStackParamList, 'Photographer'>

export default function PhotographerScreen({ navigation }: Props) {
  return (
    <ComingSoon
      onBack={() => navigation.goBack()}
      Icon={Camera}
      eyebrow="PHOTOGRAPHER"
      title="Their spots."
      body="Every spot this photographer founded, their best shots, badges and Explorer rank."
    />
  )
}
