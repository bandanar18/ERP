import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, type Href } from 'expo-router';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type NativeSyntheticEvent,
  type TextInputFocusEventData,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontFamilies } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { PmColors } from '@/features/pm/theme';
import { QcColors } from '@/features/qc/theme';
import { EyeIcon, EyeOffIcon, GoogleLogo } from '@/features/pm/components/icons';

/* ============================================================================
   Auth Kit — kit estándar de pantallas de login por módulo.
   Misma anatomía para todos los módulos (hero con banda diagonal, form,
   footer); la identidad del módulo entra por el tema (paleta).
============================================================================ */

export interface AuthTheme {
  paper: string;
  hero: string;
  heroRule: string;
  accent: string;
  accentDeep: string;
  /** Color del footer (versión oscura del acento). */
  accentDark: string;
  lime: string;
  ink: string;
  inkSoft: string;
  placeholder: string;
  rule: string;
  divider: string;
  surface: string;
  surface2: string;
  white: string;
}

interface AuthShellProps {
  eyebrow: string;
  /** Índice opcional arriba a la derecha (p.ej. "01"). Vacío no renderiza nada. */
  index?: string;
  title: string;
  copy: string;
  meta: string;
  /** Muestra un botón "← Volver" arriba del hero. */
  onBack?: () => void;
  children: ReactNode;
}

interface FieldProps extends TextInputProps {
  label: string;
  error?: string;
  scrollRef?: React.RefObject<ScrollView>;
}

interface PasswordFieldProps extends Omit<TextInputProps, 'secureTextEntry'> {
  label: string;
  error?: string;
  scrollRef?: React.RefObject<ScrollView>;
}

interface ButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'ghost';
}

interface RememberRowProps {
  remember: boolean;
  onToggle: () => void;
  /** Ruta de "¿Olvidaste tu contraseña?". Opcional: sin pantalla no hay link. */
  forgotHref?: Href;
}

