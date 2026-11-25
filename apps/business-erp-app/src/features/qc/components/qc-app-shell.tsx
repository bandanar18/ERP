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
import { QcColors } from '../theme';
import { useQcAuth } from '../hooks/useQcAuth';
import { resolveDashboardRoute } from '../utils/roles';
import {
  BoxesIcon,
  ClipboardCheckIcon,
  FileBarChart2Icon,
  GaugeIcon,
  LayoutDashboardIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  ScrollTextIcon,
  SlidersHorizontalIcon,
  UsersRoundIcon,
} from './icons';

interface QcAppShellProps {
  title: string;
  subtitle?: string;
  /** Si es false, el contenido no se envuelve en ScrollView (para FlatList). */
  scrollable?: boolean;
  /** Ocultar el bloque de título del contenido. */
  hideTitle?: boolean;
  children: ReactNode;
}

/* ============================================================================
   Navegación de la barra inferior y lateral.
   Filtrada por rol (mismo criterio que la web):
    - Admin: ve todo (Operación + Control + Administración)
    - Director: Operación + Control
    - Owner: solo Operación
============================================================================ */
type NavItem = {
  key: string;
  label: string;
  icon: typeof LayoutDashboardIcon;
  href: Href;
  /** Roles que pueden ver este ítem. Si es undefined, todos lo ven. */
  roles?: string[];
};

const NAV_ITEMS: NavItem[] = [
  // Operación
  { key: 'resumen', label: 'Resumen', icon: LayoutDashboardIcon, href: '/qc/admin' },
  { key: 'indicadores', label: 'Indicadores', icon: GaugeIcon, href: '/qc/indicadores' },
  { key: 'mediciones', label: 'Mediciones', icon: ClipboardCheckIcon, href: '/qc/mediciones' },
  // Control (solo ADMIN/DIRECTOR)
  { key: 'reportes', label: 'Reportes', icon: FileBarChart2Icon, href: '/qc/reportes', roles: ['QC_ADMIN', 'QC_DIRECTOR'] },
  { key: 'auditoria', label: 'Auditoría', icon: ScrollTextIcon, href: '/qc/auditoria', roles: ['QC_ADMIN', 'QC_DIRECTOR'] },
  // Administración (solo ADMIN)
  { key: 'procesos', label: 'Procesos', icon: BoxesIcon, href: '/qc/procesos', roles: ['QC_ADMIN'] },
  { key: 'admin-indicadores', label: 'Indicadores', icon: SlidersHorizontalIcon, href: '/qc/admin-indicadores', roles: ['QC_ADMIN'] },
  { key: 'usuarios', label: 'Usuarios', icon: UsersRoundIcon, href: '/qc/usuarios', roles: ['QC_ADMIN'] },
];

/**
 * Shell del módulo Quality Control (una vez autenticado).
 * Espeja el QcAppShell web en estética esmeralda: header con avatar,
 * barra de navegación lateral en tablets (iPad) e inferior en teléfonos.
 */
