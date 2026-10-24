import * as Notifications from 'expo-notifications'
import { supabase } from './supabase'
import { setShotAlerts } from './shotAlerts'

// Permanently deletes the signed-in account on the server (see delete_my_account in
// supabase/migrations), then clears what this device kept for it and signs out.
export async function deleteMyAccount(userId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_my_account')
  if (error) {
    throw new Error(
      error.code === 'PGRST202'
        ? 'Account deletion isn’t set up on the server yet. Email clickit.app01@gmail.com and we’ll delete it for you.'
        : 'Couldn’t delete your account. Check your connection and try again.'
    )
  }
  await setShotAlerts(false, userId).catch(() => {})
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {})
  // The account no longer exists, so only clear the session stored on this device
  await supabase.auth.signOut({ scope: 'local' })
}
