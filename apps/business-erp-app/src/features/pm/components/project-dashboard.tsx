import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontFamilies } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { PmOpColors } from '../theme';
import { ArrowUpRightIcon, PlusIcon } from './icons';
import type { Company, Project } from '../types';
import { projectService } from '../api/projects';
import { companyService } from '../api/companies';
import { moduleUserService } from '../api/users';
import { usePmAuth } from '../hooks/usePmAuth';
import { usePermission } from '../hooks/usePermission';
import { canManage } from '../utils/roles';
import { ProjectsFinancialTable } from './projects-financial-table';

/* ============================================================================
   Tarjeta reutilizable redondeada (rounded-xl)
=========================================================================== */
function PmCard({
  eyebrow,
  title,
  extra,
  children,
}: {
  eyebrow: string;
  title: string;
  extra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderText}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
        {extra}
      </View>
      {children}
    </View>
  );
}

/* ============================================================================
   Señales que requieren atención (Bandeja de decisión)
=========================================================================== */
function SignalsCard({ projects }: { projects: Project[] }) {
  const router = useRouter();

  const signals = useMemo(() => {
    const list: Array<{
      title: string;
      meta: string;
      action: string;
      severity: string;
      to: string;
    }> = [];

    const safeProjects = (projects || []).filter((p): p is Project => Boolean(p && typeof p === 'object'));
    const withoutManager = safeProjects.filter((p) => !p.manager && !p.managerId);
    if (withoutManager.length > 0) {
      const top = withoutManager[0];
      list.push({
        title: `${withoutManager.length} proyecto${withoutManager.length > 1 ? 's' : ''} sin responsable`,
        meta: `${top?.fullName || top?.shortName || top?.code || 'Proyecto'} · requiere asignar planificador`,
        action: 'Asignar',
        severity: '#df6e84',
        to: `/pm/detalle/${top?.id}`,
      });
    }

    const withProgress = safeProjects.filter((p) => p.lastProgress != null);
    if (withProgress.length > 0) {
      const latest = withProgress[0];
      list.push({
        title: 'Avance físico registrado',
        meta: `${latest?.fullName || latest?.shortName || latest?.code || 'Proyecto'} · ${latest?.lastProgress?.actualProgress ?? '0%'} reportado`,
        action: 'Ver',
        severity: '#4c9b7a',
        to: `/pm/detalle/${latest?.id}`,
      });
    }

    const delayed = safeProjects.filter((p) => p.status === 'DELAYED');
    if (delayed.length > 0) {
      const top = delayed[0];
      list.push({
        title: `${delayed.length} proyecto${delayed.length > 1 ? 's' : ''} con retraso operativo`,
        meta: `${top?.fullName || top?.shortName || top?.code || 'Proyecto'} · requiere atención inmediata`,
        action: 'Revisar',
        severity: '#c85454',
        to: `/pm/detalle/${top?.id}`,
      });
    }

    const onHold = safeProjects.filter((p) => p.status === 'ON_HOLD');
    if (onHold.length > 0) {
      const top = onHold[0];
      list.push({
        title: `${onHold.length} proyecto${onHold.length > 1 ? 's' : ''} paralizado${onHold.length > 1 ? 's' : ''}`,
        meta: `${top?.fullName || top?.shortName || top?.code || 'Proyecto'} · actividades detenidas`,
        action: 'Ver',
        severity: '#71717a',
        to: `/pm/detalle/${top?.id}`,
      });
    }

    const inProgress = safeProjects.filter((p) => p.status === 'IN_PROGRESS');
    if (inProgress.length > 0) {
      list.push({
        title: `${inProgress.length} proyecto${inProgress.length > 1 ? 's' : ''} en ejecución activa`,
        meta: 'Supervisión de cronogramas y entregables',
        action: 'Revisar',
        severity: '#d9772f',
        to: '/pm/explorar',
      });
    }

    if (list.length === 0) {
      list.push({
        title: 'Workspace operativo sin alertas',
        meta: 'No hay incidencias críticas reportadas',
        action: 'Explorar',
        severity: '#4c9b7a',
        to: '/pm/explorar',
      });
    }

    return list;
  }, [projects]);

  return (
    <PmCard
      eyebrow="Bandeja de decisión"
      title="Señales que requieren atención"
      extra={<Text style={styles.countText}>{signals.length} pendientes</Text>}>
      <View>
        {signals.map((s, i) => (
          <View key={i} style={[styles.listRow, i === signals.length - 1 && styles.listRowLast]}>
            <View style={[styles.signalRail, { backgroundColor: s.severity }]} />
            <View style={styles.listRowBody}>
              <Text style={styles.listRowTitle} numberOfLines={1}>
                {s.title}
              </Text>
              <Text style={styles.listRowMeta} numberOfLines={1}>
                {s.meta}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push(s.to as any)}
              style={({ pressed }) => [styles.actionLink, pressed && styles.actionLinkPressed]}>
              <Text style={styles.actionLinkText}>{s.action}</Text>
              <ArrowUpRightIcon size={14} color="#b9561d" />
            </Pressable>
          </View>
        ))}
      </View>
    </PmCard>
  );
}

