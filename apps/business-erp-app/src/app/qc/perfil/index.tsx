import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { FontFamilies } from '@/constants/theme';
import { QcOpColors } from '@/features/qc/theme';
import { useQcAuth } from '@/features/qc/hooks/useQcAuth';
import { QcAppShell } from '@/features/qc/components/qc-app-shell';
import { QcButton } from '@/features/qc/components/auth-ui';
import { LogOutIcon } from '@/features/qc/components/icons';

const ROLE_LABELS: Record<string, string> = {
  QC_ADMIN: 'Administrador de Calidad',
  QC_DIRECTOR: 'Director Ejecutivo',
  QC_OWNER: 'Responsable de Proceso',
};

export default function QcProfileScreen() {
  const router = useRouter();
  const { user, logout } = useQcAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  if (!user) return null;

  return (
    <QcAppShell title="Mi perfil" subtitle="Ajustes de cuenta" scrollable>
      <View style={styles.container}>
        
        {/* Basic Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Datos Personales</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Correo Electrónico</Text>
            <Text style={styles.value}>{user.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Roles Asignados</Text>
            <View style={styles.roleWrap}>
              {user.roles.map(r => (
                <View key={r} style={styles.roleChip}>
                  <Text style={styles.roleChipText}>{ROLE_LABELS[r] || r}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Security Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Seguridad</Text>
          <Text style={styles.textDesc}>
            Para cambiar tu contraseña o actualizar tus datos personales, debes contactar 
            con el administrador del sistema operativo.
          </Text>
        </View>

        {/* Logout at the bottom as requested previously */}
        <View style={styles.logoutCard}>
          <Text style={styles.sectionTitle}>Sesión</Text>
          <Text style={styles.textDesc}>Cierra tu sesión en este dispositivo.</Text>
          <Pressable onPress={handleLogout} style={styles.logoutBtn}>
            <LogOutIcon size={16} color={QcOpColors.red} />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </Pressable>
        </View>

      </View>
    </QcAppShell>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16, paddingBottom: 30 },
  card: { backgroundColor: QcOpColors.surface, padding: 18, borderWidth: 1, borderColor: QcOpColors.rule, borderRadius: 8 },
  logoutCard: { backgroundColor: '#fef2f2', padding: 18, borderWidth: 1, borderColor: '#fca5a5', borderRadius: 8, marginTop: 24 },
  sectionTitle: { fontFamily: FontFamilies.display, fontSize: 18, color: QcOpColors.ink, marginBottom: 12 },
  infoRow: { marginBottom: 16 },
  label: { fontFamily: FontFamilies.bodyBold, fontSize: 11, color: QcOpColors.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  value: { fontFamily: FontFamilies.body, fontSize: 15, color: QcOpColors.ink },
  roleWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  roleChip: { backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: '#bbf7d0' },
  roleChipText: { fontFamily: FontFamilies.bodyBold, fontSize: 11, color: '#166534', textTransform: 'uppercase' },
  textDesc: { fontFamily: FontFamilies.body, fontSize: 13, color: QcOpColors.inkSoft, lineHeight: 18, marginBottom: 12 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 8 },
  logoutText: { fontFamily: FontFamilies.bodyBold, fontSize: 13, color: QcOpColors.red, textTransform: 'uppercase', letterSpacing: 0.5 },
});