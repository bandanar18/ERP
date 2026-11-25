import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { FontFamilies } from '@/constants/theme';
import { PmOpColors } from '../theme';

/** Botón de acceso al explorador de proyectos (se muestra en los dashboards). */
export function ExplorarButton() {
  const router = useRouter();

  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      onPress={() => router.push('/pm/explorar')}>
      <Text style={styles.text}>Explorar proyectos →</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 20,
    alignSelf: 'flex-start',
    backgroundColor: PmOpColors.orange,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  pressed: {
    backgroundColor: PmOpColors.orangeDeep,
  },
  text: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: PmOpColors.white,
  },
});
