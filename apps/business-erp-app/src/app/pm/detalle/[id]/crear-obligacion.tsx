import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { FontFamilies } from '@/constants/theme';
import { PmOpColors } from '@/features/pm/theme';
import { payablesService } from '@/features/pm/api/payables';
import { projectService } from '@/features/pm/api/projects';
import { PmAppShell } from '@/features/pm/components/pm-app-shell';
import { DateInput } from '@/features/pm/components/date-input';
import { ChevronLeftIcon } from '@/features/pm/components/icons';
import type { Project } from '@/features/pm/types';

const CATEGORY_SUGGESTIONS = [
  'Equipos',
  'Viáticos',
  'Alquileres',
  'Combustible',
  'Facturas',
  'Materiales',
  'Servicios',
  'Otros',
];

export default function PmCrearObligacionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState('');
  const [amountUsd, setAmountUsd] = useState('');
  const [description, setDescription] = useState('');
  const [supplier, setSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [incurredAt, setIncurredAt] = useState(new Date().toISOString().split('T')[0]);
  const [supportDocument, setSupportDocument] = useState('');

  useEffect(() => {
    if (!id) return;
    projectService
      .getById(id)
      .then(setProject)
      .catch(() => {});
  }, [id]);

  const handleSubmit = async () => {
    if (!id) return;
    const amt = Number(amountUsd.replace(',', '.'));
    if (!category.trim()) {
      setError('Ingresa o selecciona una categoría para la obligación');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      setError('Ingresa un monto válido mayor a 0');
      return;
    }
    if (!description.trim()) {
      setError('Ingresa una descripción para la obligación');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await payablesService.create({
        projectId: id,
        category: category.trim(),
        amountUsd: amt,
        description: description.trim(),
        supplier: supplier.trim() || undefined,
        invoiceNumber: invoiceNumber.trim() || undefined,
        dueDate: dueDate.trim() || undefined,
        isIncurred: true,
        incurredAt: incurredAt || undefined,
        supportDocument: supportDocument.trim() || undefined,
      });

      Alert.alert('Éxito', 'Obligación registrada correctamente', [
        {
          text: 'Continuar',
          onPress: () => router.replace(`/pm/detalle/${id}/cuentas-por-pagar`),
        },
      ]);
    } catch (err: any) {
      setError(err?.message || 'Error al registrar la obligación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PmAppShell title="Nueva Obligación" hideTitle>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Botón Volver */}
        <View style={styles.topHeader}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            onPress={() => router.back()}>
            <ChevronLeftIcon size={16} color={PmOpColors.inkSoft} />
            <Text style={styles.backBtnText}>Volver a Cuentas por Pagar</Text>
          </Pressable>
        </View>

        {/* Formulario */}
        <View style={styles.card}>
          <Text style={styles.title}>Nueva Obligación / Cuenta por Pagar</Text>
          <Text style={styles.subtitle}>
            {project?.code ? `${project.code} · ` : ''}Registra un compromiso u obligación financiera
            asociada a la obra.
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Categoría */}
          <Text style={styles.label}>Categoría *</Text>
          <View style={styles.chipsWrap}>
            {CATEGORY_SUGGESTIONS.map((cat) => (
              <Pressable
                key={cat}
                style={[styles.chip, category === cat && styles.chipActive]}
                onPress={() => setCategory(cat)}>
                <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                  {cat}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.input}
            value={category}
            onChangeText={setCategory}
            placeholder="O escribe una categoría..."
            placeholderTextColor={PmOpColors.placeholder}
          />

          {/* Monto */}
          <Text style={styles.label}>Monto en USD *</Text>
          <TextInput
            style={styles.input}
            value={amountUsd}
            onChangeText={setAmountUsd}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor={PmOpColors.placeholder}
          />

          {/* Descripción */}
          <Text style={styles.label}>Descripción de la Obligación *</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={description}
            onChangeText={setDescription}
            placeholder="Detalle o justificación del gasto..."
            placeholderTextColor={PmOpColors.placeholder}
            multiline
            numberOfLines={3}
          />

          {/* Fechas con selector de calendario nativo */}
          <DateInput
            label="Fecha de Registro"
            value={incurredAt}
            onChange={setIncurredAt}
            required
          />

          <DateInput
            label="Fecha de Vencimiento de Pago (opcional)"
            value={dueDate}
            onChange={setDueDate}
            placeholder="YYYY-MM-DD"
          />

          {/* Proveedor y Factura */}
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Proveedor (opcional)</Text>
              <TextInput
                style={styles.input}
                value={supplier}
                onChangeText={setSupplier}
                placeholder="Nombre proveedor"
                placeholderTextColor={PmOpColors.placeholder}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>N° Factura (opcional)</Text>
              <TextInput
                style={styles.input}
                value={invoiceNumber}
                onChangeText={setInvoiceNumber}
                placeholder="001-002-1234"
                placeholderTextColor={PmOpColors.placeholder}
              />
            </View>
          </View>

          {/* Documento de Soporte / Respaldo */}
          <Text style={styles.label}>Soporte del Costo / Documento de Respaldo (opcional)</Text>
          <TextInput
            style={styles.input}
            value={supportDocument}
            onChangeText={setSupportDocument}
            placeholder="Ej: Remito N° 4589, Orden de Compra OC-2026-12"
            placeholderTextColor={PmOpColors.placeholder}
          />

          {/* Botón Guardar */}
          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              loading && styles.submitBtnDisabled,
              pressed && styles.pressed,
            ]}
            disabled={loading}
            onPress={handleSubmit}>
            {loading ? (
              <ActivityIndicator color={PmOpColors.white} />
            ) : (
              <Text style={styles.submitBtnText}>Registrar Obligación</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </PmAppShell>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 14,
    paddingBottom: 40,
  },
  topHeader: {
    marginBottom: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    backgroundColor: PmOpColors.surface,
  },
  backBtnText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: PmOpColors.inkSoft,
  },
  card: {
    backgroundColor: PmOpColors.surface,
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  title: {
    fontFamily: FontFamilies.display,
    fontSize: 22,
    lineHeight: 24,
    color: PmOpColors.ink,
  },
  subtitle: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: PmOpColors.inkSoft,
  },
  errorBox: {
    backgroundColor: '#fff0eb',
    borderWidth: 1,
    borderColor: '#edb6a5',
    borderRadius: 8,
    padding: 10,
  },
  errorText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: '#a84730',
  },
  label: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: PmOpColors.inkSoft,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  chip: {
    backgroundColor: PmOpColors.paper,
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipActive: {
    backgroundColor: '#edf3ec',
    borderColor: '#4c9b7a',
  },
  chipText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: PmOpColors.inkSoft,
  },
  chipTextActive: {
    color: '#376850',
  },
  input: {
    backgroundColor: PmOpColors.paper,
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: PmOpColors.ink,
  },
  multilineInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  col: {
    flex: 1,
    gap: 6,
  },
  submitBtn: {
    backgroundColor: '#4c9b7a',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 13,
    color: PmOpColors.white,
  },
  pressed: {
    opacity: 0.7,
  },
});
