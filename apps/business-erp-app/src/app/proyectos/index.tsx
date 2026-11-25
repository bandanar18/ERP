import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Palette, Spacing } from '@/constants/theme';

export default function ProyectosExplorerScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Proyectos (Explorer)</Text>
      <Text style={styles.copy}>Lista virtualizada en construcción...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.bg,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    color: Palette.text,
    fontWeight: 'bold',
  },
  copy: {
    fontSize: 16,
    color: Palette.muted,
  },
});
