import { fetchWithRefresh } from "@/lib/api/fetchWithRefresh";

const API_URL = "/api/users";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  isActive: boolean;
  role?: {
    id: string;
    name: string;
  };
  company?: {
    id: string;
    name: string;
  };
  projectIds?: string[];
}

/**
 * Usuario del módulo Project Management (pm_users). El endpoint del módulo
 * devuelve los registros Prisma tal cual: la relación de roles se llama
 * `pm_user_roles` y dentro de cada uno el rol está en `pm_roles`.
 */
interface PmModuleUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  status?: string;
  pm_user_roles?: {
    roleId: string;
    pm_roles?: { id: string; code: string } | null;
  }[];
  scopes?: {
    id: string;
    companyId: string | null;
    projectId: string | null;
  }[];
}

const PM_ROLE_LABELS: Record<string, string> = {
  PM_ADMIN: "Administrador",
  PM_GESTION: "Gestión de Proyectos",
  PM_PLANIFICADOR: "Planificador",
  PM_DIRECCION: "Dirección",
  PM_ADMIN_FINANCIERO: "Administrador Financiero",
};

// Mapea un usuario del módulo al tipo User del frontend
const toModuleUser = (u: PmModuleUser, companies?: { id: string; name: string }[]): User => {
  const companyId = u.scopes?.find((s) => s.companyId)?.companyId ?? null;
  const companyObj = companyId && companies
    ? companies.find((c) => c.id === companyId)
    : null;
    
  const rawRoleCode = u.pm_user_roles?.[0]?.pm_roles?.code;
  const roleCode = rawRoleCode ? rawRoleCode.trim().toUpperCase() : undefined;
  const projectIds = (u.scopes ?? []).map((s) => s.projectId).filter((id): id is string => !!id);
  
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName || "",
    lastName: u.lastName || "",
    isActive: (u.status ?? "ACTIVE") === "ACTIVE",
    role: roleCode
      ? { id: roleCode, name: PM_ROLE_LABELS[roleCode] || roleCode }
      : undefined,
    company: companyObj ? { id: companyObj.id, name: companyObj.name } : undefined,
    projectIds,
  };
};

export interface GetUsersQuery {
  role?: string;
  companyId?: string;
  isActive?: boolean;
}

