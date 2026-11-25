import { memo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontFamilies } from '@/constants/theme';
import { PmOpColors } from '../theme';
import type { Project } from '../types';
import { formatCurrency, formatDate, statusColor, statusLabel } from '../utils/format';
import { resolveMediaUrl } from '../utils/media';
import { BuildingIcon, CalendarIcon, DollarIcon, UserIcon } from './icons';

/** Tarjeta de proyecto para el explorador y listados. */
export const ProjectCard = memo(function ProjectCard({ project }: { project: Project }) {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const logoUri = resolveMediaUrl(project.company?.logoUrl);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => router.push(`/pm/detalle/${project.id}`)}>
      <View style={styles.header}>
        <View style={styles.codeWrap}>
          <Text style={styles.code}>{project.code}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor(project.status) }]}>
            <Text style={styles.statusText}>{statusLabel(project.status)}</Text>
          </View>
        </View>
        <Text style={styles.name} numberOfLines={2}>
          {project.fullName}
        </Text>
        <View style={styles.dateRow}>
          <CalendarIcon size={12} color={PmOpColors.inkSoft} />
          <Text style={styles.dates}>
            {formatDate(project.startDate)} — {formatDate(project.endDate)}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        {logoUri && !imgError ? (
          <Image
            source={{ uri: logoUri }}
            style={styles.logo}
            contentFit="contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <BuildingIcon size={20} color={PmOpColors.orangeDeep} />
        )}
        <View style={styles.amountWrap}>
          <DollarIcon size={14} color={PmOpColors.ink} />
          <Text style={styles.amount}>{formatCurrency(project.offeredAmount)}</Text>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PmOpColors.rule,
    backgroundColor: PmOpColors.surface,
    padding: 16,
    gap: 10,
    overflow: 'hidden',
    shadowColor: '#1c0f08',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pressed: {
    opacity: 0.8,
  },
  header: {
    gap: 8,
  },
  codeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  code: {
    flex: 1,
    fontFamily: FontFamilies.bodyBold,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: PmOpColors.orangeDeep,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: PmOpColors.white,
  },
  name: {
    fontFamily: FontFamilies.display,
    fontSize: 22,
    lineHeight: 24,
    color: PmOpColors.ink,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dates: {
    fontFamily: FontFamilies.body,
    fontSize: 11,
    color: PmOpColors.inkSoft,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: PmOpColors.rule,
    paddingTop: 10,
  },
  logo: {
    height: 26,
    width: 60,
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  amount: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 13,
    color: PmOpColors.ink,
  },
});
