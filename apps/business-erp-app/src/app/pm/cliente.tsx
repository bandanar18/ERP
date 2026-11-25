import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';

import { FontFamilies } from '@/constants/theme';
import { PmOpColors } from '@/features/pm/theme';
import { usePmAuth } from '@/features/pm/hooks/usePmAuth';
import { PmAppShell } from '@/features/pm/components/pm-app-shell';
import { MetricStrip } from '@/features/pm/components/metric-strip';
import { ProjectCard } from '@/features/pm/components/project-card';
import { projectService } from '@/features/pm/api/projects';
import { BuildingIcon } from '@/features/pm/components/icons';
import type { Project } from '@/features/pm/types';
import { formatCurrency } from '@/features/pm/utils/format';

export default function PmClienteScreen() {
  const { user, status } = usePmAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [company, setCompany] = useState<{ name: string } | undefined>();
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (status !== 'authenticated') return;
      projectService
        .getAll(true)
        .then((data: any) => {
          setProjects(data.projects ?? []);
          setCompany(data.company ?? data.projects?.[0]?.company);
        })
        .catch(() => {
          setProjects([]);
          setCompany(undefined);
        })
        .finally(() => setLoading(false));
    }, [status])
  );

  const totals = useMemo(() => {
    let facturado = 0;
    let porFacturar = 0;
    let porValuar = 0;
    let totalValuado = 0;
    let offered = 0;
    projects.forEach((p) => {
      offered += Number(p.offeredAmount || 0);
      if (p.financialValuations && Array.isArray(p.financialValuations)) {
        p.financialValuations.forEach((v: any) => {
          const amount = Number(v.amountUsd || 0);
          totalValuado += amount;
          if (v.status === 'FACTURADO') facturado += amount;
          if (v.status === 'POR_FACTURAR') porFacturar += amount;
          if (v.status === 'POR_VALUAR') porValuar += amount;
        });
      } else if (p.billedAmount) {
        facturado += Number(p.billedAmount || 0);
        totalValuado += Number(p.billedAmount || 0);
      }
    });
    return { offered, facturado, porFacturar, porValuar, totalValuado };
  }, [projects]);

  return (
    <PmAppShell title="" hideTitle scrollable>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.eyebrow}>Panel de control / Dirección y clientes</Text>
          <Text style={styles.headTitle}>Resumen ejecutivo</Text>
          <Text style={styles.headSubtitle}>
            Consolidado general y listado de todas las obras en curso vinculadas a su empresa
          </Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={PmOpColors.orange} style={styles.loader} />
      ) : (
        <>
          <View style={styles.companyBanner}>
            <View style={styles.companyRow}>
              <View style={styles.companyIconWrap}>
                <BuildingIcon size={20} color="#fff" />
              </View>
              <View style={styles.companyInfo}>
                <Text style={styles.companyName}>Mis proyectos · {company?.name ?? 'Empresa'}</Text>
                <Text style={styles.companySub}>
                  {projects.length} proyecto{projects.length !== 1 && 's'} en curso vinculados a su empresa
                </Text>
              </View>
            </View>
          </View>

          <MetricStrip
            metrics={[
              {
                title: 'Monto Total Ofertado',
                value: formatCurrency(totals.offered),
                change: 'Suma de todos los proyectos',
                rail: PmOpColors.orange,
                width: '72%',
              },
              {
                title: 'Proyectos',
                value: String(projects.length),
                change: `${projects.length} proyecto${projects.length !== 1 ? 's' : ''} en curso vinculados`,
                rail: PmOpColors.blue,
                width: '100%',
              },
              {
                title: 'Facturado',
                value: formatCurrency(totals.facturado),
                change: 'Total facturado a la fecha',
                rail: PmOpColors.lime,
                width: '84%',
              },
              {
                title: 'Valuado',
                value: formatCurrency(totals.totalValuado),
                change: 'Suma total de valuaciones',
                rail: PmOpColors.pink,
                width: '36%',
              },
            ]}
          />

          <View style={styles.projectsHeader}>
            <View>
              <Text style={styles.eyebrow}>Obras en curso</Text>
              <Text style={styles.projectsTitle}>Detalle de proyectos</Text>
            </View>
            <Text style={styles.projectsCount}>{projects.length} vinculados</Text>
          </View>

          <View style={styles.projectsList}>
            {projects.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No hay proyectos vinculados</Text>
                <Text style={styles.emptySub}>Aún no se ha asignado ningún proyecto a su empresa.</Text>
              </View>
            ) : (
              projects.map((p) => <ProjectCard key={p.id} project={p} />)
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Business ERP · Workspace ES</Text>
            <Text style={styles.footerText}>Datos actualizados automáticamente</Text>
          </View>
        </>
      )}
    </PmAppShell>
  );
}

const styles = StyleSheet.create({
  head: {
    marginBottom: 16,
  },
  headText: {
    flex: 1,
  },
  headTitle: {
    fontFamily: FontFamilies.display,
    fontSize: 34,
    lineHeight: 32,
    letterSpacing: 0.5,
    color: PmOpColors.ink,
  },
  headSubtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: PmOpColors.inkSoft,
    marginTop: 6,
  },
  eyebrow: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: PmOpColors.orangeDeep,
    marginBottom: 4,
  },
  loader: {
    marginTop: 40,
  },
  companyBanner: {
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    backgroundColor: PmOpColors.surface,
    padding: 16,
    marginBottom: 14,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  companyIconWrap: {
    width: 44,
    height: 44,
    backgroundColor: PmOpColors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 15,
    letterSpacing: -0.3,
    color: PmOpColors.ink,
    marginBottom: 2,
  },
  companySub: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: PmOpColors.inkSoft,
  },
  projectsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    backgroundColor: PmOpColors.surface,
    marginTop: 14,
    borderBottomWidth: 0,
  },
  projectsTitle: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 15,
    letterSpacing: -0.3,
    color: PmOpColors.ink,
  },
  projectsCount: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: PmOpColors.inkSoft,
  },
  projectsList: {
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    backgroundColor: '#f6f3eb',
    padding: 16,
    gap: 16,
  },
  empty: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 15,
    color: PmOpColors.ink,
    marginBottom: 4,
  },
  emptySub: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: PmOpColors.inkSoft,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 32,
  },
  footerText: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: PmOpColors.inkSoft,
  },
});
