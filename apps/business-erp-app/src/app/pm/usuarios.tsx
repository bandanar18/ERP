import { useCallback, useEffect, useMemo, useState } from 'react';
import { Redirect } from 'expo-router';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useCachedQuery } from '@/hooks/useCachedQuery';
import { useBreakpoint } from '@/hooks/useBreakpoint';

import { FontFamilies } from '@/constants/theme';
import { PmOpColors } from '@/features/pm/theme';
import { companyService } from '@/features/pm/api/companies';
import { moduleUserService } from '@/features/pm/api/users';
import { usePmAuth } from '@/features/pm/hooks/usePmAuth';
import { useNotify } from '@/features/pm/notifications/toast-provider';
import { PmAppShell } from '@/features/pm/components/pm-app-shell';
import {
  BuildingIcon,
  ListIcon,
  MedalIcon,
  PowerIcon,
  TableIcon,
  UserCogIcon,
} from '@/features/pm/components/icons';
import { canManage, isAdmin } from '@/features/pm/utils/roles';
import { PM_ROLE_META, pmRoleMeta } from '@/features/pm/types';
import type { Company, ModuleUser } from '@/features/pm/types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Roles del módulo disponibles como filtro + el grupo "sin rol". */
const ROLE_FILTERS = [
  { code: 'all', label: 'Todos' },
  ...PM_ROLE_META.map((r) => ({ code: r.code, label: r.label })),
  { code: 'none', label: 'Sin rol' },
];

/** Anchos (px) de las columnas de la vista tabla. La tabla scrollea horizontal. */
const COLUMNS = { user: 220, role: 130, company: 170, status: 90, actions: 150 };
const TABLE_WIDTH =
  COLUMNS.user + COLUMNS.role + COLUMNS.company + COLUMNS.status + COLUMNS.actions;

