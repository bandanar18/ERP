import { Slot } from 'expo-router';

import { QcAuthProvider } from '@/features/qc/store/auth-context';

export default function QcLayout() {
  return (
    <QcAuthProvider>
      <Slot />
    </QcAuthProvider>
  );
}
