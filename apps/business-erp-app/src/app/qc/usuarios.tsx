import { Text, View, StyleSheet, FlatList, ActivityIndicator, Pressable, TextInput, Modal, Alert, ScrollView } from 'react-native';
import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useCachedQuery } from '@/hooks/useCachedQuery';
import { QcAppShell } from '@/features/qc/components/qc-app-shell';
import { QcOpColors } from '@/features/qc/theme';
import { FontFamilies } from '@/constants/theme';
import { userApi } from '@/features/qc/api/user';
import { adminApi, QcAdminProcess } from '@/features/qc/api/admin';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { 
  SearchIcon, UserPlusIcon, EditIcon, PencilIcon, ShieldCheckIcon, 
  SlidersHorizontalIcon, PowerIcon, RotateCcwIcon, Trash2Icon, CheckIcon, XIcon 
} from '@/features/qc/components/icons';

const ROLE_LABELS: Record<string, string> = {
  QC_ADMIN: 'Administrador',
  QC_DIRECTOR: 'Director',
  QC_OWNER: 'Responsable de Proceso',
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  QC_ADMIN: 'Administrador del Sistema de Calidad con control total sobre configuración y accesos.',
  QC_DIRECTOR: 'Supervisión ejecutiva, aprobación y consulta de informes consolidados.',
  QC_OWNER: 'Gestión operativa, seguimiento y registro de mediciones en procesos asignados.',
};

interface UserCardProps {
  item: any;
  onRoles: (user: any) => void;
  onScopes: (user: any) => void;
  onEdit: (user: any) => void;
  onToggle: (id: string, currentStatus: string) => void;
  onReset: (user: any) => void;
  onRemove: (user: any) => void;
  isToggling: boolean;
}

