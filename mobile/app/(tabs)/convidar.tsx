import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Users,
  Gift,
  Share2,
  CheckCircle2,
  Info,
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { SubPageHeader } from '@/components/SubPageHeader';
import { useAuth } from '@/hooks/useAuth';
import { useLoyalty } from '@/hooks/useLoyalty';
import { useStores, getStoreShortLabel } from '@/hooks/useStores';
import { useLanguage } from '@/hooks/useLanguage';
import { useHaptics } from '@/hooks/useHaptics';
import { api } from '@/services/api';

export default function ConvidarAmigosScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  const { t } = useLanguage();
  const { customer } = useAuth();
  const { referralConfig } = useLoyalty();
  const { activeStore } = useStores();
  const [referralsCount, setReferralsCount] = useState<number>(0);

  useEffect(() => {
    if (!referralConfig.enabled) {
      router.navigate('/(tabs)');
      return;
    }

    let mounted = true;
    api
      .get('/api/loyalty/profile')
      .then((res) => {
        if (mounted && typeof res.data?.stats?.referrals_count === 'number') {
          setReferralsCount(res.data.stats.referrals_count);
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [referralConfig.enabled, router]);

  if (!referralConfig.enabled) {
    return null;
  }

  const bonusPts = referralConfig.bonus_points || 10;
  const code = customer?.referral_code || '';
  const storeLabel = activeStore ? getStoreShortLabel(activeStore) : 'Açaí da Rose';
  const totalBonusEarned = referralsCount * bonusPts;

  const shareText = `Vem provar o melhor açaí! Descarrega a app do Açaí da Rose, regista-te com o meu código ${code} e ganhamos ambos +${bonusPts} pontos na tua 1.ª compra: https://acaidarose.pt/convite/${code}`;

  const handleShareNative = async () => {
    if (!code) return;
    haptics.light();
    try {
      await Share.share({ message: shareText });
    } catch {}
  };

  return (
    <View style={styles.container}>
      <SubPageHeader
        title={t('inviteSection')}
        subtitle={t('inviteSubtitle', { n: bonusPts })}
        backTo="/(tabs)"
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.bonusPill}>
            <Text style={styles.bonusPillText}>{t('inviteBonusPill', { n: bonusPts })}</Text>
          </View>
          <Text style={styles.heroTitle}>{t('inviteHeroTitle', { n: bonusPts })}</Text>
          <Text style={styles.heroSubtitle}>
            {t('inviteHeroSub', { store: storeLabel, n: bonusPts })}
          </Text>
        </View>

        {/* Código Exclusivo */}
        {code ? (
          <View style={styles.codeCard}>
            <Text style={styles.codeCardLabel}>{t('inviteCodeLabel')}</Text>
            <View style={styles.codeDisplayBox}>
              <Text style={styles.codeText} selectable>
                {code}
              </Text>
              <Text style={styles.codeHint}>{t('inviteCodeHint')}</Text>
            </View>

            <TouchableOpacity
              style={styles.sharePrimaryBtn}
              onPress={handleShareNative}
              activeOpacity={0.85}
            >
              <Share2 size={17} color={Colors.textInverse} />
              <Text style={styles.sharePrimaryText}>{t('inviteShareCodeBtn')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Impacto Real */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('inviteImpactTitle')}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIconCircle}>
              <Users size={18} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>{referralsCount}</Text>
            <Text style={styles.statLabel}>{t('inviteFriendsCountLabel')}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconCircle, { backgroundColor: Colors.goldLight }]}>
              <Gift size={18} color={Colors.goldDark} />
            </View>
            <Text style={[styles.statValue, { color: Colors.goldDark }]}>
              +{totalBonusEarned}
            </Text>
            <Text style={styles.statLabel}>{t('invitePointsEarnedLabel')}</Text>
          </View>
        </View>

        {/* Regras Simples */}
        <View style={styles.rulesCard}>
          <View style={styles.rulesHeader}>
            <Info size={16} color={Colors.primary} />
            <Text style={styles.rulesTitle}>{t('inviteRulesTitle')}</Text>
          </View>

          <View style={styles.ruleRow}>
            <CheckCircle2 size={15} color={Colors.success} />
            <Text style={styles.ruleText}>{t('inviteRule1')}</Text>
          </View>

          <View style={styles.ruleRow}>
            <CheckCircle2 size={15} color={Colors.success} />
            <Text style={styles.ruleText}>{t('inviteRule2', { n: bonusPts })}</Text>
          </View>

          <View style={styles.ruleRow}>
            <CheckCircle2 size={15} color={Colors.success} />
            <Text style={styles.ruleText}>{t('inviteRule3')}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 116,
  },
  heroCard: {
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    marginBottom: 14,
  },
  bonusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.goldLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 10,
  },
  bonusPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.goldDark,
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 28,
  },
  heroSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
  },
  codeCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  codeCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  codeDisplayBox: {
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  codeText: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 2,
  },
  codeHint: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 6,
  },
  sharePrimaryBtn: {
    marginTop: 14,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  sharePrimaryText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textInverse,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 16,
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  rulesCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  rulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  rulesTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  ruleText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
