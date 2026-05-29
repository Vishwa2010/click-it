import { NavigatorScreenParams } from '@react-navigation/native'

export type AuthStackParamList = {
  Login: undefined
  SignUp: undefined
  Onboarding: undefined
}

export type TabParamList = {
  Map: undefined
  Explore: undefined
  Upload: undefined
  Challenges: undefined
  Profile: undefined
}

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>
  Spot: { spotId: string }
  Photographer: { userId: string }
  RouteBuilder: undefined
  ShotDuel: { duelId?: string }
  ARCompass: undefined
}