export function createAuthKit(theme: AuthTheme) {
  const s = StyleSheet.create({
    keyboardAvoiding: {
      flex: 1,
      backgroundColor: theme.paper,
    },
    shell: {
      flex: 1,
      backgroundColor: theme.paper,
    },
    /* Hero */
    hero: {
      paddingHorizontal: 18,
      paddingBottom: 17,
      borderBottomWidth: 1,
      borderBottomColor: theme.heroRule,
      backgroundColor: theme.hero,
      overflow: 'hidden',
    },
    heroDiagonal: {
      position: 'absolute',
      top: -60,
      right: -110,
      width: 220,
      height: 340,
      backgroundColor: theme.accent,
      opacity: 0.1,
      transform: [{ rotate: '35deg' }],
    },
    heroDiagonalSoft: {
      position: 'absolute',
      top: 40,
      right: -60,
      width: 140,
      height: 300,
      backgroundColor: theme.accentDeep,
      opacity: 0.07,
      transform: [{ rotate: '35deg' }],
    },
    backButton: {
      alignSelf: 'flex-start',
      marginBottom: 16,
    },
    backText: {
      fontFamily: FontFamilies.bodyBold,
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: theme.accentDeep,
    },
    heroTopline: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    heroEyebrow: {
      color: theme.accent,
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    heroIndex: {
      color: theme.inkSoft,
      fontFamily: FontFamilies.display,
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    heroTitle: {
      fontFamily: FontFamilies.display,
      fontSize: 32,
      lineHeight: 36,
      fontWeight: '800',
      letterSpacing: -0.5,
      color: theme.ink,
    },
    heroCopy: {
      maxWidth: 320,
      marginTop: 12,
      marginBottom: 14,
      color: theme.inkSoft,
      fontSize: 11,
      lineHeight: 16,
    },
    heroMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingTop: 11,
      borderTopWidth: 1,
      borderTopColor: theme.heroRule,
    },
    heroMetaDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.lime,
    },
    heroMetaText: {
      color: theme.inkSoft,
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    /* Main */
    main: {
      paddingHorizontal: 14,
      paddingTop: 14,
    },
    /* Tablet: hero a la izquierda, form a la derecha (como el login web) */
    tabletContent: {
      flexGrow: 1,
    },
    tabletRow: {
      flex: 1,
      flexDirection: 'row',
      alignSelf: 'center',
      width: '100%',
      maxWidth: 1180,
    },
    heroTablet: {
      width: '44%',
      justifyContent: 'center',
      paddingBottom: 40,
      borderBottomWidth: 0,
      borderRightWidth: 1,
      borderRightColor: theme.heroRule,
    },
    mainTablet: {
      width: '56%',
      justifyContent: 'center',
      paddingHorizontal: 36,
      paddingTop: 32,
      paddingBottom: 32,
    },
    /* Form */
    field: {
      gap: 4,
      marginBottom: 10,
    },
    label: {
      color: theme.ink,
      fontSize: 10,
      fontWeight: '700',
    },
    input: {
      height: 42,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: theme.rule,
      backgroundColor: theme.surface,
      color: theme.ink,
      fontSize: 13,
      fontWeight: '500',
    },
    inputFocused: {
      borderColor: theme.accent,
    },
    inputError: {
      borderColor: theme.accentDeep,
    },
    passwordControl: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 42,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: theme.rule,
      backgroundColor: theme.surface,
    },
    passwordInput: {
      flex: 1,
      color: theme.ink,
      fontSize: 13,
      fontWeight: '500',
      paddingVertical: 0,
    },
    /* Google */
    googleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      minHeight: 42,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: theme.rule,
      backgroundColor: theme.surface,
    },
    googleButtonNotice: {
      borderColor: theme.accent,
    },
    googleText: {
      color: theme.ink,
      fontSize: 12,
      fontWeight: '700',
    },
    /* Divider */
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
      marginBottom: 11,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.divider,
    },
    dividerText: {
      color: theme.inkSoft,
      fontSize: 9,
      fontWeight: '600',
    },
    /* Recordar / olvidaste */
    formOptions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 2,
      marginBottom: 12,
    },
    remember: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    checkbox: {
      width: 14,
      height: 14,
      borderWidth: 1,
      borderColor: theme.rule,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: theme.accent,
      borderColor: theme.accent,
    },
    checkmark: {
      color: theme.white,
      fontSize: 9,
      fontWeight: '700',
    },
    rememberText: {
      color: theme.inkSoft,
      fontSize: 10,
      fontWeight: '600',
    },
    forgotLink: {
      color: theme.accentDeep,
      fontSize: 10,
      fontWeight: '700',
    },
    /* Botón */
    button: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
      paddingHorizontal: 14,
      backgroundColor: theme.accent,
    },
    buttonGhost: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.rule,
    },
    buttonTextGhost: {
      color: theme.ink,
    },
    buttonPressed: {
      opacity: 0.85,
    },
    buttonText: {
      fontFamily: FontFamilies.bodyBold,
      fontSize: 13,
      letterSpacing: 1,
      color: theme.white,
    },
    /* Signup */
    signup: {
      marginTop: 12,
      color: theme.inkSoft,
      fontSize: 10,
      textAlign: 'center',
    },
    signupLink: {
      color: theme.accentDeep,
      fontWeight: '700',
    },
    /* Mensajes */
    screenError: {
      fontFamily: FontFamilies.body,
      fontSize: 12,
      color: theme.accentDeep,
      marginBottom: 6,
    },
    /* Footer */
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 16,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: theme.accentDark,
    },
    footerStrong: {
      color: theme.white,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    footerVersion: {
      color: 'rgba(255,255,255,0.6)',
      fontSize: 9,
    },
  });

  /* ─── Shell ────────────────────────────────────────────────────────── */

  function AuthShell({ eyebrow, index, title, copy, meta, onBack, children }: AuthShellProps) {
    const insets = useSafeAreaInsets();
    const { isTablet } = useBreakpoint();
    const scrollRef = useRef<ScrollView>(null);
    const formY = useRef(0);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
      const showSub = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
        (e) => {
          setKeyboardHeight(e.endCoordinates.height);
        }
      );
      const hideSub = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
        () => {
          setKeyboardHeight(0);
        }
      );
      return () => {
        showSub.remove();
        hideSub.remove();
      };
    }, []);

    // Desplaza la vista para que el campo enfocado quede visible sobre el teclado
    const scrollToField = (fieldY = 0) => {
      if (isTablet) return;
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          y: Math.max(0, formY.current + fieldY - 14),
          animated: true,
        });
      }, 100);
    };

    return (
      <KeyboardAvoidingView
        style={s.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          style={s.shell}
          contentContainerStyle={[
            {
              flexGrow: 1,
              paddingBottom: insets.bottom + 24 + (isTablet ? 0 : keyboardHeight),
            },
            isTablet && s.tabletContent,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={isTablet ? s.tabletRow : undefined}>
            <View
              style={[
                s.hero,
                { paddingTop: insets.top + (isTablet ? 24 : 21) },
                isTablet && s.heroTablet,
              ]}>
              {/* Banda diagonal con el acento del módulo */}
              <View style={s.heroDiagonal} />
              <View style={s.heroDiagonalSoft} />

              {onBack ? (
                <Pressable onPress={onBack} style={s.backButton} hitSlop={10}>
                  <Text style={s.backText}>← Volver</Text>
                </Pressable>
              ) : null}
              <View style={s.heroTopline}>
                <Text style={s.heroEyebrow}>{eyebrow}</Text>
                {index ? <Text style={s.heroIndex}>{index}</Text> : null}
              </View>
              <Text style={s.heroTitle}>{title}</Text>
              <Text style={s.heroCopy}>{copy}</Text>
              <View style={s.heroMeta}>
                <View style={s.heroMetaDot} />
                <Text style={s.heroMetaText}>{meta}</Text>
              </View>
            </View>

            <View
              style={[s.main, isTablet && s.mainTablet]}
              onLayout={(e) => {
                formY.current = e.nativeEvent.layout.y;
              }}>
              <FieldScrollContext.Provider value={scrollToField}>
                {children}
              </FieldScrollContext.Provider>

              <View style={s.footer}>
                <Text style={s.footerStrong}>Business &amp; Development — Venezuela</Text>
                <Text style={s.footerVersion}>© 2026</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  /* ─── Campo de formulario ──────────────────────────────────────────── */

  function Field({ label, error, style, onFocus, ...rest }: FieldProps) {
    const [focused, setFocused] = useState(false);
    const [fieldY, setFieldY] = useState(0);
    const scrollToField = useFieldScroll();

    const handleFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      setFocused(true);
      scrollToField(fieldY);
      onFocus?.(e);
    };

    return (
      <View
        style={s.field}
        onLayout={(e) => {
          setFieldY(e.nativeEvent.layout.y);
        }}>
        <Text style={s.label}>{label}</Text>
        <TextInput
          style={[s.input, focused && s.inputFocused, error && s.inputError, style]}
          placeholderTextColor={theme.placeholder}
          onFocus={handleFocus}
          onBlur={() => setFocused(false)}
          {...rest}
        />
        {error ? <Text style={s.screenError}>{error}</Text> : null}
      </View>
    );
  }

  /* ─── Campo de contraseña con mostrar/ocultar ──────────────────────── */

  function PasswordField({ label, error, style, onFocus, ...rest }: PasswordFieldProps) {
    const [focused, setFocused] = useState(false);
    const [visible, setVisible] = useState(false);
    const [fieldY, setFieldY] = useState(0);
    const scrollToField = useFieldScroll();

    const handleFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      setFocused(true);
      scrollToField(fieldY);
      onFocus?.(e);
    };

    return (
      <View
        style={s.field}
        onLayout={(e) => {
          setFieldY(e.nativeEvent.layout.y);
        }}>
        <Text style={s.label}>{label}</Text>
        <View style={[s.passwordControl, focused && s.inputFocused, error && s.inputError]}>
          <TextInput
            style={s.passwordInput}
            placeholderTextColor={theme.placeholder}
            secureTextEntry={!visible}
            onFocus={handleFocus}
            onBlur={() => setFocused(false)}
            {...rest}
          />
          <Pressable onPress={() => setVisible((v) => !v)} hitSlop={8}>
            {visible ? (
              <EyeOffIcon size={18} color={theme.accentDeep} />
            ) : (
              <EyeIcon size={18} color={theme.inkSoft} />
            )}
          </Pressable>
        </View>
        {error ? <Text style={s.screenError}>{error}</Text> : null}
      </View>
    );
  }

  /* ─── Botón "Continuar con Google" ─────────────────────────────────── */

  function GoogleButton() {
    const [notice, setNotice] = useState(false);

    const handlePress = () => {
      setNotice(true);
      setTimeout(() => setNotice(false), 1800);
    };

    return (
      <Pressable
        style={[s.googleButton, notice && s.googleButtonNotice]}
        onPress={handlePress}>
        <GoogleLogo size={18} />
        <Text style={s.googleText}>
          {notice ? 'Google no disponible todavía' : 'Continuar con Google'}
        </Text>
      </Pressable>
    );
  }

  /* ─── Divider "o continuar con correo" ─────────────────────────────── */

  function Divider() {
    return (
      <View style={s.divider}>
        <View style={s.dividerLine} />
        <Text style={s.dividerText}>o continuar con correo</Text>
        <View style={s.dividerLine} />
      </View>
    );
  }

  /* ─── Fila "Recordarme / ¿Olvidaste tu contraseña?" ────────────────── */

  function RememberRow({ remember, onToggle, forgotHref }: RememberRowProps) {
    return (
      <View style={s.formOptions}>
        <Pressable style={s.remember} onPress={onToggle}>
          <View style={[s.checkbox, remember && s.checkboxChecked]}>
            {remember ? <Text style={s.checkmark}>✓</Text> : null}
          </View>
          <Text style={s.rememberText}>Recordarme</Text>
        </Pressable>
        {forgotHref ? (
          <Link href={forgotHref} style={s.forgotLink}>
            ¿Olvidaste tu contraseña?
          </Link>
        ) : null}
      </View>
    );
  }

  /* ─── Botón principal ──────────────────────────────────────────────── */

  function Button({ label, onPress, loading, variant = 'primary' }: ButtonProps) {
    const isPrimary = variant === 'primary';

    return (
      <Pressable
        style={({ pressed }) => [
          s.button,
          !isPrimary && s.buttonGhost,
          pressed && s.buttonPressed,
        ]}
        onPress={onPress}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color={isPrimary ? theme.white : theme.ink} />
        ) : (
          <Text style={[s.buttonText, !isPrimary && s.buttonTextGhost]}>{label}</Text>
        )}
      </Pressable>
    );
  }

  /* ─── Línea "¿Eres nuevo aquí?" ────────────────────────────────────── */

  function SignupLine({ href, label = 'Solicita acceso' }: { href: Href; label?: string }) {
    return (
      <Text style={s.signup}>
        ¿Eres nuevo aquí?{' '}
        <Link href={href} style={s.signupLink}>
          {label}
        </Link>
      </Text>
    );
  }

  /* ─── Mensaje de error ─────────────────────────────────────────────── */

  function ScreenError({ message }: { message: string | null }) {
    if (!message) return null;
    return <Text style={s.screenError}>{message}</Text>;
  }

  return {
    AuthShell,
    Field,
    PasswordField,
    GoogleButton,
    Divider,
    RememberRow,
    Button,
    SignupLine,
    ScreenError,
  };
}

