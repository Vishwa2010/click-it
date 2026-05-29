import { View, Text, StyleSheet } from 'react-native'

export default function ShotDuelScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Shot Duel</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A2E', alignItems: 'center', justifyContent: 'center' },
  text: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
})
