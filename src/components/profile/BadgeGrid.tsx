import { View, Text, StyleSheet } from 'react-native'
import { Lock } from 'lucide-react-native'
import { BADGES } from '../../lib/badges'
import { User } from '../../types/user'
import { colors, fonts, radius, card } from '../../theme'

interface Props {
  user: User
  earned: Set<string>
}

// Earned badges are filled ink; locked ones show a lock and real progress toward unlocking
export default function BadgeGrid({ user, earned }: Props) {
  return (
    <View style={styles.grid}>
      {BADGES.map(({ id, name, description, Icon, progress }) => {
        const isEarned = earned.has(id)
        const p = isEarned ? null : progress(user)
        const pct = p ? p.current / p.target : 0
        return (
          <View
            key={id}
            style={[styles.tile, isEarned && styles.tileEarned]}
            accessibilityLabel={`${name}: ${description}. ${isEarned ? 'Earned' : p ? `${p.current} of ${p.target}` : 'Locked'}`}
          >
            <View style={[styles.icon, isEarned ? styles.iconEarned : styles.iconLocked]}>
              <Icon size={20} color={isEarned ? colors.onInk : colors.muted} strokeWidth={2.2} />
              {!isEarned && (
                <View style={styles.lock}>
                  <Lock size={10} color={colors.onInk} strokeWidth={3} />
                </View>
              )}
            </View>
            <Text style={[styles.name, !isEarned && styles.nameLocked]} numberOfLines={1}>{name}</Text>
            {isEarned ? (
              <Text style={styles.caption} numberOfLines={2}>{description}</Text>
            ) : p ? (
              <View style={styles.progressWrap}>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${Math.max(pct * 100, 4)}%` }]} />
                </View>
                <Text style={styles.caption}>{p.current}/{p.target}</Text>
              </View>
            ) : (
              <Text style={styles.caption} numberOfLines={2}>{description}</Text>
            )}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  tile: { ...card, width: '48.5%', padding: 12, gap: 6, borderRadius: radius.md },
  tileEarned: { borderColor: colors.ink, borderWidth: 1.5 },
  icon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  iconEarned: { backgroundColor: colors.ink },
  iconLocked: { backgroundColor: colors.sunk },
  lock: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.muted,
    borderWidth: 2,
    borderColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: { color: colors.ink, fontSize: 14, fontFamily: fonts.bold },
  nameLocked: { color: colors.ink2 },
  caption: { color: colors.muted, fontSize: 12, fontFamily: fonts.medium, lineHeight: 16 },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: { flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.sunk, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.ink, borderRadius: 3 },
})
