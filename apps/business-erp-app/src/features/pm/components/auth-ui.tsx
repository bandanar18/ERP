import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { FontFamilies } from '@/constants/theme';
import { createAuthKit, pmAuthTheme } from '@/components/auth-kit';
import { PmColors } from '../theme';
import { formatDate } from '../utils/format';
import { CalendarIcon, CheckIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';

/* ─── Componentes de auth del módulo PM ────────────────────────────────
   El login/registro usa el kit estándar (auth-kit) con el tema naranja
   del módulo. La anatomía es idéntica a los demás módulos; solo cambia
   la paleta.                                                            */

const pmKit = createAuthKit(pmAuthTheme);

export const PmAuthShell = pmKit.AuthShell;
export const PmField = pmKit.Field;
export const PmPasswordField = pmKit.PasswordField;
export const PmButton = pmKit.Button;
export const PmScreenError = pmKit.ScreenError;

/* ─── Barra de pasos (stepper) ───────────────────────────────────────── */

interface PmStepperProps {
  currentStep: number;
  totalSteps?: number;
}

export function PmStepper({ currentStep, totalSteps = 3 }: PmStepperProps) {
  return (
    <View style={styles.stepper}>
      {Array.from({ length: totalSteps }).map((_, i) => {
        const step = i + 1;
        const done = step < currentStep;
        const active = step === currentStep;
        return (
          <View key={step} style={styles.stepperItem}>
            <View
              style={[
                styles.stepCircle,
                done && styles.stepCircleDone,
                active && styles.stepCircleActive,
              ]}>
              <Text style={[styles.stepNumber, (done || active) && styles.stepNumberActive]}>
                {done ? '✓' : step}
              </Text>
            </View>
            {step < totalSteps ? (
              <View style={[styles.stepLine, done && styles.stepLineDone]} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

/* ─── Selector de opciones (chips) ───────────────────────────────────── */

export interface PmChipOption {
  label: string;
  value: string;
}

interface PmChipsProps {
  label: string;
  options: PmChipOption[];
  selected?: string;
  onSelect: (value: string) => void;
}

export function PmChips({ label, options, selected, onSelect }: PmChipsProps) {
  return (
    <View style={styles.chipsWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chipsRow}>
        {options.map((option, i) => {
          const active = option.value === selected;
          return (
            <Pressable
              key={`${option.value}-${i}`}
              onPress={() => onSelect(option.value)}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/* ─── Selector desplegable (bottom sheet cross-platform) ─────────────── */

interface PmSelectProps {
  label: string;
  options: PmChipOption[];
  selected?: string;
  onSelect: (value: string) => void;
  placeholder?: string;
}

/**
 * Select de una opción: botón que siempre muestra la opción elegida (o un
 * placeholder) y abre un modal bottom-sheet con la lista. Mismo look en web
 * y móvil (RN no tiene <select> nativo cross-platform).
 */
export function PmSelect({ label, options, selected, onSelect, placeholder = 'Seleccioná una opción' }: PmSelectProps) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o) => o.value === selected)?.label;

  const choose = (value: string) => {
    onSelect(value);
    setOpen(false);
  };

  return (
    <View style={styles.selectWrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={({ pressed }) => [styles.selectButton, pressed && styles.buttonPressed]}
        onPress={() => setOpen(true)}>
        <Text style={selectedLabel ? styles.selectButtonText : styles.selectPlaceholder} numberOfLines={1}>
          {selectedLabel ?? placeholder}
        </Text>
        <ChevronDownIcon size={16} color={PmColors.inkSoft} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.selectOverlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.selectSheet} onPress={() => {}}>
            <Text style={styles.selectSheetTitle}>{label}</Text>
            <ScrollView style={styles.selectSheetList} bounces={false}>
              {options.map((option, i) => {
                const active = option.value === selected;
                return (
                  <Pressable
                    key={`${option.value}-${i}`}
                    style={({ pressed }) => [styles.selectOption, active && styles.selectOptionActive, pressed && styles.buttonPressed]}
                    onPress={() => choose(option.value)}>
                    <Text style={[styles.selectOptionText, active && styles.selectOptionTextActive]} numberOfLines={1}>
                      {option.label}
                    </Text>
                    {active ? <CheckIcon size={16} color={PmColors.orangeDeep} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/* ─── Selector de fecha (calendario cross-platform) ──────────────────── */

interface PmDatePickerProps {
  label: string;
  value?: string; // ISO YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
}

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * Calendario mensual en un modal bottom-sheet. Devuelve la fecha en formato
 * ISO (YYYY-MM-DD) que es el que consume el backend. Funciona igual en web
 * y móvil (el datepicker nativo de RN no renderiza en web).
 */
export function PmDatePicker({ label, value, onChange, placeholder = 'Seleccioná una fecha' }: PmDatePickerProps) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const [viewDate, setViewDate] = useState(() => {
    const parsed = value ? new Date(`${value}T12:00:00`) : new Date();
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  });

  const selected = value ? new Date(`${value}T12:00:00`) : null;
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOffset = (new Date(year, month, 1).getDay() + 6) % 7; // semana empieza en lunes
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const display = value ? formatDate(value) : null;

  const pick = (day: number) => {
    onChange(toISODate(new Date(year, month, day)));
    setOpen(false);
  };

  return (
    <View style={styles.selectWrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={({ pressed }) => [styles.selectButton, pressed && styles.buttonPressed]}
        onPress={() => setOpen(true)}>
        <Text style={display ? styles.selectButtonText : styles.selectPlaceholder} numberOfLines={1}>
          {display ?? placeholder}
        </Text>
        <CalendarIcon size={16} color={PmColors.inkSoft} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.selectOverlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.dateSheet} onPress={() => {}}>
            {/* Header: mes/año + navegación */}
            <View style={styles.dateNav}>
              <Pressable
                style={({ pressed }) => [styles.dateNavBtn, pressed && styles.buttonPressed]}
                onPress={() => setViewDate(new Date(year, month - 1, 1))}>
                <ChevronLeftIcon size={18} color={PmColors.inkSoft} />
              </Pressable>
              <Text style={styles.dateNavTitle}>
                {MONTHS[month]} {year}
              </Text>
              <Pressable
                style={({ pressed }) => [styles.dateNavBtn, pressed && styles.buttonPressed]}
                onPress={() => setViewDate(new Date(year, month + 1, 1))}>
                <ChevronRightIcon size={18} color={PmColors.inkSoft} />
              </Pressable>
            </View>

            {/* Días de la semana */}
            <View style={styles.dateWeekRow}>
              {WEEKDAYS.map((d) => (
                <Text key={d} style={styles.dateWeekDay}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Grid del mes */}
            <View style={styles.dateGrid}>
              {cells.map((day, i) => {
                if (day === null) return <View key={`pad-${i}`} style={styles.dateCell} />;
                const date = new Date(year, month, day);
                const isSelected = !!selected && sameDay(date, selected);
                const isToday = sameDay(date, today);
                return (
                  <Pressable
                    key={day}
                    style={({ pressed }) => [
                      styles.dateCell,
                      styles.dateDay,
                      isSelected && styles.dateDaySelected,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => pick(day)}>
                    <Text
                      style={[
                        styles.dateDayText,
                        isSelected && styles.dateDayTextSelected,
                        isToday && !isSelected && styles.dateDayTextToday,
                      ]}>
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={({ pressed }) => [styles.dateTodayBtn, pressed && styles.buttonPressed]}
              onPress={() => {
                onChange(toISODate(today));
                setOpen(false);
              }}>
              <Text style={styles.dateTodayText}>Hoy</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/* ─── Mensajes ───────────────────────────────────────────────────────── */

export function PmScreenInfo({ message }: { message: string | null }) {
  if (!message) return null;
  return <Text style={styles.screenInfo}>{message}</Text>;
}

const styles = StyleSheet.create({
  /* Stepper */
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  stepperItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PmColors.rule,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PmColors.surface,
  },
  stepCircleActive: {
    borderColor: PmColors.orange,
  },
  stepCircleDone: {
    backgroundColor: PmColors.orange,
    borderColor: PmColors.orange,
  },
  stepNumber: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: PmColors.inkSoft,
  },
  stepNumberActive: {
    color: PmColors.white,
  },
  stepLine: {
    flex: 1,
    height: 1,
    backgroundColor: PmColors.divider,
    marginHorizontal: 6,
  },
  stepLineDone: {
    backgroundColor: PmColors.orangeLight,
  },
  /* Chips */
  chipsWrap: {
    gap: 4,
    marginBottom: 10,
  },
  label: {
    color: PmColors.ink,
    fontSize: 10,
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: PmColors.rule,
    backgroundColor: PmColors.surface,
  },
  chipActive: {
    borderColor: PmColors.orange,
    backgroundColor: PmColors.surface2,
  },
  chipText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    letterSpacing: 0.5,
    color: PmColors.inkSoft,
  },
  chipTextActive: {
    color: PmColors.orangeDeep,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  screenInfo: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    color: PmColors.inkSoft,
    marginBottom: 6,
  },
  /* Selector desplegable */
  selectWrap: {
    marginBottom: 4,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 12,
    minHeight: 40,
    borderWidth: 1,
    borderColor: PmColors.rule,
    backgroundColor: PmColors.surface,
  },
  selectButtonText: {
    flex: 1,
    fontFamily: FontFamilies.bodyBold,
    fontSize: 13,
    color: PmColors.ink,
  },
  selectPlaceholder: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: PmColors.placeholder,
  },
  selectOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  selectSheet: {
    backgroundColor: PmColors.paper,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingTop: 16,
    paddingBottom: 26,
    maxHeight: '70%',
  },
  selectSheetTitle: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: PmColors.inkSoft,
    paddingHorizontal: 18,
    marginBottom: 8,
  },
  selectSheetList: {
    flexGrow: 0,
  },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: PmColors.rule,
  },
  selectOptionActive: {
    backgroundColor: '#fff0eb',
  },
  selectOptionText: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: PmColors.ink,
  },
  selectOptionTextActive: {
    fontFamily: FontFamilies.bodyBold,
    color: PmColors.orangeDeep,
  },
  /* Calendario */
  dateSheet: {
    backgroundColor: PmColors.paper,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingTop: 16,
    paddingBottom: 26,
    paddingHorizontal: 14,
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateNavBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PmColors.rule,
    backgroundColor: PmColors.surface,
  },
  dateNavTitle: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 14,
    color: PmColors.ink,
    textTransform: 'capitalize',
  },
  dateWeekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dateWeekDay: {
    width: '14.28%',
    textAlign: 'center',
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: PmColors.inkSoft,
    paddingVertical: 4,
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dateCell: {
    width: '14.28%',
    aspectRatio: 1,
  },
  dateDay: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dateDaySelected: {
    borderColor: PmColors.orange,
    backgroundColor: '#fff0eb',
  },
  dateDayText: {
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: PmColors.ink,
  },
  dateDayTextSelected: {
    fontFamily: FontFamilies.bodyBold,
    color: PmColors.orangeDeep,
  },
  dateDayTextToday: {
    fontFamily: FontFamilies.bodyBold,
    color: PmColors.orangeDeep,
  },
  dateTodayBtn: {
    alignSelf: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: PmColors.orange,
    backgroundColor: PmColors.surface,
  },
  dateTodayText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: PmColors.orangeDeep,
  },
});
