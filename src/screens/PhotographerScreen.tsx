import { View, Text, StyleSheet } from 'react-native'
import { StackScreenProps } from '@react-navigation/stack'
import { RootStackParamList } from '../navigation/types'

type Props = StackScreenProps<RootStackParamList, 'Photographer'>

export default function PhotographerScreen({ route }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Photographer: {route.params.userId}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A2E', alignItems: 'center', justifyContent: 'center' },
  text: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
})
