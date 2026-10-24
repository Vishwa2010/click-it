import { useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native'
import * as Notifications from 'expo-notifications'
import { createStackNavigator } from '@react-navigation/stack'
import { RootStackParamList } from './types'
import TabNavigator from './TabNavigator'
import AuthNavigator from './AuthNavigator'
import SpotScreen from '../screens/SpotScreen'
import PhotographerScreen from '../screens/PhotographerScreen'
import RouteBuilderScreen from '../screens/RouteBuilderScreen'
import ShotDuelScreen from '../screens/ShotDuelScreen'
import ARCompassScreen from '../screens/ARCompassScreen'
import EditProfileScreen from '../screens/EditProfileScreen'
import { supabase } from '../lib/supabase'
import { rescheduleShotAlerts, spotIdFromResponse } from '../lib/shotAlerts'
import { useUserStore } from '../store/useUserStore'
import { User } from '../types/user'
import { colors } from '../theme'

const Stack = createStackNavigator<RootStackParamList & { Auth: undefined }>()
const navRef = createNavigationContainerRef<RootStackParamList>()
// The tap that launched the app can arrive both as the "last response" and through the listener
const handledAlerts = new Set<string>()
function openAlert(response: Notifications.NotificationResponse | null) {
  const spotId = spotIdFromResponse(response)
  const key = response?.notification.request.identifier
  if (!spotId || !key || handledAlerts.has(key) || !navRef.isReady()) return
  handledAlerts.add(key)
  navRef.navigate('Spot', { spotId })
}

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
  const userId = useUserStore((s) => s.user?.id)

  // Refresh golden-hour alerts each time a signed-in session starts
  useEffect(() => {
    if (authStatus === 'authenticated' && userId) rescheduleShotAlerts(userId)
  }, [authStatus, userId])

  // Tapping a golden-hour alert opens that spot
  useEffect(() => {
    if (authStatus !== 'authenticated') return
    const sub = Notifications.addNotificationResponseReceivedListener(openAlert)
    return () => sub.remove()
  }, [authStatus])

  async function openLaunchNotification() {
    openAlert(await Notifications.getLastNotificationResponseAsync())
  }

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
    // Supabase holds an auth lock while this callback runs, so calling the database directly
    // inside it can deadlock — defer the profile lookup until the callback has returned
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        reset()
        return
      }
      setSession(session)
      setTimeout(async () => {
        const profile = await loadProfile(session.user.id)
        if (!profile || !profile.username) {
          setAuthStatus('onboarding')
        } else {
          setUser(profile)
          setAuthStatus('authenticated')
        }
      }, 0)
    })

    return () => subscription.unsubscribe()
  }, [setSession, setUser, setAuthStatus, reset])

  if (authStatus === 'loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.ink} />
      </View>
    )
  }

  // Each status gets its own keyed NavigationContainer: a navigator only reads its initial
  // route on mount, so without a fresh tree, login → onboarding would stay on the Login screen
  if (authStatus === 'unauthenticated') {
    return (
      <NavigationContainer key="auth">
        <AuthNavigator />
      </NavigationContainer>
    )
  }

  if (authStatus === 'onboarding') {
    return (
      <NavigationContainer key="onboarding">
        <AuthNavigator initialRoute="Onboarding" />
      </NavigationContainer>
    )
  }

  return (
    <NavigationContainer key="app" ref={navRef} onReady={openLaunchNotification}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: colors.paper },
        }}
      >
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen name="Spot" component={SpotScreen} />
        <Stack.Screen name="Photographer" component={PhotographerScreen} />
        <Stack.Screen name="RouteBuilder" component={RouteBuilderScreen} />
        <Stack.Screen name="ShotDuel" component={ShotDuelScreen} />
        <Stack.Screen name="ARCompass" component={ARCompassScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.paper, justifyContent: 'center', alignItems: 'center' },
})
