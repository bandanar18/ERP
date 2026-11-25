import { Redirect, usePathname, useRouter, type Href } from 'expo-router';
import { Image } from 'expo-image';
import { useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontFamilies } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { PmOpColors } from '../theme';
import { usePmAuth } from '../hooks/usePmAuth';
import { usePermission } from '../hooks/usePermission';
import { canManage, resolveDashboardRoute } from '../utils/roles';
import {
  BuildingIcon,
  FolderIcon,
  LandmarkIcon,
  LayoutDashboardIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  UserCogIcon,
} from './icons';

interface PmAppShellProps {
  title: string;
  subtitle?: string;
  /** Si es false, el contenido no se envuelve en ScrollView (para listas FlatList). */
  scrollable?: boolean;
  /** Ocultar el bloque de título del contenido (cuando la pantalla ya muestra el suyo). */
  hideTitle?: boolean;
  children: ReactNode;
}

/* ============================================================================
   Navegación de la barra inferior.
============================================================================ */
type NavItem = {
  key: string;
  label: string;
  icon: typeof LayoutDashboardIcon;
  href: Href;
};

const NAV_ITEMS: NavItem[] = [
  { key: 'resumen', label: 'Resumen', icon: LayoutDashboardIcon, href: '/pm/gestion' },
  { key: 'proyectos', label: 'Proyectos', icon: FolderIcon, href: '/pm/explorar' },
  { key: 'finanzas', label: 'Finanzas', icon: LandmarkIcon, href: '/pm/finanzas' },
  { key: 'empresas', label: 'Empresas', icon: BuildingIcon, href: '/pm/empresas' },
  { key: 'usuarios', label: 'Usuarios', icon: UserCogIcon, href: '/pm/usuarios' },
];

/**
 * Shell del módulo Project Management (una vez autenticado).
 * Espeja el PmAppShell web en estética de operación (beige #f5f0e8, crema,
 * naranja #d9772f): header con avatar de perfil (como la topbar web) y barra
 * de navegación INFERIOR que replica los ítems del sidebar web, filtrados
 * por rol (gestión ve todo; el resto solo Resumen y Proyectos).
 */
