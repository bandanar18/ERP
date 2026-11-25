import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { FontFamilies } from '@/constants/theme';
import { PmOpColors } from '@/features/pm/theme';
import { pmAuthApi } from '@/features/pm/api/auth';
import { getPmToken, PmApiError } from '@/features/pm/api/client';
import {
  PmButton,
  PmPasswordField,
  PmScreenError,
  PmScreenInfo,
} from '@/features/pm/components/auth-ui';
import { PmFormShell } from '@/features/pm/components/pm-app-shell';
import { LockIcon, LogOutIcon } from '@/features/pm/components/icons';
import { usePmAuth } from '@/features/pm/hooks/usePmAuth';
import { goBackSafe } from '@/features/pm/utils/navigation';

export default function PmPerfilSeguridadScreen() {
  const router = useRouter();
  const { logout } = usePmAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleChangePassword = async () => {
    setError(null);
    setDone(false);
    if (!currentPassword || !newPassword) {
      setError('Completá la contraseña actual y la nueva');
      return;
    }
    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (newPassword !== confirm) {
      setError('La confirmación no coincide');
      return;
    }

    setSaving(true);
    try {
      await pmAuthApi.changePassword(currentPassword, newPassword, getPmToken());
      setDone(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
    } catch (e) {
      setError(e instanceof PmApiError ? e.message : 'Error al cambiar la contraseña');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PmFormShell
      eyebrow="Perfil · Seguridad"
      title="Seguridad"
      copy="Cambiá tu contraseña de acceso."
      onBack={() => goBackSafe(router)}>
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <LockIcon size={15} color={PmOpColors.orangeDeep} />
          <Text style={styles.cardTitle}>Cambiar contraseña</Text>
        </View>
        <PmScreenError message={error} />
        <PmScreenInfo message={done ? 'Contraseña actualizada correctamente' : null} />

        <View style={styles.fieldSpacing}>
          <PmPasswordField
            label="Contraseña actual"
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />
        </View>
        <View style={styles.fieldSpacing}>
          <PmPasswordField
            label="Nueva contraseña"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Mínimo 8 caracteres"
          />
        </View>
        <View style={styles.fieldSpacing}>
          <PmPasswordField
            label="Confirmar nueva contraseña"
            value={confirm}
            onChangeText={setConfirm}
          />
        </View>
        <View style={styles.buttonWrap}>
          <PmButton label="Cambiar contraseña" onPress={handleChangePassword} loading={saving} />
        </View>
      </View>
    </PmFormShell>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    backgroundColor: PmOpColors.surface,
    padding: 16,
    marginBottom: 14,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  cardTitle: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: PmOpColors.ink,
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