import { useFocusEffect, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { memo, useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';

import { FontFamilies } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { PmOpColors } from '@/features/pm/theme';
import { projectService } from '@/features/pm/api/projects';
import { usePmAuth } from '@/features/pm/hooks/usePmAuth';
import { PmAppShell } from '@/features/pm/components/pm-app-shell';
import { BuildingIcon, ChevronRightIcon, MailIcon, PhoneIcon } from '@/features/pm/components/icons';
import type { Company } from '@/features/pm/types';
import { useCachedQuery } from '@/hooks/useCachedQuery';
import { resolveMediaUrl } from '@/features/pm/utils/media';

const CompanyCard = memo(function CompanyCard({ company }: { company: Company }) {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const logoUri = resolveMediaUrl(company.logoUrl);

  const hasLogo = Boolean(logoUri && !imgError);
  const subtitle = company.legalName || (company.taxId ? `RIF: ${company.taxId}` : 'Empresa registrada');

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => router.push(`/pm/empresa/${company.id}`)}>
      <View style={styles.cardBody}>
        <View style={styles.logoContainer}>
          {hasLogo ? (
            <Image
              source={{ uri: logoUri }}
              style={styles.logo}
              contentFit="contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <BuildingIcon size={22} color={PmOpColors.orangeDeep} />
          )}
        </View>

        <View style={styles.cardText}>
          <Text style={styles.name} numberOfLines={1}>
            {company.name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {subtitle}
          </Text>

          <View style={styles.contactRow}>
            {company.phone ? (
              <View style={styles.contactItem}>
                <PhoneIcon size={11} color={PmOpColors.inkSoft} />
                <Text style={styles.contactText} numberOfLines={1}>
                  {company.phone}
                </Text>
              </View>
            ) : null}
            {company.email ? (
              <View style={styles.contactItem}>
                <MailIcon size={11} color={PmOpColors.inkSoft} />
                <Text style={styles.contactText} numberOfLines={1}>
                  {company.email}
                </Text>
              </View>
            ) : null}
            {!company.phone && !company.email ? (
              <Text style={styles.contactEmpty} numberOfLines={1}>
                {company.taxId && company.legalName ? `RIF: ${company.taxId}` : 'Sin datos de contacto'}
              </Text>
            ) : null}
          </View>
        </View>

        <ChevronRightIcon size={16} color={PmOpColors.inkSoft} style={styles.chevron} />
      </View>
    </Pressable>
  );
});

export default function PmEmpresasScreen() {
  const { status } = usePmAuth();
  const { isTablet } = useBreakpoint();
  const [search, setSearch] = useState('');

  const { data: companies = [], loading, error } = useCachedQuery(
    '/pm/companies',
    async () => {
      if (status !== 'authenticated') return [];
      const data = await projectService.getCompanies(true);
      return data.companies ?? [];
    }
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.legalName?.toLowerCase().includes(q) ||
        c.taxId?.toLowerCase().includes(q)
    );
  }, [companies, search]);

  const renderItem = useCallback(
    ({ item }: { item: Company }) => (
      <View style={styles.cardCell}>
        <CompanyCard company={item} />
      </View>
    ),
    [],
  );
  const keyExtractor = useCallback((c: Company, index: number) => c.id || `company-${index}`, []);

  return (
    <PmAppShell
      title="Empresas"
      subtitle={`${filtered.length} empresas`}
      scrollable={false}>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre, razón social o RIF"
          placeholderTextColor={PmOpColors.placeholder}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={PmOpColors.orange} style={styles.loader} />
      ) : error ? (
        <Text style={styles.empty}>
          {typeof error === 'string' ? error : (error as any)?.message ?? 'Error al cargar empresas'}
        </Text>
      ) : (
        <FlatList
          key={isTablet ? 'grid' : 'list'}
          data={filtered}
          numColumns={isTablet ? 2 : 1}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          columnWrapperStyle={isTablet ? styles.gridRow : undefined}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.empty}>No hay empresas</Text>}
        />
      )}
    </PmAppShell>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    marginBottom: 12,
  },
  search: {
    height: 40,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    backgroundColor: PmOpColors.surface,
    color: PmOpColors.ink,
    fontSize: 13,
    fontWeight: '500',
  },
  loader: {
    marginTop: 40,
  },
  card: {
    flex: 1,
    minHeight: 92,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    borderRadius: 10,
    backgroundColor: PmOpColors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.8,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {
    height: 48,
    width: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    backgroundColor: PmOpColors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  logo: {
    height: 46,
    width: 46,
  },
  cardText: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 3,
  },
  name: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 14,
    color: PmOpColors.ink,
  },
  meta: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: PmOpColors.inkSoft,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 1,
    minHeight: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '48%',
  },
  contactText: {
    flexShrink: 1,
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: PmOpColors.inkSoft,
  },
  contactEmpty: {
    fontFamily: FontFamilies.body,
    fontSize: 10,
    color: PmOpColors.placeholder,
  },
  chevron: {
    flexShrink: 0,
  },
  /* Grid tablet: celdas que estiran la tarjeta a la mitad del ancho */
  cardCell: {
    flex: 1,
  },
  gridRow: {
    gap: 10,
  },
  separator: {
    height: 10,
  },
  listContent: {
    paddingBottom: 24,
  },
  empty: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: PmOpColors.inkSoft,
    textAlign: 'center',
    marginTop: 30,
  },
});


