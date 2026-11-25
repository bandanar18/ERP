import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { PmColors } from '@/features/pm/theme';
import { PmAuthProvider, usePmAuthContext } from '@/features/pm/store/auth-context';
import { NotificationProvider } from '@/features/pm/notifications/toast-provider';
import { resolveDashboardRoute } from '@/features/pm/utils/roles';

function ProtectedLayout() {
  const { status, user } = usePmAuthContext();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    const routeName = segments[1]; // segments[0] es 'pm', segments[1] es 'login'
    const inAuthGroup =
      routeName === 'login' ||
      routeName === 'register' ||
      routeName === 'forgot-password' ||
      routeName === 'reset-password' ||
      routeName === 'verify';

    if (status === 'unauthenticated' && !inAuthGroup) {
      // Si no está autenticado y trata de entrar a un área privada, limpiamos el stack y vamos a login.
      if (router.canDismiss()) {
        router.dismissAll();
      }
      // Reemplazamos la pantalla base del stack por el login para no dejar rastros de (tabs)
      router.replace('/pm/login');
    } else if (status === 'authenticated' && inAuthGroup && user) {
      // Si ya está autenticado y entra a login, va a su dashboard.
      router.replace(resolveDashboardRoute(user.roles));
    }
  }, [status, segments, user]);

  if (status === 'loading') {
    return null; // O un SplashScreen/Loader
  }

  return <Slot />;
}

export default function PmLayout() {
  return (
    <PmAuthProvider>
      <NotificationProvider>
        <ProtectedLayout />
      </NotificationProvider>
    </PmAuthProvider>
  );
}
