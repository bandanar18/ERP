import { useRouter } from 'expo-router';
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
  PmScreenError,
  PmScreenInfo,
} from '@/features/pm/components/auth-ui';

export default function PmForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      setError('Ingresá tu email');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await pmAuthApi.requestPasswordReset(email.trim());
      setSent(true);
    } catch (e) {
      setError(e instanceof PmApiError ? e.message : 'Error al enviar el enlace');
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
      eyebrow="Control operativo / Recuperación"
      index="02"
      title={'Recuperar\ncontraseña'}
      copy="Te enviamos un enlace para restablecer tu contraseña de forma segura."
      meta="Módulo Proyectos · Recuperación"
      onBack={goBackToLogin}>
      <View style={styles.intro}>
        <Text style={styles.formIndex}>02 / Recuperación</Text>
        <Text style={styles.formTitle}>Restablecer contraseña</Text>
        <Text style={styles.formCopy}>Ingresa tu email y te enviaremos un enlace de recuperación.</Text>
      </View>

      <PmScreenError message={error} />

      {sent ? (
        <PmScreenInfo message="Revisá tu email: te enviamos un enlace para restablecer tu contraseña." />
      ) : (
        <>
          <PmField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="nombre@ejemplo.com"
          />
          <PmButton label="Enviar enlace" onPress={handleSend} loading={loading} />
        </>
      )}
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
