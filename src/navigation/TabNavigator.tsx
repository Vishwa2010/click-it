import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text } from 'react-native'
import { TabParamList } from './types'
import MapScreen from '../screens/MapScreen'
import ExploreScreen from '../screens/ExploreScreen'
import UploadScreen from '../screens/UploadScreen'
import ChallengesScreen from '../screens/ChallengesScreen'
import ProfileScreen from '../screens/ProfileScreen'

const Tab = createBottomTabNavigator<TabParamList>()

const COLORS = {
  primary: '#FF6B35',
  background: '#1A1A2E',
  surface: '#16213E',
  textSecondary: '#A8B2C1',
}

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Map: '🗺',
    Explore: '🔭',
    Upload: '📷',
    Challenges: '🏆',
    Profile: '👤',
  }
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
      {icons[label] ?? '●'}
    </Text>
  )
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: 'rgba(255,255,255,0.08)',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: { fontSize: 11, marginBottom: 4 },
        tabBarIcon: ({ focused }) => (
          <TabIcon label={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Upload" component={UploadScreen} />
      <Tab.Screen name="Challenges" component={ChallengesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}