export const userService = {
  getAll: async (query?: GetUsersQuery): Promise<User[]> => {
    const params = new URLSearchParams();
    if (query?.role) params.append("role", query.role);
    if (query?.companyId) params.append("companyId", query.companyId);
    if (query?.isActive !== undefined) params.append("isActive", String(query.isActive));

    const response = await fetchWithRefresh(
      `${API_URL}${params.toString() ? `?${params}` : ""}`,
      { method: "GET" }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Error al obtener usuarios");
    }

    return response.json();
  },

  getByRole: async (roleName: string): Promise<User[]> => {
    const response = await fetchWithRefresh(`${API_URL}/role/${roleName}`, {
      method: "GET",
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Error al obtener usuarios");
    }

    return response.json();
  },

  /**
   * Lista los usuarios del módulo Project Management (pm_users) con un rol PM.
   * Devuelve ids reales de pm_users (los que referencia pm_projects.managerId),
   * por lo que el selector de planificadores usa este endpoint en lugar del
   * legacy /api/users/role/planificador (que devuelve ids del ERP).
   */
  createModuleUser: async (data: { email: string; firstName?: string; lastName?: string; roleCode: string; scopes?: { companyId?: string | null; projectId?: string | null }[] }): Promise<User> => {
    const response = await fetchWithRefresh(
      `/api/project-management/module-users`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const resData = await response.json();
      throw new Error(resData.message || resData.error || "Error al crear usuario del módulo");
    }

    const result = await response.json();
    return toModuleUser(result);
  },

  getModuleByRole: async (roleCode: string): Promise<User[]> => {
    const response = await fetchWithRefresh(
      `/api/project-management/module-users?role=${encodeURIComponent(roleCode)}`,
      { method: "GET" }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || data.message || "Error al obtener usuarios del módulo");
    }

    const data = (await response.json()) as PmModuleUser[];
    return data.map((u) => toModuleUser(u));
  },

  getById: async (id: string): Promise<User> => {
    const response = await fetchWithRefresh(`${API_URL}/${id}`, {
      method: "GET",
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Error al obtener usuario");
    }

    return response.json();
  },

  update: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await fetchWithRefresh(`${API_URL}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const resData = await response.json();
      throw new Error(resData.error || "Error al actualizar usuario");
    }

    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetchWithRefresh(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Error al eliminar usuario");
    }
  },

  getAllManagement: async (search?: string, page: number = 1, limit: number = 12): Promise<{ data: User[], meta: { total: number, page: number, totalPages: number, limit: number } }> => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    params.append("page", String(page));
    params.append("limit", String(limit));

    const response = await fetchWithRefresh(`/api/user-management?${params.toString()}`, {
      method: "GET",
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Error al obtener usuarios de management");
    }

    return response.json();
  },

  updateRole: async (id: string, roleId: string | null): Promise<User> => {
    const response = await fetchWithRefresh(`/api/user-management/${id}/role`, {
      method: "PUT",
      body: JSON.stringify({ roleId }),
    });

    if (!response.ok) {
      const resData = await response.json();
      throw new Error(resData.error || "Error al actualizar rol del usuario");
    }

    return response.json();
  },

  updateCompany: async (id: string, companyId: string | null): Promise<User> => {
    const response = await fetchWithRefresh(`/api/user-management/${id}/company`, {
      method: "PUT",
      body: JSON.stringify({ companyId }),
    });

    if (!response.ok) {
      const resData = await response.json();
      throw new Error(resData.error || "Error al actualizar empresa del usuario");
    }

    return response.json();
  },

  getRoles: async (): Promise<{ id: string; name: string; description?: string }[]> => {
    const response = await fetchWithRefresh("/api/user-management/roles", {
      method: "GET",
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Error al obtener roles");
    }

    return response.json();
  },

  toggleActive: async (id: string): Promise<User> => {
    const response = await fetchWithRefresh(`/api/user-management/${id}/toggle-active`, {
      method: "PUT",
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Error al cambiar estado del usuario");
    }

    return response.json();
  },

  // ── Métodos del módulo PM (independientes del ERP) ─────────────────

  /** Lista todos los usuarios del módulo PM (pm_users) */
  getModuleUsers: async (companies?: { id: string; name: string }[]): Promise<User[]> => {
    const response = await fetchWithRefresh(
      `/api/project-management/module-users`,
      { method: "GET" }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || data.error || "Error al obtener usuarios del módulo");
    }

    const data = (await response.json()) as PmModuleUser[];
    return data.map((u) => toModuleUser(u, companies));
  },

  /** Lista los roles del módulo PM (pm_roles) */
  getModuleRoles: async (): Promise<{ id: string; name: string; description?: string }[]> => {
    const response = await fetchWithRefresh(
      `/api/project-management/module-users/roles`,
      { method: "GET" }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || data.error || "Error al obtener roles del módulo");
    }

    const roles = await response.json();
    return roles.map((r: any) => ({
      id: r.code,
      name: PM_ROLE_LABELS[r.code] || r.code,
      description: r.description,
    }));
  },

  /** Actualiza el rol de un usuario PM (PATCH /module-users/:id/role) */
  updateModuleUserRole: async (userId: string, roleCode: string): Promise<void> => {
    const response = await fetchWithRefresh(
      `/api/project-management/module-users/${userId}/role`,
      {
        method: "PATCH",
        body: JSON.stringify({ roleCode }),
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || data.error || "Error al actualizar rol");
    }
  },

  /** Actualiza los scopes (empresa / proyectos) de un usuario PM (PATCH /module-users/:id/scopes) */
  updateModuleUserScopes: async (
    userId: string,
    companyId: string | null,
    projectIds?: string[]
  ): Promise<void> => {
    const scopes: { companyId?: string | null; projectId?: string | null }[] = [];
    if (companyId) {
      scopes.push({ companyId });
    }
    if (projectIds && projectIds.length > 0) {
      projectIds.forEach((pId) => scopes.push({ projectId: pId }));
    }
    const response = await fetchWithRefresh(
      `/api/project-management/module-users/${userId}/scopes`,
      {
        method: "PATCH",
        body: JSON.stringify({ scopes }),
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || data.error || "Error al actualizar asignaciones");
    }
  },

  /** Activa/desactiva un usuario PM (PATCH /module-users/:id/toggle-active) */
  toggleModuleUserActive: async (userId: string): Promise<void> => {
    const response = await fetchWithRefresh(
      `/api/project-management/module-users/${userId}/toggle-active`,
      {
        method: "PATCH",
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || data.error || "Error al cambiar estado");
    }
  },
};