export function QcAppShell({ title, subtitle, scrollable = true, hideTitle = false, children }: QcAppShellProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { user, status } = useQcAuth();
  const { height: windowHeight } = useWindowDimensions();
  const { isTablet, width } = useBreakpoint();
  const isNarrowTablet = isTablet && width < 900;
  const [userCollapsed, setUserCollapsed] = useState<boolean | null>(null);
  const isCollapsed = userCollapsed !== null ? userCollapsed : isNarrowTablet;

  const userRoles = user?.roles ?? [];
  const summaryHref = useMemo<Href>(() => resolveDashboardRoute(userRoles), [userRoles]);

  // Mientras se restaura la sesión
  if (status === 'loading') {
    return (
      <View style={[styles.shell, styles.loading, { paddingTop: insets.top }]}>
        <ActivityIndicator color={QcColors.accent} />
      </View>
    );
  }

  // Sin sesión → al login
  if (status === 'unauthenticated' || !user) {
    return <Redirect href="/qc/login" />;
  }

  // Filtrar ítems por rol
  const items: NavItem[] = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.some((r) => userRoles.includes(r)),
  ).map((item) => (item.key === 'resumen' ? { ...item, href: summaryHref } : item));

  // Detectar ítem activo
  const isActive = (item: NavItem) => {
    if (item.key === 'resumen') {
      return pathname === '/qc/admin' || pathname === '/qc/director' || pathname === '/qc/owner';
    }
    const href = typeof item.href === 'string' ? item.href : item.href.pathname;
    return href ? pathname.startsWith(href) : false;
  };

  const handlePress = (item: NavItem) => {
    if (isActive(item)) return;
    router.replace(item.href);
  };

  // Iniciales del avatar
  const local = user?.email?.split('@')[0] ?? '?';
  const dot = local.indexOf('.');
  const initials = `${local[0] ?? '?'}${dot > 0 ? local[dot + 1] : ''}`.toUpperCase();

  return (
    <View style={[styles.shell, Platform.OS === 'web' ? { height: windowHeight } : null]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.brandRow}>
          {isTablet ? (
            <Pressable
              onPress={() => setUserCollapsed(!isCollapsed)}
              style={({ pressed }) => [styles.headerToggleBtn, pressed && styles.pressed]}
              hitSlop={8}
              accessibilityLabel={isCollapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}>
              {isCollapsed ? (
                <PanelLeftOpenIcon size={18} color={QcColors.accentDeep} />
              ) : (
                <PanelLeftCloseIcon size={18} color={QcColors.inkSoft} />
              )}
            </Pressable>
          ) : null}
          <Image source={require('@/assets/images/business.webp')} style={styles.logo} contentFit="contain" />
          <Text style={styles.crumb} numberOfLines={1}>
            Control de Calidad
          </Text>
        </View>
        <Pressable onPress={() => router.replace('/qc/perfil')} style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}>
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
                      color={active ? QcColors.accentDeep : QcColors.inkSoft}
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
                  <PanelLeftOpenIcon size={18} color={QcColors.inkSoft} />
                ) : (
                  <>
                    <PanelLeftCloseIcon size={18} color={QcColors.inkSoft} />
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
                <item.icon size={18} color={active ? QcColors.accentDeep : QcColors.inkSoft} />
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

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: QcColors.paper,
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
    borderBottomColor: QcColors.rule,
    backgroundColor: QcColors.surface,
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
    backgroundColor: QcColors.surface2,
  },
  logo: {
    height: 28,
    width: 42,
  },
  crumb: {
    flex: 1,
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: QcColors.inkSoft,
  },
  avatar: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: QcColors.rule,
    backgroundColor: QcColors.surface,
  },
  avatarText: {
    fontFamily: FontFamilies.display,
    fontSize: 17,
    letterSpacing: 0.5,
    color: QcColors.accentDeep,
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
    borderRightColor: QcColors.rule,
    backgroundColor: QcColors.surface,
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
    borderLeftColor: QcColors.accent,
    backgroundColor: QcColors.surface2,
  },
  sidebarItemActiveCollapsed: {
    borderLeftWidth: 0,
    backgroundColor: QcColors.surface2,
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: QcColors.rule,
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
    color: QcColors.inkSoft,
  },
  sidebarLabel: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: QcColors.inkSoft,
  },
  mainArea: {
    flex: 1,
    minWidth: 0,
  },
  mainAreaTablet: {
    backgroundColor: QcColors.paper,
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  contentTablet: {
    paddingHorizontal: 24,
  },
  contentBody: {
    flex: 1,
  },
  pageHead: {
    marginBottom: 14,
  },
  pageTitle: {
    fontFamily: FontFamilies.display,
    fontSize: 30,
    lineHeight: 30,
    color: QcColors.ink,
  },
  pageSubtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: QcColors.inkSoft,
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: QcColors.rule,
    backgroundColor: QcColors.surface,
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
    borderTopColor: QcColors.accent,
    backgroundColor: QcColors.surface2,
  },
  tabLabel: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 8,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: QcColors.inkSoft,
  },
  tabLabelActive: {
    color: QcColors.accentDeep,
  },
});