/* ============================================================================
   Accesos de operación (Atajos)
=========================================================================== */
function AccessCard({
  projects,
  companiesCount = 0,
  usersCount = 0,
}: {
  projects: Project[];
  companiesCount?: number;
  usersCount?: number;
}) {
  const router = useRouter();
  const { canViewPayables } = usePermission();
  const safeProjects = (projects || []).filter((p): p is Project => Boolean(p && typeof p === 'object'));
  const activeProjectsCount = safeProjects.filter((p) => p.status === 'IN_PROGRESS').length;

  const accessList = [
    {
      title: 'Proyectos',
      desc: `${safeProjects.length} totales · ${activeProjectsCount} activos`,
      rail: '#d9772f',
      to: '/pm/explorar' as const,
    },
    ...(canViewPayables
      ? [
          {
            title: 'Finanzas',
            desc: 'Cuentas por pagar y flujo',
            rail: '#b45309',
            to: '/pm/finanzas' as const,
          },
        ]
      : []),
    {
      title: 'Empresas',
      desc: `${companiesCount ?? 0} clientes y empresas`,
      rail: '#5e8fc2',
      to: '/pm/empresas' as const,
    },
    {
      title: 'Usuarios',
      desc: `${usersCount ?? 0} usuarios en el módulo`,
      rail: '#b9cd48',
      to: '/pm/usuarios' as const,
    },
    {
      title: 'Contraseña',
      desc: 'Cambia tu clave de acceso',
      rail: '#df6e84',
      to: '/pm/perfil/seguridad' as const,
    },
  ];

  return (
    <PmCard
      eyebrow="Atajos"
      title="Accesos de operación"
      extra={<Text style={styles.countText}>Abrir módulo</Text>}>
      <View>
        {accessList.map((item, i) => (
          <View key={i} style={[styles.listRow, i === accessList.length - 1 && styles.listRowLast]}>
            <View style={[styles.accessRail, { backgroundColor: item.rail }]} />
            <View style={styles.listRowBody}>
              <Text style={styles.accessTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.listRowMeta} numberOfLines={1}>
                {item.desc}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push(item.to as any)}
              style={({ pressed }) => [styles.actionLink, pressed && styles.actionLinkPressed]}>
              <Text style={styles.actionLinkText}>Abrir</Text>
              <ArrowUpRightIcon size={14} color="#111416" />
            </Pressable>
          </View>
        ))}
      </View>
    </PmCard>
  );
}

/* ============================================================================
   Dashboard Principal (espejo fiel de ProjectDashboardView web)
=========================================================================== */
export interface ProjectDashboardProps {
  metrics?: ReactNode;
  projects?: Project[];
  companies?: Company[];
  usersCount?: number;
  loading?: boolean;
}

