import React, { useState, useMemo, useEffect } from 'react';
import { useAuthStore } from '../../shared/store/auth.store';
import {
  Users,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCog,
  Building2,
  Calendar,
  ChevronRight,
  Save,
  Loader2,
  AlertTriangle,
  Search,
  Settings2,
  UserCheck,
} from 'lucide-react';
import { Card, CardContent } from '@/features/executive/components/ui/card';
import { Button } from '@/features/executive/components/ui/button';
import { Badge } from '@/features/executive/components/ui/badge';
import { Avatar, AvatarFallback } from '@/features/executive/components/ui/avatar';
import { Input } from '@/features/executive/components/ui/input';
import { Checkbox } from '@/features/executive/components/ui/checkbox';
import { Separator } from '@/features/executive/components/ui/separator';
import { ScrollArea } from '@/features/executive/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/features/executive/components/ui/dialog';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { BasicPagination, usePagination } from '../../components/evilcharts/blocks/basic-pagination';
import {
  useUsers,
  useRoles,
  usePermissions,
  useUpdateUserRoles,
  useUpdateUserScopes,
  useUpdateRolePermissions,
  useAllProcesses,
} from '../../shared/hooks/useUsers';
import type { User, Role, Permission } from '../../shared/api/users.api';

/* ─── Constants ─── */

const PAGE_SIZE = 12;

const PERMISSION_LABELS: Record<string, string> = {
  VIEW_DASHBOARD: 'Ver Dashboard',
  SUBMIT_MEASUREMENT: 'Cargar Medición',
  MANAGE_USERS: 'Gestionar Usuarios',
  MANAGE_STRUCTURE: 'Gestionar Estructura',
  MANAGE_INDICATORS: 'Gestionar Indicadores',
  MANAGE_PERIODS: 'Gestionar Períodos',
  REVIEW_MEASUREMENTS: 'Revisar Mediciones',
  VIEW_REPORTS: 'Ver Informes',
  VIEW_AUDIT_LOG: 'Ver Bitácora',
};

const ROLE_LABELS: Record<string, { label: string; icon: React.ReactNode; variant: 'danger' | 'info' | 'warning' | 'neutral' }> = {
  ADMIN:         { label: 'Administrador',    icon: <ShieldAlert className="h-3 w-3" />, variant: 'danger' },
  DIRECTOR:      { label: 'Director',         icon: <ShieldCheck className="h-3 w-3" />, variant: 'info' },
  PROCESS_OWNER: { label: 'Dueño de Proceso', icon: <UserCog    className="h-3 w-3" />, variant: 'warning' },
};

/* ─── Helpers ─── */

function getUserInitials(email: string): string {
  return email.substring(0, 2).toUpperCase();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/* ─── Edit User Dialog ─── */

interface EditUserDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  roles: Role[];
  allProcesses: Array<{ id: string; name: string; code: string }>;
  permissions: Permission[];
}

