import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { LandingFontFamilies, Palette } from '@/constants/theme';
import { LandingLoader } from '@/components/landing-loader';
import { useBreakpoint } from '@/hooks/useBreakpoint';

export default function LandingScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isTablet } = useBreakpoint();
  // Altura visible real (la mide el contenedor al renderizarse — fiable en web/iOS/Android).
  const [viewHeight, setViewHeight] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setViewHeight(0);
  }, [width, height]);

  const isLandscape = width > height;
  // Two-column layout only on tablets (≥768 logical px) or landscape.
  // Phones in portrait ALWAYS stay in single-column mode.
  const isWide = isTablet || isLandscape;
  const heroTitleFont = isWide
    ? Math.min(height * 0.085, width * 0.055, 52)
    : Math.min(width * 0.135, height * 0.07, 68);
  const currentHeight = viewHeight > 0 && viewHeight <= height ? viewHeight : height;

  // Las imágenes locales (require) ya están empaquetadas y no soportan prefetch() como si fueran URLs externas.

  if (loading) {
    return <LandingLoader onComplete={() => setLoading(false)} />;
  }

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        const h = e.nativeEvent.layout.height;
        if (h > 0 && h !== viewHeight) setViewHeight(h);
      }}>
      {/* ─── HERO: ocupa toda la pantalla, sin scroll ───────────────── */}
      <View style={[styles.hero, { minHeight: currentHeight }]}>
        <View style={styles.heroMedia}>
          <Image
            source={require('@/assets/images/hero-bg.webp')}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <View style={styles.heroOverlay} />
        </View>

        <View
          style={[
            styles.heroCopy,
            {
              paddingTop: insets.top + (isWide ? 4 : 8),
              paddingBottom: insets.bottom + (isWide ? 12 : 20),
            },
            isWide && styles.heroCopyWide,
          ]}>
          <Animated.View
            entering={FadeInDown.duration(600)}
            style={[styles.heroNav, isWide && styles.heroNavWide]}>
            <Image
              source={require('@/assets/images/business.webp')}
              style={styles.wordmark}
              contentFit="contain"
            />
          </Animated.View>

          {/* Phone portrait: column layout — hero content first, panel at bottom */}
          {!isWide ? (
            <>
              <Animated.View
                entering={FadeInDown.duration(600).delay(150)}
                style={styles.heroBody}>
                <Text style={styles.eyebrow}>Plataforma operativa · Business ERP</Text>
                <Text style={[styles.heroTitle, { fontSize: heroTitleFont, lineHeight: heroTitleFont * 1.02 }]}>
                  {'Todo tu negocio.\nEn un mismo\npulso.'}
                </Text>
                <Text style={styles.heroSupport}>
                  Conecta equipos, finanzas y operación en una sola fuente de verdad.
                </Text>
                <Pressable
                  style={({ pressed }) => [styles.heroButton, pressed && styles.pressed]}
                  onPress={() => router.push('/explore')}>
                  <Text style={styles.heroButtonText}>
                    Explorar módulos  <Text style={styles.arrow}>→</Text>
                  </Text>
                </Pressable>
              </Animated.View>
              <Animated.View
                entering={FadeInDown.duration(600).delay(350)}
                style={styles.heroPanel}>
                <View style={styles.panelTop}>
                  <Text style={styles.panelTitle}>{'06\nmódulos'}</Text>
                  <Text style={styles.panelCopy}>{'01 fuente\nde verdad'}</Text>
                </View>
                <View style={styles.panelStat}>
                  <Text style={styles.panelNumber}>+32%</Text>
                  <Text style={styles.panelLabel}>más visibilidad operativa</Text>
                </View>
                <View style={styles.bars}>
                  {[34, 58, 42, 78, 94, 68].map((h, i) => (
                    <View key={i} style={[styles.bar, { height: `${h}%` }]} />
                  ))}
                </View>
              </Animated.View>
            </>
          ) : (
            /* Wide (tablet or landscape): two-column row layout */
            <View style={styles.heroMainWide}>
              <Animated.View
                entering={FadeInDown.duration(600).delay(150)}
                style={styles.heroBodyWide}>
                <Text style={styles.eyebrow}>Plataforma operativa · Business ERP</Text>
                <Text style={[styles.heroTitle, { fontSize: heroTitleFont, lineHeight: heroTitleFont * 1.02 }]}>
                  {'Todo tu negocio.\nEn un mismo\npulso.'}
                </Text>
                <Text style={[styles.heroSupport, styles.heroSupportWide]}>
                  Conecta equipos, finanzas y operación en una sola fuente de verdad. Menos fricción
                  para el día a día. Más claridad para crecer.
                </Text>
                <Pressable
                  style={({ pressed }) => [styles.heroButton, pressed && styles.pressed]}
                  onPress={() => router.push('/explore')}>
                  <Text style={styles.heroButtonText}>
                    Explorar módulos  <Text style={styles.arrow}>→</Text>
                  </Text>
                </Pressable>
              </Animated.View>

              <Animated.View
                entering={FadeInDown.duration(600).delay(350)}
                style={styles.heroPanelWide}>
                <View style={styles.panelTop}>
                  <Text style={styles.panelTitle}>{'06\nmódulos'}</Text>
                  <Text style={styles.panelCopy}>{'01 fuente\nde verdad'}</Text>
                </View>
                <View style={styles.panelStat}>
                  <Text style={styles.panelNumber}>+32%</Text>
                  <Text style={styles.panelLabel}>más visibilidad operativa</Text>
                </View>
                <View style={styles.bars}>
                  {[34, 58, 42, 78, 94, 68].map((h, i) => (
                    <View key={i} style={[styles.bar, { height: `${h}%` }]} />
                  ))}
                </View>
              </Animated.View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.bg,
  },
  pressed: {
    opacity: 0.75,
  },
  /* HERO */
  hero: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: Palette.bg,
  },
  heroMedia: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Palette.overlay,
  },
  heroCopy: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 6,
  },
  heroCopyWide: {
    maxWidth: 1080,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 28,
  },
  heroNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
  },
  heroNavWide: {
    paddingHorizontal: 0,
  },
  heroMain: {
    // Retained for reference, no longer used directly in JSX (conditional render splits paths)
    flex: 1,
  },
  heroMainWide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  heroBody: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 16,
    paddingTop: 24,
    paddingHorizontal: 16,
    zIndex: 20,
  },
  heroBodyWide: {
    flex: 1,
    maxWidth: 580,
    paddingTop: 0,
    paddingBottom: 16,
    paddingHorizontal: 0,
    gap: 14,
    justifyContent: 'center',
    alignSelf: 'center',
    zIndex: 20,
  },
  wordmark: {
    height: 52,
    width: 100,
  },
  eyebrow: {
    fontFamily: LandingFontFamilies.bodyBold,
    fontSize: 10,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: Palette.muted,
  },
  heroTitle: {
    fontFamily: LandingFontFamilies.display,
    color: Palette.text,
    letterSpacing: -0.5,
  },
  heroSupport: {
    fontFamily: LandingFontFamilies.body,
    fontSize: 14,
    lineHeight: 21,
    color: Palette.text,
    maxWidth: 320,
  },
  heroSupportTablet: {
    maxWidth: 480,
  },
  heroSupportWide: {
    maxWidth: 480,
    fontSize: 13,
    lineHeight: 19,
  },
  heroButton: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    zIndex: 30,
    elevation: 30,
  },
  heroButtonText: {
    fontFamily: LandingFontFamilies.bodyBold,
    fontSize: 11,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: Palette.text,
  },
  arrow: {
    fontSize: 18,
  },
  heroPanel: {
    marginTop: 'auto',
    marginLeft: 16,
    marginBottom: 8,
    alignSelf: 'flex-start',
    width: 190,
    padding: 14,
    backgroundColor: 'rgba(13,13,13,0.76)',
    borderWidth: 1,
    borderColor: 'rgba(245,240,232,0.22)',
    zIndex: 1,
    elevation: 1,
  },
  heroPanelWide: {
    marginTop: 0,
    marginLeft: 32,
    marginBottom: 16,
    alignSelf: 'flex-end',
    width: 220,
    padding: 16,
    flexShrink: 0,
    zIndex: 1,
    elevation: 1,
  },
  panelTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245,240,232,0.2)',
  },
  panelTitle: {
    fontFamily: LandingFontFamilies.display,
    fontSize: 26,
    lineHeight: 30,
    color: Palette.text,
  },
  panelCopy: {
    fontFamily: LandingFontFamilies.bodyBold,
    fontSize: 8,
    lineHeight: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: 'rgba(245,240,232,0.55)',
    maxWidth: 75,
  },
  panelStat: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 14,
  },
  panelNumber: {
    fontFamily: LandingFontFamilies.display,
    fontSize: 40,
    color: Palette.primary,
    lineHeight: 44,
  },
  panelLabel: {
    fontFamily: LandingFontFamilies.bodyBold,
    fontSize: 8,
    lineHeight: 11,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: 'rgba(245,240,232,0.6)',
    maxWidth: 78,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 40,
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(245,240,232,0.15)',
  },
  bar: {
    flex: 1,
    backgroundColor: Palette.primary,
  },
});
