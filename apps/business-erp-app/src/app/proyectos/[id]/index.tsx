import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Palette, Spacing } from '@/constants/theme';

export default function ProjectDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalles del Proyecto</Text>
      <Text style={styles.copy}>ID: {id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.bg, padding: Spacing.xl },
  title: { fontSize: 32, color: Palette.text },
  copy: { fontSize: 16, color: Palette.muted },
});
