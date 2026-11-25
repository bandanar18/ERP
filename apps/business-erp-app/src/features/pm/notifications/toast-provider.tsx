import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontFamilies } from '@/constants/theme';
import { PmColors } from '../theme';
import { CheckIcon, InfoIcon, XIcon } from '../components/icons';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  /** Dispara una notificación in-app (toast) desde cualquier pantalla del módulo. */
  notify: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_COLORS: Record<ToastType, string> = {
  success: '#4c9b7a',
  error: '#c2410c',
  info: '#3f6486',
};

const TOAST_LABEL: Record<ToastType, string> = {
  success: 'Listo',
  error: 'Error',
  info: 'Aviso',
};

let nextId = 1;

function ToastIcon({ type }: { type: ToastType }) {
  const color = TOAST_COLORS[type];
  if (type === 'success') return <CheckIcon size={16} color={color} />;
  if (type === 'error') return <XIcon size={16} color={color} />;
  return <InfoIcon size={16} color={color} />;
}

function ToastItem({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(onDone, 3500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const color = TOAST_COLORS[toast.type];

  return (
    <Animated.View
      style={[
        styles.toast,
        { borderLeftColor: color, opacity, transform: [{ translateY }] },
      ]}>
      <ToastIcon type={toast.type} />
      <View style={styles.toastBody}>
        <Text style={[styles.toastLabel, { color }]}>{TOAST_LABEL[toast.type]}</Text>
        <Text style={styles.toastMessage}>{toast.message}</Text>
      </View>
    </Animated.View>
  );
}

/**
 * Sistema global de notificaciones in-app del módulo PM.
 * Envolvé la app con <NotificationProvider> y usá useNotify() desde cualquier
 * pantalla para disparar un toast (éxito, error o aviso).
 */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const insets = useSafeAreaInsets();

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback((message: string, type: ToastType = 'success') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      {/* Viewport de toasts: flota sobre el contenido, debajo del header del shell */}
      <View style={[styles.viewport, { top: insets.top + 66, pointerEvents: 'box-none' }]}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDone={() => dismiss(toast.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useNotify(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useNotify debe usarse dentro de <NotificationProvider>');
  }
  return ctx;
}

const styles = StyleSheet.create({
  viewport: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 1000,
    gap: 8,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: PmColors.rule,
    backgroundColor: PmColors.surface,
    boxShadow: '0px 3px 8px rgba(0, 0, 0, 0.12)',
    elevation: 4,
  },
  toastBody: {
    flex: 1,
    minWidth: 0,
  },
  toastLabel: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  toastMessage: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    lineHeight: 17,
    color: PmColors.ink,
  },
});
