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
  PmPasswordField,
  PmScreenError,
  PmScreenInfo,
  PmStepper,
} from '@/features/pm/components/auth-ui';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zíZ0-9_.-]{4,}$/;

const SUBTITLES: Record<number, string> = {
  1: 'Paso 1 de 3 — Datos personales',
  2: 'Paso 2 de 3 — Datos de la cuenta',
  3: 'Paso 3 de 3 — Seguridad',
};

export default function PmRegisterScreen() {
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
      const { available } = await pmAuthApi.checkUsername(username.trim());
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
      await pmAuthApi.register({
        email: form.email.trim(),
        password: form.password,
        username: form.username.trim() || undefined,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
      });
      router.replace({ pathname: '/pm/verify', params: { email: form.email.trim() } });
    } catch (e) {
      setError(e instanceof PmApiError ? e.message : 'Error inesperado al registrarse');
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
      eyebrow="Control operativo / Registro"
      index="01"
      title={'Crear\ncuenta'}
      copy="Registrate para acceder al módulo de proyectos: planifica, ejecuta y da seguimiento a cada proyecto."
      meta="Módulo Proyectos · Registro"
      onBack={goBackToLogin}>
      <View style={styles.intro}>
        <Text style={styles.stepSubtitle}>{SUBTITLES[step]}</Text>
        <PmStepper currentStep={step} />
      </View>

      <PmScreenError message={error} />

      {step === 1 && (
        <View>
          <PmField
            label="Nombre"
            value={form.firstName}
            onChangeText={set('firstName')}
            error={errors.firstName ? 'Ingresa tu nombre (mín. 2 caracteres)' : undefined}
            placeholder="Tu nombre"
          />
          <PmField
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
          <PmField
            label="Email"
            value={form.email}
            onChangeText={set('email')}
            error={errors.email ? 'Ingresa un email válido' : undefined}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="nombre@ejemplo.com"
          />
          <PmField
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
          {usernameStatus === 'checking' && <PmScreenInfo message="Comprobando disponibilidad…" />}
          {usernameStatus === 'available' && <PmScreenInfo message="✓ Nombre de usuario disponible" />}
          {usernameStatus === 'taken' && <PmScreenError message="Ese nombre de usuario ya está en uso" />}
        </View>
      )}

      {step === 3 && (
        <View>
          <PmPasswordField
            label="Contraseña"
            value={form.password}
            onChangeText={set('password')}
            error={errors.password ? 'Mínimo 8 caracteres' : undefined}
            placeholder="••••••••"
          />
          <PmPasswordField
            label="Confirmar contraseña"
            value={form.confirm}
            onChangeText={set('confirm')}
            error={errors.confirm ? 'Las contraseñas no coinciden' : undefined}
            placeholder="••••••••"
          />
        </View>
      )}

      <View style={styles.actions}>
        {step > 1 && <PmButton label="← Anterior" onPress={back} variant="ghost" />}
        {step < 3 ? (
          <PmButton label="Siguiente →" onPress={next} />
        ) : (
          <PmButton label="Registrarme" onPress={submit} loading={loading} />
        )}
      </View>
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
  stepSubtitle: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: PmColors.orangeDeep,
    marginBottom: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
});
