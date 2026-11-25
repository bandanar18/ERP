import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FontFamilies } from '@/constants/theme';
import { pmAuthApi } from '@/features/pm/api/auth';
import { PmApiError } from '@/features/pm/api/client';
import { PmColors } from '@/features/pm/theme';
import {
  PmAuthShell,
  PmButton,
  PmField,
  PmPasswordField,
  PmScreenError,
} from '@/features/pm/components/auth-ui';

export default function PmResetPasswordScreen() {
  const router = useRouter();
  const { token: tokenParam } = useLocalSearchParams<{ token?: string }>();

  const [token, setToken] = useState(tokenParam ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    if (!token.trim() || newPassword.length < 8) {
      setError('El token es requerido y la contraseña debe tener al menos 8 caracteres');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await pmAuthApi.resetPassword(token.trim(), newPassword);
      router.replace('/pm/login');
    } catch (e) {
      setError(e instanceof PmApiError ? e.message : 'Error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const goBackToLogin = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/pm/login');
  };

  return (
    <PmAuthShell
      eyebrow="Control operativo / Nueva contraseña"
      index="04"
      title={'Nueva\ncontraseña'}
      copy="Ingresá el token recibido y definí tu nueva contraseña."
      meta="Módulo Proyectos · Nueva contraseña"
      onBack={goBackToLogin}>
      <View style={styles.intro}>
        <Text style={styles.formIndex}>04 / Nueva contraseña</Text>
        <Text style={styles.formTitle}>Restablecer contraseña</Text>
        <Text style={styles.formCopy}>Definí una nueva contraseña para tu cuenta.</Text>
      </View>

      <PmScreenError message={error} />

      <PmField
        label="Token"
        value={token}
        onChangeText={setToken}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Token de recuperación"
      />
      <PmPasswordField
        label="Nueva contraseña"
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder="••••••••"
      />

      <PmButton label="Restablecer contraseña" onPress={handleReset} loading={loading} />
    </PmAuthShell>
  );
}

const styles = StyleSheet.create({
  intro: {
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: PmColors.ink,
    marginBottom: 14,
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
    fontSize: 32,
    letterSpacing: 0.5,
    color: PmColors.ink,
  },
  formCopy: {
    marginTop: 7,
    marginBottom: 4,
    color: PmColors.inkSoft,
    fontSize: 11,
    lineHeight: 16,
  },
});
