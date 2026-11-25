import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LandingFontFamilies, Palette } from '@/constants/theme';
import { MODULES, type ModuleInfo } from '@/data/modules';
import { useBreakpoint } from '@/hooks/useBreakpoint';

const CARD_PADDING = 22;

export default function ExploreScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isTablet } = useBreakpoint();
  const listRef = useRef<FlatList<ModuleInfo>>(null);
  const [index, setIndex] = useState(0);

  const total = MODULES.length;
  const cardHeight = height - insets.top - insets.bottom - 230;

  const scrollTo = (i: number) => {
    listRef.current?.scrollToIndex({ index: i, animated: true });
    setIndex(i);
  };

  const goNext = () => scrollTo((index + 1) % total);
  const goPrev = () => scrollTo((index - 1 + total) % total);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(Math.max(0, Math.min(next, total - 1)));
  };

  return (
    <View style={styles.screen}>
      {/* Cabecera */}
      <View style={[styles.head, { paddingTop: insets.top + 24 }, isTablet && styles.containerTablet]}>
        <Pressable onPress={goBack} style={styles.backButton} hitSlop={10}>
          <Text style={styles.backText}>← Volver</Text>
        </Pressable>
        <Text style={styles.eyebrow}>Mapa operativo</Text>
        <Text style={styles.title}>Explorar módulos</Text>
      </View>

      {/* Carousel: swipeable (arrastra el dedo) + paginación */}
      <FlatList
        ref={listRef}
        data={MODULES}
        keyExtractor={(m) => m.number}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        onMomentumScrollEnd={onMomentumEnd}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item: m }) => (
          <View style={{ width, paddingHorizontal: CARD_PADDING, alignItems: 'center' }}>
            <View
              style={[
                styles.card,
                { height: cardHeight, borderColor: `${m.accent}66` },
                isTablet && styles.cardTablet,
              ]}>
              <View style={[styles.cardAccent, { backgroundColor: m.accent }]} />
              <Text style={[styles.cardNumber, { color: `${m.accent}40` }]}>{m.number}</Text>

              <View style={[styles.cardBody, isTablet && styles.cardBodyTablet]}>
                <View style={styles.kickerBadge}>
                  <Text style={[styles.kicker, { borderColor: m.accent, color: m.accent }]}>
                    {m.kicker}
                  </Text>
                </View>
                <Text style={styles.cardTitle}>{m.title}</Text>
                <Text style={styles.cardBold}>{m.bold}</Text>
                <Text style={styles.cardCopy}>{m.copy}</Text>
              </View>

              <View style={styles.cardFooter}>
                {m.to ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.enterButton,
                      { backgroundColor: m.accent },
                      pressed && styles.pressed,
                    ]}
                    onPress={() => router.push(m.to!)}>
                    <Text style={styles.enterButtonText}>Entrar al módulo  ↗</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.soonText}>Próximamente</Text>
                )}
              </View>
            </View>
          </View>
        )}
      />

      {/* Navegación: atrás / indicador / adelante */}
      <View style={[styles.nav, isTablet && styles.containerTablet]}>
        <Pressable
          style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}
          onPress={goPrev}>
          <Text style={styles.navButtonText}>← Anterior</Text>
        </Pressable>

        <View style={styles.dots}>
          {MODULES.map((m, i) => (
            <Pressable
              key={m.number}
              onPress={() => scrollTo(i)}
              style={[styles.dot, i === index && { backgroundColor: m.accent, borderColor: m.accent }]}
            />
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}
          onPress={goNext}>
          <Text style={styles.navButtonText}>Siguiente →</Text>
        </Pressable>
      </View>

      <Text style={styles.counter}>
        {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.bg,
  },
  pressed: {
    opacity: 0.75,
  },
  head: {
    paddingHorizontal: 22,
    paddingBottom: 18,
    gap: 8,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  backText: {
    fontFamily: LandingFontFamilies.bodyBold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Palette.primary,
  },
  eyebrow: {
    fontFamily: LandingFontFamilies.bodyBold,
    fontSize: 10,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: Palette.lime,
  },
  title: {
    fontFamily: LandingFontFamilies.display,
    fontSize: 46,
    lineHeight: 50,
    color: Palette.text,
  },
  containerTablet: {
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 20,
    padding: 26,
    backgroundColor: Palette.card,
  },
  cardTablet: {
    width: '100%',
    maxWidth: 640,
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
  },
  cardNumber: {
    position: 'absolute',
    right: 6,
    top: -26,
    fontFamily: LandingFontFamilies.display,
    fontSize: 170,
    opacity: 0.9,
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
    gap: 14,
    maxWidth: 300,
  },
  cardBodyTablet: {
    maxWidth: 540,
  },
  kickerBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
  },
  kicker: {
    fontFamily: LandingFontFamilies.bodyBold,
    fontSize: 8,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontFamily: LandingFontFamilies.display,
    fontSize: 68,
    lineHeight: 74,
    color: Palette.text,
  },
  cardBold: {
    fontFamily: LandingFontFamilies.display,
    fontSize: 22,
    color: Palette.text,
    letterSpacing: 1.1,
  },
  cardCopy: {
    fontFamily: LandingFontFamilies.body,
    fontSize: 14,
    lineHeight: 21,
    color: Palette.muted,
  },
  cardFooter: {
    marginTop: 20,
  },
  enterButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 4,
  },
  enterButtonText: {
    fontFamily: LandingFontFamilies.bodyBold,
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: Palette.bg,
  },
  soonText: {
    fontFamily: LandingFontFamilies.bodyBold,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Palette.muted,
    opacity: 0.7,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    marginTop: 20,
  },
  navButton: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  navButtonText: {
    fontFamily: LandingFontFamilies.bodyBold,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: Palette.text,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: Palette.muted,
    opacity: 0.6,
  },
  counter: {
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 16,
    fontFamily: LandingFontFamilies.bodyMedium,
    fontSize: 12,
    letterSpacing: 2,
    color: Palette.muted,
  },
});
