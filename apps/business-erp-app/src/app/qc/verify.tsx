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
  QcScreenError,
  QcScreenInfo,
} from '@/features/qc/components/auth-ui';

export default function QcVerifyScreen() {
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
      await qcAuthApi.sendOtp(email.trim());
      setSent(true);
      setInfo('Te enviamos un código de verificación a tu email');
    } catch (e) {
      setError(e instanceof QcApiError ? e.message : 'Error al enviar el código');
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
      const result = await qcAuthApi.verifyOtp(email.trim(), code.trim());
      if (result.verified) {
        router.replace('/qc/login');
      } else {
        setError('Código inválido o expirado');
      }
    } catch (e) {
      setError(e instanceof QcApiError ? e.message : 'Error al verificar');
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
      eyebrow="Control operativo / Verificación"
      index="03"
      title={'Verificar\nemail'}
      copy="Confirmá tu cuenta con el código que te enviamos a tu email."
      meta="Módulo Calidad · Verificación"
      onBack={goBackToLogin}>
      <View style={styles.intro}>
        <Text style={styles.formIndex}>03 / Verificación</Text>
        <Text style={styles.formTitle}>Verificar email</Text>
        <Text style={styles.formCopy}>Ingresá el código de verificación para activar tu cuenta.</Text>
      </View>

      <QcScreenError message={error} />
      <QcScreenInfo message={info} />

      <QcField
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
          <QcField
            label="Código de verificación"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            placeholder="••••••"
          />
          <QcButton label="Verificar" onPress={handleVerify} loading={loading} />
          <QcButton label="Reenviar código" onPress={handleSendOtp} loading={loading} variant="ghost" />
        </>
      ) : (
        <QcButton label="Enviar código" onPress={handleSendOtp} loading={loading} />
      )}
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
