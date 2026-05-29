import 'react-native-gesture-handler'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import MapboxGL from '@rnmapbox/maps'
import Constants from 'expo-constants'
import RootNavigator from './src/navigation/RootNavigator'

MapboxGL.setAccessToken(
  (Constants.expoConfig?.extra?.mapboxAccessToken as string | undefined) ?? ''
)

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