export function ProjectDashboard({
  metrics,
  projects: propProjects,
  companies: propCompanies,
  usersCount: propUsersCount,
  loading = false,
}: ProjectDashboardProps) {
  const router = useRouter();
  const { user } = usePmAuth();
  const { isPlanner, isFinancialAdmin } = usePermission();

  const [fallbackProjects, setFallbackProjects] = useState<Project[]>([]);
  const [fallbackCompanies, setFallbackCompanies] = useState<Company[]>([]);
  const [fallbackUsersCount, setFallbackUsersCount] = useState<number>(0);

  useEffect(() => {
    let active = true;
    if (propProjects === undefined || propCompanies === undefined || propUsersCount === undefined) {
      Promise.allSettled([
        propProjects === undefined ? projectService.getAll(true) : Promise.resolve(null),
        propCompanies === undefined ? companyService.getAll() : Promise.resolve(null),
        propUsersCount === undefined ? moduleUserService.getAll() : Promise.resolve(null),
      ]).then(([pRes, cRes, uRes]) => {
        if (!active) return;
        if (pRes.status === 'fulfilled' && pRes.value) {
          setFallbackProjects(pRes.value.projects ?? []);
        }
        if (cRes.status === 'fulfilled' && cRes.value) {
          setFallbackCompanies(cRes.value ?? []);
        }
        if (uRes.status === 'fulfilled' && uRes.value) {
          setFallbackUsersCount(uRes.value.length ?? 0);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [propProjects, propCompanies, propUsersCount]);

  const projects = propProjects ?? fallbackProjects ?? [];
  const companies = propCompanies ?? fallbackCompanies ?? [];
  const usersCount = propUsersCount ?? fallbackUsersCount;

  const todayLabel = useMemo(
    () =>
      new Date()
        .toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
        .replace(/^./, (c) => c.toUpperCase()),
    []
  );

  const { isTablet } = useBreakpoint();

  return (
    <View>
      {/* Cabecera */}
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.eyebrow}>
            {isFinancialAdmin
              ? 'Panel de control / Administrador Financiero'
              : isPlanner
              ? 'Panel de control / Rol Planificador'
              : `Panel de control / ${todayLabel}`}
          </Text>
          <Text style={styles.headTitle}>
            {isFinancialAdmin
              ? 'Gestión Financiera'
              : isPlanner
              ? 'Panel de planificador'
              : 'Resumen operativo'}
          </Text>
          <Text style={styles.headSubtitle}>
            {isFinancialAdmin
              ? 'Control de obligaciones, cuentas por pagar y desembolsos'
              : isPlanner
              ? 'Proyectos asignados · avances físicos y próximos hitos de tu planificación'
              : 'Última sincronización · lectura general del workspace'}
          </Text>
        </View>
        {isFinancialAdmin ? (
          <Pressable
            onPress={() => router.push('/pm/finanzas')}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}>
            <Text style={styles.primaryButtonText}>Ver finanzas</Text>
          </Pressable>
        ) : isPlanner ? (
          <Pressable
            onPress={() => router.push('/pm/explorar')}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}>
            <Text style={styles.primaryButtonText}>+ Nuevo avance</Text>
          </Pressable>
        ) : canManage(user?.roles ?? []) ? (
          <Pressable
            onPress={() => router.push('/pm/crear-proyecto')}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}>
            <PlusIcon size={14} color="#ffffff" strokeWidth={2.5} />
            <Text style={styles.primaryButtonText}>Nueva acción</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.push('/pm/explorar')}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}>
            <Text style={styles.primaryButtonText}>+ Nuevo avance</Text>
          </Pressable>
        )}
      </View>

      {/* Métricas */}
      {metrics}

      {/* Tabla Principal de Seguimiento de Proyectos (reemplaza la gráfica anterior) */}
      <ProjectsFinancialTable projects={projects} />

      {/* Grid secundario: señales + accesos (lado a lado en tablet) */}
      <View style={[styles.secondaryGrid, isTablet && styles.secondaryGridTablet]}>
        <View style={isTablet ? styles.secondaryGridCol : undefined}>
          <SignalsCard projects={projects} />
        </View>
        <View style={isTablet ? styles.secondaryGridCol : undefined}>
          <AccessCard
            projects={projects}
            companiesCount={companies.length}
            usersCount={usersCount}
          />
        </View>
      </View>

      {/* Nota inferior */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Business ERP · Workspace ES · Datos actualizados automáticamente</Text>
        <View style={styles.prepRow}>
          <Text style={styles.footerText}>Preparación operativa</Text>
          <View style={styles.prepBar}>
            <View style={styles.prepBarFill} />
          </View>
          <Text style={styles.prepValue}>78%</Text>
        </View>
      </View>
    </View>
  );
}

/* ============================================================================
   Estilos con bordes redondeados (rounded-xl, rounded-lg, rounded-full)
=========================================================================== */
const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  headText: {
    flex: 1,
    minWidth: 0,
  },
  headTitle: {
    fontFamily: FontFamilies.display,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: 0.5,
    color: '#111416',
  },
  headSubtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: '#4e5558',
    marginTop: 4,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#d9772f',
    borderWidth: 1,
    borderColor: '#d9772f',
  },
  primaryButtonPressed: {
    backgroundColor: '#b9561d',
    borderColor: '#b9561d',
  },
  primaryButtonText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: '#ffffff',
  },
  eyebrow: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: '#b9561d',
    marginBottom: 4,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d8d0c4',
    backgroundColor: '#fffdf9',
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#1c0f08',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#d8d0c4',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cardHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 16,
    letterSpacing: -0.3,
    color: '#111416',
  },
  countText: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: '#4e5558',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#d8d0c4',
    paddingHorizontal: 16,
    paddingVertical: 11,
    minHeight: 50,
  },
  listRowLast: {
    borderBottomWidth: 0,
  },
  signalRail: {
    width: 6,
    height: 28,
    borderRadius: 9999,
  },
  accessRail: {
    width: 5,
    height: 32,
    borderRadius: 9999,
  },
  listRowBody: {
    flex: 1,
    minWidth: 0,
  },
  listRowTitle: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: '#111416',
    marginBottom: 2,
  },
  listRowMeta: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: '#4e5558',
  },
  accessTitle: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: '#111416',
    marginBottom: 2,
  },
  actionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  actionLinkPressed: {
    opacity: 0.6,
  },
  actionLinkText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    color: '#b9561d',
  },
  footer: {
    marginTop: 6,
    marginBottom: 24,
    paddingTop: 10,
    gap: 8,
  },
  footerText: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: '#4e5558',
  },
  prepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  prepBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#d8d0c4',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  prepBarFill: {
    width: '78%',
    height: '100%',
    backgroundColor: '#111416',
    borderRadius: 9999,
  },
  prepValue: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    color: '#111416',
  },
  secondaryGrid: {
    gap: 0,
  },
  secondaryGridTablet: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'stretch',
  },
  secondaryGridCol: {
    flex: 1,
  },
});