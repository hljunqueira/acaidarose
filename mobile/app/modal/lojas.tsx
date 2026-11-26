import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Linking,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { ModalHeader } from '@/components/ModalHeader';
import { SkeletonBox } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { useStores } from '@/hooks/useStores';
import { useLanguage } from '@/hooks/useLanguage';
import { useRouter, useNavigation } from 'expo-router';
import { Check, MapPin, Navigation, Phone } from 'lucide-react-native';

export default function LojasModal() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
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

  const isMountedRef = React.useRef(true);
  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleClose = () => {
    try {
      if (typeof router.canDismiss === 'function' && router.canDismiss()) {
        router.dismiss(1);
      } else if (navigation.canGoBack()) {
        navigation.goBack();
      } else if (typeof router.canGoBack === 'function' && router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
        return;
      }
    } catch {
      router.replace('/(tabs)');
      return;
    }

    setTimeout(() => {
      if (isMountedRef.current) {
        try {
          router.replace('/(tabs)');
        } catch {}
      }
    }, 150);
  };

  const handleSelectStore = async (tenantId: string) => {
    await setActiveStoreId(tenantId);
    handleClose();
  };

  const handleOpenMap = (mapsUrl?: string | null, address?: string | null, city?: string | null) => {
    const target =
      mapsUrl ||
      `https://maps.google.com/?q=${encodeURIComponent([address, city, 'Portugal'].filter(Boolean).join(', '))}`;
    Linking.openURL(target).catch(() => {});
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Platform.OS === 'ios' ? 8 : insets.top,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      <ModalHeader
        title={t('chooseStoreTitle')}
        icon={<MapPin size={18} color={Colors.primary} />}
        showGrabber={Platform.OS === 'ios'}
      />

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
              refreshing={isLoading}
              onRefresh={() => {
                refetch();
              }}
              tintColor={Colors.primary}
            />
          }
          renderItem={({ item }) => {
            const isSelected = activeStoreId === item.id;
            const isNearest = nearestStore?.id === item.id;
            const distKm = distanceByStoreId[item.id];
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
                  <View style={styles.badgesRow}>
                    {item.isHeadquarters && (
                      <View style={styles.hqBadge}>
                        <Text style={styles.hqBadgeText}>{t('headquartersBadge')}</Text>
                      </View>
                    )}
                    {isNearest && (
                      <View style={styles.nearestBadge}>
                        <Text style={styles.nearestBadgeText}>{t('nearestBadge')}</Text>
                      </View>
                    )}
                    {distKm !== undefined && (
                      <Text style={styles.distanceText}>{distKm} km</Text>
                    )}
                  </View>

                  <Text style={[styles.storeName, isSelected && styles.storeNameActive]}>
                    {item.name}
                  </Text>

                  {fullAddress ? (
                    <Text style={styles.storeAddress}>{fullAddress}</Text>
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
    padding: 20,
    paddingBottom: 40,
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
