import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { FontFamilies } from '@/constants/theme';
import { PmOpColors } from '@/features/pm/theme';
import { pmAuthApi } from '@/features/pm/api/auth';
import { getPmToken, PmApiError } from '@/features/pm/api/client';
import {
  PmButton,
  PmField,
  PmScreenError,
  PmScreenInfo,
} from '@/features/pm/components/auth-ui';
import { PmFormShell } from '@/features/pm/components/pm-app-shell';
import { PencilIcon } from '@/features/pm/components/icons';
import { usePmAuth } from '@/features/pm/hooks/usePmAuth';
import { displayName } from '@/features/pm/utils/profile';
import { goBackSafe } from '@/features/pm/utils/navigation';
import type { PmUser } from '@/features/pm/types';

export default function PmPerfilEditarScreen() {
  const router = useRouter();
  const { user, status } = usePmAuth();

  const [me, setMe] = useState<PmUser | null>(user);
  const [form, setForm] = useState({ firstName: '', lastName: '', username: '', phone: '' });
  const [loadingMe, setLoadingMe] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated') return;
    const token = getPmToken();
    if (!token) return;

    pmAuthApi
      .me(token)
      .then((profile) => {
        setMe(profile);
        setForm({
          firstName: profile.firstName ?? '',
          lastName: profile.lastName ?? '',
          username: profile.username ?? '',
          phone: profile.phone ?? '',
        });
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'No se pudo cargar el perfil');
      })
      .finally(() => setLoadingMe(false));
  }, [status]);

  const handleSave = async () => {
    setError(null);
    setDone(false);

    const username = form.username.trim();
    if (username && username.length < 4) {
      setError('El nombre de usuario debe tener al menos 4 caracteres');
      return;
    }

    setSaving(true);
    try {
      await pmAuthApi.updateProfile(
        {
          firstName: form.firstName.trim() || null,
          lastName: form.lastName.trim() || null,
          username: username || null,
          phone: form.phone.trim() || null,
        },
        getPmToken(),
      );
      setDone(true);
    } catch (e) {
      setError(e instanceof PmApiError ? e.message : 'Error al guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PmFormShell
      eyebrow="Perfil · Editar"
      title="Editar perfil"
      copy="Nombre, apellido, nombre de usuario y teléfono."
      onBack={() => goBackSafe(router)}>
      {me ? (
        <View style={styles.identity}>
          <PencilIcon size={20} color={PmOpColors.orangeDeep} />
          <View style={styles.identityInfo}>
            <Text style={styles.identityName} numberOfLines={1}>
              {displayName(me)}
            </Text>
            <Text style={styles.identityEmail} numberOfLines={1}>
              {me.email}
            </Text>
          </View>
        </View>
      ) : null}

      {loadingMe ? null : (
        <>
          <PmScreenError message={error} />
          <PmScreenInfo message={done ? 'Perfil actualizado correctamente' : null} />

          <View style={styles.fieldSpacing}>
            <PmField
              label="Nombre"
              value={form.firstName}
              onChangeText={(v) => setForm((f) => ({ ...f, firstName: v }))}
              placeholder="Tu nombre"
            />
          </View>
          <View style={styles.fieldSpacing}>
            <PmField
              label="Apellido"
              value={form.lastName}
              onChangeText={(v) => setForm((f) => ({ ...f, lastName: v }))}
              placeholder="Tu apellido"
            />
          </View>
          <View style={styles.fieldSpacing}>
            <PmField
              label="Nombre de usuario"
              value={form.username}
              onChangeText={(v) => setForm((f) => ({ ...f, username: v }))}
              placeholder="alias (mínimo 4 caracteres)"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={styles.fieldSpacing}>
            <PmField
              label="Número de teléfono"
              value={form.phone}
              onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
              placeholder="+584121234567"
              keyboardType="phone-pad"
            />
          </View>
          <Text style={styles.note}>
            Número de contacto directo para comunicaciones y proyectos vinculados. El email no se puede cambiar.
          </Text>
          <View style={styles.buttonWrap}>
            <PmButton label="Guardar cambios" onPress={handleSave} loading={saving} />
          </View>
        </>
      )}
    </PmFormShell>
  );
}

const styles = StyleSheet.create({
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    backgroundColor: PmOpColors.surface,
    padding: 14,
    marginBottom: 14,
  },
  identityInfo: {
    flex: 1,
    minWidth: 0,
  },
  identityName: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 14,
    color: PmOpColors.ink,
  },
  identityEmail: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: PmOpColors.inkSoft,
  },
  fieldSpacing: {
    marginBottom: 10,
  },
  note: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: PmOpColors.inkSoft,
    marginBottom: 12,
  },
  buttonWrap: {
    marginTop: 2,
  },
});