import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomTabInset, FontFamilies, Palette } from '@/constants/theme';
import { goBackSafe } from '@/features/pm/utils/navigation';

interface ModuleScreenProps {
  kicker: string;
  title: string;
  copy: string;
  accent: string;
}

/**
 * Pantalla genérica de un módulo del ERP. Reutilizada por cada ruta de módulo
 * (proyectos, calidad, ...) para evitar duplicar layout y estilos.
 */
export function ModuleScreen({ kicker, title, copy, accent }: ModuleScreenProps) {
  const router = useRouter();

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: BottomTabInset + 30 }}>
      <View style={styles.container}>
        <Text style={[styles.kicker, { color: accent }]}>{kicker}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.copy}>{copy}</Text>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          onPress={() => goBackSafe(router)}>
          <Text style={styles.buttonText}>← Volver</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Palette.bg },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    gap: 16,
  },
  kicker: {
    fontFamily: FontFamilies.bodyBold,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: FontFamilies.display,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: Palette.text,
  },
  copy: {
    fontFamily: FontFamilies.body,
    fontSize: 15,
    lineHeight: 22,
    color: Palette.muted,
    maxWidth: 330,
  },
  button: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Palette.text,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  buttonText: {
    fontFamily: FontFamilies.bodyBold,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Palette.text,
  },
  pressed: { opacity: 0.7 },
});
