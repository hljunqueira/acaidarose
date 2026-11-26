import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { UtensilsCrossed } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { ModalHeader } from '@/components/ModalHeader';
import { SkeletonBox } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { useStores, getStoreShortLabel } from '@/hooks/useStores';
import { useMenu, CatalogContainer } from '@/hooks/useMenu';
import { useLanguage } from '@/hooks/useLanguage';
import { resolveMediaUrl } from '@/services/api';

function ProductVideoThumb({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <VideoView
      player={player}
      style={styles.productMedia}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

export default function EmentaModal() {
  const insets = useSafeAreaInsets();
  const { activeStore, activeStoreId, refetch: refetchStores } = useStores();
  const { language, t } = useLanguage();
  const { data, isLoading, isRefetching, isError, refetch } = useMenu(activeStoreId);

  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const menus = useMemo(() => {
    return (data?.menus || []).filter((m) => m.active !== false);
  }, [data?.menus]);

  const activeMenuId = useMemo(() => {
    if (selectedMenuId && menus.some((m) => m.id === selectedMenuId)) {
      return selectedMenuId;
    }
    return menus[0]?.id || null;
  }, [menus, selectedMenuId]);

  const categoriesForMenu = useMemo(() => {
    const all = (data?.categories || []).filter((c) => c.active !== false);
    if (!activeMenuId) return all;
    return all.filter((c) => !c.menuId || c.menuId === activeMenuId);
  }, [data?.categories, activeMenuId]);

  const products = useMemo(() => {
    const all = (data?.containers || []).filter(
      (p) => p.active !== false && p.isAvailableInStore !== false && !p.isCategoryPaused
    );

    const catIdsInMenu = new Set(categoriesForMenu.map((c) => c.id));
    return all.filter((item) => {
      if (selectedCategoryId) {
        return item.categoryId === selectedCategoryId;
      }
      if (activeMenuId && item.menuId) {
        return item.menuId === activeMenuId;
      }
      if (activeMenuId && item.categoryId && catIdsInMenu.size > 0) {
        return catIdsInMenu.has(item.categoryId);
      }
      return true;
    });
  }, [data?.containers, categoriesForMenu, activeMenuId, selectedCategoryId]);

  const getLocalizedName = (item: { name: string; nameEn?: string | null; nameEs?: string | null }) => {
    if (language === 'EN' && item.nameEn) return item.nameEn;
    if (language === 'ES' && item.nameEs) return item.nameEs;
    return item.name;
  };

  const getLocalizedDesc = (item: CatalogContainer) => {
    if (language === 'EN' && item.descriptionEn) return item.descriptionEn;
    if (language === 'ES' && item.descriptionEs) return item.descriptionEs;
    return item.description;
  };

  const isAcaiMenu = useMemo(() => {
    const m = menus.find((x) => x.id === activeMenuId);
    const label = (m?.name || '').toLowerCase();
    return label.includes('aça') || label.includes('acai');
  }, [menus, activeMenuId]);

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
        title={t('menuTitle')}
        subtitle={activeStore ? getStoreShortLabel(activeStore) : undefined}
        icon={<UtensilsCrossed size={18} color={Colors.primary} />}
        showGrabber={Platform.OS === 'ios'}
      />

      {isLoading || (!data && !isError) ? (
        <View style={styles.skeletonWrap}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <SkeletonBox width={120} height={36} borderRadius={18} />
            <SkeletonBox width={100} height={36} borderRadius={18} />
          </View>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <SkeletonBox width={84} height={84} borderRadius={14} />
              <View style={{ flex: 1, gap: 8 }}>
                <SkeletonBox width="70%" height={16} />
                <SkeletonBox width="90%" height={12} />
                <SkeletonBox width="35%" height={16} />
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
          onAction={() => {
            refetchStores();
            refetch();
          }}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                refetch();
              }}
              tintColor={Colors.primary}
            />
          }
        >
          {/* Abas de Menu (horizontais com scroll para todos os menus ativos) */}
          {menus.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.menuTabsRow}
            >
              {menus.map((m) => {
                const active = m.id === activeMenuId;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.menuTab, active && styles.menuTabActive]}
                    onPress={() => {
                      setSelectedMenuId(m.id);
                      setSelectedCategoryId(null);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.menuTabText, active && styles.menuTabTextActive]}>
                      {getLocalizedName(m)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Filtros de Categoria */}
          {categoriesForMenu.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              <TouchableOpacity
                style={[styles.catChip, !selectedCategoryId && styles.catChipActive]}
                onPress={() => setSelectedCategoryId(null)}
              >
                <Text style={[styles.catChipText, !selectedCategoryId && styles.catChipTextActive]}>
                  {t('filterAll')}
                </Text>
              </TouchableOpacity>
              {categoriesForMenu.map((cat) => {
                const active = selectedCategoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.catChip, active && styles.catChipActive]}
                    onPress={() => setSelectedCategoryId(cat.id)}
                  >
                    <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
                      {getLocalizedName(cat)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Regras canónicas para Açaí */}
          {isAcaiMenu && (
            <View style={styles.rulesNote}>
              <Text style={styles.rulesNoteText}>{t('menuRuleBases')}</Text>
              <Text style={styles.rulesNoteText}>{t('menuRuleToppings')}</Text>
            </View>
          )}

          {/* Lista de Produtos Reais da Loja */}
          {products.length === 0 ? (
            <EmptyState
              title={t('menuEmpty')}
              description={t('emptyRewardsSub')}
              actionText={t('retryBtn')}
              onAction={refetch}
            />
          ) : (
            <View style={styles.productsList}>
              {products.map((item) => {
                const desc = getLocalizedDesc(item);
                const videoUri = resolveMediaUrl(item.videoUrl);
                const posterOrImage = resolveMediaUrl(item.image || item.videoPoster);
                return (
                  <View key={item.id} style={styles.productCard}>
                    <View style={styles.mediaBox}>
                      {videoUri ? (
                        <ProductVideoThumb uri={videoUri} />
                      ) : posterOrImage ? (
                        <Image
                          source={{ uri: posterOrImage }}
                          style={styles.productMedia}
                          contentFit="cover"
                          transition={200}
                        />
                      ) : (
                        <View style={styles.mediaFallback}>
                          <UtensilsCrossed size={24} color={Colors.primary} />
                        </View>
                      )}
                      {item.weightGrams ? (
                        <View style={styles.weightBadge}>
                          <Text style={styles.weightBadgeText}>{item.weightGrams}g</Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.productBody}>
                      <Text style={styles.productTitle} numberOfLines={2}>
                        {getLocalizedName(item)}
                      </Text>
                      {desc ? (
                        <Text style={styles.productDesc} numberOfLines={2}>
                          {desc}
                        </Text>
                      ) : null}
                      <Text style={styles.productPrice}>
                        {Number(item.precoBase || 0).toFixed(2).replace('.', ',')} €
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
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
    padding: 16,
    gap: 14,
  },
  skeletonCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  menuTabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12,
  },
  menuTab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  menuTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  menuTabText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  menuTabTextActive: {
    color: Colors.textInverse,
  },
  categoryScroll: {
    gap: 8,
    paddingBottom: 12,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catChipActive: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primary,
  },
  catChipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  catChipTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  rulesNote: {
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    gap: 4,
  },
  rulesNoteText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  productsList: {
    gap: 12,
  },
  productCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  mediaBox: {
    width: 86,
    height: 86,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: Colors.primarySurface,
    position: 'relative',
  },
  productMedia: {
    width: '100%',
    height: '100%',
  },
  mediaFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primarySoft,
  },
  weightBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(40, 20, 45, 0.78)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  weightBadgeText: {
    color: Colors.textInverse,
    fontSize: 10,
    fontWeight: '700',
  },
  productBody: {
    flex: 1,
  },
  productTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  productDesc: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  productPrice: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 6,
  },
});
