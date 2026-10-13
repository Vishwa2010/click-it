import { Linking, Platform } from 'react-native'
import Constants from 'expo-constants'

export const isMapboxConfigured = Boolean(Constants.expoConfig?.extra?.mapboxAccessToken)

// Opens the native maps app with directions to the exact coordinates
export function openDirections(latitude: number, longitude: number): void {
  const url =
    Platform.OS === 'ios'
      ? `maps://app?daddr=${latitude},${longitude}`
      : `geo:${latitude},${longitude}?q=${latitude},${longitude}`
  Linking.openURL(url)
}