function EditUserDialog({
  user,
  isOpen,
  onClose,
  currentUserId,
  roles,
  allProcesses,
  permissions,
}: EditUserDialogProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedProcessIds, setSelectedProcessIds] = useState<string[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'roles' | 'procesos' | 'permisos'>('roles');
  const [saving, setSaving] = useState(false);

  const updateRoles = useUpdateUserRoles();
  const updateScopes = useUpdateUserScopes();
  const updatePerms = useUpdateRolePermissions();

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      setSelectedRoles(user.roles.map(r => r.role.code));
      setSelectedProcessIds(user.processAssignments.map(pa => pa.process.id));
      // Default to first role's permissions — use permission IDs, not codes
      const firstRole = user.roles[0]?.role;
      if (firstRole) {
        const role = roles.find(r => r.id === firstRole.id);
        setSelectedPermissions(role?.permissions?.map((p: any) => p.permission.id) ?? []);
      }
    }
  }, [user, roles]);

  // Self-protection check
  const isSelf = user?.id === currentUserId;

  const handleSaveRoles = async () => {
    if (!user) return;

    // Prevent removing last ADMIN from self
    if (isSelf && !selectedRoles.includes('ADMIN') && user.roles.some(r => r.role.code === 'ADMIN')) {
      toast.error('No puedes quitarte el rol de Administrador a ti mismo');
      return;
    }

    setSaving(true);
    try {
      await updateRoles.mutateAsync({ userId: user.id, roles: selectedRoles });
      toast.success('Roles actualizados correctamente');
    } catch (err: any) {
      toast.error(err?.message || 'Error al actualizar roles');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveScopes = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateScopes.mutateAsync({ userId: user.id, processIds: selectedProcessIds });
      toast.success('Procesos asignados correctamente');
    } catch (err: any) {
      toast.error(err?.message || 'Error al asignar procesos');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!user) return;
    const firstRole = user.roles[0];
    if (!firstRole) {
      toast.error('El usuario debe tener al menos un rol para gestionar permisos');
      return;
    }
    setSaving(true);
    try {
      await updatePerms.mutateAsync({
        roleId: firstRole.role.id,
        permissionIds: selectedPermissions,
      });
      toast.success('Permisos actualizados correctamente');
    } catch (err: any) {
      toast.error(err?.message || 'Error al actualizar permisos');
    } finally {
      setSaving(false);
    }
  };

  const toggleRole = (code: string) => {
    setSelectedRoles(prev =>
      prev.includes(code) ? prev.filter(r => r !== code) : [...prev, code],
    );
  };

  const toggleProcess = (id: string) => {
    setSelectedProcessIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id],
    );
  };

  const togglePermission = (id: string) => {
    setSelectedPermissions(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id],
    );
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 rounded-lg bg-primary/10">
              <AvatarFallback className="rounded-lg text-sm font-bold text-primary">
                {getUserInitials(user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <DialogTitle className="text-lg truncate">{user.email}</DialogTitle>
              <DialogDescription className="text-xs">
                {user.organization?.name ?? 'CORP_MAIN'} · Registrado {formatDate(user.createdAt)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border/40 pb-1">
          {(['roles', 'procesos', 'permisos'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-sm font-medium rounded-t-md transition-colors ${
                activeTab === tab
                  ? 'bg-primary/10 text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {tab === 'roles' ? 'Roles' : tab === 'procesos' ? 'Procesos' : 'Permisos'}
            </button>
          ))}
        </div>

        <ScrollArea className="max-h-[50vh] pr-4">
          {/* Roles Tab */}
          {activeTab === 'roles' && (
            <div className="space-y-3 pt-2">
              <p className="text-sm text-muted-foreground">
                Selecciona uno o más roles para este usuario. Los cambios afectarán sus permisos.
              </p>

              {isSelf && user.roles.some(r => r.role.code === 'ADMIN') && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 text-amber-800 rounded-md border border-amber-200 text-sm">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>No puedes quitarte el rol de Administrador a ti mismo.</span>
                </div>
              )}

              {roles.map(role => {
                const isSelected = selectedRoles.includes(role.code);
                const roleInfo = ROLE_LABELS[role.code] ?? {
                  label: role.code,
                  icon: <Shield className="h-3 w-3" />,
                  variant: 'outline' as const,
                };
                const isDisabled = isSelf && role.code === 'ADMIN' && !isSelected;

                return (
                  <label
                    key={role.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border/40 hover:border-border'
                    } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Checkbox
                      checked={isSelected}
                      disabled={isDisabled}
                      onCheckedChange={() => !isDisabled && toggleRole(role.code)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant={roleInfo.variant} className="gap-1 text-[10px]">
                          {roleInfo.icon}
                          {roleInfo.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
                    </div>
                  </label>
                );
              })}

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSaveRoles}
                  disabled={saving}
                  size="sm"
                  className="gap-1.5"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Guardar Roles
                </Button>
              </div>
            </div>
          )}

          {/* Processes Tab */}
          {activeTab === 'procesos' && (
            <div className="space-y-3 pt-2">
              <p className="text-sm text-muted-foreground">
                Asigna procesos a este usuario para limitar su alcance de operación.
              </p>

              {allProcesses.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No hay procesos disponibles
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {allProcesses.map(process => {
                    const isSelected = selectedProcessIds.includes(process.id);
                    return (
                      <label
                        key={process.id}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-primary/40 bg-primary/5'
                            : 'border-border/40 hover:border-border'
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleProcess(process.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{process.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{process.code}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSaveScopes}
                  disabled={saving}
                  size="sm"
                  className="gap-1.5"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Guardar Procesos
                </Button>
              </div>
            </div>
          )}

          {/* Permissions Tab */}
          {activeTab === 'permisos' && (
            <div className="space-y-3 pt-2">
              <p className="text-sm text-muted-foreground">
                Los permisos se asignan a nivel de rol. Los cambios afectarán a todos los usuarios con el mismo rol.
              </p>

              {user.roles.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  El usuario debe tener al menos un rol para gestionar permisos
                </p>
              ) : (
                <>
                  <p className="text-xs font-medium text-muted-foreground">
                    Rol: <span className="text-foreground">{user.roles.map(r => ROLE_LABELS[r.role.code]?.label ?? r.role.code).join(', ')}</span>
                  </p>

                  {permissions.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No hay permisos disponibles
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {permissions.map(perm => {
                        const isSelected = selectedPermissions.includes(perm.id);
                        return (
                          <label
                            key={perm.id}
                            className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                              isSelected
                                ? 'border-primary/40 bg-primary/5'
                                : 'border-border/40 hover:border-border'
                            }`}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => togglePermission(perm.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{perm.description || PERMISSION_LABELS[perm.code] || perm.code}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">{PERMISSION_LABELS[perm.code] || perm.code}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={handleSavePermissions}
                      disabled={saving || user.roles.length === 0}
                      size="sm"
                      className="gap-1.5"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Guardar Permisos
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="border-t border-border/30 pt-4">
          <Button variant="outline" onClick={onClose} size="sm">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── User Card ─── */

function UserCard({
  user,
  onEdit,
  currentUserId,
}: {
  user: User;
  onEdit: (user: User) => void;
  currentUserId: string;
}) {
  const isSelf = user.id === currentUserId;
  const isActive = user.status === 'ACTIVE';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Card className="border-border/40 hover:border-primary/30 transition-all duration-300 hover:shadow-md overflow-hidden h-full">
        <CardContent className="p-0">
          {/* Header */}
          <div className="p-4 pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 ring-1 ring-primary/10">
                  <AvatarFallback className="rounded-lg text-sm font-bold text-primary">
                    {getUserInitials(user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{user.email}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Building2 className="h-3 w-3" />
                    {user.organization?.name ?? 'CORP_MAIN'}
                  </p>
                </div>
              </div>

              {/* Status dot */}
              <div className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${
                isActive ? 'bg-green-500' : 'bg-gray-300'
              }`} />
            </div>
          </div>

          <Separator />

          {/* Roles */}
          <div className="px-4 py-2.5">
            <div className="flex flex-wrap gap-1">
              {user.roles.length === 0 ? (
                <span className="text-[10px] text-muted-foreground italic">Sin roles</span>
              ) : (
                user.roles.map(({ role }) => {
                  const info = ROLE_LABELS[role.code] ?? {
                    label: role.code,
                    icon: <Shield className="h-3 w-3" />,
                    variant: 'outline' as const,
                  };
                  return (
                    <Badge key={role.id} variant={info.variant} className="gap-1 text-[10px]">
                      {info.icon}
                      {info.label}
                    </Badge>
                  );
                })
              )}
              {isSelf && (
                <Badge variant="outline" className="gap-1 text-[10px] border-sky-500/35 bg-sky-500/10 text-sky-700 dark:border-sky-400/35 dark:bg-sky-400/15 dark:text-sky-200">
                  <UserCheck className="h-3 w-3" />
                  Tú
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Footer */}
          <div className="px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {formatDate(user.createdAt)}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onEdit(user)}
            >
              <Settings2 className="h-3 w-3" />
              Gestionar
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ─── Main Page ─── */

export function AccessManagementPage() {
  const { user: currentUser } = useAuthStore();
  const currentUserId = currentUser?.id ?? '';

  const { data: users, isLoading: loading, error } = useUsers();
  const { data: roles = [] } = useRoles();
  const { data: permissions = [] } = usePermissions();
  const { data: allProcesses = [] } = useAllProcesses();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Filter users by search
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      u =>
        u.email.toLowerCase().includes(q) ||
        u.roles.some(r => r.role.code.toLowerCase().includes(q)) ||
        u.organization?.name?.toLowerCase().includes(q),
    );
  }, [users, search]);

  // Pagination
  const { totalPages, paginatedItems } = usePagination(filteredUsers, PAGE_SIZE);
  const visibleUsers = paginatedItems(page);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Reset page when total pages change
  useEffect(() => {
    if (page > totalPages) setPage(Math.max(totalPages, 1));
  }, [page, totalPages]);

  const handleEditUser = (user: User) => {
    setEditUser(user);
    setIsEditOpen(true);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 py-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
            <Users className="h-6 w-6 text-primary" />
            Gestión de Usuarios
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administra roles, procesos y permisos de los usuarios corporativos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuarios..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
        </div>
      </motion.div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Usuarios', value: users?.length ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Administradores', value: users?.filter(u => u.roles.some(r => r.role.code === 'ADMIN')).length ?? 0, icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Directores', value: users?.filter(u => u.roles.some(r => r.role.code === 'DIRECTOR')).length ?? 0, icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Dueños de Proceso', value: users?.filter(u => u.roles.some(r => r.role.code === 'PROCESS_OWNER')).length ?? 0, icon: UserCog, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(stat => (
          <Card key={stat.label} className="border-border/40 shadow-sm">
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-xl font-bold">{stat.value}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-border/40 animate-pulse">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-24 bg-muted rounded" />
                    <div className="h-3 w-16 bg-muted rounded" />
                  </div>
                </div>
                <div className="h-8 bg-muted rounded" />
                <div className="h-6 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center text-red-600 text-sm">
            Error al cargar usuarios. Intenta de nuevo.
          </CardContent>
        </Card>
      ) : visibleUsers.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="p-12 text-center">
            <Users className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground text-sm">
              {search ? 'No se encontraron usuarios con ese criterio de búsqueda' : 'No hay usuarios registrados'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {visibleUsers.map(user => (
                <UserCard
                  key={user.id}
                  user={user}
                  onEdit={handleEditUser}
                  currentUserId={currentUserId}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center pt-4">
              <BasicPagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                showFirstLast
                size="sm"
              />
            </div>
          )}
        </>
      )}

      {/* Edit Dialog */}
      {editUser && (
        <EditUserDialog
          user={editUser}
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setEditUser(null);
          }}
          currentUserId={currentUserId}
          roles={roles}
          allProcesses={allProcesses}
          permissions={permissions}
        />
      )}
    </div>
  );
}

export default AccessManagementPage;
