import { View, Text, StyleSheet } from 'react-native'
import { colors, fonts } from '../../theme'

// Ink bubble with the number of spots inside; grows a little with the count
export default function ClusterPin({ count }: { count: number }) {
  const size = count < 10 ? 44 : count < 50 ? 50 : 58
  return (
    <View style={[styles.outer, { width: size + 10, height: size + 10, borderRadius: (size + 10) / 2 }]}>
      <View style={[styles.inner, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={styles.count}>{count > 99 ? '99+' : count}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: 'rgba(26,23,20,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    backgroundColor: colors.ink,
    borderWidth: 2,
    borderColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  count: { color: colors.onInk, fontSize: 15, fontFamily: fonts.extrabold },
})
