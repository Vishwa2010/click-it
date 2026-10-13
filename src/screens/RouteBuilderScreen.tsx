import { Route } from 'lucide-react-native'
import { StackScreenProps } from '@react-navigation/stack'
import ComingSoon from '../components/ui/ComingSoon'
import { RootStackParamList } from '../navigation/types'

type Props = StackScreenProps<RootStackParamList, 'RouteBuilder'>

export default function RouteBuilderScreen({ navigation }: Props) {
  return (
    <ComingSoon
      onBack={() => navigation.goBack()}
      Icon={Route}
      eyebrow="PLAN"
      title="Photo walks."
      body="Build an optimised route through nearby spots, timed to hit each one in its best light."
    />
  )
}
