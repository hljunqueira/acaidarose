import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useStores, getStoreShortLabel } from '@/hooks/useStores';
import { useHaptics } from '@/hooks/useHaptics';
import { resolveMediaUrl } from '@/services/api';
import { getStoreOpenStatus } from '@/utils/storeHours';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Colors } from '@/constants/Colors';
import { User as UserIcon, MapPin, ChevronDown } from 'lucide-react-native';

export function GlobalHeader() {
  const router = useRouter();
  const { customer } = useAuth();
  const { t, language } = useLanguage();
  const haptics = useHaptics();
  const { activeStore, activeDistanceKm, isGpsDetected, isLoading } = useStores();

  const avatarUri = resolveMediaUrl(customer?.avatar_url);
  const openStatus = getStoreOpenStatus(activeStore?.openingHours);
  const firstName = customer?.name?.trim()?.split(/\s+/)[0] || '';

  const storeDisplayName = activeStore
    ? getStoreShortLabel(activeStore)
    : isLoading
    ? t('loadingStore')
    : 'Açaí da Rose';

  return (
    <View style={styles.headerContainer}>
      {/* 1ª Linha: Avatar + Nome/@username (Esquerda) | Idioma (Centro) | Logo (Direita) */}
      <View style={styles.topRow}>
        <View style={styles.leftSlot}>
          <TouchableOpacity
            style={styles.userGroup}
            onPress={() => {
              haptics.light();
              router.navigate('/(tabs)/perfil');
            }}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={t('profileTitle')}
          >
            <View style={styles.avatarButton}>
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={styles.avatarImage}
                  contentFit="cover"
                  transition={150}
                />
              ) : customer?.name ? (
                <Text style={styles.avatarInitial}>
                  {customer.name.trim().charAt(0).toUpperCase()}
                </Text>
              ) : (
                <UserIcon size={18} color={Colors.textInverse} />
              )}
            </View>
            <View style={styles.userTextCol}>
              <Text style={styles.userName} numberOfLines={1}>
                {firstName || customer?.username || 'Cliente'}
              </Text>
              {customer?.username ? (
                <Text style={styles.userHandle} numberOfLines={1}>
                  {customer.username}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.centerLang}>
          <LanguageSwitcher compact />
        </View>

        <View style={styles.rightSlot}>
          <View style={styles.rightBrandCol}>
            <Image
              source={require('@/assets/logo.png')}
              style={styles.logoMini}
              contentFit="contain"
            />
            <Text style={styles.cashbackTag}>{t('cashback')}</Text>
          </View>
        </View>
      </View>

      {/* 2ª Linha: Loja Ativa Dinâmica + Distância GPS + Seletor */}
      <View style={styles.storeRow}>
        <TouchableOpacity
          style={styles.storeBadgeButton}
          onPress={() => router.navigate('/(tabs)/lojas')}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={t('chooseStoreTitle')}
        >
          <View style={styles.storeBadgeLeft}>
            <View style={styles.gpsIconCircle}>
              <MapPin size={12} color={Colors.primary} />
            </View>
            <Text style={styles.storeBadgeLabel}>{t('closestStore')}:</Text>
            <Text style={styles.storeBadgeName} numberOfLines={1}>
              {storeDisplayName}
            </Text>
            {openStatus ? (
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: openStatus.isOpen ? Colors.success : Colors.textMuted },
                ]}
              />
            ) : null}
            {activeDistanceKm !== null && isGpsDetected && (
              <Text style={styles.storeDistanceTag}>({activeDistanceKm} km)</Text>
            )}
          </View>

          <View style={styles.storeBadgeRight}>
            <Text style={styles.alterarText}>{t('changeStore')}</Text>
            <ChevronDown size={13} color={Colors.primary} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    zIndex: 50,
  },
  topRow: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  leftSlot: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingRight: 6,
  },
  userGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '100%',
  },
  userTextCol: {
    flexShrink: 1,
    justifyContent: 'center',
  },
  userName: {
    color: Colors.text,
    fontSize: 13.5,
    fontWeight: '800',
    lineHeight: 16,
  },
  userHandle: {
    color: Colors.textSecondary,
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 1,
  },
  rightSlot: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  rightBrandCol: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
  },
  logoMini: {
    width: 38,
    height: 38,
  },
  cashbackTag: {
    color: Colors.goldDark,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  centerLang: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    color: Colors.textInverse,
    fontSize: 14,
    fontWeight: '800',
  },
  storeRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 2,
  },
  storeBadgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  storeBadgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    paddingRight: 8,
  },
  gpsIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeBadgeLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  storeBadgeName: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '800',
    flexShrink: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  storeDistanceTag: {
    color: Colors.success,
    fontSize: 11,
    fontWeight: '700',
  },
  storeBadgeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  alterarText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
});
