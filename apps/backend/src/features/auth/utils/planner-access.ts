/**
 * Alcance de un planificador sobre proyectos.
 *
 * Un planificador SOLO ve/edita proyectos donde:
 *  - es manager (pm_projects.managerId), o
 *  - el proyecto está en sus scopes (projectIds del token PM).
 *
 * Nunca debe abrirse acceso a TODOS los proyectos de su companyId:
 * tener empresa asignada (ERP o scopes) no implica ver la cartera completa.
 */

export function buildPlannerProjectsWhere(
  plannerId: string,
  projectIds?: string[] | null,
): { managerId: string } | { OR: Array<{ managerId: string } | { id: { in: string[] } }> } {
  const scopedIds = (projectIds ?? []).filter((id): id is string => !!id);
  if (scopedIds.length === 0) {
    return { managerId: plannerId };
  }
  return {
    OR: [{ managerId: plannerId }, { id: { in: scopedIds } }],
  };
}

export function canPlannerAccessProject(
  project: { id: string; managerId: string | null },
  plannerId: string,
  projectIds?: string[] | null,
): boolean {
  if (project.managerId === plannerId) return true;
  return (projectIds ?? []).includes(project.id);
}
