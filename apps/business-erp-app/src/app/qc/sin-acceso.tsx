import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontFamilies } from '@/constants/theme';
import { QcColors } from '@/features/qc/theme';
import { useQcAuth } from '@/features/qc/hooks/useQcAuth';

/**
 * Pantalla mostrada cuando el usuario no tiene roles asignados en el módulo QC.
 */
export default function QcSinAccesoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useQcAuth();

  const handleLogout = () => {
    logout();
    router.replace('/qc/login');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.eyebrow}>Sin acceso</Text>
      <Text style={styles.title}>No tenés permisos{'\n'}para este módulo</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Usuario</Text>
        <Text style={styles.cardValue}>{user?.email ?? '—'}</Text>
        <Text style={[styles.cardLabel, styles.cardLabelSpaced]}>Roles asignados</Text>
        <Text style={styles.cardValue}>
          {(user?.roles ?? []).length > 0 ? user?.roles?.join(', ') : 'Ninguno'}
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
        onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </Pressable>
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
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: 0.5,
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
  cardLabelSpaced: {
    marginTop: 14,
  },
  cardValue: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
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
});
