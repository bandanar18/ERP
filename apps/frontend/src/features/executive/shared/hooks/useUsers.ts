import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, processesApi } from '../api/users.api';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getUsers,
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: usersApi.getRoles,
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: usersApi.getPermissions,
  });
}

export function useUpdateUserRoles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roles }: { userId: string; roles: string[] }) =>
      usersApi.updateUserRoles(userId, roles),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUserScopes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, processIds }: { userId: string; processIds: string[] }) =>
      usersApi.updateUserScopes(userId, processIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      usersApi.updateRolePermissions(roleId, permissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function useAllProcesses() {
  return useQuery({
    queryKey: ['allProcesses'],
    queryFn: () => processesApi.getAll(),
  });
}
