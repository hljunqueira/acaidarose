import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Linking,
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useLoyalty, CampaignItem } from '@/hooks/useLoyalty';
import { useLanguage } from '@/hooks/useLanguage';
import { resolveMediaUrl } from '@/services/api';
import { Colors } from '@/constants/Colors';
import { PointsCard } from '@/components/PointsCard';
import { CampaignCard } from '@/components/CampaignCard';
import { SkeletonBox } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import {
  Gift,
  Store,
  Ticket,
  ArrowRight,
  Clock,
  UserPlus,
} from 'lucide-react-native';

function formatRemainingShort(expiresAt: string): string {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return '0h';
  const totalMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours >= 1) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { customer } = useAuth();
  const { t, language } = useLanguage();
  const {
    rewards,
    campaign,
    campaigns,
    referralConfig,
    balance,
    transactions,
    activeVouchers,
    notifications,
    isLoadingRewards,
    isLoadingTransactions,
    isRefetchingRewards,
    isRefetchingTransactions,
    isErrorTransactions,
    refetchRewards,
    refetchVouchers,
    refetchTransactions,
    refetchNotifications,
  } = useLoyalty();

  const [manualRefreshing, setManualRefreshing] = useState(false);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignItem | null>(null);

  const handleRefresh = async () => {
    setManualRefreshing(true);
    try {
      await Promise.all([
        refetchRewards(),
        refetchVouchers(),
        refetchTransactions(),
        refetchNotifications(),
      ]);
    } finally {
      setManualRefreshing(false);
    }
  };

  const latestNotification = useMemo(
    () => notifications.find((n) => !dismissedNotificationIds.includes(n.id)) || null,
    [notifications, dismissedNotificationIds]
  );

  // Prioriza prémios já desbloqueados; se ainda não houver nenhum, mostra progresso para o mais próximo
  const { nextReward, unlockedRewardsCount } = useMemo(() => {
    if (!rewards.length) {
      return { nextReward: null, unlockedRewardsCount: 0 };
    }
    const sorted = [...rewards].sort((a, b) => a.points_cost - b.points_cost);
    const unlocked = sorted.filter((r) => r.points_cost <= balance);
    if (unlocked.length > 0) {
      return {
        nextReward: unlocked[unlocked.length - 1],
        unlockedRewardsCount: unlocked.length,
      };
    }
    return {
      nextReward: sorted[0],
      unlockedRewardsCount: 0,
    };
  }, [rewards, balance]);

  const locale = language === 'EN' ? 'en-GB' : language === 'ES' ? 'es-ES' : 'pt-PT';

  const firstName = customer?.name?.trim()?.split(/\s+/)[0] || '';
  const greetingPrefix = language === 'EN' ? 'Hi' : language === 'ES' ? 'Hola' : 'Olá';

  // Animação suave de entrada em cascata (RN Animated nativo 60fps)
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslate = useRef(new Animated.Value(14)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.stagger(90, [
      Animated.parallel([
        Animated.timing(heroOpacity, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(heroTranslate, {
          toValue: 0,
          duration: 340,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslate, {
          toValue: 0,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [heroOpacity, heroTranslate, contentOpacity, contentTranslate]);

  const featuredRewards = useMemo(() => {
    if (!rewards.length) return [];
    return [...rewards]
      .sort((a, b) => {
        const aCan = balance >= a.points_cost ? 0 : 1;
        const bCan = balance >= b.points_cost ? 0 : 1;
        if (aCan !== bCan) return aCan - bCan;
        return a.points_cost - b.points_cost;
      })
      .slice(0, 6);
  }, [rewards, balance]);

  return (
    <View style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 12) + 96 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={manualRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* 1. Cartão de Pontos */}
        <Animated.View
          style={{
            opacity: heroOpacity,
            transform: [{ translateY: heroTranslate }],
          }}
        >
          <PointsCard
            balance={balance}
            nextReward={nextReward}
            unlockedCount={unlockedRewardsCount}
          />
        </Animated.View>

        {/* 2. Vouchers Ativos no Caixa (Prioridade máxima ao chegar ao balcão) */}
        {activeVouchers && activeVouchers.length > 0 && (
          <View style={styles.vouchersSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>{t('activeVouchers')}</Text>
              <View style={styles.vouchersCountBadge}>
                <Text style={styles.vouchersCount}>{activeVouchers.length}</Text>
              </View>
            </View>

            {activeVouchers.map((voucher) => (
              <TouchableOpacity
                key={voucher.id}
                style={styles.voucherCard}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/voucher',
                    params: {
                      code: voucher.voucher_code,
                      name: voucher.reward?.name || '',
                      expiresAt: voucher.expires_at,
                    },
                  })
                }
                activeOpacity={0.8}
              >
                <View style={styles.voucherIcon}>
                  <Ticket size={20} color={Colors.primary} />
                </View>
                <View style={styles.voucherInfo}>
                  <Text style={styles.voucherName} numberOfLines={1}>
                    {voucher.reward?.name || 'Voucher Açaí da Rose'}
                  </Text>
                  <View style={styles.voucherMetaRow}>
                    <Text style={styles.voucherCode}>{voucher.voucher_code}</Text>
                    <View style={styles.voucherTimerPill}>
                      <Clock size={10} color={Colors.goldDark} />
                      <Text style={styles.voucherTimerText}>
                        {formatRemainingShort(voucher.expires_at)}
                      </Text>
                    </View>
                  </View>
                </View>
                <ArrowRight size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 3. Carrossel Unificado: Campanhas, Destaques & Publicidade (100% PostgreSQL) */}
        {!isLoadingRewards && campaigns.length > 0 ? (
          <View style={styles.highlightsSection}>
            {campaigns.length === 1 ? (
              <View style={styles.highlightsSingleWrap}>
                {campaigns.map((item) => {
                  const imgUri = resolveMediaUrl(item.banner_url);
                  const badgeText =
                    item.campaign_type === 'MULTIPLIER'
                      ? `${Number(item.multiplier)}x PONTOS`
                      : item.campaign_type === 'HIGHLIGHT'
                        ? language === 'EN'
                          ? 'HIGHLIGHT'
                          : language === 'ES'
                            ? 'DESTACADO'
                            : 'DESTAQUE'
                        : language === 'EN'
                          ? 'PARTNER'
                          : language === 'ES'
                            ? 'PUBLICIDAD'
                            : 'PUBLICIDADE';

                  const handlePress = () => {
                    if (item.campaign_type === 'AD' && item.link_url) {
                      Linking.openURL(item.link_url).catch(() => {});
                      return;
                    }
                    if (item.content || item.description || item.subtitle || item.banner_url) {
                      setSelectedCampaign(item);
                    } else if (item.link_url) {
                      Linking.openURL(item.link_url).catch(() => {});
                    }
                  };

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.highlightCard, styles.highlightCardSingle]}
                      onPress={handlePress}
                      activeOpacity={0.88}
                    >
                      {imgUri ? (
                        <Image
                          source={{ uri: imgUri }}
                          style={styles.highlightImage}
                          contentFit="cover"
                          transition={180}
                        />
                      ) : null}
                      <View style={styles.highlightBody}>
                        <View style={styles.highlightBadgeRow}>
                          <View
                            style={[
                              styles.highlightBadge,
                              item.campaign_type === 'MULTIPLIER' && styles.highlightBadgeMultiplier,
                            ]}
                          >
                            <Text
                              style={[
                                styles.highlightBadgeText,
                                item.campaign_type === 'MULTIPLIER' &&
                                  styles.highlightBadgeTextMultiplier,
                              ]}
                            >
                              {badgeText}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.highlightTitle} numberOfLines={2}>
                          {item.title}
                        </Text>
                        {item.subtitle || item.description ? (
                          <Text style={styles.highlightSubtitle} numberOfLines={2}>
                            {item.subtitle || item.description}
                          </Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.highlightsScroll}
                decelerationRate="fast"
              >
                {campaigns.map((item) => {
                  const imgUri = resolveMediaUrl(item.banner_url);
                  const badgeText =
                    item.campaign_type === 'MULTIPLIER'
                      ? `${Number(item.multiplier)}x PONTOS`
                      : item.campaign_type === 'HIGHLIGHT'
                        ? language === 'EN'
                          ? 'HIGHLIGHT'
                          : language === 'ES'
                            ? 'DESTACADO'
                            : 'DESTAQUE'
                        : language === 'EN'
                          ? 'PARTNER'
                          : language === 'ES'
                            ? 'PUBLICIDAD'
                            : 'PUBLICIDADE';

                  const handlePress = () => {
                    if (item.campaign_type === 'AD' && item.link_url) {
                      Linking.openURL(item.link_url).catch(() => {});
                      return;
                    }
                    if (item.content || item.description || item.subtitle || item.banner_url) {
                      setSelectedCampaign(item);
                    } else if (item.link_url) {
                      Linking.openURL(item.link_url).catch(() => {});
                    }
                  };

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.highlightCard}
                      onPress={handlePress}
                      activeOpacity={0.88}
                    >
                      {imgUri ? (
                        <Image
                          source={{ uri: imgUri }}
                          style={styles.highlightImage}
                          contentFit="cover"
                          transition={180}
                        />
                      ) : null}
                      <View style={styles.highlightBody}>
                        <View style={styles.highlightBadgeRow}>
                          <View
                            style={[
                              styles.highlightBadge,
                              item.campaign_type === 'MULTIPLIER' && styles.highlightBadgeMultiplier,
                            ]}
                          >
                            <Text
                              style={[
                                styles.highlightBadgeText,
                                item.campaign_type === 'MULTIPLIER' &&
                                  styles.highlightBadgeTextMultiplier,
                              ]}
                            >
                              {badgeText}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.highlightTitle} numberOfLines={2}>
                          {item.title}
                        </Text>
                        {item.subtitle || item.description ? (
                          <Text style={styles.highlightSubtitle} numberOfLines={2}>
                            {item.subtitle || item.description}
                          </Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        ) : !isLoadingRewards && campaign ? (
          <CampaignCard campaign={campaign} />
        ) : null}

        {/* 3.5 Aviso / Notificação mais recente enviada pela Franqueadora */}
        {latestNotification ? (
          <View style={styles.announcementCard}>
            {resolveMediaUrl(latestNotification.image_url) ? (
              <Image
                source={{ uri: resolveMediaUrl(latestNotification.image_url)! }}
                style={styles.announcementImage}
                contentFit="cover"
                transition={180}
              />
            ) : null}
            <View style={styles.announcementContentRow}>
              <View style={styles.announcementBody}>
                <Text style={styles.announcementTitle}>{latestNotification.title}</Text>
                <Text style={styles.announcementText}>{latestNotification.body}</Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  setDismissedNotificationIds((prev) => [...prev, latestNotification.id])
                }
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.announcementClose}
                accessibilityLabel="Fechar aviso"
              >
                <Text style={styles.announcementCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* 4. Banner Convidar Amigos (controlado pelo Admin via loyalty_settings) */}
        {referralConfig.enabled ? (
          <TouchableOpacity
            style={styles.referralBanner}
            onPress={() => router.navigate('/(tabs)/convidar')}
            activeOpacity={0.85}
          >
            <View style={styles.referralBannerIcon}>
              <UserPlus size={20} color={Colors.primary} />
            </View>
            <View style={styles.referralBannerBody}>
              <View style={styles.referralBannerTitleRow}>
                <Text style={styles.referralBannerTitle}>{t('inviteFriends')}</Text>
                <View style={styles.referralBannerPill}>
                  <Text style={styles.referralBannerPillText}>
                    +{referralConfig.bonus_points} pts
                  </Text>
                </View>
              </View>
              <Text style={styles.referralBannerSub} numberOfLines={2}>
                {t('referralBannerSub')}
              </Text>
            </View>
            <ArrowRight size={18} color={Colors.primary} />
          </TouchableOpacity>
        ) : null}

        {/* 4.5 Mini-carrossel de Prémios Reais */}
        {!isLoadingRewards && featuredRewards.length > 0 ? (
          <Animated.View
            style={[
              styles.featuredSection,
              {
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslate }],
              },
            ]}
          >
            <View style={styles.featuredHeader}>
              <Text style={styles.movementsTitle}>{t('tabRewards')}</Text>
              <TouchableOpacity
                onPress={() => router.navigate('/(tabs)/premios')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.seeAllText}>{t('seeAll')}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredScroll}
            >
              {featuredRewards.map((item) => {
                const mediaUri = resolveMediaUrl(item.image_url);
                const canRedeem = balance >= item.points_cost;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.featuredCard,
                      canRedeem && styles.featuredCardReady,
                    ]}
                    onPress={() => router.navigate('/(tabs)/premios')}
                    activeOpacity={0.85}
                  >
                    <View style={styles.featuredImgBox}>
                      {mediaUri ? (
                        <Image
                          source={{ uri: mediaUri }}
                          style={styles.featuredImg}
                          contentFit="cover"
                          transition={180}
                        />
                      ) : (
                        <Gift size={24} color={Colors.primary} />
                      )}
                    </View>
                    <Text style={styles.featuredName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <View
                      style={[
                        styles.featuredPtsPill,
                        canRedeem && styles.featuredPtsPillReady,
                      ]}
                    >
                      <Text
                        style={[
                          styles.featuredPtsText,
                          canRedeem && styles.featuredPtsTextReady,
                        ]}
                      >
                        {item.points_cost} pts
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>
        ) : null}

        {/* 5. Últimos Movimentos */}
        <Animated.View
          style={[
            styles.movementsSection,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslate }],
            },
          ]}
        >
          <View style={styles.movementsHeader}>
            <Text style={styles.movementsTitle}>{t('recentActivity')}</Text>
            <TouchableOpacity
              onPress={() =>
                router.navigate({
                  pathname: '/(tabs)/extrato',
                  params: { returnTo: '/(tabs)' },
                })
              }
            >
              <Text style={styles.seeAllText}>{t('seeAll')}</Text>
            </TouchableOpacity>
          </View>

          {isLoadingTransactions ? (
            <View style={styles.movementsCardGroup}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={styles.skeletonRow}>
                  <SkeletonBox width={38} height={38} borderRadius={19} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <SkeletonBox width="68%" height={14} />
                    <SkeletonBox width="42%" height={10} />
                  </View>
                  <SkeletonBox width={54} height={22} borderRadius={12} />
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
            <View style={styles.movementsCardGroup}>
              {transactions && transactions.length > 0 ? (
                transactions.slice(0, 4).map((tx, idx) => {
                  const isCredit = tx.type === 'CREDIT';
                  const formattedDate = new Date(tx.created_at).toLocaleDateString(locale, {
                    day: '2-digit',
                    month: 'short',
                  });
                  const storeName = tx.tenant_city || tx.tenant_name;
                  const metaLine = storeName ? `${storeName} • ${formattedDate}` : formattedDate;

                  return (
                    <TouchableOpacity
                      key={tx.id || idx}
                      style={styles.movementItem}
                      onPress={() => router.navigate('/(tabs)/extrato')}
                      activeOpacity={0.75}
                    >
                      <View style={styles.movementLeft}>
                        <View
                          style={[
                            styles.movementIconBg,
                            {
                              backgroundColor: isCredit
                                ? Colors.successLight
                                : Colors.primarySoft,
                            },
                          ]}
                        >
                          {isCredit ? (
                            <Store size={18} color={Colors.success} />
                          ) : (
                            <Gift size={18} color={Colors.primary} />
                          )}
                        </View>
                        <View style={styles.movementInfo}>
                          <Text style={styles.movementTitleText}>
                            {tx.description}
                          </Text>
                          <Text style={styles.movementSubText} numberOfLines={1}>
                            {metaLine}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.movementRight}>
                        <View
                          style={
                            isCredit ? styles.pointsPillPositive : styles.pointsPillNegative
                          }
                        >
                          <Text
                            style={
                              isCredit
                                ? styles.pointsPillTextPositive
                                : styles.pointsPillTextNegative
                            }
                          >
                            {isCredit ? `+${tx.points}` : `-${tx.points}`} pts
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptyMovements}>
                  <Text style={styles.emptyMovementsTitle}>{t('noRecentActivity')}</Text>
                  <Text style={styles.emptyMovementsSub}>{t('noRecentActivitySub')}</Text>
                </View>
              )}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Modal de Detalhe da Campanha / Destaque */}
      <Modal
        visible={Boolean(selectedCampaign)}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedCampaign(null)}
      >
        <View style={styles.campaignModalBackdrop}>
          <View style={styles.campaignModalSheet}>
            <View style={styles.campaignModalTopBar}>
              <TouchableOpacity
                onPress={() => setSelectedCampaign(null)}
                style={styles.campaignModalCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.campaignModalCloseText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.campaignModalTypeLabel}>
                {selectedCampaign?.campaign_type === 'MULTIPLIER'
                  ? `${Number(selectedCampaign.multiplier)}x PONTOS`
                  : selectedCampaign?.campaign_type === 'AD'
                    ? 'PUBLICIDADE'
                    : 'DESTAQUE'}
              </Text>
              <View style={{ width: 32 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {resolveMediaUrl(selectedCampaign?.banner_url) ? (
                <Image
                  source={{ uri: resolveMediaUrl(selectedCampaign?.banner_url)! }}
                  style={styles.campaignModalImage}
                  contentFit="cover"
                />
              ) : null}

              <View style={styles.campaignModalBody}>
                <Text style={styles.campaignModalTitle}>{selectedCampaign?.title}</Text>
                {selectedCampaign?.subtitle ? (
                  <Text style={styles.campaignModalSubtitle}>{selectedCampaign.subtitle}</Text>
                ) : null}
                {selectedCampaign?.content || selectedCampaign?.description ? (
                  <Text style={styles.campaignModalText}>
                    {selectedCampaign?.content || selectedCampaign?.description}
                  </Text>
                ) : null}

                {selectedCampaign?.link_url ? (
                  <TouchableOpacity
                    style={styles.campaignModalCta}
                    onPress={() => {
                      const url = selectedCampaign.link_url;
                      setSelectedCampaign(null);
                      if (url) Linking.openURL(url).catch(() => {});
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.campaignModalCtaText}>
                      {language === 'EN' ? 'Open link' : language === 'ES' ? 'Abrir enlace' : 'Saber mais'}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </ScrollView>
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
  scrollContent: {
    paddingTop: 8,
    backgroundColor: Colors.background,
  },
  homeLogoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    paddingBottom: 6,
  },
  homeLogo: {
    width: 118,
    height: 44,
  },
  greetingRow: {
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 4,
  },
  greetingText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  greetingName: {
    fontWeight: '800',
    color: Colors.text,
  },
  featuredSection: {
    marginTop: 20,
  },
  announcementCard: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 18,
    overflow: 'hidden',
  },
  announcementImage: {
    width: '100%',
    height: 136,
    backgroundColor: Colors.primarySoft,
  },
  announcementContentRow: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  announcementBody: {
    flex: 1,
    gap: 3,
  },
  announcementTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  announcementText: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  announcementClose: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  announcementCloseText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  featuredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  featuredScroll: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 12,
  },
  featuredCard: {
    width: 148,
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 10,
    justifyContent: 'space-between',
    gap: 8,
  },
  featuredCardReady: {
    borderColor: Colors.primary,
  },
  featuredImgBox: {
    width: '100%',
    height: 88,
    borderRadius: 12,
    backgroundColor: Colors.primarySurface,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredImg: {
    width: '100%',
    height: '100%',
  },
  featuredName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 16,
    minHeight: 32,
  },
  featuredPtsPill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  featuredPtsPillReady: {
    backgroundColor: Colors.primary,
  },
  featuredPtsText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  featuredPtsTextReady: {
    color: Colors.textInverse,
  },
  referralBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  referralBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralBannerBody: {
    flex: 1,
  },
  referralBannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  referralBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  referralBannerPill: {
    backgroundColor: Colors.goldLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  referralBannerPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.goldDark,
  },
  referralBannerSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  quickActionsSection: {
    marginTop: 18,
    paddingHorizontal: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  quickGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickActionCard: {
    flex: 1,
    height: 100,
    backgroundColor: Colors.primarySurface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  quickIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickActionLabel: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 14,
  },
  referralBonusBadge: {
    position: 'absolute',
    top: -6,
    right: 4,
    backgroundColor: Colors.success,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 10,
    zIndex: 10,
  },
  referralBonusText: {
    color: Colors.textInverse,
    fontSize: 9,
    fontWeight: '800',
  },
  movementsSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  movementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  movementsTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  movementsTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  seeAllText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  movementsCardGroup: {
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 6,
    gap: 6,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 12,
  },
  emptyMovements: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMovementsTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyMovementsSub: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  movementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 14,
    padding: 12,
  },
  movementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  movementIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  movementInfo: {
    flex: 1,
  },
  movementTitleText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  movementSubText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  movementRight: {
    alignItems: 'flex-end',
  },
  pointsPillPositive: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pointsPillTextPositive: {
    color: Colors.success,
    fontSize: 13,
    fontWeight: '800',
  },
  pointsPillNegative: {
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pointsPillTextNegative: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  vouchersSection: {
    marginTop: 18,
    paddingHorizontal: 16,
  },
  vouchersCountBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  vouchersCount: {
    color: Colors.textInverse,
    fontSize: 11,
    fontWeight: '800',
  },
  voucherCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  voucherIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  voucherInfo: {
    flex: 1,
    paddingRight: 8,
  },
  voucherName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  voucherMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  voucherCode: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  voucherTimerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.goldLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  voucherTimerText: {
    color: Colors.goldDark,
    fontSize: 10,
    fontWeight: '800',
  },
  highlightsSection: {
    marginTop: 14,
  },
  highlightsSingleWrap: {
    paddingHorizontal: 16,
  },
  highlightsScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  highlightCard: {
    width: 280,
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  highlightCardSingle: {
    width: '100%',
  },
  highlightImage: {
    width: '100%',
    height: 142,
    backgroundColor: Colors.primarySoft,
  },
  highlightBody: {
    padding: 13,
    gap: 4,
  },
  highlightBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  highlightBadge: {
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  highlightBadgeMultiplier: {
    backgroundColor: Colors.goldLight,
  },
  highlightBadgeText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  highlightBadgeTextMultiplier: {
    color: Colors.goldDark,
  },
  highlightTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  highlightSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  campaignModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 4, 36, 0.55)',
    justifyContent: 'flex-end',
  },
  campaignModalSheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  campaignModalTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  campaignModalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  campaignModalCloseText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  campaignModalTypeLabel: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  campaignModalImage: {
    width: '100%',
    height: 210,
    backgroundColor: Colors.primarySoft,
  },
  campaignModalBody: {
    padding: 20,
    paddingBottom: 34,
    gap: 10,
  },
  campaignModalTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
  },
  campaignModalSubtitle: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  campaignModalText: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  campaignModalCta: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  campaignModalCtaText: {
    color: Colors.textInverse,
    fontSize: 14,
    fontWeight: '800',
  },
});
