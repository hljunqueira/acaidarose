import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Linking,
  RefreshControl,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { SubPageHeader } from '@/components/SubPageHeader';
import { SkeletonBox } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { useStores } from '@/hooks/useStores';
import { useLanguage } from '@/hooks/useLanguage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getStoreOpenStatus } from '@/utils/storeHours';
import { Check, MapPin, Navigation, Phone, Clock } from 'lucide-react-native';

export default function LojasScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const targetRoute = (typeof returnTo === 'string' && returnTo.startsWith('/(tabs)')
    ? returnTo
    : '/(tabs)') as any;
  const { setActiveStoreId } = useAuth();
  const { t } = useLanguage();
  const {
    stores,
    activeStoreId,
    nearestStore,
    distanceByStoreId,
    isLoading,
    isError,
    refetch,
  } = useStores();

  const [manualRefreshing, setManualRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setManualRefreshing(true);
    try {
      await refetch();
    } finally {
      setManualRefreshing(false);
    }
  };

  const handleSelectStore = async (tenantId: string) => {
    await setActiveStoreId(tenantId);
    router.navigate(targetRoute);
  };

  const handleOpenMap = (mapsUrl?: string | null, address?: string | null, city?: string | null) => {
    const target =
      mapsUrl ||
      `https://maps.google.com/?q=${encodeURIComponent([address, city, 'Portugal'].filter(Boolean).join(', '))}`;
    Linking.openURL(target).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <SubPageHeader title={t('chooseStoreTitle')} backTo={targetRoute} />

      {isLoading ? (
        <View style={styles.skeletonWrap}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.skeletonItem}>
              <SkeletonBox width={24} height={24} borderRadius={12} />
              <View style={{ flex: 1, gap: 6 }}>
                <SkeletonBox width="72%" height={16} />
                <SkeletonBox width="88%" height={12} />
              </View>
            </View>
          ))}
        </View>
      ) : isError ? (
        <EmptyState
          variant="error"
          title={t('loadErrorTitle')}
          description={t('loadErrorSub')}
          actionText={t('retryBtn')}
          onAction={refetch}
        />
      ) : (
        <FlatList
          data={stores}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={manualRefreshing}
              onRefresh={handleManualRefresh}
              tintColor={Colors.primary}
            />
          }
          renderItem={({ item }) => {
            const isSelected = activeStoreId === item.id;
            const isNearest = nearestStore?.id === item.id;
            const distKm = distanceByStoreId[item.id];
            const openStatus = getStoreOpenStatus(item.openingHours);
            const fullAddress = [item.address, item.city].filter(Boolean).join(', ');

            return (
              <TouchableOpacity
                style={[styles.storeItem, isSelected && styles.storeItemActive]}
                onPress={() => handleSelectStore(item.id)}
                activeOpacity={0.75}
              >
                <View style={styles.storeIcon}>
                  <MapPin size={20} color={isSelected ? Colors.primary : Colors.textMuted} />
                </View>

                <View style={styles.storeInfo}>
                  {(isNearest || distKm !== undefined) && (
                    <View style={styles.badgesRow}>
                      {isNearest && (
                        <View style={styles.nearestBadge}>
                          <Text style={styles.nearestBadgeText}>{t('nearestBadge')}</Text>
                        </View>
                      )}
                      {distKm !== undefined && (
                        <Text style={styles.distanceText}>{distKm} km</Text>
                      )}
                    </View>
                  )}

                  <Text style={[styles.storeName, isSelected && styles.storeNameActive]}>
                    {item.name}
                  </Text>

                  {fullAddress ? (
                    <Text style={styles.storeAddress}>{fullAddress}</Text>
                  ) : null}

                  {openStatus ? (
                    <View style={styles.hoursRow}>
                      <View
                        style={[
                          styles.hoursDot,
                          { backgroundColor: openStatus.isOpen ? Colors.success : Colors.textMuted },
                        ]}
                      />
                      <Text
                        style={[
                          styles.hoursStatus,
                          { color: openStatus.isOpen ? Colors.success : Colors.textMuted },
                        ]}
                      >
                        {openStatus.closedToday
                          ? t('storeClosedToday')
                          : openStatus.isOpen
                          ? t('storeOpenNow')
                          : t('storeClosedNow')}
                      </Text>
                      {openStatus.openTime && openStatus.closeTime ? (
                        <View style={styles.hoursTimeWrap}>
                          <Clock size={11} color={Colors.textMuted} />
                          <Text style={styles.hoursTime}>
                            {openStatus.openTime}–{openStatus.closeTime}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}

                  <View style={styles.storeActionsRow}>
                    {item.phone ? (
                      <TouchableOpacity
                        style={styles.miniAction}
                        onPress={(e) => {
                          e.stopPropagation();
                          Linking.openURL(`tel:${item.phone}`).catch(() => {});
                        }}
                      >
                        <Phone size={12} color={Colors.primary} />
                        <Text style={styles.miniActionText}>{item.phone}</Text>
                      </TouchableOpacity>
                    ) : null}

                    {(item.googleMapsUrl || fullAddress) && (
                      <TouchableOpacity
                        style={styles.miniAction}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleOpenMap(item.googleMapsUrl, item.address, item.city);
                        }}
                      >
                        <Navigation size={12} color={Colors.primary} />
                        <Text style={styles.miniActionText}>{t('openInMaps')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {isSelected && <Check size={20} color={Colors.primary} />}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  skeletonWrap: {
    padding: 20,
    gap: 12,
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  listContent: {
    padding: 16,
    paddingBottom: 116,
  },
  storeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    marginBottom: 12,
  },
  storeItemActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
  storeIcon: {
    marginRight: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  storeInfo: {
    flex: 1,
    paddingRight: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  hqBadge: {
    backgroundColor: Colors.goldLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  hqBadgeText: {
    color: Colors.goldDark,
    fontSize: 10,
    fontWeight: '800',
  },
  nearestBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  nearestBadgeText: {
    color: Colors.success,
    fontSize: 10,
    fontWeight: '800',
  },
  distanceText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  storeName: {
    ...Typography.headline,
    color: Colors.text,
  },
  storeNameActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  storeAddress: {
    ...Typography.footnote,
    color: Colors.textMuted,
    marginTop: 3,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  hoursDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  hoursStatus: {
    fontSize: 11,
    fontWeight: '800',
  },
  hoursTimeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  hoursTime: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  storeActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  miniAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  miniActionText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
});
