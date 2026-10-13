import { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Flag, Globe2, Building, Image as ImageIcon, LogOut, Trophy } from 'lucide-react-native'
import { useUserStore } from '../store/useUserStore'
import { supabase } from '../lib/supabase'
import { getProgressToNextRank, getXPToNextRank } from '../lib/xp'
import { colors, fonts, radius, type, card, explorerRankColors } from '../theme'
import Button from '../components/ui/Button'

const RANK_NAMES = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', elite: 'Elite', legend: 'Legend' } as const

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const user = useUserStore((s) => s.user)
  const [signingOut, setSigningOut] = useState(false)

  // Signing out is explicit and confirmed (CLAUDE.md: never act without confirmation)
  function confirmSignOut() {
    Alert.alert('Sign out?', 'You can log back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true)
          await supabase.auth.signOut()
          setSigningOut(false)
        },
      },
    ])
  }

  if (!user) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Text style={type.body}>Your profile couldn’t be loaded.</Text>
        <Button label="Sign out" variant="secondary" onPress={confirmSignOut} loading={signingOut} />
      </View>
    )
  }

  const rankColor = explorerRankColors[user.explorer_rank]
  const progress = getProgressToNextRank(user.xp)
  const toNext = getXPToNextRank(user.xp)
  const stats = [
    { Icon: Flag, value: user.spots_founded, label: 'Spots' },
    { Icon: Globe2, value: user.countries_visited, label: 'Countries' },
    { Icon: Building, value: user.cities_visited, label: 'Cities' },
    { Icon: ImageIcon, value: user.photos_uploaded, label: 'Photos' },
  ]

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 40 }}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.username.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={[type.title, styles.handle]} numberOfLines={1} adjustsFontSizeToFit>
          @{user.username}
        </Text>
        <View style={[styles.rank, { borderColor: rankColor }]}>
          <Trophy size={14} color={rankColor} />
          <Text style={[styles.rankText, { color: rankColor }]}>{RANK_NAMES[user.explorer_rank]} Explorer</Text>
        </View>
      </View>

      <View style={[card, styles.xpCard]}>
        <View style={styles.xpRow}>
          <Text style={type.stat}>{user.xp.toLocaleString()}</Text>
          <Text style={type.small}>XP</Text>
        </View>
        <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}>
          <View style={[styles.fill, { width: `${Math.max(2, progress * 100)}%` }]} />
        </View>
        <Text style={type.caption}>
          {toNext > 0 ? `${toNext.toLocaleString()} XP to the next rank` : 'Top rank reached'}
        </Text>
      </View>

      <View style={styles.stats}>
        {stats.map(({ Icon, value, label }) => (
          <View key={label} style={[card, styles.stat]}>
            <Icon size={18} color={colors.ink2} />
            <Text style={styles.statValue}>{value}</Text>
            <Text style={type.caption}>{label}</Text>
          </View>
        ))}
      </View>

      <Text style={[type.body, styles.soon]}>Your badges, founded spots and photo grid are coming soon.</Text>

      <Button
        label="Sign out"
        variant="secondary"
        onPress={confirmSignOut}
        loading={signingOut}
        icon={<LogOut size={18} color={colors.ink} />}
        style={styles.signOut}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: 20 },
  center: { justifyContent: 'center', alignItems: 'center', gap: 16, paddingHorizontal: 24 },
  header: { alignItems: 'center' },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarText: { color: colors.onInk, fontSize: 36, fontFamily: fonts.extrabold },
  handle: { maxWidth: '100%' },
  rank: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  rankText: { fontSize: 13, fontFamily: fonts.bold },
  xpCard: { padding: 18, marginTop: 28, gap: 10 },
  xpRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.sunk, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.ink, borderRadius: 4 },
  stats: { flexDirection: 'row', gap: 8, marginTop: 12 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 4, borderRadius: radius.md },
  statValue: { color: colors.ink, fontSize: 22, fontFamily: fonts.extrabold },
  soon: { marginTop: 24, textAlign: 'center' },
  signOut: { marginTop: 24 },
})
