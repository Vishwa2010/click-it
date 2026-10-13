import { ExpoConfig, ConfigContext } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'ClickIt',
  slug: 'clickit',
  scheme: 'clickit',
  owner: 'hehe12345',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.clickit.app',
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#F5F0E8',
      foregroundImage: './assets/adaptive-icon.png',
    },
    package: 'com.clickit.app',
  },
  extra: {
    eas: { projectId: 'dc415d38-2a40-46f9-afbd-05563bab2046' },
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    mapboxAccessToken: process.env.MAPBOX_ACCESS_TOKEN,
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
    cloudinaryUploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET,
    openweatherApiKey: process.env.OPENWEATHER_API_KEY,
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
  },
  plugins: [
    'expo-secure-store',
    'expo-location',
    ['@rnmapbox/maps', { RNMapboxMapsAccessToken: process.env.MAPBOX_ACCESS_TOKEN ?? '' }],
    ['expo-build-properties', { ios: { deploymentTarget: '16.4' } }],
    [
      'expo-image-picker',
      {
        photosPermission: 'ClickIt needs your photos so you can pin where a shot was taken.',
        cameraPermission: 'ClickIt uses the camera so you can capture a shot and pin its spot.',
        microphonePermission: false,
      },
    ],
    './plugins/withIos27Fixes',
  ],
})
