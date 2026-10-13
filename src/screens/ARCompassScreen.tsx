import { ScanLine } from 'lucide-react-native'
import { StackScreenProps } from '@react-navigation/stack'
import ComingSoon from '../components/ui/ComingSoon'
import { RootStackParamList } from '../navigation/types'

type Props = StackScreenProps<RootStackParamList, 'ARCompass'>

export default function ARCompassScreen({ navigation }: Props) {
  return (
    <ComingSoon
      onBack={() => navigation.goBack()}
      Icon={ScanLine}
      eyebrow="AR COMPASS"
      title="Point & find."
      body="Hold up your camera and see nearby spots pinned in the real world around you."
    />
  )
}
