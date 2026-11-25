import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FontFamilies } from '@/constants/theme';
import { QcApiError } from '@/features/qc/api/client';
import { QcColors } from '@/features/qc/theme';
import { useQcAuth } from '@/features/qc/hooks/useQcAuth';
import { resolveDashboardRoute } from '@/features/qc/utils/roles';
import { createAuthKit, qcAuthTheme } from '@/components/auth-kit';

const { AuthShell, Field, PasswordField, GoogleButton, Divider, RememberRow, Button, ScreenError } =
  createAuthKit(qcAuthTheme);

export default function QcLoginScreen() {
  const router = useRouter();
  const { login } = useQcAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      setError('Ingresá tu correo/usuario y contraseña');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const user = await login({ login: identifier.trim(), password });
      router.replace(resolveDashboardRoute(user.roles));
    } catch (e) {
      setError(e instanceof QcApiError ? e.message : 'Error inesperado al iniciar sesión');
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
      eyebrow="Indicadores vivos / Acceso"
      title={'Gestión de\nCalidad'}
      copy="Indicadores, mediciones y reportes en un solo lugar para controlar tus procesos."
      meta="Módulo Calidad · Sesión protegida"
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
          placeholder="nombre@empresa.com o tu usuario"
        />
        <PasswordField
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
        />

        {/* Aún no hay pantalla de forgot-password QC: solo "Recordarme". */}
        <RememberRow remember={remember} onToggle={() => setRemember((v) => !v)} />

        <Button label="Entrar al módulo" onPress={handleLogin} loading={loading} />
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  formIntro: {
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: QcColors.accentDark,
  },
  formIndex: {
    marginBottom: 6,
    color: QcColors.accentDeep,
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
    color: QcColors.ink,
  },
  formCopy: {
    marginTop: 7,
    marginBottom: 13,
    color: QcColors.inkSoft,
    fontSize: 11,
    lineHeight: 16,
  },
});
