import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FontFamilies } from '@/constants/theme';
import { qcAuthApi } from '@/features/qc/api/auth';
import { QcApiError } from '@/features/qc/api/client';
import { QcOpColors } from '@/features/qc/theme';
import {
  QcAuthShell,
  QcButton,
  QcField,
  QcPasswordField,
  QcScreenError,
} from '@/features/qc/components/auth-ui';

export default function QcResetPasswordScreen() {
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
      await qcAuthApi.resetPassword(token.trim(), newPassword);
      router.replace('/qc/login');
    } catch (e) {
      setError(e instanceof QcApiError ? e.message : 'Error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const goBackToLogin = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/qc/login');
  };

  return (
    <QcAuthShell
      eyebrow="Control operativo / Nueva contraseña"
      index="04"
      title={'Nueva\ncontraseña'}
      copy="Ingresá el token recibido y definí tu nueva contraseña."
      meta="Módulo Calidad · Nueva contraseña"
      onBack={goBackToLogin}>
      <View style={styles.intro}>
        <Text style={styles.formIndex}>04 / Nueva contraseña</Text>
        <Text style={styles.formTitle}>Restablecer contraseña</Text>
        <Text style={styles.formCopy}>Definí una nueva contraseña para tu cuenta.</Text>
      </View>

      <QcScreenError message={error} />

      <QcField
        label="Token"
        value={token}
        onChangeText={setToken}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Token de recuperación"
      />
      <QcPasswordField
        label="Nueva contraseña"
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder="••••••••"
      />

      <QcButton label="Restablecer contraseña" onPress={handleReset} loading={loading} />
    </QcAuthShell>
  );
}

const styles = StyleSheet.create({
  intro: {
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: QcOpColors.ink,
    marginBottom: 14,
  },
  formIndex: {
    marginBottom: 6,
    color: QcOpColors.orangeDeep,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  formTitle: {
    fontFamily: FontFamilies.display,
    fontSize: 32,
    letterSpacing: 0.5,
    color: QcOpColors.ink,
  },
  formCopy: {
    marginTop: 7,
    marginBottom: 4,
    color: QcOpColors.inkSoft,
    fontSize: 11,
    lineHeight: 16,
  },
});