const UserCard = memo(function UserCard({
  item,
  onRoles,
  onScopes,
  onEdit,
  onToggle,
  onReset,
  onRemove,
  isToggling,
}: UserCardProps) {
  const formattedDate = useMemo(() => {
    try {
      return new Date(item.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return item.createdAt;
    }
  }, [item.createdAt]);

  const displayName = (item.firstName || item.lastName)
    ? `${item.firstName || ''} ${item.lastName || ''}`.trim()
    : item.email;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{item.email} {item.username ? `(@${item.username})` : ''}</Text>
          <Text style={styles.regDate}>Registrado el {formattedDate}</Text>
        </View>
        <View style={styles.statusWrap}>
          <View style={[styles.statusBadge, item.status === 'ACTIVE' ? styles.statusActive : styles.statusInactive]}>
            <Text style={[styles.statusText, item.status === 'ACTIVE' ? styles.statusTextActive : styles.statusTextInactive]}>
              {item.status === 'ACTIVE' ? 'Activo' : item.status === 'INACTIVE' ? 'Inactivo' : item.status}
            </Text>
          </View>
          {!item.emailVerified && item.status === 'ACTIVE' && (
            <View style={styles.statusBadgeUnverified}>
              <Text style={styles.statusTextUnverified}>Sin verificar</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.sectionWrap}>
        <Text style={styles.sectionTitle}>ROLES</Text>
        <View style={styles.chipWrap}>
          {(item.qc_user_roles || []).map((r: any) => (
            <View key={r.role?.id || r.role?.code} style={styles.roleChip}>
              <Text style={styles.roleChipText}>{ROLE_LABELS[r.role?.code] || r.role?.code}</Text>
            </View>
          ))}
          {(!item.qc_user_roles || item.qc_user_roles.length === 0) && <Text style={styles.emptyText}>Sin roles</Text>}
        </View>
      </View>

      <View style={styles.sectionWrap}>
        <Text style={styles.sectionTitle}>PROCESOS ALCANCE</Text>
        <View style={styles.chipWrap}>
          {(item.processAssignments || []).map((pa: any) => (
            <View key={pa.process?.id} style={styles.processChip}>
              <Text style={styles.processChipCode}>{pa.process?.code}</Text>
              <Text style={styles.processChipName}>{pa.process?.name}</Text>
            </View>
          ))}
          {(!item.processAssignments || item.processAssignments.length === 0) && <Text style={styles.emptyText}>Sin procesos asignados</Text>}
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Pressable style={styles.actionBtn} onPress={() => onRoles(item)}>
          <ShieldCheckIcon size={16} color={QcOpColors.accentDeep}/>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={() => onScopes(item)}>
          <SlidersHorizontalIcon size={16} color={QcOpColors.accentDeep}/>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={() => onEdit(item)}>
          <PencilIcon size={16} color={QcOpColors.accentDeep}/>
        </Pressable>
        <Pressable 
          style={[styles.actionBtn, item.status === 'ACTIVE' ? { borderColor: '#fde68a', backgroundColor: '#fef3c7' } : { borderColor: '#a7f3d0', backgroundColor: '#ecfdf5' }]} 
          onPress={() => onToggle(item.id, item.status)}
          disabled={isToggling}
        >
          {isToggling ? (
            <ActivityIndicator size="small" color={item.status === 'ACTIVE' ? '#b45309' : '#059669'} />
          ) : (
            <PowerIcon size={16} color={item.status === 'ACTIVE' ? '#b45309' : '#059669'}/>
          )}
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={() => onReset(item)}>
          <RotateCcwIcon size={16} color={QcOpColors.accentDeep}/>
        </Pressable>
        <Pressable style={[styles.actionBtn, { borderColor: '#fecaca', backgroundColor: '#fef2f2' }]} onPress={() => onRemove(item)}>
          <Trash2Icon size={16} color="#ef4444"/>
        </Pressable>
      </View>
    </View>
  );
});

export default function QcUsuariosScreen() {
  const { isTablet } = useBreakpoint();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const { data = { users: [], roles: [], processes: [] }, loading, refetch: loadData } = useCachedQuery(
    '/admin/users_roles_processes',
    async () => {
      const [usersRes, rolesRes, processesRes] = await Promise.all([
        userApi.list(),
        userApi.roles(),
        adminApi.listProcesses(),
      ]);
      return { 
        users: (usersRes as any).data || usersRes, 
        roles: (rolesRes as any).data || rolesRes,
        processes: (processesRes as any).data || processesRes,
      };
    }
  );

  const users = data.users || [];
  const roles = data.roles || [];
  const processes: QcAdminProcess[] = data.processes || [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u: any) => 
      u.email?.toLowerCase().includes(q) || 
      u.firstName?.toLowerCase().includes(q) ||
      u.lastName?.toLowerCase().includes(q)
    );
  }, [users, search]);

  const paginatedData = useMemo(() => {
    return filtered.slice(0, page * ITEMS_PER_PAGE);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  // Modals state
  const [activeModal, setActiveModal] = useState<'create' | 'editProfile' | 'roles' | 'scopes' | 'resetPass' | 'remove' | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isToggling, setIsToggling] = useState<string | null>(null);

  // Form states
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formConfirmPassword, setFormConfirmPassword] = useState('');
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  
  const [selectedRoleCodes, setSelectedRoleCodes] = useState<string[]>([]);
  const [selectedProcessIds, setSelectedProcessIds] = useState<string[]>([]);

  // Helpers
  const closeModals = () => {
    setActiveModal(null);
    setSelectedUser(null);
    setFormEmail('');
    setFormPassword('');
    setFormConfirmPassword('');
    setFormFirstName('');
    setFormLastName('');
    setFormUsername('');
    setSelectedRoleCodes([]);
    setSelectedProcessIds([]);
  };

  const openCreateModal = () => {
    closeModals();
    setActiveModal('create');
  };

  const handleCreateUser = async () => {
    if (!formEmail || formPassword.length < 8 || formPassword !== formConfirmPassword || selectedRoleCodes.length === 0) {
      Alert.alert('Error', 'Completa los campos obligatorios. La contraseña debe tener al menos 8 caracteres y coincidir.');
      return;
    }
    try {
      setIsSubmitting(true);
      await userApi.create({
        email: formEmail,
        password: formPassword,
        firstName: formFirstName,
        lastName: formLastName,
        username: formUsername,
        roleCodes: selectedRoleCodes,
        processIds: selectedProcessIds,
      });
      closeModals();
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo crear el usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditProfileModal = useCallback((user: any) => {
    setSelectedUser(user);
    setFormFirstName(user.firstName || '');
    setFormLastName(user.lastName || '');
    setFormUsername(user.username || '');
    setActiveModal('editProfile');
  }, []);

  const handleEditProfile = async () => {
    if (!selectedUser) return;
    try {
      setIsSubmitting(true);
      await userApi.updateProfile(selectedUser.id, {
        firstName: formFirstName.trim() || null,
        lastName: formLastName.trim() || null,
        username: formUsername.trim() || null,
      });
      closeModals();
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo actualizar el perfil');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRolesModal = useCallback((user: any) => {
    setSelectedUser(user);
    const userRoleCodes = (user.qc_user_roles || []).map((r: any) => r.role?.code || r.role);
    setSelectedRoleCodes(userRoleCodes);
    setActiveModal('roles');
  }, []);

  const toggleRoleCode = useCallback((code: string) => {
    setSelectedRoleCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }, []);

  const handleSaveRoles = async () => {
    if (!selectedUser) return;
    if (selectedRoleCodes.length === 0) {
      Alert.alert('Atención', 'Debes seleccionar al menos un rol.');
      return;
    }
    try {
      setIsSubmitting(true);
      const matchedRoleIds = roles
        .filter((r: any) => selectedRoleCodes.includes(r.code))
        .map((r: any) => r.id);
      const rolesPayload = matchedRoleIds.length > 0 ? matchedRoleIds : selectedRoleCodes;
      await userApi.updateUserRoles(selectedUser.id, rolesPayload);
      closeModals();
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudieron actualizar los roles');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openScopesModal = useCallback((user: any) => {
    setSelectedUser(user);
    const pIds = (user.processAssignments || []).map((pa: any) => pa.process?.id || pa.processId);
    setSelectedProcessIds(pIds);
    setActiveModal('scopes');
  }, []);

  const toggleProcessId = useCallback((id: string) => {
    setSelectedProcessIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  }, []);

  const handleSaveScopes = async () => {
    if (!selectedUser) return;
    try {
      setIsSubmitting(true);
      await userApi.updateUserScopes(selectedUser.id, selectedProcessIds);
      closeModals();
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudieron actualizar los alcances');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openResetPasswordModal = useCallback((user: any) => {
    setSelectedUser(user);
    setFormPassword('');
    setFormConfirmPassword('');
    setActiveModal('resetPass');
  }, []);

  const handleResetPassword = async () => {
    if (!selectedUser || formPassword.length < 8 || formPassword !== formConfirmPassword) {
      Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres y coincidir.');
      return;
    }
    try {
      setIsSubmitting(true);
      await userApi.resetPassword(selectedUser.id, formPassword);
      Alert.alert('Éxito', 'Contraseña actualizada');
      closeModals();
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo resetear la contraseña');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRemoveModal = useCallback((user: any) => {
    setSelectedUser(user);
    setActiveModal('remove');
  }, []);

  const handleRemoveUser = async () => {
    if (!selectedUser) return;
    try {
      setIsSubmitting(true);
      await userApi.remove(selectedUser.id);
      closeModals();
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo eliminar el usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = useCallback(async (id: string, currentStatus: string) => {
    Alert.alert(
      currentStatus === 'ACTIVE' ? 'Desactivar usuario' : 'Activar usuario',
      '¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Confirmar', 
          onPress: async () => {
            try {
              setIsToggling(id);
              await userApi.toggleActive(id);
              loadData();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'No se pudo cambiar el estado del usuario');
            } finally {
              setIsToggling(null);
            }
          }
        }
      ]
    );
  }, [loadData]);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <View style={isTablet ? styles.cardCell : undefined}>
      <UserCard
        item={item}
        onRoles={openRolesModal}
        onScopes={openScopesModal}
        onEdit={openEditProfileModal}
        onToggle={handleToggleActive}
        onReset={openResetPasswordModal}
        onRemove={openRemoveModal}
        isToggling={isToggling === item.id}
      />
    </View>
  ), [openRolesModal, openScopesModal, openEditProfileModal, handleToggleActive, openResetPasswordModal, openRemoveModal, isToggling, isTablet]);

  return (
    <QcAppShell title="Usuarios y Roles" subtitle="Gestión de accesos y permisos" scrollable={false}>
      <View style={styles.headerRow}>
        <View style={styles.searchBox}>
          <SearchIcon size={16} color={QcOpColors.inkSoft} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Buscar usuario..."
            placeholderTextColor={QcOpColors.placeholder}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <Pressable style={styles.addButton} onPress={openCreateModal}>
          <UserPlusIcon size={16} color={QcOpColors.white} />
          <Text style={styles.addText}>Nuevo</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={QcOpColors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          key={isTablet ? 'tablet-grid' : 'phone-list'}
          data={paginatedData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={isTablet ? 2 : 1}
          columnWrapperStyle={isTablet ? styles.columnWrapper : undefined}
          contentContainerStyle={styles.listContainer}
          onEndReached={() => setPage((p) => p + 1)}
          onEndReachedThreshold={0.5}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          ListEmptyComponent={
            filtered.length === 0 ? (
              <Text style={styles.empty}>No se encontraron usuarios.</Text>
            ) : null
          }
        />
      )}

      {/* CREATE USER MODAL */}
      <Modal visible={activeModal === 'create'} animationType="fade" transparent={true} onRequestClose={closeModals}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo Usuario</Text>
              <Pressable onPress={closeModals}><XIcon size={20} color={QcOpColors.inkSoft}/></Pressable>
            </View>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput style={styles.modalInput} placeholder="usuario@empresa.com" placeholderTextColor={QcOpColors.placeholder} value={formEmail} onChangeText={setFormEmail} keyboardType="email-address" autoCapitalize="none" />
              <Text style={styles.inputLabel}>Nombre</Text>
              <TextInput style={styles.modalInput} placeholder="María" placeholderTextColor={QcOpColors.placeholder} value={formFirstName} onChangeText={setFormFirstName} />
              <Text style={styles.inputLabel}>Apellido</Text>
              <TextInput style={styles.modalInput} placeholder="Pérez" placeholderTextColor={QcOpColors.placeholder} value={formLastName} onChangeText={setFormLastName} />
              <Text style={styles.inputLabel}>Usuario (username)</Text>
              <TextInput style={styles.modalInput} placeholder="mperez" placeholderTextColor={QcOpColors.placeholder} value={formUsername} onChangeText={setFormUsername} autoCapitalize="none" />
              <Text style={styles.inputLabel}>Contraseña *</Text>
              <TextInput style={styles.modalInput} placeholder="Mínimo 8 caracteres" placeholderTextColor={QcOpColors.placeholder} value={formPassword} onChangeText={setFormPassword} secureTextEntry />
              <Text style={styles.inputLabel}>Confirmar contraseña *</Text>
              <TextInput style={[styles.modalInput, formPassword !== formConfirmPassword && formConfirmPassword.length > 0 && { borderColor: '#fca5a5' }]} placeholder="Repite la contraseña" placeholderTextColor={QcOpColors.placeholder} value={formConfirmPassword} onChangeText={setFormConfirmPassword} secureTextEntry />
              
              <Text style={styles.inputLabel}>Roles *</Text>
              <View style={styles.selectionList}>
                {roles.map((r: any) => {
                  const isSelected = selectedRoleCodes.includes(r.code);
                  return (
                    <Pressable key={r.id} style={[styles.selectableItem, isSelected && styles.selectableItemActive]} onPress={() => toggleRoleCode(r.code)}>
                      <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                        {isSelected && <CheckIcon size={12} color={QcOpColors.white} />}
                      </View>
                      <Text style={styles.selectableText}>{ROLE_LABELS[r.code] || r.code}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Procesos asignados</Text>
              <View style={styles.selectionList}>
                {processes.length === 0 && <Text style={styles.emptyText}>No hay procesos disponibles.</Text>}
                {processes.map((p: any) => {
                  const isSelected = selectedProcessIds.includes(p.id);
                  return (
                    <Pressable key={p.id} style={[styles.selectableItem, isSelected && styles.selectableItemActive]} onPress={() => toggleProcessId(p.id)}>
                      <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                        {isSelected && <CheckIcon size={12} color={QcOpColors.white} />}
                      </View>
                      <View style={styles.processChip}>
                        <Text style={styles.processChipCode}>{p.code}</Text>
                        <Text style={styles.processChipName}>{p.name}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalBtnCancel]} onPress={closeModals} disabled={isSubmitting}>
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={handleCreateUser} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color={QcOpColors.white} size="small" /> : <Text style={styles.modalBtnPrimaryText}>Crear</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* EDIT PROFILE MODAL */}
      <Modal visible={activeModal === 'editProfile'} animationType="fade" transparent={true} onRequestClose={closeModals}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Editar perfil</Text>
                <Text style={styles.modalSubtitle}>{selectedUser?.email}</Text>
              </View>
              <Pressable onPress={closeModals}><XIcon size={20} color={QcOpColors.inkSoft}/></Pressable>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Nombre</Text>
              <TextInput style={styles.modalInput} value={formFirstName} onChangeText={setFormFirstName} />
              <Text style={styles.inputLabel}>Apellido</Text>
              <TextInput style={styles.modalInput} value={formLastName} onChangeText={setFormLastName} />
              <Text style={styles.inputLabel}>Usuario (username)</Text>
              <TextInput style={styles.modalInput} value={formUsername} onChangeText={setFormUsername} autoCapitalize="none" />
            </View>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalBtnCancel]} onPress={closeModals} disabled={isSubmitting}>
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={handleEditProfile} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color={QcOpColors.white} size="small" /> : <Text style={styles.modalBtnPrimaryText}>Guardar</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* EDIT ROLES MODAL */}
      <Modal visible={activeModal === 'roles'} animationType="fade" transparent={true} onRequestClose={closeModals}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Roles de usuario</Text>
                <Text style={styles.modalSubtitle}>{selectedUser?.email}</Text>
              </View>
              <Pressable onPress={closeModals}><XIcon size={20} color={QcOpColors.inkSoft}/></Pressable>
            </View>
            <ScrollView style={styles.modalScroll}>
              <View style={styles.selectionListColumn}>
                {roles.map((r: any) => {
                  const isSelected = selectedRoleCodes.includes(r.code);
                  return (
                    <Pressable key={r.id} style={[styles.selectableItemLarge, isSelected && styles.selectableItemActive]} onPress={() => toggleRoleCode(r.code)}>
                      <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                        {isSelected && <CheckIcon size={12} color={QcOpColors.white} />}
                      </View>
                      <View>
                        <Text style={styles.selectableTextLarge}>{ROLE_LABELS[r.code] || r.code}</Text>
                        <Text style={styles.selectableDesc}>{ROLE_DESCRIPTIONS[r.code] || r.description || r.code}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalBtnCancel]} onPress={closeModals} disabled={isSubmitting}>
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable 
                style={[styles.modalBtn, styles.modalBtnPrimary, (isSubmitting || selectedRoleCodes.length === 0) && { opacity: 0.6 }]} 
                onPress={handleSaveRoles} 
                disabled={isSubmitting || selectedRoleCodes.length === 0}
              >
                {isSubmitting ? <ActivityIndicator color={QcOpColors.white} size="small" /> : <Text style={styles.modalBtnPrimaryText}>Guardar</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* EDIT SCOPES MODAL */}
      <Modal visible={activeModal === 'scopes'} animationType="fade" transparent={true} onRequestClose={closeModals}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Alcance por procesos</Text>
                <Text style={styles.modalSubtitle}>{selectedUser?.email}</Text>
              </View>
              <Pressable onPress={closeModals}><XIcon size={20} color={QcOpColors.inkSoft}/></Pressable>
            </View>
            <ScrollView style={styles.modalScroll}>
              <View style={styles.selectionListColumn}>
                {processes.length === 0 && <Text style={styles.emptyText}>No hay procesos disponibles.</Text>}
                {processes.map((p: any) => {
                  const isSelected = selectedProcessIds.includes(p.id);
                  return (
                    <Pressable key={p.id} style={[styles.selectableItemLarge, isSelected && styles.selectableItemActive]} onPress={() => toggleProcessId(p.id)}>
                      <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                        {isSelected && <CheckIcon size={12} color={QcOpColors.white} />}
                      </View>
                      <View>
                        <Text style={styles.selectableTextLarge}>{p.name}</Text>
                        <Text style={styles.selectableDesc}>{p.code}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalBtnCancel]} onPress={closeModals} disabled={isSubmitting}>
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={handleSaveScopes} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color={QcOpColors.white} size="small" /> : <Text style={styles.modalBtnPrimaryText}>Guardar</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* RESET PASSWORD MODAL */}
      <Modal visible={activeModal === 'resetPass'} animationType="fade" transparent={true} onRequestClose={closeModals}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Resetear contraseña</Text>
                <Text style={styles.modalSubtitle}>{selectedUser?.email}</Text>
              </View>
              <Pressable onPress={closeModals}><XIcon size={20} color={QcOpColors.inkSoft}/></Pressable>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Nueva contraseña *</Text>
              <TextInput style={styles.modalInput} placeholder="Mínimo 8 caracteres" placeholderTextColor={QcOpColors.placeholder} value={formPassword} onChangeText={setFormPassword} secureTextEntry />
              <Text style={styles.inputLabel}>Confirmar contraseña *</Text>
              <TextInput style={[styles.modalInput, formPassword !== formConfirmPassword && formConfirmPassword.length > 0 && { borderColor: '#fca5a5' }]} placeholder="Repite la contraseña" placeholderTextColor={QcOpColors.placeholder} value={formConfirmPassword} onChangeText={setFormConfirmPassword} secureTextEntry />
            </View>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalBtnCancel]} onPress={closeModals} disabled={isSubmitting}>
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={handleResetPassword} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color={QcOpColors.white} size="small" /> : <Text style={styles.modalBtnPrimaryText}>Actualizar</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* REMOVE USER MODAL */}
      <Modal visible={activeModal === 'remove'} animationType="fade" transparent={true} onRequestClose={closeModals}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center' }}>
                  <Trash2Icon size={20} color="#ef4444" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Eliminar usuario</Text>
                  <Text style={styles.modalSubtitle}>{selectedUser?.email}</Text>
                </View>
              </View>
              <Pressable onPress={closeModals}><XIcon size={20} color={QcOpColors.inkSoft}/></Pressable>
            </View>
            <View style={styles.modalBody}>
              <Text style={{ fontFamily: FontFamilies.body, fontSize: 13, color: QcOpColors.inkSoft, lineHeight: 20 }}>
                El usuario quedará <Text style={{ fontFamily: FontFamilies.bodyBold, color: QcOpColors.ink }}>desactivado</Text> y marcado como eliminado. Su historial de mediciones se conserva (borrado lógico).
              </Text>
            </View>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalBtnCancel]} onPress={closeModals} disabled={isSubmitting}>
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: '#ef4444' }]} onPress={handleRemoveUser} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color={QcOpColors.white} size="small" /> : <Text style={styles.modalBtnPrimaryText}>Eliminar</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </QcAppShell>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: QcOpColors.surface, borderWidth: 1, borderColor: QcOpColors.rule, paddingHorizontal: 12, height: 44, borderRadius: 8 },
  searchInput: { flex: 1, marginLeft: 8, fontFamily: FontFamilies.body, fontSize: 14, color: QcOpColors.ink },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: QcOpColors.accent, paddingHorizontal: 16, height: 44, justifyContent: 'center', borderRadius: 8 },
  addText: { fontFamily: FontFamilies.bodyBold, color: QcOpColors.white, fontSize: 12, textTransform: 'uppercase' },
  listContainer: { gap: 12, paddingBottom: 40 },
  columnWrapper: { gap: 12 },
  cardCell: { flex: 1 },
  
  card: { backgroundColor: QcOpColors.surface, padding: 16, borderWidth: 1, borderColor: QcOpColors.rule, borderRadius: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cardHeaderLeft: { flex: 1, paddingRight: 12 },
  userName: { fontFamily: FontFamilies.display, fontSize: 16, color: QcOpColors.ink },
  userEmail: { fontFamily: FontFamilies.body, fontSize: 12, color: QcOpColors.inkSoft, marginTop: 2 },
  regDate: { fontFamily: FontFamilies.body, fontSize: 11, color: QcOpColors.placeholder, marginTop: 4 },
  
  statusWrap: { alignItems: 'flex-end', gap: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, borderWidth: 1 },
  statusActive: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  statusInactive: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },
  statusText: { fontFamily: FontFamilies.bodyBold, fontSize: 10 },
  statusTextActive: { color: '#047857' },
  statusTextInactive: { color: '#475569' },
  statusBadgeUnverified: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, borderWidth: 1, backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  statusTextUnverified: { fontFamily: FontFamilies.bodyBold, fontSize: 10, color: '#b45309' },

  sectionWrap: { marginBottom: 12 },
  sectionTitle: { fontFamily: FontFamilies.bodyBold, fontSize: 11, color: QcOpColors.inkSoft, marginBottom: 6 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  roleChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f8fafc', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  roleChipText: { fontFamily: FontFamilies.bodyBold, fontSize: 10, color: '#475569', textTransform: 'uppercase' },
  processChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: QcOpColors.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: QcOpColors.rule },
  processChipCode: { fontFamily: FontFamilies.bodyBold, fontSize: 10, color: QcOpColors.accentDeep, backgroundColor: '#ecfdf5', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
  processChipName: { fontFamily: FontFamilies.bodyBold, fontSize: 11, color: QcOpColors.ink },
  emptyText: { fontFamily: FontFamilies.body, fontSize: 11, color: QcOpColors.placeholder },
  empty: { textAlign: 'center', marginTop: 40, fontFamily: FontFamilies.body, fontSize: 13, color: QcOpColors.placeholder },

  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderColor: QcOpColors.rule },
  actionBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: QcOpColors.rule, backgroundColor: QcOpColors.surface, justifyContent: 'center', alignItems: 'center' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(11, 31, 22, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { backgroundColor: QcOpColors.surface, padding: 20, width: '100%', maxWidth: 480, maxHeight: '90%', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle: { fontFamily: FontFamilies.display, fontSize: 18, color: QcOpColors.ink },
  modalSubtitle: { fontFamily: FontFamilies.body, fontSize: 12, color: QcOpColors.inkSoft, marginTop: 2 },
  modalBody: { paddingBottom: 16 },
  modalScroll: { maxHeight: '100%' },
  
  inputLabel: { fontFamily: FontFamilies.bodyBold, fontSize: 11, color: QcOpColors.inkSoft, marginBottom: 6, marginTop: 12 },
  modalInput: { height: 40, borderRadius: 8, borderWidth: 1, borderColor: QcOpColors.rule, paddingHorizontal: 12, fontFamily: FontFamilies.body, fontSize: 13, color: QcOpColors.ink, backgroundColor: QcOpColors.white },
  
  selectionList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 4 },
  selectionListColumn: { flexDirection: 'column', gap: 8, paddingVertical: 4 },
  selectableItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: QcOpColors.rule, backgroundColor: QcOpColors.white },
  selectableItemLarge: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: QcOpColors.rule, backgroundColor: QcOpColors.white },
  selectableItemActive: { borderColor: QcOpColors.accentLight, backgroundColor: '#f0faf5' },
  checkbox: { width: 16, height: 16, borderRadius: 4, borderWidth: 1, borderColor: QcOpColors.rule, justifyContent: 'center', alignItems: 'center', backgroundColor: QcOpColors.white },
  checkboxActive: { borderColor: QcOpColors.accent, backgroundColor: QcOpColors.accent },
  selectableText: { fontFamily: FontFamilies.bodyBold, fontSize: 12, color: QcOpColors.ink },
  selectableTextLarge: { fontFamily: FontFamilies.bodyBold, fontSize: 13, color: QcOpColors.ink },
  selectableDesc: { fontFamily: FontFamilies.body, fontSize: 11, color: QcOpColors.inkSoft, marginTop: 2 },
  
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderColor: '#eef4f0' },
  modalBtn: { paddingHorizontal: 16, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 8, minWidth: 80 },
  modalBtnCancel: { backgroundColor: QcOpColors.surface, borderWidth: 1, borderColor: QcOpColors.rule },
  modalBtnCancelText: { fontFamily: FontFamilies.bodyBold, fontSize: 12, color: QcOpColors.ink },
  modalBtnPrimary: { backgroundColor: QcOpColors.accent },
  modalBtnPrimaryText: { fontFamily: FontFamilies.bodyBold, fontSize: 12, color: QcOpColors.white },
});
