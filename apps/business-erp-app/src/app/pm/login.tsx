import { Link, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { setItem, getItem, removeItem } from '@/features/pm/store/session';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontFamilies } from '@/constants/theme';
import { PmApiError } from '@/features/pm/api/client';
import { PmColors } from '@/features/pm/theme';
import { usePmAuth } from '@/features/pm/hooks/usePmAuth';
import { resolveDashboardRoute } from '@/features/pm/utils/roles';
import { createAuthKit, pmAuthTheme } from '@/components/auth-kit';

const { AuthShell, Field, PasswordField, GoogleButton, Divider, RememberRow, Button, SignupLine, ScreenError } =
  createAuthKit(pmAuthTheme);

export default function PmLoginScreen() {
  const router = useRouter();
  const { login } = usePmAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCredentials() {
      try {
        const savedId = await getItem('pm_saved_id');
        const savedPwd = await getItem('pm_saved_pwd');
        if (savedId && savedPwd) {
          setIdentifier(savedId);
          setPassword(savedPwd);
          setRemember(true);
        }
      } catch (e) {
        // ignore errors loading credentials
      }
    }
    loadCredentials();
  }, []);

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      setError('Ingresá tu correo/usuario y contraseña');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (remember) {
        await setItem('pm_saved_id', identifier.trim()).catch(() => {});
        await setItem('pm_saved_pwd', password).catch(() => {});
      } else {
        await removeItem('pm_saved_id').catch(() => {});
        await removeItem('pm_saved_pwd').catch(() => {});
      }

      const user = await login({ login: identifier.trim(), password }, remember);
      // router.replace manejado por _layout
    } catch (e: any) {
      if (e instanceof PmApiError || e.name === 'PmApiError' || e.status !== undefined) {
        setError(e.message);
      } else {
        setError(e?.message ? `Error: ${e.message}` : 'Error inesperado al iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

  const goBackToLanding = () => {
    // replace() en vez de back(): con stacks anidados el router.back() puede
    // quedarse atrapado en el navigator interno.
    router.replace('/');
  };

  return (
    <AuthShell
      eyebrow="Control operativo / Acceso"
      title={'Gestión de\nProyectos'}
      copy="Planifica, ejecuta y da seguimiento a cada proyecto: presupuesto, avance físico, finanzas y entregables en un solo lugar."
      meta="Módulo Proyectos • Sesión protegida"
      onBack={goBackToLanding}>
      <View style={styles.formIntro}>
        <Text style={styles.formIndex}>01 / Acceso al módulo</Text>
        <Text style={styles.formTitle}>Entrar al módulo</Text>
        <Text style={styles.formCopy}>Usa tus credenciales para continuar.</Text>

        <GoogleButton />
        <Divider />

        <ScreenError message={error} />

        <Field
          label="Correo o usuario"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="nombre@ejemplo.com o tu usuario"
        />
        <PasswordField
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
        />

        <RememberRow remember={remember} onToggle={() => setRemember((v) => !v)} forgotHref="/pm/forgot-password" />

        <Button label="Entrar al módulo" onPress={handleLogin} loading={loading} />

        <SignupLine href="/pm/register" />
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  formIntro: {
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: PmColors.ink,
  },
  formIndex: {
    marginBottom: 6,
    color: PmColors.orangeDeep,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  formTitle: {
    fontFamily: FontFamilies.display,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: PmColors.ink,
  },
  formCopy: {
    marginTop: 7,
    marginBottom: 13,
    color: PmColors.inkSoft,
    fontSize: 11,
    lineHeight: 16,
  },
});
