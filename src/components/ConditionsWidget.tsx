import { View, Text, StyleSheet } from 'react-native'

export default function ConditionsWidget() {
  return (
    <View style={styles.widget} pointerEvents="none">
      <Text style={styles.icon}>☀️</Text>
      <View>
        <Text style={styles.title}>Perfect light</Text>
        <Text style={styles.sub}>near you · 34 min</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  widget: {
    position: 'absolute',
    bottom: 96,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15,52,96,0.94)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  icon: { fontSize: 22 },
  title: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  sub: { color: '#A8B2C1', fontSize: 11, marginTop: 1 },
})
