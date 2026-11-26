import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, RefreshControl } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Calendar, ShieldCheck } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { SubPageHeader } from '@/components/SubPageHeader';
import { TransactionItem } from '@/components/TransactionItem';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonBox } from '@/components/Skeleton';
import { useLoyalty } from '@/hooks/useLoyalty';
import { useLanguage } from '@/hooks/useLanguage';
import { useStores, getStoreShortLabel } from '@/hooks/useStores';

type FilterType = 'ALL' | 'CREDIT' | 'DEBIT';
type PeriodFilter = '30D' | '90D' | 'ALL';

interface MonthSection {
  title: string;
  count: number;
  data: any[];
}

export default function ExtratoScreen() {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const backRoute =
    typeof returnTo === 'string' && returnTo.startsWith('/(tabs)')
      ? returnTo
      : '/(tabs)/perfil';
  const { t, language } = useLanguage();
  const { activeStore } = useStores();
  const {
    transactions,
    isLoadingTransactions,
    isRefetchingTransactions,
    isErrorTransactions,
    refetchTransactions,
  } = useLoyalty();
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [period, setPeriod] = useState<PeriodFilter>('ALL');
  const [manualRefreshing, setManualRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setManualRefreshing(true);
    try {
      await refetchTransactions();
    } finally {
      setManualRefreshing(false);
    }
  };

  const periodTransactions = useMemo(() => {
    if (period === 'ALL') return transactions;
    const days = period === '30D' ? 30 : 90;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return transactions.filter((tx) => new Date(tx.created_at).getTime() >= cutoff);
  }, [transactions, period]);

  const counts = useMemo(() => {
    let credits = 0;
    let debits = 0;
    for (const tx of periodTransactions) {
      if (tx.type === 'CREDIT') credits++;
      else debits++;
    }
    return { all: periodTransactions.length, credits, debits };
  }, [periodTransactions]);

  const filtered = useMemo(() => {
    if (filter === 'ALL') return periodTransactions;
    return periodTransactions.filter((tx) => tx.type === filter);
  }, [periodTransactions, filter]);

  const locale = language === 'EN' ? 'en-GB' : language === 'ES' ? 'es-ES' : 'pt-PT';

  const sections = useMemo<MonthSection[]>(() => {
    const map = new Map<string, any[]>();
    for (const tx of filtered) {
      const d = new Date(tx.created_at);
      const label = d
        .toLocaleDateString(locale, { month: 'long', year: 'numeric' })
        .toUpperCase();
      const bucket = map.get(label) || [];
      bucket.push(tx);
      map.set(label, bucket);
    }
    return Array.from(map.entries()).map(([title, data]) => ({
      title,
      count: data.length,
      data,
    }));
  }, [filtered, locale]);

  return (
    <View style={styles.safeArea}>
      <SubPageHeader title={t('statementTitle')} backTo={backRoute} />
      <View style={styles.header}>

        <View style={styles.filterRow}>
          {(
            [
              { key: 'ALL', label: t('filterAll'), badge: String(counts.all) },
              { key: 'CREDIT', label: t('filterEarned'), badge: `+${counts.credits}` },
              { key: 'DEBIT', label: t('filterRedeemed'), badge: `-${counts.debits}` },
            ] as const
          ).map((tab) => {
            const active = filter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setFilter(tab.key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {tab.label}
                </Text>
                <View
                  style={[
                    styles.countBadge,
                    active
                      ? styles.countBadgeActive
                      : tab.key === 'CREDIT'
                      ? styles.countBadgeCredit
                      : styles.countBadgeNeutral,
                  ]}
                >
                  <Text
                    style={[
                      styles.countBadgeText,
                      active
                        ? styles.countBadgeTextActive
                        : tab.key === 'CREDIT'
                        ? styles.countBadgeTextCredit
                        : styles.countBadgeTextNeutral,
                    ]}
                  >
                    {tab.badge}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.periodRow}>
          {(
            [
              { key: '30D', label: t('period30d') },
              { key: '90D', label: t('period90d') },
              { key: 'ALL', label: t('periodAll') },
            ] as const
          ).map((p) => {
            const active = period === p.key;
            return (
              <TouchableOpacity
                key={p.key}
                style={[styles.periodChip, active && styles.periodChipActive]}
                onPress={() => setPeriod(p.key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.periodChipText, active && styles.periodChipTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {isLoadingTransactions ? (
        <View style={styles.skeletonList}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.skeletonRow}>
              <SkeletonBox width={38} height={38} borderRadius={19} />
              <View style={{ flex: 1, gap: 6 }}>
                <SkeletonBox width="72%" height={14} />
                <SkeletonBox width="45%" height={10} />
              </View>
              <SkeletonBox width={56} height={24} borderRadius={12} />
            </View>
          ))}
        </View>
      ) : isErrorTransactions ? (
        <EmptyState
          variant="error"
          title={t('loadErrorTitle')}
          description={t('loadErrorSub')}
          actionText={t('retryBtn')}
          onAction={refetchTransactions}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={manualRefreshing}
              onRefresh={handleManualRefresh}
              tintColor={Colors.primary}
            />
          }
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section }) => (
            <View style={styles.monthHeader}>
              <View style={styles.monthLeft}>
                <Calendar size={14} color={Colors.textMuted} />
                <Text style={styles.monthTitle}>{section.title}</Text>
              </View>
              <Text style={styles.monthCount}>
                {section.count} {section.count === 1 ? t('movementSingular') : t('movementPlural')}
              </Text>
            </View>
          )}
          renderItem={({ item }) => <TransactionItem transaction={item} />}
          ListFooterComponent={
            filtered.length > 0 ? (
              <View style={styles.validityCard}>
                <View style={styles.validityIcon}>
                  <ShieldCheck size={18} color={Colors.goldDark} />
                </View>
                <Text style={styles.validityText}>
                  {t('pointsValidityNote', {
                    store: activeStore ? getStoreShortLabel(activeStore) : 'Açaí da Rose',
                  })}
                </Text>
              </View>
            ) : undefined
          }
          ListEmptyComponent={
            <EmptyState
              title={t('emptyStatementTitle')}
              description={t('emptyStatementSub')}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  title: {
    ...Typography.title2,
    color: Colors.text,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  periodChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodChipActive: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primary,
  },
  periodChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  periodChipTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  filterChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.textInverse,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  countBadgeCredit: {
    backgroundColor: Colors.successLight,
  },
  countBadgeNeutral: {
    backgroundColor: Colors.primarySoft,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  countBadgeTextActive: {
    color: Colors.textInverse,
  },
  countBadgeTextCredit: {
    color: Colors.success,
  },
  countBadgeTextNeutral: {
    color: Colors.primary,
  },
  skeletonList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 116,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 8,
  },
  monthLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: 0.6,
  },
  monthCount: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  validityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
  },
  validityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  validityText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  validityBold: {
    fontWeight: '800',
    color: Colors.text,
  },
});
