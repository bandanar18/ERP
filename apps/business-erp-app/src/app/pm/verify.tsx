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
  PmScreenError,
  PmScreenInfo,
} from '@/features/pm/components/auth-ui';

export default function PmVerifyScreen() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();

  const [email, setEmail] = useState(emailParam ?? '');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setError('Ingresá tu email');
      return;
    }
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      await pmAuthApi.sendOtp(email.trim());
      setSent(true);
      setInfo('Te enviamos un código de verificación a tu email');
    } catch (e) {
      setError(e instanceof PmApiError ? e.message : 'Error al enviar el código');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!email.trim() || !code.trim()) {
      setError('Email y código son obligatorios');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await pmAuthApi.verifyOtp(email.trim(), code.trim());
      if (result.verified) {
        router.replace('/pm/login');
      } else {
        setError('Código inválido o expirado');
      }
    } catch (e) {
      setError(e instanceof PmApiError ? e.message : 'Error al verificar');
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
      eyebrow="Control operativo / Verificación"
      index="03"
      title={'Verificar\nemail'}
      copy="Confirmá tu cuenta con el código que te enviamos a tu email."
      meta="Módulo Proyectos · Verificación"
      onBack={goBackToLogin}>
      <View style={styles.intro}>
        <Text style={styles.formIndex}>03 / Verificación</Text>
        <Text style={styles.formTitle}>Verificar email</Text>
        <Text style={styles.formCopy}>Ingresá el código de verificación para activar tu cuenta.</Text>
      </View>

      <PmScreenError message={error} />
      <PmScreenInfo message={info} />

      <PmField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        placeholder="nombre@ejemplo.com"
      />

      {sent ? (
        <>
          <PmField
            label="Código de verificación"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            placeholder="••••••"
          />
          <PmButton label="Verificar" onPress={handleVerify} loading={loading} />
          <PmButton label="Reenviar código" onPress={handleSendOtp} loading={loading} variant="ghost" />
        </>
      ) : (
        <PmButton label="Enviar código" onPress={handleSendOtp} loading={loading} />
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
