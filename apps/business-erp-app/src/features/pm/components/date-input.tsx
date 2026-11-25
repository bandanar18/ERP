import { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { FontFamilies } from '@/constants/theme';
import { PmOpColors } from '@/features/pm/theme';
import { CalendarIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, XIcon } from './icons';

import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

export interface DateInputProps {
  value: string; // Formato YYYY-MM-DD
  onChange: (val: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function DateInput({
  value,
  onChange,
  label,
  required,
  placeholder = 'YYYY-MM-DD',
  disabled,
  style,
}: DateInputProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [iosDate, setIosDate] = useState(() => {
    if (value) {
      const p = new Date(value + 'T00:00:00');
      if (!isNaN(p.getTime())) return p;
    }
    return new Date();
  });

  const parsedDate = (() => {
    if (value) {
      const p = new Date(value + 'T00:00:00');
      if (!isNaN(p.getTime())) return p;
    }
    return new Date();
  })();

  const setToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
  };

  const handleOpenPicker = () => {
    if (disabled) return;
    setIosDate(parsedDate);
    setShowPicker(true);
  };

  const handleNativeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'set' && selectedDate) {
        const y = selectedDate.getFullYear();
        const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const d = String(selectedDate.getDate()).padStart(2, '0');
        onChange(`${y}-${m}-${d}`);
      }
    } else if (Platform.OS === 'ios') {
      if (selectedDate) {
        setIosDate(selectedDate);
      }
    }
  };

  const handleConfirmIos = () => {
    const y = iosDate.getFullYear();
    const m = String(iosDate.getMonth() + 1).padStart(2, '0');
    const d = String(iosDate.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setShowPicker(false);
  };

  // En plataforma Web, usamos el input tipo date nativo para la mejor experiencia y compatibilidad de navegador
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        {label ? (
          <View style={styles.labelRow}>
            <Text style={styles.label}>
              {label} {required ? <Text style={styles.req}>*</Text> : null}
            </Text>
            <Pressable onPress={setToday} style={styles.quickTodayBtn}>
              <Text style={styles.quickTodayText}>Hoy</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.webInputWrap}>
          <input
            type="date"
            value={value || ''}
            disabled={disabled}
            onChange={(e: any) => onChange(e.target.value)}
            style={{
              width: '100%',
              height: 42,
              padding: '0 12px',
              borderRadius: 8,
              border: '1px solid #d8d0c4',
              backgroundColor: '#fffdf9',
              color: '#111416',
              fontSize: 13,
              fontFamily: 'inherit',
              outline: 'none',
              boxSizing: 'border-box',
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={styles.label}>
            {label} {required ? <Text style={styles.req}>*</Text> : null}
          </Text>
          <Pressable onPress={setToday} style={styles.quickTodayBtn}>
            <Text style={styles.quickTodayText}>Hoy</Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable
        onPress={handleOpenPicker}
        style={({ pressed }) => [
          styles.inputBox,
          disabled && styles.disabled,
          pressed && !disabled && styles.pressed,
        ]}>
        <CalendarIcon size={16} color={PmOpColors.inkSoft} />
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={PmOpColors.placeholder}
          editable={!disabled}
          maxLength={10}
        />
        <Pressable onPress={handleOpenPicker} style={styles.calTriggerBtn}>
          <Text style={styles.calTriggerText}>Elegir</Text>
        </Pressable>
      </Pressable>

      {/* Android: diálogo nativo del sistema */}
      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={parsedDate}
          mode="date"
          display="default"
          onChange={handleNativeChange}
        />
      )}

      {/* iOS: selector nativo presentado en sheet modal */}
      {Platform.OS === 'ios' && (
        <Modal visible={showPicker} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.iosCard}>
              <View style={styles.iosHeader}>
                <View style={styles.modalTitleRow}>
                  <CalendarIcon size={16} color={PmOpColors.orange} />
                  <Text style={styles.modalTitle}>{label || 'Seleccionar Fecha'}</Text>
                </View>
                <Pressable onPress={() => setShowPicker(false)}>
                  <XIcon size={18} color={PmOpColors.inkSoft} />
                </Pressable>
              </View>

              <DateTimePicker
                value={iosDate}
                mode="date"
                display="spinner"
                onChange={handleNativeChange}
                textColor={PmOpColors.ink}
              />

              <View style={styles.iosActions}>
                <Pressable
                  style={styles.modalBtnCancel}
                  onPress={() => setShowPicker(false)}>
                  <Text style={styles.modalBtnCancelText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={styles.modalBtnConfirm}
                  onPress={handleConfirmIos}>
                  <CheckIcon size={14} color="#fff" />
                  <Text style={styles.modalBtnConfirmText}>Listo</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 12,
    color: PmOpColors.ink,
  },
  req: {
    color: PmOpColors.red,
  },
  quickTodayBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#faf7f2',
    borderWidth: 1,
    borderColor: '#d8d0c4',
  },
  quickTodayText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    color: PmOpColors.orangeDeep,
  },
  webInputWrap: {
    width: '100%',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderWidth: 1,
    borderColor: '#d8d0c4',
    borderRadius: 8,
    backgroundColor: '#fffdf9',
    paddingHorizontal: 12,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontFamily: FontFamilies.body,
    fontSize: 13,
    color: PmOpColors.ink,
    padding: 0,
  },
  calTriggerBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f5f0e8',
  },
  calTriggerText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: PmOpColors.ink,
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.85,
  },
  /* ── iOS Modal ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 20, 22, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iosCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fffdf9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d8d0c4',
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  iosHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0ece2',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalTitle: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 14,
    color: PmOpColors.ink,
  },
  iosActions: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0ece2',
  },
  modalBtnCancel: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#fffdf9',
    borderWidth: 1,
    borderColor: '#d8d0c4',
  },
  modalBtnCancelText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: PmOpColors.inkSoft,
  },
  modalBtnConfirm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#376850',
  },
  modalBtnConfirmText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 11,
    color: '#fff',
  },
});
