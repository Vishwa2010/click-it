import { createStackNavigator } from '@react-navigation/stack'
import { AuthStackParamList } from './types'
import LoginScreen from '../screens/auth/LoginScreen'
import SignUpScreen from '../screens/auth/SignUpScreen'
import OnboardingScreen from '../screens/auth/OnboardingScreen'

const Stack = createStackNavigator<AuthStackParamList>()

interface Props {
  initialRoute?: keyof AuthStackParamList
}

export default function AuthNavigator({ initialRoute = 'Login' }: Props) {
  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#1A1A2E' },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    </Stack.Navigator>
  )
}
