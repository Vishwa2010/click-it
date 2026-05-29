import { View, Text, StyleSheet } from 'react-native'

export default function ARCompassScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>AR Compass</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A2E', alignItems: 'center', justifyContent: 'center' },
  text: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
})
