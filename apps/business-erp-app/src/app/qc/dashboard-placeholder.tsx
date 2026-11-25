import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontFamilies } from '@/constants/theme';
import { QcColors } from '@/features/qc/theme';

/**
 * Placeholder de dashboard QC (paso 2 en construcción).
 * Muestra el rol que corresponde y confirma que el routing por rol funciona.
 */
export function QcDashboardPlaceholder({ roleLabel }: { roleLabel: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.eyebrow}>Módulo Calidad</Text>
      <Text style={styles.title}>{'Dashboard\nen construcción'}</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Vista para</Text>
        <Text style={styles.cardValue}>{roleLabel}</Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
        onPress={() => router.replace('/qc/login')}>
        <Text style={styles.logoutText}>Ir a iniciar sesión</Text>
      </Pressable>

      <Text style={styles.note}>
        Los indicadores, mediciones y reportes llegan en los próximos pasos del módulo.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: QcColors.paper,
    paddingHorizontal: 18,
  },
  eyebrow: {
    color: QcColors.accent,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: FontFamilies.display,
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: 1.2,
    color: QcColors.ink,
    marginTop: 10,
    marginBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderColor: QcColors.rule,
    backgroundColor: QcColors.surface,
    padding: 14,
  },
  cardLabel: {
    color: QcColors.inkSoft,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardValue: {
    fontFamily: FontFamilies.display,
    fontSize: 18,
    color: QcColors.ink,
    marginTop: 4,
  },
  logoutButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginTop: 18,
    backgroundColor: QcColors.accent,
  },
  pressed: {
    opacity: 0.85,
  },
  logoutText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    letterSpacing: 1,
    color: QcColors.white,
  },
  note: {
    marginTop: 14,
    color: QcColors.inkSoft,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
});

export default QcDashboardPlaceholder;
