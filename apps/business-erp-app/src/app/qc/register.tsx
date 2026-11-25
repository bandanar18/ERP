import { useRouter } from 'expo-router';
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
  QcScreenInfo,
  QcStepper,
} from '@/features/qc/components/auth-ui';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zíZ0-9_.-]{4,}$/;

const SUBTITLES: Record<number, string> = {
  1: 'Paso 1 de 3 — Datos personales',
  2: 'Paso 2 de 3 — Datos de la cuenta',
  3: 'Paso 3 de 3 — Seguridad',
};

export default function QcRegisterScreen() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirm: '',
  });
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const checkUsername = async (username: string) => {
    if (username.trim().length < 4) {
      setUsernameStatus('idle');
      return;
    }
    setUsernameStatus('checking');
    try {
      const { available } = await qcAuthApi.checkUsername(username.trim());
      setUsernameStatus(available ? 'available' : 'taken');
    } catch {
      setUsernameStatus('idle');
    }
  };

  const validateStep = (s: number): boolean => {
    const e: Record<string, boolean> = {};
    if (s === 1) {
      if (form.firstName.trim().length < 2) e.firstName = true;
      if (form.lastName.trim().length < 2) e.lastName = true;
    }
    if (s === 2) {
      if (!EMAIL_RE.test(form.email.trim())) e.email = true;
      if (!USERNAME_RE.test(form.username.trim()) || usernameStatus === 'taken') e.username = true;
    }
    if (s === 3) {
      if (form.password.length < 8) e.password = true;
      if (form.password !== form.confirm) e.confirm = true;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, 3));
  };
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const submit = async () => {
    if (!validateStep(3)) return;
    setLoading(true);
    setError(null);
    try {
      await qcAuthApi.register({
        email: form.email.trim(),
        password: form.password,
        username: form.username.trim() || undefined,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
      });
      router.replace({ pathname: '/qc/verify', params: { email: form.email.trim() } });
    } catch (e) {
      setError(e instanceof QcApiError ? e.message : 'Error inesperado al registrarse');
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
      eyebrow="Control operativo / Registro"
      index="01"
      title={'Crear\ncuenta'}
      copy="Registrate para acceder al módulo de calidad: planifica, ejecuta y da seguimiento a cada proyecto."
      meta="Módulo Calidad · Registro"
      onBack={goBackToLogin}>
      <View style={styles.intro}>
        <Text style={styles.stepSubtitle}>{SUBTITLES[step]}</Text>
        <QcStepper currentStep={step} />
      </View>

      <QcScreenError message={error} />

      {step === 1 && (
        <View>
          <QcField
            label="Nombre"
            value={form.firstName}
            onChangeText={set('firstName')}
            error={errors.firstName ? 'Ingresa tu nombre (mín. 2 caracteres)' : undefined}
            placeholder="Tu nombre"
          />
          <QcField
            label="Apellido"
            value={form.lastName}
            onChangeText={set('lastName')}
            error={errors.lastName ? 'Ingresa tu apellido (mín. 2 caracteres)' : undefined}
            placeholder="Tu apellido"
          />
        </View>
      )}

      {step === 2 && (
        <View>
          <QcField
            label="Email"
            value={form.email}
            onChangeText={set('email')}
            error={errors.email ? 'Ingresa un email válido' : undefined}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="nombre@ejemplo.com"
          />
          <QcField
            label="Nombre de usuario"
            value={form.username}
            onChangeText={(v) => {
              set('username')(v);
              checkUsername(v);
            }}
            error={errors.username ? 'Nombre de usuario inválido o no disponible' : undefined}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="miusuario"
          />
          {usernameStatus === 'checking' && <QcScreenInfo message="Comprobando disponibilidad…" />}
          {usernameStatus === 'available' && <QcScreenInfo message="✓ Nombre de usuario disponible" />}
          {usernameStatus === 'taken' && <QcScreenError message="Ese nombre de usuario ya está en uso" />}
        </View>
      )}

      {step === 3 && (
        <View>
          <QcPasswordField
            label="Contraseña"
            value={form.password}
            onChangeText={set('password')}
            error={errors.password ? 'Mínimo 8 caracteres' : undefined}
            placeholder="••••••••"
          />
          <QcPasswordField
            label="Confirmar contraseña"
            value={form.confirm}
            onChangeText={set('confirm')}
            error={errors.confirm ? 'Las contraseñas no coinciden' : undefined}
            placeholder="••••••••"
          />
        </View>
      )}

      <View style={styles.actions}>
        {step > 1 && <QcButton label="← Anterior" onPress={back} variant="ghost" />}
        {step < 3 ? (
          <QcButton label="Siguiente →" onPress={next} />
        ) : (
          <QcButton label="Registrarme" onPress={submit} loading={loading} />
        )}
      </View>
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
  stepSubtitle: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: QcOpColors.orangeDeep,
    marginBottom: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
});
