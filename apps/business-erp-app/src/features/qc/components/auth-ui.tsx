import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontFamilies } from '@/constants/theme';
import { QcOpColors } from '../theme';
import { ChevronRightIcon, EyeIcon, EyeOffIcon } from './icons';
import { useState } from 'react';

interface QcAuthShellProps {
  eyebrow: string;
  index: string;
  title: string;
  copy: string;
  meta: string;
  onBack?: () => void;
  children: ReactNode;
}

export function QcAuthShell({
  eyebrow,
  index,
  title,
  copy,
  meta,
  onBack,
  children,
}: QcAuthShellProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  return (
    <ScrollView
      style={styles.shell}
      contentContainerStyle={{
        flexGrow: 1,
        paddingTop: insets.top + 20,
        paddingBottom: insets.bottom + 20,
      }}>
      <View style={[styles.container, Platform.OS === 'web' && { minHeight: windowHeight - 40 }]}>
        <View style={styles.leftCol}>
          <View style={styles.header}>
            <Image source={require('@/assets/images/business.webp')} style={styles.logo} contentFit="contain" />
            <Text style={styles.meta}>{meta}</Text>
          </View>
          <View style={styles.heroWrap}>
            {onBack ? (
              <Pressable onPress={onBack} style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
                <Text style={styles.backBtnText}>← Volver al inicio</Text>
              </Pressable>
            ) : null}
            <Text style={styles.eyebrow}>{eyebrow}</Text>
            <View style={styles.titleRow}>
              <Text style={styles.titleIndex}>{index}</Text>
              <Text style={styles.title}>{title}</Text>
            </View>
            <Text style={styles.copy}>{copy}</Text>
          </View>
        </View>

        <View style={styles.rightCol}>
          <View style={styles.formCard}>{children}</View>
        </View>
      </View>
    </ScrollView>
  );
}

export function QcScreenError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

export function QcButton({ label, onPress, loading, variant = 'primary' }: { label: string; onPress: () => void; loading?: boolean; variant?: 'primary' | 'ghost' }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.button,
        variant === 'ghost' ? styles.buttonGhost : styles.buttonPrimary,
        pressed && styles.pressed,
        loading && styles.buttonDisabled,
      ]}>
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? QcOpColors.teal : QcOpColors.white} />
      ) : (
        <Text style={[styles.buttonText, variant === 'ghost' && styles.buttonTextGhost]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function QcField({ label, ...props }: any) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={QcOpColors.placeholder}
        {...props}
      />
    </View>
  );
}

export function QcPasswordField({ label, ...props }: any) {
  const [show, setShow] = useState(false);
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pwdWrap}>
        <TextInput
          style={styles.inputPwd}
          placeholderTextColor={QcOpColors.placeholder}
          secureTextEntry={!show}
          {...props}
        />
        <Pressable onPress={() => setShow(!show)} style={styles.eyeBtn}>
          {show ? <EyeOffIcon size={16} color={QcOpColors.inkSoft} /> : <EyeIcon size={16} color={QcOpColors.inkSoft} />}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: QcOpColors.background },
  container: { flex: 1, paddingHorizontal: 16, maxWidth: 800, width: '100%', alignSelf: 'center' },
  leftCol: { marginBottom: 30 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 },
  logo: { height: 24, width: 36 },
  meta: { fontFamily: FontFamilies.bodyBold, fontSize: 10, letterSpacing: 0.5, color: QcOpColors.inkSoft, textTransform: 'uppercase' },
  heroWrap: { marginTop: 20 },
  backBtn: { marginBottom: 12, alignSelf: 'flex-start' },
  backBtnText: { fontFamily: FontFamilies.bodyBold, fontSize: 11, color: QcOpColors.teal, textTransform: 'uppercase', letterSpacing: 1 },
  eyebrow: { fontFamily: FontFamilies.bodyBold, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: QcOpColors.tealDeep, marginBottom: 8 },
  titleRow: { flexDirection: 'row', gap: 12 },
  titleIndex: { fontFamily: FontFamilies.display, fontSize: 13, fontWeight: '700', color: QcOpColors.tealDeep, marginTop: 6 },
  title: { fontFamily: FontFamilies.display, fontSize: 26, lineHeight: 30, fontWeight: '800', letterSpacing: -0.5, color: QcOpColors.ink },
  copy: { fontFamily: FontFamilies.body, fontSize: 14, lineHeight: 20, color: QcOpColors.inkSoft, marginTop: 12, maxWidth: 300 },
  rightCol: { flex: 1 },
  formCard: { backgroundColor: QcOpColors.surface, padding: 24, borderWidth: 1, borderColor: QcOpColors.rule },
  errorBox: { backgroundColor: '#fee2e2', padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#fca5a5' },
  errorText: { fontFamily: FontFamilies.body, fontSize: 12, color: '#991b1b' },
  button: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  buttonPrimary: { backgroundColor: QcOpColors.teal },
  buttonGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: QcOpColors.rule },
  buttonText: { fontFamily: FontFamilies.bodyBold, fontSize: 12, color: QcOpColors.white, letterSpacing: 1, textTransform: 'uppercase' },
  buttonTextGhost: { color: QcOpColors.teal },
  buttonDisabled: { opacity: 0.6 },
  pressed: { opacity: 0.7 },
  fieldWrap: { marginBottom: 16 },
  label: { fontFamily: FontFamilies.bodyBold, fontSize: 10, letterSpacing: 0.5, color: QcOpColors.ink, marginBottom: 6, textTransform: 'uppercase' },
  input: { fontFamily: FontFamilies.body, fontSize: 14, color: QcOpColors.ink, borderWidth: 1, borderColor: QcOpColors.rule, backgroundColor: QcOpColors.surface, minHeight: 42, paddingHorizontal: 12 },
  pwdWrap: { flexDirection: 'row', borderWidth: 1, borderColor: QcOpColors.rule, backgroundColor: QcOpColors.surface },
  inputPwd: { flex: 1, fontFamily: FontFamilies.body, fontSize: 14, color: QcOpColors.ink, minHeight: 42, paddingHorizontal: 12 },
  eyeBtn: { padding: 12, justifyContent: 'center' },
});

export function QcScreenInfo({ message }: { message: string | null }) { if (!message) return null; return <Text style={{ color: QcOpColors.teal, fontFamily: FontFamilies.body, fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{message}</Text>; }

export function QcStepper({ step, total }: { step: number; total: number }) { return <View style={{ flexDirection: 'row', gap: 4, marginBottom: 24, justifyContent: 'center' }}>{Array.from({ length: total }).map((_, i) => <View key={i} style={{ width: 32, height: 4, borderRadius: 2, backgroundColor: i < step ? QcOpColors.teal : QcOpColors.rule }} />)}</View>; }
