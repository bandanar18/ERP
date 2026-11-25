import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';

import { FontFamilies } from '@/constants/theme';
import { PmColors } from '@/features/pm/theme';
import { physicalProgressService } from '@/features/pm/api/physical-progress';
import { usePermission } from '@/features/pm/hooks/usePermission';
import { usePmAuth } from '@/features/pm/hooks/usePmAuth';
import { PmAppShell } from '@/features/pm/components/pm-app-shell';
import { formatDate } from '@/features/pm/utils/format';
import type { PhysicalProgress } from '@/features/pm/types';

const AnyFlashList = FlashList as any;

export default function PmAvancesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { status } = usePmAuth();
  const { canCreateProgress } = usePermission();
  const [progress, setProgress] = useState<PhysicalProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      if (status !== 'authenticated') return;
      setLoading(true);
      physicalProgressService
        .getByProject(id)
        .then((data) => setProgress(data.progress ?? []))
        .catch(() => setProgress([]))
        .finally(() => setLoading(false));
    }, [id, status])
  );

  return (
    <PmAppShell title="Avances" subtitle={`${progress.length} registros`} scrollable={false}>
      {canCreateProgress ? (
        <Pressable
          style={({ pressed }) => [styles.createButton, pressed && styles.pressed]}
          onPress={() => router.push(`/pm/detalle/${id}/crear-avance`)}>
          <Text style={styles.createButtonText}>+ Registrar avance</Text>
        </Pressable>
      ) : null}

      {loading ? (
        <ActivityIndicator color={PmColors.orange} style={styles.loader} />
      ) : (
        <AnyFlashList
          data={progress}
          keyExtractor={(p: PhysicalProgress) => p.id}
          renderItem={({ item }: { item: PhysicalProgress }) => (
            <View style={styles.item}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemDate}>{formatDate(item.date)}</Text>
                <Text style={styles.itemProgress}>{item.actualProgress}%</Text>
              </View>
              <Text style={styles.itemPlanned}>Programado: {item.plannedProgress}%</Text>
              {item.attentionPoints ? (
                <Text style={styles.itemAttention}>"{item.attentionPoints}"</Text>
              ) : null}
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.empty}>Sin avances registrados</Text>}
          estimatedItemSize={90}
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
    paddingVertical: 10,
    borderRadius: 8,
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
    color: PmColors.white,
  },
  loader: {
    marginTop: 40,
  },
  item: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d8d0c4',
    backgroundColor: '#fffdf9',
    padding: 16,
    gap: 6,
    overflow: 'hidden',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemDate: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: PmColors.ink,
  },
  itemProgress: {
    fontFamily: FontFamilies.display,
    fontSize: 26,
    color: PmColors.orange,
  },
  itemPlanned: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: PmColors.inkSoft,
  },
  itemAttention: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    fontStyle: 'italic',
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

