import { memo, useCallback, useEffect, useRef } from 'react'
import { View, Text, Image, Pressable, FlatList, StyleSheet, ListRenderItemInfo, Animated, Easing } from 'react-native'
import { ImageOff, Clock, MapPinPlus } from 'lucide-react-native'
import { Spot } from '../../types/spot'
import { RANK_LABELS } from '../SpotCard'
import { formatHHMM } from '../../lib/goldenHour'
import { colors, fonts, radius, spotRankColors } from '../../theme'

export interface NearbySpot {
  spot: Spot
  distance: string
}

interface Props {
  loading?: boolean
  items: NearbySpot[]
  selectedId: string | null
  filterLabel: string
  onSelect: (spot: Spot) => void
  onPinFirst: () => void
}

export const CARD_WIDTH = 272
const GAP = 10
export const CAROUSEL_HEIGHT = 100

const NearbyCard = memo(function NearbyCard({ item, selected, onSelect }: {
  item: NearbySpot
  selected: boolean
  onSelect: (spot: Spot) => void
}) {
  const { spot, distance } = item
  return (
    <Pressable
      onPress={() => onSelect(spot)}
      style={({ pressed }) => [styles.card, selected && styles.cardSelected, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${spot.name}, ${RANK_LABELS[spot.rank]}, ${distance} away`}
      accessibilityState={{ selected }}
    >
      {spot.cover_photo_url ? (
        <Image source={{ uri: spot.cover_photo_url }} style={styles.thumb} resizeMode="cover" />
      ) : (
        <View style={[styles.thumb, styles.thumbEmpty]}>
          <ImageOff size={20} color={colors.muted} />
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{spot.name}</Text>
        <View style={styles.row}>
          <View style={[styles.rankDot, { backgroundColor: spotRankColors[spot.rank] }]} />
          <Text style={styles.meta} numberOfLines={1}>
            {RANK_LABELS[spot.rank]} · {distance}
          </Text>
        </View>
        {spot.best_time_start ? (
          <View style={styles.row}>
            <Clock size={12} color={colors.muted} />
            <Text style={styles.meta} numberOfLines={1}>
              Best {formatHHMM(spot.best_time_start)}–{formatHHMM(spot.best_time_end)}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  )
})

// Placeholder cards while spots load (skill: loading-states — reserve the space, don't jump)
function SkeletonCards() {
  const pulse = useRef(new Animated.Value(0.5)).current
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [pulse])
  return (
    <View style={styles.skeletonRow} accessibilityLabel="Loading nearby spots">
      {[0, 1].map((i) => (
        <Animated.View key={i} style={[styles.card, { opacity: pulse }]}>
          <View style={[styles.thumb, styles.thumbEmpty]} />
          <View style={styles.body}>
            <View style={[styles.bar, { width: '70%' }]} />
            <View style={[styles.bar, { width: '45%' }]} />
            <View style={[styles.bar, { width: '55%' }]} />
          </View>
        </Animated.View>
      ))}
    </View>
  )
}

export default function NearbyCarousel({ loading, items, selectedId, filterLabel, onSelect, onPinFirst }: Props) {
  const listRef = useRef<FlatList<NearbySpot>>(null)

  // Keep the selected spot's card in view when a pin is tapped on the map
  useEffect(() => {
    if (!selectedId) return
    const index = items.findIndex((i) => i.spot.id === selectedId)
    if (index >= 0) listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 })
  }, [selectedId, items])

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<NearbySpot>) => (
      <NearbyCard item={item} selected={item.spot.id === selectedId} onSelect={onSelect} />
    ),
    [selectedId, onSelect]
  )

  if (loading) return <SkeletonCards />

  if (items.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Pressable
          onPress={onPinFirst}
          style={({ pressed }) => [styles.card, styles.empty, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <View style={[styles.thumb, styles.emptyIcon]}>
            <MapPinPlus size={22} color={colors.onInk} />
          </View>
          <View style={styles.body}>
            <Text style={styles.name}>{filterLabel === 'All' ? 'No spots on the map yet' : `No ${filterLabel.toLowerCase()} spots yet`}</Text>
            <Text style={styles.meta}>Pin the first one and become its Founder →</Text>
          </View>
        </Pressable>
      </View>
    )
  }

  return (
    <FlatList
      ref={listRef}
      data={items}
      keyExtractor={(i) => i.spot.id}
      renderItem={renderItem}
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={CARD_WIDTH + GAP}
      decelerationRate="fast"
      contentContainerStyle={styles.list}
      getItemLayout={(_, index) => ({ length: CARD_WIDTH + GAP, offset: (CARD_WIDTH + GAP) * index, index })}
      onScrollToIndexFailed={() => undefined}
    />
  )
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, gap: GAP },
  emptyWrap: { paddingHorizontal: 16 },
  skeletonRow: { flexDirection: 'row', gap: GAP, paddingHorizontal: 16 },
  bar: { height: 10, borderRadius: 5, backgroundColor: colors.sunk },
  card: {
    width: CARD_WIDTH,
    height: CAROUSEL_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.line,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  cardSelected: { borderColor: colors.ink },
  empty: { width: '100%' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  thumb: { width: 78, height: 78, borderRadius: radius.md },
  thumbEmpty: { backgroundColor: colors.sunk, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { backgroundColor: colors.ink, justifyContent: 'center', alignItems: 'center' },
  body: { flex: 1, gap: 5 },
  name: { color: colors.ink, fontSize: 16, fontFamily: fonts.bold },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rankDot: { width: 8, height: 8, borderRadius: 4 },
  meta: { color: colors.ink2, fontSize: 13, fontFamily: fonts.medium, flexShrink: 1 },
})
