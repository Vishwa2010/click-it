import { useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { RootStackParamList } from './types'
import TabNavigator from './TabNavigator'
import AuthNavigator from './AuthNavigator'
import SpotScreen from '../screens/SpotScreen'
import PhotographerScreen from '../screens/PhotographerScreen'
import RouteBuilderScreen from '../screens/RouteBuilderScreen'
import ShotDuelScreen from '../screens/ShotDuelScreen'
import ARCompassScreen from '../screens/ARCompassScreen'
import { supabase } from '../lib/supabase'
import { useUserStore } from '../store/useUserStore'
import { User } from '../types/user'

const Stack = createStackNavigator<RootStackParamList & { Auth: undefined }>()

async function loadProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) return null
  return data as User
}

export default function RootNavigator() {
  const { authStatus, setSession, setUser, setAuthStatus, reset } = useUserStore()

  useEffect(() => {
    // Resolve initial session
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        if (!session) {
          setAuthStatus('unauthenticated')
          return
        }
        setSession(session)
        const profile = await loadProfile(session.user.id)
        if (!profile || !profile.username) {
          setAuthStatus('onboarding')
        } else {
          setUser(profile)
          setAuthStatus('authenticated')
        }
      })
      .catch(() => {
        setAuthStatus('unauthenticated')
      })

    // Listen for subsequent auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          reset()
          return
        }
        setSession(session)
        const profile = await loadProfile(session.user.id)
        if (!profile || !profile.username) {
          setAuthStatus('onboarding')
        } else {
          setUser(profile)
          setAuthStatus('authenticated')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [setSession, setUser, setAuthStatus, reset])

  if (authStatus === 'loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    )
  }

  if (authStatus === 'unauthenticated') {
    return (
      <NavigationContainer>
        <AuthNavigator />
      </NavigationContainer>
    )
  }

  if (authStatus === 'onboarding') {
    return (
      <NavigationContainer>
        <AuthNavigator initialRoute="Onboarding" />
      </NavigationContainer>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#1A1A2E' },
        }}
      >
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen name="Spot" component={SpotScreen} />
        <Stack.Screen name="Photographer" component={PhotographerScreen} />
        <Stack.Screen name="RouteBuilder" component={RouteBuilderScreen} />
        <Stack.Screen name="ShotDuel" component={ShotDuelScreen} />
        <Stack.Screen name="ARCompass" component={ARCompassScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#1A1A2E', justifyContent: 'center', alignItems: 'center' },
})
