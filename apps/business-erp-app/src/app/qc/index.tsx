import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { QcColors } from '@/features/qc/theme';
import { useQcAuth } from '@/features/qc/hooks/useQcAuth';
import { resolveDashboardRoute } from '@/features/qc/utils/roles';

/**
 * Ruta índice del módulo QC.
 * Redirige al dashboard según el rol del usuario:
 *  - QC_ADMIN  → /qc/admin
 *  - QC_DIRECTOR → /qc/director
 *  - QC_OWNER   → /qc/owner
 */
export default function QcIndexScreen() {
  const { user, status } = useQcAuth();

  if (status === 'loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={QcColors.accent} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/qc/login" />;
  }

  return <Redirect href={resolveDashboardRoute(user.roles)} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: QcColors.paper,
  },
});
