import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { PmOpColors } from '@/features/pm/theme';
import { projectService } from '@/features/pm/api/projects';
import { usePmAuth } from '@/features/pm/hooks/usePmAuth';
import { PmAppShell } from '@/features/pm/components/pm-app-shell';
import { MetricStrip } from '@/features/pm/components/metric-strip';
import { ProjectDashboard } from '@/features/pm/components/project-dashboard';
import type { Project } from '@/features/pm/types';

export default function PmPlanificadorScreen() {
  const { status } = usePmAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let active = true;
    setLoading(true);
    projectService
      .getAll(true)
      .then((res) => {
        if (active) setProjects(res.projects ?? []);
      })
      .catch(() => {
        if (active) setProjects([]);
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

  const { avgProgress, progressCount } = useMemo(() => {
    const validProgress = projects
      .map((p) => p.lastProgress?.actualProgress)
      .filter((v): v is string => Boolean(v))
      .map((v) => parseFloat(v.replace('%', '')))
      .filter((n) => !isNaN(n));
    if (validProgress.length === 0) return { avgProgress: 0, progressCount: 0 };
    const avg = Math.round(validProgress.reduce((sum, v) => sum + v, 0) / validProgress.length);
    return { avgProgress: avg, progressCount: validProgress.length };
  }, [projects]);

  const uniqueCompanies = useMemo(() => {
    const names = new Set(
      projects.map((p) => p.company?.name || p.companyId).filter(Boolean)
    );
    return Array.from(names);
  }, [projects]);

  const nextAvance = useMemo(() => {
    const sorted = [...projects]
      .filter((p) => p.lastProgress?.date)
      .sort(
        (a, b) =>
          new Date(b.lastProgress!.date!).getTime() - new Date(a.lastProgress!.date!).getTime()
      );
    const top = sorted[0];
    if (!top?.lastProgress?.date) {
      return { date: 'Pendiente', label: 'Sin registros' };
    }
    const d = new Date(top.lastProgress.date);
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    const dateFormatted = !isNaN(d.getTime())
      ? `${d.getDate()} ${months[d.getMonth()]}`
      : 'Pendiente';
    const label = top.shortName || top.code || top.fullName;
    return { date: dateFormatted, label };
  }, [projects]);

  return (
    <PmAppShell title="" hideTitle scrollable>
      {loading ? (
        <ActivityIndicator color={PmOpColors.orange} style={styles.loader} />
      ) : (
        <ProjectDashboard
          projects={projects}
          metrics={
            <MetricStrip
              metrics={[
                {
                  title: 'Proyectos Asignados',
                  value: String(totalProjects),
                  change:
                    inProgressProjects.length > 0
                      ? `${inProgressProjects.length} activos`
                      : 'Sin proyectos activos',
                  rail: PmOpColors.orange,
                  width: `${Math.min(100, Math.max(15, totalProjects * 10))}%`,
                },
                {
                  title: 'Avance Promedio',
                  value: `${avgProgress}%`,
                  change:
                    progressCount > 0
                      ? `${progressCount} con registro`
                      : 'Sin registros de avance',
                  rail: PmOpColors.blue,
                  width: `${Math.min(100, Math.max(10, avgProgress))}%`,
                },
                {
                  title: 'Empresas vinculadas',
                  value: String(uniqueCompanies.length),
                  change:
                    uniqueCompanies.length === 1
                      ? String(uniqueCompanies[0])
                      : 'Proyectos distribuidos',
                  rail: PmOpColors.lime,
                  width: '84%',
                },
                {
                  title: 'Próximo Avance',
                  value: nextAvance.date,
                  change: nextAvance.label,
                  rail: PmOpColors.pink,
                  width: '92%',
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