export default function PmUsuariosScreen() {
  const { user, status } = usePmAuth();
  const { notify } = useNotify();
  const { isTablet } = useBreakpoint();

  // Solo gestión/admin ven la página (misma restricción que la web).
  if (status === 'authenticated' && !canManage(user?.roles ?? [])) {
    return <Redirect href="/pm/sin-acceso" />;
  }

  const admin = status === 'authenticated' && isAdmin(user?.roles ?? []);

  
  
  
  
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');

  // Modal de gestión (rol + empresa)
  const [selectedUser, setSelectedUser] = useState<ModuleUser | null>(null);
  const [editRole, setEditRole] = useState<string>('');
  const [editCompany, setEditCompany] = useState<string>('none');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);



  const { data: usersData, loading, error: fetchError, refetch: loadUsers } = useCachedQuery(
    '/pm/users',
    async () => {
      if (status !== 'authenticated') return { users: [], companies: [] };
      const [uList, cList] = await Promise.all([
        moduleUserService.getAll(),
        companyService.getAll().catch(() => [])
      ]);
      return { users: uList, companies: cList };
    }
  );

  const users = usersData?.users || [];
  const companies = usersData?.companies || [];

  // Used to show error from the query
  useEffect(() => {
    if (fetchError) setError(fetchError.message);
  }, [fetchError]);

  /** Rol PM del usuario (primer pm_user_role) o null. */
  const roleOf = (u: ModuleUser) => u.pm_user_roles?.[0]?.pm_roles?.code ?? null;

  /** Primera empresa de los scopes del usuario. */
  const companyOf = (u: ModuleUser) => {
    const scope = u.scopes?.find((s) => s.companyId);
    return scope?.companyId ? (companies.find((c) => c.id === scope.companyId) ?? null) : null;
  };

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter === 'none' && (u.pm_user_roles?.length ?? 0) > 0) return false;
      if (roleFilter !== 'all' && roleFilter !== 'none' && roleOf(u) !== roleFilter) return false;
      if (!q) return true;
      const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.toLowerCase();
      return name.includes(q) || u.email.toLowerCase().includes(q);
    });
  }, [users, search, roleFilter]);

  const initials = (u: ModuleUser) =>
    `${u.firstName?.charAt(0) ?? ''}${u.lastName?.charAt(0) ?? ''}`.toUpperCase();

  const openManageDialog = (u: ModuleUser) => {
    setSelectedUser(u);
    setEditRole(roleOf(u) ?? '');
    setEditCompany(companyOf(u)?.id ?? 'none');
    setModalError(null);
  };

  const handleSaveChanges = async () => {
    if (!selectedUser) return;
    const roleChanged = roleOf(selectedUser) !== editRole;
    const companyChanged = (companyOf(selectedUser)?.id ?? 'none') !== editCompany;

    if (!roleChanged && !companyChanged) {
      setSelectedUser(null);
      return;
    }
    if (roleChanged && !editRole) {
      setModalError('Elegí un rol para este usuario.');
      return;
    }

    try {
      setSaving(true);
      setModalError(null);
      setError(null);
      setSuccessMsg(null);

      if (roleChanged) {
        await moduleUserService.updateRole(selectedUser.id, editRole);
      }
      if (companyChanged) {
        await moduleUserService.updateScopes(
          selectedUser.id,
          editCompany === 'none' ? [] : [{ companyId: editCompany, projectId: null }],
        );
      }

      notify('Usuario actualizado correctamente', 'success');
      setSelectedUser(null);
      loadUsers();
    } catch (e) {
      setModalError(e instanceof Error ? e.message : 'Error al actualizar usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (u: ModuleUser) => {
    try {
      setError(null);
      setSuccessMsg(null);
      await moduleUserService.toggleActive(u.id);
      notify(
        u.status === 'ACTIVE'
          ? 'Usuario desactivado correctamente'
          : 'Usuario activado correctamente',
        'success',
      );
      loadUsers();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Error al cambiar estado del usuario', 'error');
    }
  };



  const renderUser = ({ item }: { item: ModuleUser }) => {
    const active = item.status === 'ACTIVE';
    const role = pmRoleMeta(roleOf(item));
    const company = companyOf(item);

    return (
      <View style={isTablet ? styles.cardCell : undefined}>
        <View style={styles.card}>
          <View style={[styles.statusBar, { backgroundColor: active ? '#4c9b7a' : '#c85454' }]} />

        <View style={styles.cardHeader}>
          <View style={[styles.avatar, active ? styles.avatarActive : styles.avatarInactive]}>
            <Text style={[styles.avatarText, !active && styles.avatarTextInactive]}>
              {initials(item) || '?'}
            </Text>
          </View>
          <View style={styles.cardIdentity}>
            <Text style={styles.cardName} numberOfLines={1}>
              {item.firstName || item.lastName ? `${item.firstName ?? ''} ${item.lastName ?? ''}` : item.email}
            </Text>
            <Text style={styles.cardEmail} numberOfLines={1}>
              {item.email}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: active ? '#4c9b7a' : '#ece6dc' }]}>
            <Text style={[styles.badgeText, !active && styles.badgeTextInactive]}>
              {active ? 'Activo' : 'Inactivo'}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardRow}>
            <MedalIcon size={15} color={PmOpColors.orangeDeep} />
            <View style={[styles.roleBadge, { backgroundColor: role.color }]}>
              <Text style={styles.roleBadgeText}>{role.label}</Text>
            </View>
            <Text style={styles.cardRowLabel}>Rol del módulo</Text>
          </View>
          <View style={[styles.cardRow, styles.cardRowLast]}>
            <BuildingIcon size={15} color={PmOpColors.orangeDeep} />
            <Text style={styles.cardRowValue} numberOfLines={1}>
              {company?.name || 'Sin Empresa'}
            </Text>
            <Text style={styles.cardRowLabel}>Empresa</Text>
          </View>
        </View>

        {admin ? (
          <View style={styles.cardFooter}>
            <Pressable
              style={({ pressed }) => [styles.footerBtn, pressed && styles.pressed]}
              onPress={() => handleToggleActive(item)}>
              <PowerIcon size={13} color={active ? '#4c9b7a' : '#a84730'} />
              <Text style={[styles.footerBtnText, { color: active ? '#4c9b7a' : '#a84730' }]}>
                {active ? 'Desactivar' : 'Activar'}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.footerBtn, pressed && styles.pressed]}
              onPress={() => openManageDialog(item)}>
              <Text style={[styles.footerBtnText, { color: '#b9561d' }]}>Gestionar</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
    );
  };

  /** Fila del header de la vista tabla (títulos de columna). */
  const renderTableHeader = () => (
    <View style={styles.tableHeaderRow}>
      <Text style={[styles.tableHeaderCell, { width: COLUMNS.user }]}>Usuario</Text>
      <Text style={[styles.tableHeaderCell, { width: COLUMNS.role }]}>Rol</Text>
      <Text style={[styles.tableHeaderCell, { width: COLUMNS.company }]}>Empresa</Text>
      <Text style={[styles.tableHeaderCell, { width: COLUMNS.status }]}>Estado</Text>
      {admin ? <Text style={[styles.tableHeaderCell, { width: COLUMNS.actions }]}>Acciones</Text> : null}
    </View>
  );

  /** Fila de usuario de la vista tabla. */
  const renderTableRow = ({ item }: { item: ModuleUser }) => {
    const active = item.status === 'ACTIVE';
    const role = pmRoleMeta(roleOf(item));
    const company = companyOf(item);
    const name = item.firstName || item.lastName ? `${item.firstName ?? ''} ${item.lastName ?? ''}` : item.email;

    return (
      <View style={styles.tableRow}>
        <View style={[styles.tableCell, { width: COLUMNS.user }]}>
          <Text style={styles.tableName} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.tableEmail} numberOfLines={1}>
            {item.email}
          </Text>
        </View>

        <View style={[styles.tableCell, { width: COLUMNS.role }]}>
          <View style={[styles.roleBadge, { backgroundColor: role.color }]}>
            <Text style={styles.roleBadgeText}>{role.label}</Text>
          </View>
        </View>

        <View style={[styles.tableCell, { width: COLUMNS.company }]}>
          <Text style={styles.tableCompany} numberOfLines={1}>
            {company?.name || 'Sin Empresa'}
          </Text>
        </View>

        <View style={[styles.tableCell, { width: COLUMNS.status }]}>
          <View style={[styles.badge, { backgroundColor: active ? '#4c9b7a' : '#ece6dc' }]}>
            <Text style={[styles.badgeText, !active && styles.badgeTextInactive]}>
              {active ? 'Activo' : 'Inactivo'}
            </Text>
          </View>
        </View>

        {admin ? (
          <View style={[styles.tableCell, { width: COLUMNS.actions, gap: 6 }]}>
            <Pressable
              style={({ pressed }) => [styles.tableAction, pressed && styles.pressed]}
              onPress={() => handleToggleActive(item)}>
              <PowerIcon size={12} color={active ? '#4c9b7a' : '#a84730'} />
              <Text style={[styles.tableActionText, { color: active ? '#4c9b7a' : '#a84730' }]}>
                {active ? 'Desactivar' : 'Activar'}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.tableAction, pressed && styles.pressed]}
              onPress={() => openManageDialog(item)}>
              <UserCogIcon size={12} color="#b9561d" />
              <Text style={[styles.tableActionText, { color: '#b9561d' }]}>Gestionar</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <PmAppShell title="Gestión de Usuarios" subtitle="Sistema / Accesos" scrollable={false}>
      <View style={styles.headerRow}>
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre o email..."
          placeholderTextColor={PmOpColors.placeholder}
        />

      </View>

      

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsRow}
        contentContainerStyle={styles.chipsContent}>
        {ROLE_FILTERS.map((f) => {
          const active = roleFilter === f.code;
          return (
            <Pressable
              key={f.code}
              style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
              onPress={() => setRoleFilter(f.code)}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {error ? (
        <View style={[styles.banner, styles.bannerError]}>
          <Text style={[styles.bannerText, styles.bannerTextError]}>{error}</Text>
        </View>
      ) : null}
      {successMsg ? (
        <View style={[styles.banner, styles.bannerSuccess]}>
          <Text style={[styles.bannerText, styles.bannerTextSuccess]}>{successMsg}</Text>
        </View>
      ) : null}
      {status === 'authenticated' && !admin ? (
        <View style={[styles.banner, styles.bannerInfo]}>
          <Text style={[styles.bannerText, styles.bannerTextInfo]}>
            Modo solo lectura: solo el Administrador puede modificar usuarios.
          </Text>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={PmOpColors.orange} style={styles.loader} />
      ) : (
        <View style={styles.list}>
          <FlashList
            key={isTablet ? 'usuarios-grid-tablet' : 'usuarios-cards-phone'}
            {...({
              data: filteredUsers,
              keyExtractor: (u: ModuleUser) => u.id,
              renderItem: renderUser,
              numColumns: isTablet ? 2 : 1,
              ItemSeparatorComponent: isTablet ? undefined : () => <View style={styles.separator} />,
              contentContainerStyle: styles.listContent,
              ListEmptyComponent: <Text style={styles.empty}>No se encontraron usuarios.</Text>,
              estimatedItemSize: 140,
              ListHeaderComponent:
                filteredUsers.length > 0 ? (
                  <Text style={styles.counter}>
                    {filteredUsers.length} {filteredUsers.length === 1 ? 'usuario' : 'usuarios'}
                  </Text>
                ) : null,
            } as any)}
          />
        </View>
      )}

      {/* Modal de gestión: rol del módulo + empresa (scopes) */}
      <Modal
        visible={selectedUser !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedUser(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selectedUser ? (
              <>
                <View style={styles.modalHeader}>
                  <View
                    style={[
                      styles.avatar,
                      selectedUser.status === 'ACTIVE' ? styles.avatarActive : styles.avatarInactive,
                    ]}>
                    <Text style={[styles.avatarText, selectedUser.status !== 'ACTIVE' && styles.avatarTextInactive]}>
                      {initials(selectedUser) || '?'}
                    </Text>
                  </View>
                  <View style={styles.cardIdentity}>
                    <Text style={styles.cardName} numberOfLines={1}>
                      {selectedUser.firstName || selectedUser.lastName
                        ? `${selectedUser.firstName ?? ''} ${selectedUser.lastName ?? ''}`
                        : selectedUser.email}
                    </Text>
                    <Text style={styles.cardEmail} numberOfLines={1}>
                      {selectedUser.email}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: selectedUser.status === 'ACTIVE' ? '#4c9b7a' : '#ece6dc' },
                    ]}>
                    <Text
                      style={[
                        styles.badgeText,
                        selectedUser.status !== 'ACTIVE' && styles.badgeTextInactive,
                      ]}>
                      {selectedUser.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                    </Text>
                  </View>
                </View>

                <ScrollView style={styles.modalBody}>
                  <Text style={styles.modalEyebrow}>Sistema / Accesos</Text>
                  <Text style={styles.modalTitle}>Gestionar Usuario</Text>
                  <Text style={styles.modalCopy}>
                    Definí el rol del módulo y la empresa asignada a este usuario.
                  </Text>

                  {modalError ? (
                    <View style={[styles.banner, styles.bannerError]}>
                      <Text style={[styles.bannerText, styles.bannerTextError]}>{modalError}</Text>
                    </View>
                  ) : null}

                  <Text style={styles.modalLabel}>Rol del módulo</Text>
                  {PM_ROLE_META.map((r) => {
                    const active = editRole === r.code;
                    return (
                      <Pressable
                        key={r.code}
                        style={({ pressed }) => [
                          styles.optionRow,
                          active && styles.optionRowActive,
                          pressed && styles.pressed,
                        ]}
                        onPress={() => setEditRole(r.code)}>
                        <View style={[styles.optionRoleBadge, { backgroundColor: r.color }]}>
                          <Text style={styles.optionRoleBadgeText}>{r.label}</Text>
                        </View>
                        {active ? <Text style={styles.optionCheck}>✓</Text> : null}
                      </Pressable>
                    );
                  })}

                  <Text style={styles.modalLabel}>Empresa asignada</Text>
                  {[{ id: 'none', name: 'Sin Empresa' }, ...companies].map((c) => {
                    const active = editCompany === c.id;
                    return (
                      <Pressable
                        key={c.id}
                        style={({ pressed }) => [
                          styles.optionRow,
                          active && styles.optionRowActive,
                          pressed && styles.pressed,
                        ]}
                        onPress={() => setEditCompany(c.id)}>
                        <Text style={[styles.optionText, active && styles.optionTextActive]} numberOfLines={1}>
                          {c.name}
                        </Text>
                        {active ? <Text style={styles.optionCheck}>✓</Text> : null}
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <View style={styles.modalFooter}>
                  <Pressable
                    style={({ pressed }) => [styles.modalBtn, styles.modalBtnCancel, pressed && styles.pressed]}
                    onPress={() => setSelectedUser(null)}
                    disabled={saving}>
                    <Text style={styles.modalBtnCancelText}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.modalBtn, styles.modalBtnSave, pressed && styles.pressed]}
                    onPress={handleSaveChanges}
                    disabled={saving}>
                    <Text style={styles.modalBtnSaveText}>{saving ? 'Guardando...' : 'Guardar Cambios'}</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>


    </PmAppShell>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  search: {
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    backgroundColor: PmOpColors.surface,
    color: PmOpColors.ink,
    fontSize: 13,
    fontWeight: '500',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    backgroundColor: PmOpColors.orange,
    borderWidth: 1,
    borderColor: PmOpColors.orange,
  },
  createBtnText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: '#ffffff',
  },
  chipsRow: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: 12,
  },
  chipsContent: {
    gap: 8,
    paddingRight: 8,
    alignItems: 'center',
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    backgroundColor: PmOpColors.surface,
  },
  chipActive: {
    borderColor: PmOpColors.orange,
    backgroundColor: '#fff0eb',
  },
  chipText: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: PmOpColors.inkSoft,
  },
  chipTextActive: {
    fontFamily: FontFamilies.bodyBold,
    color: '#b9561d',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
  },
  bannerError: {
    borderColor: '#edb6a5',
    backgroundColor: '#fff0eb',
  },
  bannerSuccess: {
    borderColor: '#a7c9b4',
    backgroundColor: '#edf3ec',
  },
  bannerInfo: {
    borderColor: '#b9cfe4',
    backgroundColor: '#eef4fa',
  },
  bannerText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
  },
  bannerTextError: {
    color: '#a84730',
  },
  bannerTextSuccess: {
    color: '#376850',
  },
  bannerTextInfo: {
    color: '#3f6486',
  },
  loader: {
    marginTop: 40,
  },
  list: {
    flex: 1,
  },
  /* Toggle de vista (Lista / Tabla) */
  viewToggle: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    backgroundColor: PmOpColors.surface,
    marginBottom: 12,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: PmOpColors.rule,
  },
  viewBtnActive: {
    backgroundColor: '#fff0eb',
  },
  viewBtnText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: PmOpColors.inkSoft,
  },
  viewBtnTextActive: {
    color: PmOpColors.orangeDeep,
  },
  /* Vista tabla */
  tableWrap: {
    flex: 1,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: PmOpColors.orange,
    backgroundColor: PmOpColors.surface2,
    paddingVertical: 8,
  },
  tableHeaderCell: {
    paddingHorizontal: 8,
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: PmOpColors.ink,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: PmOpColors.rule,
    backgroundColor: PmOpColors.surface,
    paddingVertical: 8,
  },
  tableCell: {
    paddingHorizontal: 8,
  },
  tableName: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: PmOpColors.ink,
  },
  tableEmail: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: PmOpColors.inkSoft,
    marginTop: 2,
  },
  tableCompany: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: PmOpColors.ink,
  },
  tableAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  tableActionText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
  },
  tableFooter: {
    height: 24,
  },
  listContent: {
    paddingBottom: 24,
  },
  separator: {
    height: 10,
  },
  counter: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: PmOpColors.inkSoft,
    marginBottom: 10,
  },
  empty: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: PmOpColors.inkSoft,
    textAlign: 'center',
    marginTop: 30,
  },
  cardCell: {
    flex: 1,
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    backgroundColor: PmOpColors.surface,
    borderRadius: 8,
    overflow: 'hidden',
  },
  statusBar: {
    height: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: PmOpColors.divider,
  },
  avatar: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarActive: {
    borderWidth: 1,
    borderColor: PmOpColors.orange,
    backgroundColor: 'rgba(217,119,47,0.15)',
  },
  avatarInactive: {
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    backgroundColor: '#ece6dc',
  },
  avatarText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 14,
    color: '#b9561d',
  },
  avatarTextInactive: {
    color: '#8d918f',
  },
  cardIdentity: {
    flex: 1,
    minWidth: 0,
  },
  cardName: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 13,
    color: PmOpColors.ink,
  },
  cardEmail: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: PmOpColors.inkSoft,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#ffffff',
  },
  badgeTextInactive: {
    color: PmOpColors.inkSoft,
  },
  cardBody: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: PmOpColors.divider,
  },
  cardRowLast: {
    borderBottomWidth: 0,
  },
  cardRowValue: {
    flex: 1,
    minWidth: 0,
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: PmOpColors.ink,
  },
  cardRowLabel: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#8d918f',
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: PmOpColors.rule,
    backgroundColor: 'rgba(245,240,232,0.4)',
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  footerBtnText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17,20,22,0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    maxHeight: '86%',
    backgroundColor: PmOpColors.surface,
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: PmOpColors.rule,
    backgroundColor: 'rgba(245,240,232,0.4)',
  },
  modalBody: {
    padding: 16,
  },
  modalEyebrow: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: PmOpColors.orangeDeep,
  },
  modalTitle: {
    fontFamily: FontFamilies.display,
    fontSize: 18,
    color: PmOpColors.ink,
    marginTop: 2,
  },
  modalCopy: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: PmOpColors.inkSoft,
    marginBottom: 14,
  },
  modalLabel: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: PmOpColors.ink,
    marginTop: 12,
    marginBottom: 6,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    backgroundColor: PmOpColors.surface,
    marginBottom: 6,
  },
  optionRowActive: {
    borderColor: PmOpColors.orange,
    backgroundColor: '#fff0eb',
  },
  optionText: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: PmOpColors.ink,
  },
  optionTextActive: {
    fontFamily: FontFamilies.bodyBold,
  },
  optionCheck: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 13,
    color: PmOpColors.orangeDeep,
    marginLeft: 8,
  },
  optionRoleBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 2,
  },
  optionRoleBadgeText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    color: '#ffffff',
  },
  fieldInput: {
    height: 42,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    backgroundColor: PmOpColors.surface,
    color: PmOpColors.ink,
    fontSize: 13,
    fontWeight: '500',
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 8,
  },
  fieldHalf: {
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: PmOpColors.rule,
  },
  modalBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderWidth: 1,
  },
  modalBtnCancel: {
    borderColor: PmOpColors.rule,
    backgroundColor: PmOpColors.surface,
  },
  modalBtnCancelText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: PmOpColors.inkSoft,
  },
  modalBtnSave: {
    borderColor: PmOpColors.orange,
    backgroundColor: PmOpColors.orange,
  },
  modalBtnSaveText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: '#ffffff',
  },
});
