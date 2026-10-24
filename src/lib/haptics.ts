import * as Haptics from 'expo-haptics'

// Small, consistent tactile feedback. Failures are ignored (simulators / devices without a Taptic Engine).
const safe = (p: Promise<void>) => {
  p.catch(() => undefined)
}

export const haptics = {
  tap: () => safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  select: () => safe(Haptics.selectionAsync()),
  success: () => safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
}
