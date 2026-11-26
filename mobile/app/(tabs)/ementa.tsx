import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { UtensilsCrossed, Search, X, ChevronRight, Play } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { ModalHeader } from '@/components/ModalHeader';
import { SubPageHeader } from '@/components/SubPageHeader';
import { SkeletonBox } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { useStores } from '@/hooks/useStores';
import { useMenu, CatalogContainer } from '@/hooks/useMenu';
import { useLanguage } from '@/hooks/useLanguage';
import { useHaptics } from '@/hooks/useHaptics';
import { resolveMediaUrl } from '@/services/api';

function DetailVideoPlayer({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <VideoView
      player={player}
      style={styles.detailMedia}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

export default function EmentaScreen() {
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const { activeStoreId, refetch: refetchStores } = useStores();
  const { language, t } = useLanguage();
  const { data, isLoading, isRefetching, isError, refetch } = useMenu(activeStoreId);

  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<CatalogContainer | null>(null);
  const [manualRefreshing, setManualRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setManualRefreshing(true);
    try {
      await refetch();
    } finally {
      setManualRefreshing(false);
    }
  };

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

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const products = useMemo(() => {
    const all = (data?.containers || []).filter(
      (p) => p.active !== false && p.isAvailableInStore !== false && !p.isCategoryPaused
    );

    if (normalizedSearch.length > 0) {
      return all.filter((item) => {
        const haystack = [
          item.name,
          item.nameEn,
          item.nameEs,
          item.description,
          item.categoryName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(normalizedSearch);
      });
    }

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
  }, [data?.containers, categoriesForMenu, activeMenuId, selectedCategoryId, normalizedSearch]);

  const isAcaiMenu = useMemo(() => {
    const m = menus.find((x) => x.id === activeMenuId);
    const label = (m?.name || '').toLowerCase();
    return label.includes('aça') || label.includes('acai');
  }, [menus, activeMenuId]);

  const activeOptionGroups = useMemo(() => {
    if (!selectedProduct?.optionGroups?.length) return [];
    const isCutleryGroup = (g: { name?: string; nameEn?: string | null; nameEs?: string | null }) => {
      const label = [g.name, g.nameEn, g.nameEs].filter(Boolean).join(' ').toLowerCase();
      return /talher|colher|cutlery|spoon|cubierto|cuchara/.test(label);
    };
    return selectedProduct.optionGroups
      .filter((g) => g.active !== false && !isCutleryGroup(g))
      .map((g) => ({
        ...g,
        options: (g.options || []).filter((o) => o.active !== false),
      }))
      .filter((g) => g.options.length > 0);
  }, [selectedProduct]);

  return (
    <View style={styles.container}>
      <SubPageHeader title={t('menuTitle')} backTo="/(tabs)/premios" />
      <View style={styles.pageHeader}>
        {/* Pesquisa rápida na ementa */}
        <View style={styles.searchBox}>
          <Search size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('searchMenuPlaceholder')}
            placeholderTextColor={Colors.textMuted}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

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
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={manualRefreshing}
              onRefresh={handleManualRefresh}
              tintColor={Colors.primary}
            />
          }
        >
          {normalizedSearch.length === 0 && menus.length > 0 && (
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
                      haptics.light();
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

          {normalizedSearch.length === 0 && categoriesForMenu.length > 1 && (
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

          {normalizedSearch.length === 0 && isAcaiMenu && (
            <View style={styles.rulesNote}>
              <Text style={styles.rulesNoteText}>{t('menuRuleBases')}</Text>
              <Text style={styles.rulesNoteText}>{t('menuRuleToppings')}</Text>
            </View>
          )}

          {products.length === 0 ? (
            <EmptyState
              title={t('menuEmpty')}
              description={t('emptyRewardsSub')}
              actionText={normalizedSearch ? t('filterAll') : t('retryBtn')}
              onAction={() => {
                if (normalizedSearch) setSearchQuery('');
                else refetch();
              }}
            />
          ) : (
            <View style={styles.productsList}>
              {products.map((item) => {
                const desc = getLocalizedDesc(item);
                const posterOrImage = resolveMediaUrl(item.image || item.videoPoster);
                const hasVideo = Boolean(resolveMediaUrl(item.videoUrl));
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.productCard}
                    onPress={() => {
                      haptics.light();
                      setSelectedProduct(item);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.mediaBox}>
                      {posterOrImage ? (
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
                      {hasVideo ? (
                        <View style={styles.videoBadge}>
                          <Play size={10} color={Colors.textInverse} fill={Colors.textInverse} />
                        </View>
                      ) : null}
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

                    <ChevronRight size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Modal de Detalhe do Produto (com vídeo em loop + opções disponíveis na loja) */}
      <Modal
        visible={Boolean(selectedProduct)}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedProduct(null)}
      >
        {selectedProduct ? (
          <View
            style={[
              styles.detailContainer,
              {
                paddingTop: Platform.OS === 'ios' ? 8 : insets.top,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            <ModalHeader
              title={getLocalizedName(selectedProduct)}
              subtitle={selectedProduct.categoryName || undefined}
              showGrabber
              onClose={() => setSelectedProduct(null)}
            />

            <ScrollView contentContainerStyle={styles.detailScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.detailMediaBox}>
                {resolveMediaUrl(selectedProduct.videoUrl) ? (
                  <DetailVideoPlayer uri={resolveMediaUrl(selectedProduct.videoUrl)!} />
                ) : resolveMediaUrl(selectedProduct.image || selectedProduct.videoPoster) ? (
                  <Image
                    source={{ uri: resolveMediaUrl(selectedProduct.image || selectedProduct.videoPoster)! }}
                    style={styles.detailMedia}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.mediaFallback}>
                    <UtensilsCrossed size={42} color={Colors.primary} />
                  </View>
                )}
              </View>

              <View style={styles.detailHeaderRow}>
                <Text style={styles.detailTitle}>{getLocalizedName(selectedProduct)}</Text>
                <Text style={styles.detailPrice}>
                  {Number(selectedProduct.precoBase || 0).toFixed(2).replace('.', ',')} €
                </Text>
              </View>

              {selectedProduct.weightGrams ? (
                <View style={styles.detailWeightPill}>
                  <Text style={styles.detailWeightText}>{selectedProduct.weightGrams}g</Text>
                </View>
              ) : null}

              {getLocalizedDesc(selectedProduct) ? (
                <Text style={styles.detailDesc}>{getLocalizedDesc(selectedProduct)}</Text>
              ) : null}

              {activeOptionGroups.length > 0 ? (
                <View style={styles.optionsSection}>
                  <Text style={styles.optionsSectionTitle}>{t('productOptionsTitle')}</Text>
                  {activeOptionGroups.map((group, idx) => (
                    <View key={group.id || `${group.name}-${idx}`} style={styles.optionGroupCard}>
                      <Text style={styles.optionGroupTitle}>{getLocalizedName(group)}</Text>
                      <View style={styles.optionChipsWrap}>
                        {group.options.map((opt, optIdx) => (
                          <View key={opt.id || `${opt.name}-${optIdx}`} style={styles.optionChip}>
                            <Text style={styles.optionChipText}>{getLocalizedName(opt)}</Text>
                            {opt.price && opt.price > 0 ? (
                              <Text style={styles.optionChipPrice}>
                                +{Number(opt.price).toFixed(2).replace('.', ',')} €
                              </Text>
                            ) : null}
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}
            </ScrollView>
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  pageHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 10,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    paddingVertical: 0,
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
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 116,
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
    width: 84,
    height: 84,
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
  videoBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(40, 20, 45, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
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
  detailContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  detailScroll: {
    padding: 18,
    paddingBottom: 40,
  },
  detailMediaBox: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.primarySurface,
    marginBottom: 16,
  },
  detailMedia: {
    width: '100%',
    height: '100%',
  },
  detailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '900',
    color: Colors.text,
  },
  detailPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.primary,
  },
  detailWeightPill: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  detailWeightText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  detailDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: 12,
  },
  optionsSection: {
    marginTop: 22,
    gap: 12,
  },
  optionsSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  optionGroupCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 14,
  },
  optionGroupTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 10,
  },
  optionChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  optionChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  optionChipPrice: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
});
