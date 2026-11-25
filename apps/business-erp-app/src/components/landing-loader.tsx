import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { LandingFontFamilies, Palette } from '@/constants/theme';

/**
 * Screen de carga inicial (loader) de la landing.
 * Muestra el logo con animación de entrada, una barra de progreso y el texto,
 * y avisa `onComplete` al terminar para revelar la pantalla.
 */
export function LandingLoader({ onComplete }: { onComplete: () => void }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 1300 }, (finished) => {
      if (finished) runOnJS(onComplete)();
    });
  }, [progress, onComplete]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.overlay}>
      <Animated.View entering={FadeInDown.duration(650).springify()}>
        <Image
          source={require('@/assets/images/business.webp')}
          style={styles.logo}
          contentFit="contain"
        />
      </Animated.View>

      <Animated.View entering={FadeIn.duration(400).delay(250)} style={styles.bar}>
        <Animated.View style={[styles.fill, fillStyle]} />
      </Animated.View>

      <Animated.View entering={FadeIn.duration(400).delay(450)}>
        <Text style={styles.word}>Plataforma operativa</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
    backgroundColor: Palette.bg,
    paddingHorizontal: 40,
  },
  logo: {
    height: 60,
    width: 240,
  },
  bar: {
    width: '100%',
    maxWidth: 280,
    height: 3,
    backgroundColor: 'rgba(245,240,232,0.15)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Palette.primary,
  },
  word: {
    fontFamily: LandingFontFamilies.bodyBold,
    fontSize: 10,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: Palette.muted,
  },
});
