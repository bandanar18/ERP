import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { FontFamilies } from '@/constants/theme';
import { PmOpColors } from '@/features/pm/theme';
import { pmAuthApi } from '@/features/pm/api/auth';
import { companyService } from '@/features/pm/api/companies';
import { getPmToken } from '@/features/pm/api/client';
import { PmAppShell } from '@/features/pm/components/pm-app-shell';
import { PmScreenError, PmButton } from '@/features/pm/components/auth-ui';
import {
  BuildingIcon,
  CalendarIcon,
  ChevronRightIcon,
  LockIcon,
  LogOutIcon,
  MailIcon,
  PencilIcon,
  PhoneIcon,
  UserIcon,
} from '@/features/pm/components/icons';
import { usePmAuth } from '@/features/pm/hooks/usePmAuth';
import { pmRoleMeta } from '@/features/pm/types';
import { displayName, formatDate, initialsOf } from '@/features/pm/utils/profile';
import type { Company, PmUser } from '@/features/pm/types';

export default function PmPerfilScreen() {
  const router = useRouter();
  const { user, status, logout } = usePmAuth();

  // Perfil enriquecido (GET /auth/me) — trae username/firstName/lastName/createdAt.
  const [me, setMe] = useState<PmUser | null>(user);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [meError, setMeError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') return;
    const token = getPmToken();
    if (!token) return;

    pmAuthApi
      .me(token)
      .then(setMe)
      .catch((e: unknown) => {
        setMeError(e instanceof Error ? e.message : 'No se pudo cargar el perfil');
      });

    companyService
      .getAll()
      .then(setCompanies)
      .catch(() => {});
  }, [status]);

  const profile = me ?? user;
  const role = pmRoleMeta(profile?.roles?.[0]);
  const myCompanies = (profile?.scopes?.companyIds ?? [])
    .map((id) => companies.find((c) => c.id === id))
    .filter((c): c is Company => Boolean(c));

  return (
    <PmAppShell title="Perfil" subtitle="Cuenta y seguridad" hideTitle>
      <Text style={styles.eyebrow}>Perfil</Text>
      <Text style={styles.title}>Tu cuenta</Text>
      <Text style={styles.copy}>Datos personales, seguridad y sesión.</Text>

      {/* ─── Identidad ─────────────────────────────────────────────── */}
      <View style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={[styles.heroAvatar, { borderColor: role.color }]}>
            <Text style={[styles.heroAvatarText, { color: role.color }]}>
              {profile ? initialsOf(profile) : '?'}
            </Text>
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroName} numberOfLines={1}>
              {profile ? displayName(profile) : 'Cargando...'}
            </Text>
            <Text style={styles.heroEmail} numberOfLines={1}>
              {profile?.email ?? ''}
            </Text>
            <View style={styles.heroRoleRow}>
              <View style={[styles.roleBadge, { backgroundColor: role.color }]}>
                <Text style={styles.roleBadgeText}>{role.label}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {meError ? <PmScreenError message={meError} /> : null}

      {/* ─── Mi cuenta ─────────────────────────────────────────────── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Mi cuenta</Text>
        <View style={styles.row}>
          <UserIcon size={16} color={PmOpColors.inkSoft} />
          <Text style={styles.rowLabel}>Usuario</Text>
          <Text style={styles.rowValue} numberOfLines={1}>
            {profile?.username ?? '—'}
          </Text>
        </View>
        <View style={[styles.row, styles.rowBorder]}>
          <MailIcon size={16} color={PmOpColors.inkSoft} />
          <Text style={styles.rowLabel}>Email</Text>
          <Text style={styles.rowValue} numberOfLines={1}>
            {profile?.email ?? '—'}
          </Text>
        </View>
        <View style={[styles.row, styles.rowBorder]}>
          <PhoneIcon size={16} color={PmOpColors.inkSoft} />
          <Text style={styles.rowLabel}>Teléfono</Text>
          <Text style={styles.rowValue} numberOfLines={1}>
            {profile?.phone ?? '—'}
          </Text>
        </View>
        <View style={[styles.row, styles.rowBorder]}>
          <BuildingIcon size={16} color={PmOpColors.inkSoft} />
          <Text style={styles.rowLabel}>Empresa</Text>
          <Text style={styles.rowValue} numberOfLines={2}>
            {myCompanies.length > 0 ? myCompanies.map((c) => c.name).join(', ') : 'Sin empresa asignada'}
          </Text>
        </View>
        <View style={[styles.row, styles.rowBorder]}>
          <CalendarIcon size={16} color={PmOpColors.inkSoft} />
          <Text style={styles.rowLabel}>Desde</Text>
          <Text style={styles.rowValue} numberOfLines={1}>
            {formatDate(profile?.createdAt)}
          </Text>
        </View>
      </View>

      {/* ─── Accesos ───────────────────────────────────────────────── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Configuración</Text>

        <Pressable
          style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}
          onPress={() => router.push('/pm/perfil/editar')}>
          <PencilIcon size={17} color={PmOpColors.orangeDeep} />
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Editar perfil</Text>
            <Text style={styles.menuCopy}>Nombre, apellido, usuario y teléfono</Text>
          </View>
          <ChevronRightIcon size={16} color={PmOpColors.inkSoft} />
        </Pressable>

        <View style={styles.menuDivider} />

        <Pressable
          style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}
          onPress={() => router.push('/pm/perfil/seguridad')}>
          <LockIcon size={17} color={PmOpColors.orangeDeep} />
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Seguridad</Text>
            <Text style={styles.menuCopy}>Cambiar contraseña de acceso</Text>
          </View>
          <ChevronRightIcon size={16} color={PmOpColors.inkSoft} />
        </Pressable>
      </View>

      {/* ─── Sesión ─────────────────────────────────────────────────── */}
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <LogOutIcon size={15} color={PmOpColors.orangeDeep} />
          <Text style={styles.cardTitle}>Sesión</Text>
        </View>
        <Text style={styles.note}>
          Cerrás la sesión en este dispositivo. La próxima vez tendrás que volver a ingresar.
        </Text>
        <View style={styles.buttonWrap}>
          <PmButton label="Cerrar sesión" onPress={logout} variant="ghost" />
        </View>
      </View>
    </PmAppShell>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: PmOpColors.orangeDeep,
  },
  title: {
    fontFamily: FontFamilies.display,
    fontSize: 30,
    lineHeight: 32,
    color: PmOpColors.ink,
  },
  copy: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: PmOpColors.inkSoft,
    marginBottom: 16,
  },
  hero: {
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    backgroundColor: PmOpColors.surface,
    padding: 16,
    marginBottom: 14,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroAvatar: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    backgroundColor: 'rgba(217,119,47,0.08)',
  },
  heroAvatarText: {
    fontFamily: FontFamilies.display,
    fontSize: 22,
  },
  heroInfo: {
    flex: 1,
    minWidth: 0,
  },
  heroName: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 16,
    color: PmOpColors.ink,
  },
  heroEmail: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: PmOpColors.inkSoft,
  },
  heroRoleRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  roleBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 2,
  },
  roleBadgeText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
    letterSpacing: 0.4,
    color: '#ffffff',
  },
  card: {
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    backgroundColor: PmOpColors.surface,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: PmOpColors.ink,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: PmOpColors.divider,
  },
  rowLabel: {
    width: 78,
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: PmOpColors.inkSoft,
  },
  rowValue: {
    flex: 1,
    minWidth: 0,
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: PmOpColors.ink,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  menuInfo: {
    flex: 1,
    minWidth: 0,
  },
  menuTitle: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 13,
    color: PmOpColors.ink,
  },
  menuCopy: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: PmOpColors.inkSoft,
  },
  menuDivider: {
    height: 1,
    backgroundColor: PmOpColors.divider,
  },
  pressed: {
    opacity: 0.7,
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