export function PmAppShell({ title, subtitle, scrollable = true, hideTitle = false, children }: PmAppShellProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { user, status } = usePmAuth();
  const { isGestion, isFinancialAdmin, canViewPayables } = usePermission();
  // En web el contenedor raíz no fija altura; medir el viewport garantiza que
  // la barra inferior quede SIEMPRE visible (el contenido scrollea interno).
  const { height: windowHeight } = useWindowDimensions();
  const { isTablet, width } = useBreakpoint();
  const isNarrowTablet = isTablet && width < 900;
  const [userCollapsed, setUserCollapsed] = useState<boolean | null>(null);
  const isCollapsed = userCollapsed !== null ? userCollapsed : isNarrowTablet;

  // El tab "Resumen" apunta al dashboard del rol (gestión/planificador/cliente).
  const summaryHref = useMemo<Href>(() => resolveDashboardRoute(user?.roles ?? []), [user?.roles]);

  // Mientras se restaura la sesión, mostramos un loader (evita requests sin token).
  if (status === 'loading') {
    return (
      <View style={[styles.shell, styles.loading, { paddingTop: insets.top }]}>
        <ActivityIndicator color={PmOpColors.orange} />
      </View>
    );
  }

  // Sin sesión → al login.
  if (status === 'unauthenticated' || !user) {
    return null; // Redirect handled by _layout
  }

  const canSeeCompanies = !user.roles.includes('PM_DIRECCION') && !isFinancialAdmin;
  let items: NavItem[];
  if (isFinancialAdmin && !isGestion) {
    items = [
      { key: 'finanzas', label: 'Finanzas', icon: LandmarkIcon, href: '/pm/finanzas' },
      { key: 'proyectos', label: 'Proyectos', icon: FolderIcon, href: '/pm/explorar' },
    ];
  } else {
    items = NAV_ITEMS.filter(
      (item) =>
        (item.key !== 'usuarios' || isGestion) &&
        (item.key !== 'empresas' || canSeeCompanies) &&
        (item.key !== 'finanzas' || canViewPayables),
    ).map((item) => (item.key === 'resumen' ? { ...item, href: summaryHref } : item));
  }

  const isSummary =
    pathname === '/pm/gestion' ||
    pathname === '/pm/planificador' ||
    pathname === '/pm/cliente';
  const isFinance =
    pathname === '/pm/finanzas' ||
    pathname.includes('/cuentas-por-pagar') ||
    pathname.includes('/costo-real') ||
    pathname.includes('/cobros') ||
    pathname.includes('/crear-obligacion');
  const isProjects =
    !isFinance &&
    (pathname.startsWith('/pm/explorar') ||
    pathname.startsWith('/pm/detalle') ||
    pathname.startsWith('/pm/crear-proyecto') ||
    pathname.startsWith('/pm/editar-proyecto'));
  const isCompanies =
    pathname === '/pm/empresas' ||
    pathname.startsWith('/pm/empresa/') ||
    pathname === '/pm/crear-empresa';

  const isActive = (item: NavItem) => {
    if (item.key === 'resumen') return isSummary;
    if (item.key === 'proyectos') return isProjects;
    if (item.key === 'finanzas') return isFinance;
    if (item.key === 'empresas') return isCompanies;
    return pathname === item.href;
  };

  const handlePress = (item: NavItem) => {
    router.replace(item.href);
  };

  // Iniciales del avatar (topbar web: Avatar firstName/lastName). El backend
  // PM no devuelve nombres, así que se derivan del email: "juan.perez" → "JP".
  const local = user?.email?.split('@')[0] ?? '?';
  const dot = local.indexOf('.');
  const initials = `${local[0] ?? '?'}${dot > 0 ? local[dot + 1] : ''}`.toUpperCase();

  return (
    <View style={[styles.shell, Platform.OS === 'web' ? { height: windowHeight } : null]}>
      {/* Header (topbar web: logo corporativo + breadcrumb "Gestión de proyecto" + avatar) */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.brandRow}>
          {isTablet ? (
            <Pressable
              onPress={() => setUserCollapsed(!isCollapsed)}
              style={({ pressed }) => [styles.headerToggleBtn, pressed && styles.pressed]}
              hitSlop={8}
              accessibilityLabel={isCollapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}>
              {isCollapsed ? (
                <PanelLeftOpenIcon size={18} color={PmOpColors.orangeDeep} />
              ) : (
                <PanelLeftCloseIcon size={18} color={PmOpColors.inkSoft} />
              )}
            </Pressable>
          ) : null}
          <Image
            source={require('@/assets/images/business.webp')}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.crumb} numberOfLines={1}>
            Gestión de proyecto
          </Text>
        </View>

        <Pressable
          onPress={() => router.replace('/pm/perfil')}
          style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </Pressable>
      </View>

      {/* Contenido + navegación: sidebar en tablet, barra inferior en teléfono */}
      <View style={styles.bodyRow}>
        {isTablet ? (
          <View
            style={[
              styles.sidebar,
              isCollapsed && styles.sidebarCollapsed,
              { paddingTop: 12, paddingBottom: insets.bottom + 12 },
            ]}>
            <View style={styles.sidebarItems}>
              {items.map((item) => {
                const active = isActive(item);
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => handlePress(item)}
                    style={({ pressed }) => [
                      styles.sidebarItem,
                      isCollapsed && styles.sidebarItemCollapsed,
                      active && styles.sidebarItemActive,
                      active && isCollapsed && styles.sidebarItemActiveCollapsed,
                      pressed && styles.pressed,
                    ]}
                    accessibilityLabel={item.label}>
                    <item.icon
                      size={isCollapsed ? 19 : 17}
                      color={active ? PmOpColors.orangeDeep : PmOpColors.inkSoft}
                    />
                    {!isCollapsed ? (
                      <Text style={[styles.sidebarLabel, active && styles.tabLabelActive]} numberOfLines={1}>
                        {item.label}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.sidebarFooter}>
              <Pressable
                onPress={() => setUserCollapsed(!isCollapsed)}
                style={({ pressed }) => [
                  styles.collapseBtn,
                  isCollapsed && styles.collapseBtnCollapsed,
                  pressed && styles.pressed,
                ]}
                accessibilityLabel={isCollapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}>
                {isCollapsed ? (
                  <PanelLeftOpenIcon size={18} color={PmOpColors.inkSoft} />
                ) : (
                  <>
                    <PanelLeftCloseIcon size={18} color={PmOpColors.inkSoft} />
                    <Text style={styles.collapseBtnText} numberOfLines={1}>
                      Contraer
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={[styles.mainArea, isTablet && styles.mainAreaTablet]}>
          {scrollable ? (
            <ScrollView
              style={styles.content}
              contentContainerStyle={{
                paddingBottom: insets.bottom + (isTablet ? 20 : 78),
                maxWidth: isTablet ? 980 : undefined,
                width: '100%',
                alignSelf: isTablet ? 'center' : 'auto',
              }}>
              {!hideTitle ? (
                <View style={styles.pageHead}>
                  <Text style={styles.pageTitle}>{title}</Text>
                  {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
                </View>
              ) : null}
              {children}
            </ScrollView>
          ) : (
            <View style={[styles.content, isTablet && styles.contentTablet]}>
              {!hideTitle ? (
                <View style={styles.pageHead}>
                  <Text style={styles.pageTitle}>{title}</Text>
                  {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
                </View>
              ) : null}
              <View style={styles.contentBody}>{children}</View>
            </View>
          )}
        </View>
      </View>

      {/* Barra de navegación inferior (solo teléfono) */}
      {!isTablet ? (
        <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          {items.map((item) => {
            const active = isActive(item);
            return (
              <Pressable
                key={item.key}
                onPress={() => handlePress(item)}
                style={({ pressed }) => [
                  styles.tab,
                  active && styles.tabActive,
                  pressed && styles.pressed,
                ]}>
                <item.icon size={17} color={active ? PmOpColors.orangeDeep : PmOpColors.inkSoft} />
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]} numberOfLines={1}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

/* ============================================================================
   Shell de formularios internos del módulo.
   Las pantallas de creación/edición (costo, valuación, avance, proyecto,
   galería) viven dentro del shell operativo con barra inferior — como en la
   web, donde el sidebar está presente en toda la vista.
============================================================================ */
interface PmFormShellProps {
  eyebrow: string;
  title: string;
  copy?: string;
  onBack?: () => void;
  children: ReactNode;
}

export function PmFormShell({ eyebrow, title, copy, onBack, children }: PmFormShellProps) {
  const router = useRouter();
  return (
    <PmAppShell title={title} subtitle={copy}>
      <View style={styles.formHead}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [styles.formBack, pressed && styles.pressed]}
            hitSlop={8}>
            <Text style={styles.formBackText}>← Volver</Text>
          </Pressable>
        ) : null}
        <Text style={styles.formEyebrow}>{eyebrow}</Text>
      </View>
      {children}
    </PmAppShell>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: PmOpColors.paper,
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 50,
    paddingHorizontal: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: PmOpColors.rule,
    backgroundColor: PmOpColors.surface,
  },
  brandRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  headerToggleBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: PmOpColors.surface2,
  },
  logo: {
    height: 28,
    width: 42,
  },
  crumb: {
    flex: 1,
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: PmOpColors.inkSoft,
  },
  avatar: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    backgroundColor: PmOpColors.paper,
  },
  avatarText: {
    fontFamily: FontFamilies.display,
    fontSize: 17,
    letterSpacing: 0.5,
    color: PmOpColors.orangeDeep,
  },
  pressed: {
    opacity: 0.7,
  },
  /* Layout responsive: sidebar (tablet) + área principal */
  bodyRow: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 0,
  },
  sidebar: {
    width: 216,
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: PmOpColors.rule,
    backgroundColor: PmOpColors.surface,
    justifyContent: 'space-between',
  },
  sidebarCollapsed: {
    width: 62,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  sidebarItems: {
    gap: 3,
    width: '100%',
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
    borderRadius: 4,
  },
  sidebarItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: 11,
    borderLeftWidth: 0,
    borderRadius: 8,
    width: 48,
    alignSelf: 'center',
  },
  sidebarItemActive: {
    borderLeftColor: PmOpColors.orange,
    backgroundColor: PmOpColors.surface2,
  },
  sidebarItemActiveCollapsed: {
    borderLeftWidth: 0,
    backgroundColor: PmOpColors.surface2,
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: PmOpColors.rule,
    paddingTop: 8,
    width: '100%',
  },
  collapseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  collapseBtnCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  collapseBtnText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: PmOpColors.inkSoft,
  },
  sidebarLabel: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: PmOpColors.inkSoft,
  },
  mainArea: {
    flex: 1,
    minWidth: 0,
  },
  mainAreaTablet: {
    backgroundColor: PmOpColors.paper,
  },
  contentTablet: {
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  /* Cuerpo de las pantallas no-scrollables (FlatList): llena el espacio
     restante para que la lista scrollee internamente. */
  contentBody: {
    flex: 1,
  },
  /* Título de la pantalla (H1 de la vista, como en la web) */
  pageHead: {
    marginBottom: 14,
  },
  pageTitle: {
    fontFamily: FontFamilies.display,
    fontSize: 30,
    lineHeight: 30,
    color: PmOpColors.ink,
  },
  pageSubtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: PmOpColors.inkSoft,
    marginTop: 4,
  },
  /* Formularios internos */
  formHead: {
    marginBottom: 14,
  },
  formBack: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  formBackText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: PmOpColors.orangeDeep,
  },
  formEyebrow: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: PmOpColors.orangeDeep,
  },
  /* Bottom tab bar (sidebar web) */
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: PmOpColors.rule,
    backgroundColor: PmOpColors.surface,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingTop: 9,
    paddingHorizontal: 2,
    borderTopWidth: 2,
    borderTopColor: 'transparent',
  },
  tabActive: {
    borderTopColor: PmOpColors.orange,
    backgroundColor: PmOpColors.surface2,
  },
  tabLabel: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 8,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: PmOpColors.inkSoft,
  },
  tabLabelActive: {
    color: PmOpColors.orangeDeep,
  },
});