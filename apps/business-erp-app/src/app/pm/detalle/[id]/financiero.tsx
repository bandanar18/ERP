import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, Pressable, TextInput } from 'react-native';
import { FlashList } from '@shopify/flash-list';

import { FontFamilies } from '@/constants/theme';
import { PmColors } from '@/features/pm/theme';
import { financialService } from '@/features/pm/api/financial';
import { usePmAuth } from '@/features/pm/hooks/usePmAuth';
import { usePermission } from '@/features/pm/hooks/usePermission';
import { PmAppShell } from '@/features/pm/components/pm-app-shell';
import { formatDate, formatUsd } from '@/features/pm/utils/format';
import type { FinancialValuation, ValuationStatus } from '@/features/pm/types';
import { useNotify } from '@/features/pm/notifications/toast-provider';

const STATUS_LABEL: Record<ValuationStatus, string> = {
  POR_VALUAR: 'Por valuar',
  POR_FACTURAR: 'Por facturar',
  FACTURADO: 'Facturado',
};

export default function PmFinancieroScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { status } = usePmAuth();
  const { canCreate } = usePermission();
  const { notify } = useNotify();
  const [valuations, setValuations] = useState<FinancialValuation[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [invoicingId, setInvoicingId] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');

  const fetchValuations = useCallback(() => {
    if (!id || status !== 'authenticated') return;
    setLoading(true);
    financialService
      .getByProjectId(id)
      .then(setValuations)
      .catch(() => setValuations([]))
      .finally(() => setLoading(false));
  }, [id, status]);

  useFocusEffect(
    useCallback(() => {
      fetchValuations();
    }, [fetchValuations])
  );

  const handleStatus = async (valId: string, newStatus: ValuationStatus, invNumber?: string) => {
    try {
      if (newStatus === 'FACTURADO' && !invNumber) {
        notify('Debe ingresar el número de factura', 'error');
        return;
      }
      await financialService.updateStatus(valId, { status: newStatus, invoiceNumber: invNumber });
      notify('Estado actualizado', 'success');
      setInvoicingId(null);
      setInvoiceNumber('');
      fetchValuations();
    } catch {
      notify('Error al actualizar estado', 'error');
    }
  };

  const handleSaveAmount = async (valId: string) => {
    try {
      const parsed = parseFloat(editAmount);
      if (isNaN(parsed) || parsed <= 0) {
        notify('Monto inválido', 'error');
        return;
      }
      await financialService.updateAmount(valId, { amountUsd: parsed });
      notify('Monto actualizado', 'success');
      setEditingId(null);
      fetchValuations();
    } catch {
      notify('Error al actualizar monto', 'error');
    }
  };

  const renderItem = ({ item }: { item: FinancialValuation }) => {
    const isEditing = editingId === item.id;
    const isInvoicing = invoicingId === item.id;
    return (
      <View style={styles.item}>
        <View style={styles.itemHeader}>
          <Text style={styles.number}>#{item.valuationNumber}</Text>
          <Text style={styles.status}>{STATUS_LABEL[item.status]}</Text>
        </View>

        {isEditing ? (
          <View style={styles.editRow}>
            <TextInput
              style={styles.editInput}
              value={editAmount}
              onChangeText={setEditAmount}
              keyboardType="numeric"
              placeholder="Nuevo monto..."
            />
            <View style={styles.editActions}>
              <Pressable onPress={() => handleSaveAmount(item.id)} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Guardar</Text>
              </Pressable>
              <Pressable onPress={() => setEditingId(null)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Text style={styles.amount}>{formatUsd(item.amountUsd)}</Text>
        )}

        <Text style={styles.dates}>
          {formatDate(item.startDate)} - {formatDate(item.endDate)}
        </Text>
        {item.invoiceNumber ? (
          <Text style={styles.invoiceNumber}>Factura: {item.invoiceNumber}</Text>
        ) : null}

        {item.status === 'FACTURADO' ? (
          <Text style={[styles.actionLink, { color: PmColors.green }]}>Completado</Text>
        ) : canCreate && !isEditing && !isInvoicing ? (
          <View style={styles.actions}>
            <Pressable onPress={() => { setEditingId(item.id); setEditAmount(item.amountUsd.toString()); }}>
              <Text style={styles.actionLink}>Editar monto</Text>
            </Pressable>

            {item.status === 'POR_VALUAR' && (
              <Pressable onPress={() => handleStatus(item.id, 'POR_FACTURAR')}>
                <Text style={styles.actionLink}>Marcar Por Facturar</Text>
              </Pressable>
            )}

            {item.status === 'POR_FACTURAR' && (
              <Pressable onPress={() => setInvoicingId(item.id)}>
                <Text style={styles.actionLink}>Marcar Facturado</Text>
              </Pressable>
            )}
          </View>
        ) : null}

        {isInvoicing && (
          <View style={styles.editRow}>
            <TextInput
              style={styles.editInput}
              value={invoiceNumber}
              onChangeText={setInvoiceNumber}
              placeholder="Número de factura..."
            />
            <View style={styles.editActions}>
              <Pressable onPress={() => handleStatus(item.id, 'FACTURADO', invoiceNumber)} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Guardar</Text>
              </Pressable>
              <Pressable onPress={() => setInvoicingId(null)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <PmAppShell title="Valuaciones" subtitle={`${valuations.length} registros`} scrollable={false}>
      {canCreate ? (
        <Pressable
          style={({ pressed }) => [styles.createButton, pressed && styles.pressed]}
          onPress={() => router.push(`/pm/detalle/${id}/crear-valuacion`)}>
          <Text style={styles.createButtonText}>+ Crear valuación</Text>
        </Pressable>
      ) : null}

      {loading ? (
        <ActivityIndicator color={PmColors.orange} style={styles.loader} />
      ) : (
        <FlashList
          data={valuations}
          keyExtractor={(v) => v.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.empty}>Sin valuaciones registradas</Text>}
          estimatedItemSize={120}
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
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  number: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: PmColors.orangeDeep,
  },
  status: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: PmColors.inkSoft,
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
  invoiceNumber: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: PmColors.orangeDeep,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: PmColors.rule,
  },
  actionLink: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: PmColors.orange,
    textTransform: 'uppercase',
  },
  editRow: {
    flexDirection: 'column',
    gap: 8,
    marginVertical: 4,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  editInput: {
    width: '100%',
    height: 36,
    borderWidth: 1,
    borderColor: PmColors.rule,
    paddingHorizontal: 10,
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: PmColors.ink,
  },
  saveBtn: {
    backgroundColor: PmColors.orange,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  saveBtnText: {
    color: '#ffffff',
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelBtnText: {
    color: PmColors.inkSoft,
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
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
