import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { PmOpColors } from '@/features/pm/theme';
import { projectService } from '@/features/pm/api/projects';
import { companyService } from '@/features/pm/api/companies';
import { moduleUserService } from '@/features/pm/api/users';
import { usePmAuth } from '@/features/pm/hooks/usePmAuth';
import { PmAppShell } from '@/features/pm/components/pm-app-shell';
import { MetricStrip } from '@/features/pm/components/metric-strip';
import { ProjectDashboard } from '@/features/pm/components/project-dashboard';
import type { Company, ModuleUser, Project } from '@/features/pm/types';

export default function PmGestionScreen() {
  const { status } = usePmAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<ModuleUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // No pedir datos hasta que la sesión esté restaurada (evita requests sin token).
    if (status !== 'authenticated') return;
    let active = true;
    setLoading(true);

    Promise.allSettled([
      projectService.getAll(true),
      companyService.getAll(),
      moduleUserService.getAll(),
    ])
      .then(([projRes, compRes, userRes]) => {
        if (!active) return;
        if (projRes.status === 'fulfilled') {
          setProjects(projRes.value.projects ?? []);
        }
        if (compRes.status === 'fulfilled') {
          setCompanies(compRes.value ?? []);
        }
        if (userRes.status === 'fulfilled') {
          setUsers(userRes.value ?? []);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [status]);

  const totalProjects = projects.length;
  const inProgressProjects = useMemo(
    () => projects.filter((p) => p.status === 'IN_PROGRESS'),
    [projects]
  );

  const activeUsers = useMemo(
    () => users.filter((u) => u.status === 'ACTIVE' || !u.status),
    [users]
  );

  // Cumplimiento Global = (Total Cobrado / Total Facturado) * 100
  const { globalCompliancePct, hasFacturado } = useMemo(() => {
    let totalCobrado = 0;
    let totalFacturado = 0;

    for (const p of projects) {
      const cobrado = Number(p.collectedAmount ?? 0);
      totalCobrado += cobrado;

      let facturado = Number(p.billedAmount ?? 0);
      if (!facturado && Array.isArray(p.financialValuations) && p.financialValuations.length > 0) {
        const facturadas = p.financialValuations.filter((v: any) => v.status === 'FACTURADO');
        facturado = facturadas.reduce((sum: number, v: any) => sum + Number(v.amountUsd || v.amount || 0), 0);
      }
      totalFacturado += facturado;
    }

    const hasFact = totalFacturado > 0;
    const pct = hasFact ? Math.round((totalCobrado / totalFacturado) * 100) : 0;
    return { globalCompliancePct: pct, hasFacturado: hasFact };
  }, [projects]);

  return (
    <PmAppShell title="" hideTitle scrollable>
      {loading ? (
        <ActivityIndicator color={PmOpColors.orange} style={styles.loader} />
      ) : (
        <ProjectDashboard
          projects={projects}
          companies={companies}
          usersCount={users.length}
          metrics={
            <MetricStrip
              metrics={[
                {
                  title: 'Proyectos Gestionados',
                  value: String(totalProjects),
                  change:
                    totalProjects > 0
                      ? `+${inProgressProjects.length} en ejecución`
                      : 'Sin proyectos activos',
                  subLabel: totalProjects > 0 ? 'en ejecución' : 'activos',
                  rail: PmOpColors.orange,
                  width: `${Math.min(100, Math.max(15, totalProjects * 10))}%`,
                },
                {
                  title: 'Empresas Registradas',
                  value: String(companies.length),
                  change: `${companies.length} clientes y empresas`,
                  subLabel: 'empresas',
                  rail: PmOpColors.blue,
                  width: `${Math.min(100, Math.max(15, companies.length * 10))}%`,
                },
                {
                  title: 'Usuarios del Módulo',
                  value: String(users.length),
                  change: `${activeUsers.length} activos en el módulo`,
                  subLabel: 'activos',
                  rail: PmOpColors.lime,
                  width: `${Math.min(100, Math.max(15, users.length * 10))}%`,
                },
                {
                  title: 'Cumplimiento Global',
                  value: `${globalCompliancePct}%`,
                  change: hasFacturado
                    ? globalCompliancePct > 0
                      ? `+${globalCompliancePct}% cobrado`
                      : '0% cobrado de facturado'
                    : 'Sin facturación',
                  subLabel: hasFacturado ? 'cobros / facturado' : 'sin facturación',
                  rail: PmOpColors.pink,
                  width: hasFacturado ? `${Math.min(100, Math.max(0, globalCompliancePct))}%` : '0%',
                },
              ]}
            />
          }
        />
      )}
    </PmAppShell>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: 40,
  },
});