/* ─── Context para scroll-to-field (patrón cerrado en el kit) ────────── */

type ScrollToFieldFn = (fieldY?: number) => void;
const noop: ScrollToFieldFn = () => {};
const FieldScrollContext = createContext<ScrollToFieldFn>(noop);
function useFieldScroll() {
  return useContext(FieldScrollContext);
}

/* ─── Temas por módulo (única diferencia entre logins: la paleta) ─────── */

/** Tema del módulo Project Management (naranja editorial). */
export const pmAuthTheme: AuthTheme = {
  paper: PmColors.paper,
  hero: PmColors.hero,
  heroRule: PmColors.heroRule,
  accent: PmColors.orange,
  accentDeep: PmColors.orangeDeep,
  accentDark: PmColors.orangeDeep,
  lime: PmColors.lime,
  ink: PmColors.ink,
  inkSoft: PmColors.inkSoft,
  placeholder: PmColors.placeholder,
  rule: PmColors.rule,
  divider: PmColors.divider,
  surface: PmColors.surface,
  surface2: PmColors.surface2,
  white: PmColors.white,
};

/** Tema del módulo Quality Control (verde esmeralda). */
export const qcAuthTheme: AuthTheme = {
  paper: QcColors.paper,
  hero: QcColors.hero,
  heroRule: QcColors.heroRule,
  accent: QcColors.accent,
  accentDeep: QcColors.accentDeep,
  accentDark: QcColors.accentDark,
  lime: QcColors.lime,
  ink: QcColors.ink,
  inkSoft: QcColors.inkSoft,
  placeholder: QcColors.placeholder,
  rule: QcColors.rule,
  divider: QcColors.divider,
  surface: QcColors.surface,
  surface2: QcColors.surface2,
  white: QcColors.white,
};
