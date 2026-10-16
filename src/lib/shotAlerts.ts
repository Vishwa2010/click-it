import * as Notifications from 'expo-notifications'
import * as Location from 'expo-location'
import * as SecureStore from 'expo-secure-store'
import { supabase } from './supabase'
import { getShotWindow } from './suncalc'
import { distanceMeters } from './geo'

// Golden-hour alerts: for saved spots within 20 km, a local notification 45 minutes
// before each golden hour over the next two days. Rescheduled on app open and when saves change.
const PREF_KEY = 'clickit.shotAlerts'
const RADIUS_M = 20000
const LEAD_MS = 45 * 60 * 1000
const DAYS = 2
const MAX_ALERTS = 40 // iOS keeps at most 64 pending local notifications per app

interface SavedSpot {
  id: string
  name: string
  latitude: number
  longitude: number
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
})

export async function shotAlertsEnabled(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(PREF_KEY)) === 'on'
  } catch {
    return false
  }
}

// Turning alerts on asks for notification permission; returns whether alerts are now on
export async function setShotAlerts(on: boolean, userId: string): Promise<boolean> {
  if (on) {
    const current = await Notifications.getPermissionsAsync()
    const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted
    if (!granted) return false
  }
  await SecureStore.setItemAsync(PREF_KEY, on ? 'on' : 'off')
  await rescheduleShotAlerts(userId)
  return on
}

export async function rescheduleShotAlerts(userId: string): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync()
    if (!(await shotAlertsEnabled())) return
    if (!(await Notifications.getPermissionsAsync()).granted) return
    // Only use location if it was already granted — never prompt from the background
    if (!(await Location.getForegroundPermissionsAsync()).granted) return

    const here =
      (await Location.getLastKnownPositionAsync()) ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }))
    const { data: saves } = await supabase.from('spot_saves').select('spot_id').eq('user_id', userId)
    const ids = (saves ?? []).map((r: { spot_id: string }) => r.spot_id)
    if (ids.length === 0) return
    const { data } = await supabase.from('spots_public').select('id, name, latitude, longitude').in('id', ids)
    const nearby = ((data ?? []) as SavedSpot[]).filter(
      (s) => distanceMeters(here.coords.latitude, here.coords.longitude, s.latitude, s.longitude) <= RADIUS_M
    )

    const now = Date.now()
    const alerts: { spot: SavedSpot; start: Date; fireAt: Date }[] = []
    for (const spot of nearby) {
      for (let d = 0; d < DAYS; d++) {
        const w = getShotWindow(spot.latitude, spot.longitude, new Date(now + d * 86400000))
        for (const start of [w.morningGoldenStart, w.eveningGoldenStart]) {
          const fireAt = new Date(start.getTime() - LEAD_MS)
          if (fireAt.getTime() > now + 60000) alerts.push({ spot, start, fireAt })
        }
      }
    }
    alerts.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime())

    for (const { spot, start, fireAt } of alerts.slice(0, MAX_ALERTS)) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Golden hour at ${spot.name} in 45 min`,
          body: `The light turns gold at ${start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}. Time to head out.`,
          data: { spotId: spot.id },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireAt },
      })
    }
  } catch {
    // Alerts are best-effort; a failure here must never break the app
  }
}

export function spotIdFromResponse(response: Notifications.NotificationResponse | null): string | null {
  const id = response?.notification.request.content.data?.spotId
  return typeof id === 'string' ? id : null
}
