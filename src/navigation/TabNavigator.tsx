import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Map, Compass, PlusSquare, Trophy, User, LucideIcon } from 'lucide-react-native'
import { TabParamList } from './types'
import MapScreen from '../screens/MapScreen'
import ExploreScreen from '../screens/ExploreScreen'
import UploadScreen from '../screens/UploadScreen'
import ChallengesScreen from '../screens/ChallengesScreen'
import ProfileScreen from '../screens/ProfileScreen'
import { colors, fonts } from '../theme'

const Tab = createBottomTabNavigator<TabParamList>()

const ICONS: Record<keyof TabParamList, LucideIcon> = {
  Map,
  Explore: Compass,
  Upload: PlusSquare,
  Challenges: Trophy,
  Profile: User,
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopColor: colors.line,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontFamily: fonts.semibold, marginBottom: 2 },
        tabBarIcon: ({ color, focused }) => {
          const Icon = ICONS[route.name]
          return <Icon size={23} color={color} strokeWidth={focused ? 2.4 : 1.8} />
        },
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
