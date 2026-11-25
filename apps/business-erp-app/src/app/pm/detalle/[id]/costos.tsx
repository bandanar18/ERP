import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';

import { FontFamilies } from '@/constants/theme';
import { PmColors } from '@/features/pm/theme';
import { costService } from '@/features/pm/api/cost';
import { usePmAuth } from '@/features/pm/hooks/usePmAuth';
import { usePermission } from '@/features/pm/hooks/usePermission';
import { PmAppShell } from '@/features/pm/components/pm-app-shell';
import { formatDate, formatUsd } from '@/features/pm/utils/format';
import type { CostPlanning } from '@/features/pm/types';

export default function PmCostosScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { status } = usePmAuth();
  const { canCreate } = usePermission();
  const [costs, setCosts] = useState<CostPlanning[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      if (status !== 'authenticated') return;
      setLoading(true);
      costService
        .getByProjectId(id)
        .then(setCosts)
        .catch(() => setCosts([]))
        .finally(() => setLoading(false));
    }, [id, status])
  );

  return (
    <PmAppShell title="Costos" subtitle={`${costs.length} registros`} scrollable={false}>
      {canCreate ? (
        <Pressable
          style={({ pressed }) => [styles.createButton, pressed && styles.pressed]}
          onPress={() => router.push(`/pm/detalle/${id}/crear-costo`)}>
          <Text style={styles.createButtonText}>+ Cargar costo</Text>
        </Pressable>
      ) : null}

      {loading ? (
        <ActivityIndicator color={PmColors.orange} style={styles.loader} />
      ) : (
        <FlashList
          data={costs}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.amount}>{formatUsd(item.amountUsd)}</Text>
              <Text style={styles.dates}>
                {formatDate(item.startDate)} — {formatDate(item.endDate)}
              </Text>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.empty}>Sin costos registrados</Text>}
          estimatedItemSize={70}
        />
      )}
    </PmAppShell>
  );
}

const styles = StyleSheet.create({
  createButton: {
    alignSelf: 'flex-start',
    backgroundColor: PmColors.orange,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 14,
  },
  pressed: {
    backgroundColor: PmColors.orangeDeep,
  },
  createButtonText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#ffffff',
  },
  loader: {
    marginTop: 40,
  },
  item: {
    borderWidth: 1,
    borderColor: PmColors.rule,
    backgroundColor: PmColors.surface,
    padding: 14,
    gap: 4,
  },
  amount: {
    fontFamily: FontFamilies.display,
    fontSize: 24,
    color: PmColors.ink,
  },
  dates: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: PmColors.inkSoft,
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
    color: PmColors.inkSoft,
    textAlign: 'center',
    marginTop: 30,
  },
});

