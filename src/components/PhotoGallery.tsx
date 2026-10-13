import { useMemo, useState } from 'react'
import { View, Text, Image, Pressable, StyleSheet, ScrollView } from 'react-native'
import { ArrowBigUp, ImageOff, Sunrise } from 'lucide-react-native'
import { colors, fonts, radius, type, card, hitSlop } from '../theme'
import { SpotPhoto } from '../types/spot'
import { ShotWindow } from '../lib/suncalc'

export type GalleryTab = 'Top' | 'Recent' | 'Morning' | 'Golden Hour' | 'Night'

const TABS: GalleryTab[] = ['Top', 'Recent', 'Morning', 'Golden Hour', 'Night']

interface Props {
  photos: SpotPhoto[]
  usernames: Record<string, string>
  shotWindow: ShotWindow
  onPressPhotographer?: (userId: string) => void
}

// Minutes since midnight, read from the local time in the ISO string (where the photo was taken)
function minuteOfDay(iso: string): number {
  const match = /T(\d{2}):(\d{2})/.exec(iso)
  return match ? Number(match[1]) * 60 + Number(match[2]) : -1
}

function dateMinutes(d: Date): number {
  return d.getHours() * 60 + d.getMinutes()
}

function filterPhotos(photos: SpotPhoto[], tab: GalleryTab, w: ShotWindow): SpotPhoto[] {
  switch (tab) {
    case 'Top':
      return [...photos].sort((a, b) => b.upvotes - a.upvotes)
    case 'Recent':
      return [...photos].sort((a, b) => b.created_at.localeCompare(a.created_at))
    case 'Morning':
      return photos.filter((p) => {
        const m = minuteOfDay(p.taken_at)
        return m >= 4 * 60 && m < 11 * 60
      })
    case 'Golden Hour':
      return photos.filter((p) => {
        const m = minuteOfDay(p.taken_at)
        return (
          (m >= dateMinutes(w.morningGoldenStart) - 30 && m <= dateMinutes(w.morningGoldenEnd)) ||
          (m >= dateMinutes(w.eveningGoldenStart) && m <= dateMinutes(w.eveningGoldenEnd) + 30)
        )
      })
    case 'Night':
      return photos.filter((p) => {
        const m = minuteOfDay(p.taken_at)
        return m >= dateMinutes(w.blueHourEnd) || (m >= 0 && m < 5 * 60)
      })
  }
}

export default function PhotoGallery({ photos, usernames, shotWindow, onPressPhotographer }: Props) {
  const [tab, setTab] = useState<GalleryTab>('Top')
  const visible = useMemo(() => filterPhotos(photos, tab, shotWindow), [photos, tab, shotWindow])

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {TABS.map((t) => (
          <Pressable
            key={t}
            style={({ pressed }) => [styles.tab, tab === t && styles.tabActive, pressed && styles.pressed]}
            onPress={() => setTab(t)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t }}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {visible.length === 0 ? (
        <View style={styles.empty}>
          <Sunrise size={30} color={colors.muted} />
          <Text style={styles.emptyText}>No {tab.toLowerCase()} shots yet. Be the first.</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {visible.map((photo) => {
            const username = usernames[photo.user_id] ?? 'photographer'
            return (
              <View key={photo.id} style={styles.tile}>
                {photo.photo_url ? (
                  <Image source={{ uri: photo.photo_url }} style={styles.image} resizeMode="cover" accessibilityLabel={`Photo by ${username}`} />
                ) : (
                  <View style={[styles.image, styles.imagePlaceholder]}>
                    <ImageOff size={24} color={colors.muted} />
                  </View>
                )}
                <View style={styles.tileBody}>
                  <Pressable
                    style={({ pressed }) => [styles.author, pressed && styles.pressed]}
                    onPress={() => onPressPhotographer?.(photo.user_id)}
                    hitSlop={hitSlop}
                    accessibilityRole="link"
                  >
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{username.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.username} numberOfLines={1}>{username}</Text>
                  </Pressable>
                  <View style={styles.tileMeta}>
                    <View style={styles.upvoteRow}>
                      <ArrowBigUp size={16} color={colors.ink} />
                      <Text style={styles.upvotes}>{photo.upvotes}</Text>
                    </View>
                    <Text style={styles.gear} numberOfLines={1}>{photo.lens}</Text>
                  </View>
                </View>
              </View>
            )
          })}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  tabs: { gap: 8, paddingBottom: 14 },
  tab: {
    paddingHorizontal: 16,
    minHeight: 38,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  tabActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  pressed: { opacity: 0.75 },
  tabText: { color: colors.ink, fontSize: 14, fontFamily: fonts.semibold },
  tabTextActive: { color: colors.onInk },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  tile: { ...card, width: '48.5%', overflow: 'hidden', borderRadius: radius.md },
  image: { width: '100%', aspectRatio: 1 },
  imagePlaceholder: { backgroundColor: colors.sunk, justifyContent: 'center', alignItems: 'center' },
  tileBody: { padding: 10, gap: 6 },
  author: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: colors.onInk, fontSize: 11, fontFamily: fonts.bold },
  username: { color: colors.ink, fontSize: 13, fontFamily: fonts.semibold, flex: 1 },
  tileMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6 },
  upvoteRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  upvotes: { color: colors.ink, fontSize: 13, fontFamily: fonts.bold },
  gear: { ...type.caption, flexShrink: 1 },
  empty: { alignItems: 'center', paddingVertical: 28, gap: 8 },
  emptyText: { ...type.small },
})
