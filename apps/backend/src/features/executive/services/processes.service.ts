import * as repo from '../repositories/executive.repository';

/**
 * MÓDULO EJECUTIVO — Procesos.
 */
export class ProcessesService {
  /** Solo procesos de CORP_MAIN (Nexoil excluida por diseño). */
  async getProcesses() {
    return repo.findProcesses();
  }

  /** Procesos asignados al usuario vía ExecutiveUserProcessAssignment. */
  async getMyProcesses(userId: string) {
    const assignments = await repo.findAssignmentsWithProcesses(userId);

    // Deduplicar por processId (puede haber registros duplicados)
    const seen = new Set<string>();
    return assignments
      .filter((a) => {
        if (seen.has(a.processId)) return false;
        seen.add(a.processId);
        return true;
      })
      .map((a) => a.process);
  }
}
