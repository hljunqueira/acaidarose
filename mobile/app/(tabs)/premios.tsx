import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { RewardCard } from '@/components/RewardCard';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonBox } from '@/components/Skeleton';
import { useLoyalty, VoucherItem, RewardItem } from '@/hooks/useLoyalty';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useStores, getStoreShortLabel } from '@/hooks/useStores';
import { resolveMediaUrl } from '@/services/api';
import { Store, Ticket, ChevronRight, Gift, UtensilsCrossed } from 'lucide-react-native';

type RewardsTab = 'ALL' | 'AVAILABLE' | 'VOUCHERS';

export default function RewardsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { t, language } = useLanguage();
  const { activeStore } = useStores();
  const {
    rewards,
    vouchers,
    balance,
    redeemReward,
    redeemingRewardId,
    isLoadingRewards,
    isLoadingVouchers,
    isRefetchingRewards,
    isRefetchingVouchers,
    isErrorRewards,
    refetchRewards,
    refetchVouchers,
  } = useLoyalty();

  const [filter, setFilter] = useState<RewardsTab>('ALL');
  const [pendingReward, setPendingReward] = useState<RewardItem | null>(null);
  const [confirmingRedeem, setConfirmingRedeem] = useState(false);
  const [manualRefreshing, setManualRefreshing] = useState(false);

  const handleManualRefresh = async (target: 'vouchers' | 'rewards') => {
    setManualRefreshing(true);
    try {
      await (target === 'vouchers' ? refetchVouchers() : refetchRewards());
    } finally {
      setManualRefreshing(false);
    }
  };

  const handleRedeem = (rewardId: string) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Inicia Sessão',
        'Precisas de entrar na tua conta para trocar pontos por prémios.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Entrar', onPress: () => router.push('/(auth)/login') },
        ]
      );
      return;
    }

    const selected = rewards.find((r) => r.id === rewardId);
    if (!selected) return;
    setPendingReward(selected);
  };

  const executeRedeem = async () => {
    if (!pendingReward || confirmingRedeem) return;
    const selected = pendingReward;
    try {
      setConfirmingRedeem(true);
      const res = await redeemReward(selected.id);
      setPendingReward(null);
      router.push({
        pathname: '/(tabs)/voucher',
        params: {
          code: res.voucher?.voucher_code,
          name: selected.name,
          expiresAt: res.voucher?.expires_at || '',
        },
      });
    } catch (err: any) {
      Alert.alert(
        'Erro',
        err.response?.data?.error || 'Não foi possível resgatar o prémio.'
      );
    } finally {
      setConfirmingRedeem(false);
    }
  };

  const filteredRewards = useMemo(() => {
    const base =
      filter === 'AVAILABLE'
        ? rewards.filter((r) => balance >= r.points_cost)
        : [...rewards];

    return base.sort((a, b) => {
      const aCan = balance >= a.points_cost ? 0 : 1;
      const bCan = balance >= b.points_cost ? 0 : 1;
      if (aCan !== bCan) return aCan - bCan;
      return a.points_cost - b.points_cost;
    });
  }, [rewards, filter, balance]);

  const locale = language === 'EN' ? 'en-GB' : language === 'ES' ? 'es-ES' : 'pt-PT';

  const getVoucherStatusMeta = (v: VoucherItem) => {
    const isExpiredDate = v.status === 'ACTIVE' && new Date(v.expires_at) <= new Date();
    const effective = isExpiredDate ? 'EXPIRED' : v.status;
    switch (effective) {
      case 'ACTIVE':
        return { label: t('voucherStatusActive'), bg: Colors.successLight, fg: Colors.success, clickable: true };
      case 'REDEEMED':
        return { label: t('voucherStatusRedeemed'), bg: Colors.primarySoft, fg: Colors.primary, clickable: false };
      case 'REFUNDED':
        return { label: t('voucherStatusRefunded'), bg: Colors.goldLight, fg: Colors.goldDark, clickable: false };
      default:
        return { label: t('voucherStatusExpired'), bg: Colors.dangerLight, fg: Colors.danger, clickable: false };
    }
  };

  const renderVoucherRow = ({ item }: { item: VoucherItem }) => {
    const meta = getVoucherStatusMeta(item);
    const createdDate = new Date(item.expires_at).toLocaleDateString(locale, {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <TouchableOpacity
        style={styles.voucherCard}
        disabled={!meta.clickable}
        onPress={() =>
          router.push({
            pathname: '/(tabs)/voucher',
            params: {
              code: item.voucher_code,
              name: item.reward?.name || '',
              expiresAt: item.expires_at,
            },
          })
        }
        activeOpacity={0.75}
      >
        <View style={styles.voucherIcon}>
          <Ticket size={20} color={meta.clickable ? Colors.primary : Colors.textMuted} />
        </View>
        <View style={styles.voucherBody}>
          <View style={styles.voucherTopRow}>
            <Text style={styles.voucherTitle} numberOfLines={1}>
              {item.reward?.name || 'Voucher Açaí da Rose'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
              <Text style={[styles.statusBadgeText, { color: meta.fg }]}>{meta.label}</Text>
            </View>
          </View>
          <Text style={styles.voucherCode}>{item.voucher_code}</Text>
          <Text style={styles.voucherDate}>
            {t('expiresIn')}: {createdDate}
          </Text>
        </View>
        {meta.clickable && <ChevronRight size={18} color={Colors.textMuted} />}
      </TouchableOpacity>
    );
  };

  const isLoading = filter === 'VOUCHERS' ? isLoadingVouchers : isLoadingRewards;
  const isRefreshing = filter === 'VOUCHERS' ? isRefetchingVouchers : isRefetchingRewards;

  return (
    <View style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{t('tabRewards')}</Text>
            <View style={styles.balancePill}>
              <Text style={styles.balancePillText}>
                {balance.toLocaleString(locale)} pts
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.menuAccessBtn}
            onPress={() => router.navigate('/(tabs)/ementa')}
            activeOpacity={0.8}
          >
            <UtensilsCrossed size={14} color={Colors.primary} />
            <Text style={styles.menuAccessBtnText}>{t('menu')}</Text>
          </TouchableOpacity>
        </View>

        {/* Filtros Segmentados */}
        <View style={styles.filterRow}>
          {(
            [
              { key: 'ALL', label: t('filterAll') },
              { key: 'AVAILABLE', label: t('filterAvailable') },
              { key: 'VOUCHERS', label: `Vouchers (${vouchers.length})` },
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
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.skeletonList}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <SkeletonBox width={86} height={86} borderRadius={14} />
              <View style={{ flex: 1, gap: 8 }}>
                <SkeletonBox width="70%" height={16} />
                <SkeletonBox width="40%" height={18} />
                <SkeletonBox width="100%" height={6} />
                <SkeletonBox width="100%" height={34} borderRadius={10} />
              </View>
            </View>
          ))}
        </View>
      ) : isErrorRewards && filter !== 'VOUCHERS' ? (
        <EmptyState
          variant="error"
          title={t('loadErrorTitle')}
          description={t('loadErrorSub')}
          actionText={t('retryBtn')}
          onAction={refetchRewards}
        />
      ) : filter === 'VOUCHERS' ? (
        <FlatList
          data={vouchers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={manualRefreshing}
              onRefresh={() => {
                handleManualRefresh('vouchers');
              }}
              tintColor={Colors.primary}
            />
          }
          renderItem={renderVoucherRow}
          ListEmptyComponent={
            <EmptyState
              title={t('emptyVouchersTitle')}
              description={t('emptyVouchersSub')}
            />
          }
        />
      ) : (
        <FlatList
          data={filteredRewards}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={manualRefreshing}
              onRefresh={() => {
                handleManualRefresh('rewards');
              }}
              tintColor={Colors.primary}
            />
          }
          renderItem={({ item }) => (
            <RewardCard
              reward={item}
              userBalance={balance}
              onRedeem={handleRedeem}
              isRedeeming={redeemingRewardId === item.id}
            />
          )}
          ListFooterComponent={
            filteredRewards.length > 0 ? (
              <View style={styles.pickupInfoCard}>
                <View style={styles.pickupIconBox}>
                  <Store size={20} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickupTitle}>{t('counterPickupTitle')}</Text>
                  <Text style={styles.pickupText}>
                    {t('counterPickupSub', {
                      store: activeStore ? getStoreShortLabel(activeStore) : 'Açaí da Rose',
                    })}
                  </Text>
                </View>
              </View>
            ) : undefined
          }
          ListEmptyComponent={
            <EmptyState
              title={t('emptyRewardsTitle')}
              description={t('emptyRewardsSub')}
              actionText={t('retryBtn')}
              onAction={refetchRewards}
            />
          }
        />
      )}

      {/* Modal de Confirmação de Resgate */}
      <Modal
        visible={Boolean(pendingReward)}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!confirmingRedeem) setPendingReward(null);
        }}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            {pendingReward ? (
              <>
                <View style={styles.confirmHeader}>
                  <View style={styles.confirmThumb}>
                    {resolveMediaUrl(pendingReward.image_url) ? (
                      <Image
                        source={{ uri: resolveMediaUrl(pendingReward.image_url)! }}
                        style={styles.confirmThumbImg}
                        contentFit="cover"
                      />
                    ) : (
                      <Gift size={26} color={Colors.primary} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.confirmTitle}>{t('confirmRedeemTitle')}</Text>
                    <Text style={styles.confirmRewardName} numberOfLines={2}>
                      {pendingReward.name}
                    </Text>
                  </View>
                </View>

                <Text style={styles.confirmDesc}>{t('confirmRedeemDesc')}</Text>

                <View style={styles.balanceSummaryBox}>
                  <View style={styles.balanceSummaryRow}>
                    <Text style={styles.balanceSummaryLabel}>{t('balanceBeforeLabel')}</Text>
                    <Text style={styles.balanceSummaryValue}>{balance} pts</Text>
                  </View>
                  <View style={styles.balanceSummaryDivider} />
                  <View style={styles.balanceSummaryRow}>
                    <Text style={styles.balanceSummaryLabel}>{t('balanceAfterLabel')}</Text>
                    <Text style={[styles.balanceSummaryValue, { color: Colors.primary }]}>
                      {Math.max(0, balance - pendingReward.points_cost)} pts
                    </Text>
                  </View>
                </View>

                <View style={styles.confirmActionsRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setPendingReward(null)}
                    disabled={confirmingRedeem}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.cancelBtnText}>{t('cancelBtn')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={executeRedeem}
                    disabled={confirmingRedeem}
                    activeOpacity={0.85}
                  >
                    {confirmingRedeem ? (
                      <ActivityIndicator size="small" color={Colors.textInverse} />
                    ) : (
                      <Text style={styles.confirmBtnText}>{t('confirmRedeemBtn')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
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
    paddingBottom: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  title: {
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.3,
    color: Colors.text,
    fontWeight: '800',
  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.goldLight,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  balancePillText: {
    color: Colors.goldDark,
    fontSize: 12,
    fontWeight: '800',
  },
  subtitle: {
    ...Typography.subhead,
    color: Colors.textMuted,
    marginTop: 3,
  },
  menuAccessBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  menuAccessBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  storeContextPill: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  storeContextText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  storeChangeLink: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
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
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: Colors.textInverse,
  },
  skeletonList: {
    padding: 16,
    gap: 14,
  },
  skeletonCard: {
    flexDirection: 'row',
    gap: 14,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.card,
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
  },
  voucherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  voucherIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voucherBody: {
    flex: 1,
  },
  voucherTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  voucherTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  voucherCode: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 3,
  },
  voucherDate: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  pickupInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 14,
    marginTop: 4,
  },
  pickupIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  pickupText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginTop: 2,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(29, 14, 32, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  confirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  confirmThumb: {
    width: 58,
    height: 58,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmThumbImg: {
    width: '100%',
    height: '100%',
  },
  confirmTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  confirmRewardName: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 2,
  },
  confirmDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  balanceSummaryBox: {
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 18,
  },
  balanceSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceSummaryDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 8,
  },
  balanceSummaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  balanceSummaryValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  confirmActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  confirmBtn: {
    flex: 1.3,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textInverse,
  },
});
