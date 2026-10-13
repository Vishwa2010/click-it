import { useState } from 'react'
import { View, Text, Image, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'
import MapboxGL from '@rnmapbox/maps'
import { Camera, Images, MapPin, Map as MapIcon } from 'lucide-react-native'
import Button from '../../components/ui/Button'
import { stripExifKeepGPS, ExifGPS } from '../../lib/exif'
import { isMapboxConfigured } from '../../lib/maps'
import { UploadDraft, COLORS } from './types'
import { colors, fonts } from '../../theme'

interface Props {
  draft: UploadDraft
  onChange: (patch: Partial<UploadDraft>) => void
}

const DEFAULT_CENTER: [number, number] = [-74.006, 40.7128]

function formatCoords(c: ExifGPS): string {
  return `${c.latitude.toFixed(5)}, ${c.longitude.toFixed(5)}`
}

export default function PhotoStep({ draft, onChange }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)

  async function pick(source: 'camera' | 'library') {
    setError(null)
    // Always ask before opening the camera or photo library
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      setError(
        source === 'camera'
          ? 'Camera access is off. Enable it in Settings to take a photo.'
          : 'Photo access is off. Enable it in Settings to choose a photo.'
      )
      return
    }

    setBusy(true)
    try {
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: 'images', exif: true, quality: 1 }
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options)
      if (result.canceled || result.assets.length === 0) return

      const asset = result.assets[0]
      const { gps, takenAt } = stripExifKeepGPS(asset.exif as Record<string, unknown> | null | undefined)
      onChange({
        photo: { uri: asset.uri, width: asset.width, height: asset.height },
        takenAt,
        coords: gps,
        coordsSource: gps ? 'exif' : null,
        existingSpot: null,
      })
    } catch {
      setError('Could not open the photo. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function useCurrentLocation() {
    setError(null)
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== Location.PermissionStatus.GRANTED) {
      setError('Location access is off. Tap the map to drop the pin instead.')
      return
    }
    setLocating(true)
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      onChange({ coords: { latitude: pos.coords.latitude, longitude: pos.coords.longitude }, coordsSource: 'manual' })
    } catch {
      setError('Unable to get your location. Tap the map to drop the pin instead.')
    } finally {
      setLocating(false)
    }
  }

  if (!draft.photo) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <Camera size={32} color={COLORS.onPrimary} />
        </View>
        <Text style={styles.title}>Pin a new shot</Text>
        <Text style={styles.subtitle}>Take a photo or choose one from your library. We’ll read its location to place the pin.</Text>
        <Button label="Take photo" onPress={() => pick('camera')} disabled={busy} icon={<Camera size={18} color={COLORS.onPrimary} />} style={styles.fullWidth} />
        <Button label="Choose from library" variant="secondary" onPress={() => pick('library')} disabled={busy} icon={<Images size={18} color={COLORS.text} />} style={styles.fullWidth} />
        {busy && <ActivityIndicator color={COLORS.primary} style={styles.spinner} />}
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    )
  }

  const pin = draft.coords
  return (
    <View style={styles.gap}>
      <Image source={{ uri: draft.photo.uri }} style={styles.preview} resizeMode="cover" />
      <Pressable onPress={() => pick('library')} disabled={busy}>
        <Text style={styles.link}>Choose a different photo</Text>
      </Pressable>

      {draft.coordsSource === 'exif' && pin ? (
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <MapPin size={16} color={COLORS.text} />
            <Text style={styles.cardTitle}>Location detected</Text>
          </View>
          <Text style={styles.coords}>{formatCoords(pin)}</Text>
          <Text style={styles.cardHint}>Read from the photo. Tap the map to adjust the pin.</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <MapPin size={16} color={COLORS.text} />
            <Text style={styles.cardTitle}>{pin ? 'Pin dropped' : 'No location in this photo'}</Text>
          </View>
          {pin ? (
            <Text style={styles.coords}>{formatCoords(pin)}</Text>
          ) : (
            <Text style={styles.cardHint}>Tap the map where you took the shot, or use your current location.</Text>
          )}
          <Pressable onPress={useCurrentLocation} disabled={locating}>
            <Text style={styles.link}>{locating ? 'Locating…' : 'Use my current location'}</Text>
          </Pressable>
        </View>
      )}

      {!isMapboxConfigured ? (
        <View style={[styles.mapWrap, styles.mapPlaceholder]}>
          <MapIcon size={22} color={COLORS.textSecondary} />
          <Text style={styles.cardTitle}>Map unavailable</Text>
          <Text style={styles.cardHint}>Add a Mapbox token to adjust the pin on a map.</Text>
        </View>
      ) : (
        <View style={styles.mapWrap}>
          <MapboxGL.MapView
            style={StyleSheet.absoluteFill}
            styleURL={MapboxGL.StyleURL.Light}
            logoEnabled={false}
            attributionEnabled={false}
            scaleBarEnabled={false}
            onPress={(feature) => {
              const geometry = feature.geometry
              if (geometry.type === 'Point') {
                const [longitude, latitude] = geometry.coordinates
                onChange({ coords: { latitude, longitude }, coordsSource: 'manual' })
              }
            }}
          >
            <MapboxGL.Camera
              zoomLevel={pin ? 15 : 10}
              centerCoordinate={pin ? [pin.longitude, pin.latitude] : DEFAULT_CENTER}
              animationMode="flyTo"
              animationDuration={600}
            />
            {pin && (
              <MapboxGL.PointAnnotation id="upload-pin" coordinate={[pin.longitude, pin.latitude]}>
                <View style={styles.pinDot} />
              </MapboxGL.PointAnnotation>
            )}
          </MapboxGL.MapView>
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  fullWidth: { alignSelf: 'stretch' },
  empty: { alignItems: 'center', paddingTop: 48, gap: 12 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { color: COLORS.text, fontSize: 24, fontFamily: fonts.bold },
  subtitle: { color: COLORS.textSecondary, fontFamily: fonts.regular, fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 12 },
  spinner: { marginTop: 8 },
  gap: { gap: 12 },
  preview: { width: '100%', aspectRatio: 4 / 3, borderRadius: 16, backgroundColor: COLORS.card },
  link: { color: COLORS.primary, fontSize: 14, fontFamily: fonts.semibold },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    gap: 6,
  },
  cardTitle: { color: COLORS.text, fontSize: 14, fontFamily: fonts.semibold },
  coords: { color: COLORS.text, fontFamily: fonts.regular, fontSize: 14, fontVariant: ['tabular-nums'] },
  cardHint: { color: COLORS.textSecondary, fontFamily: fonts.regular, fontSize: 12 },
  mapWrap: { height: 220, borderRadius: 16, overflow: 'hidden', backgroundColor: COLORS.surface },
  mapPlaceholder: { justifyContent: 'center', alignItems: 'center', gap: 6, padding: 16 },
  pinDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.card,
  },
  error: { color: colors.error, fontFamily: fonts.regular, fontSize: 14, textAlign: 'center' },
})
