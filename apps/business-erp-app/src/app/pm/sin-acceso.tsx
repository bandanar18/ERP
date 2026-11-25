import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontFamilies } from '@/constants/theme';
import { PmColors } from '@/features/pm/theme';
import { usePmAuth } from '@/features/pm/hooks/usePmAuth';

export default function PmSinAccesoScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = usePmAuth();

  const handleLogout = () => {
    logout();
    router.replace('/pm/login');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.kicker}>Acceso denegado</Text>
      <Text style={styles.title}>Sin rol asignado</Text>
      <Text style={styles.copy}>
        Tu cuenta ({user?.email}) no tiene un rol asignado en el módulo de proyectos.
        Contactá al administrador para obtener acceso.
      </Text>
      <Pressable style={({ pressed }) => [styles.logout, pressed && styles.pressed]} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PmColors.paper,
    paddingHorizontal: 24,
    gap: 14,
  },
  kicker: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: PmColors.orange,
  },
  title: {
    fontFamily: FontFamilies.display,
    fontSize: 38,
    lineHeight: 42,
    color: PmColors.ink,
  },
  copy: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    lineHeight: 21,
    color: PmColors.inkSoft,
  },
  logout: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: PmColors.rule,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  logoutText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: PmColors.orangeDeep,
  },
  pressed: {
    opacity: 0.7,
  },
});
