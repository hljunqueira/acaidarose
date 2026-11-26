import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share } from 'react-native';
import { Colors } from '@/constants/Colors';
import { SubPageHeader } from '@/components/SubPageHeader';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLoyalty } from '@/hooks/useLoyalty';
import { useStores, getStoreShortLabel } from '@/hooks/useStores';
import { useLanguage } from '@/hooks/useLanguage';
import { useHaptics } from '@/hooks/useHaptics';
import QRCode from 'react-native-qrcode-svg';
import { Clock, ShieldCheck, Store, Copy, Check, QrCode as QrIcon } from 'lucide-react-native';

function formatCountdown(expiresAt?: string | null): string | null {
  if (!expiresAt) return null;
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return 'Expirado';
  const totalSec = Math.floor(diffMs / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function VoucherScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  const { t } = useLanguage();
  const { activeStore } = useStores();
  const { code, name, expiresAt } = useLocalSearchParams<{
    code: string;
    name?: string;
    expiresAt?: string;
  }>();
  const { vouchers, refetchVouchers, refetchTransactions } = useLoyalty();
  const [copied, setCopied] = useState(false);

  const matchedVoucher = useMemo(
    () => vouchers.find((v) => v.voucher_code === code),
    [vouchers, code]
  );

  const isRedeemed = matchedVoucher?.status === 'REDEEMED';

  // Polling rápido (3s) enquanto o cliente exibe o QR no balcão para refletir validação do PDV em tempo real
  useEffect(() => {
    if (!code || isRedeemed) return;
    const poll = setInterval(() => {
      refetchVouchers();
    }, 3000);
    return () => clearInterval(poll);
  }, [code, isRedeemed, refetchVouchers]);

  useEffect(() => {
    if (isRedeemed) {
      haptics.success();
      refetchTransactions();
    }
  }, [isRedeemed, refetchTransactions]);

  const resolvedName = name || matchedVoucher?.reward?.name || 'Prémio Açaí da Rose';
  const resolvedExpiresAt = expiresAt || matchedVoucher?.expires_at || null;
  const [countdown, setCountdown] = useState<string | null>(() =>
    formatCountdown(resolvedExpiresAt)
  );

  useEffect(() => {
    let mounted = true;
    let originalBrightness = 0.5;
    let ScreenCaptureMod: typeof import('expo-screen-capture') | null = null;
    let BrightnessMod: typeof import('expo-brightness') | null = null;

    (async () => {
      try {
        ScreenCaptureMod = await import('expo-screen-capture');
        await ScreenCaptureMod?.preventScreenCaptureAsync?.();
      } catch {}

      try {
        BrightnessMod = await import('expo-brightness');
        if (typeof BrightnessMod?.getBrightnessAsync === 'function') {
          const b = await BrightnessMod.getBrightnessAsync();
          if (mounted) {
            originalBrightness = b;
            await BrightnessMod?.setBrightnessAsync?.(1.0);
          }
        }
      } catch {}
    })();

    return () => {
      mounted = false;
      try {
        ScreenCaptureMod?.allowScreenCaptureAsync?.()?.catch?.(() => {});
      } catch {}
      try {
        BrightnessMod?.setBrightnessAsync?.(originalBrightness)?.catch?.(() => {});
      } catch {}
    };
  }, []);

  useEffect(() => {
    setCountdown(formatCountdown(resolvedExpiresAt));
    if (!resolvedExpiresAt) return;
    const timer = setInterval(() => {
      setCountdown(formatCountdown(resolvedExpiresAt));
    }, 1000);
    return () => clearInterval(timer);
  }, [resolvedExpiresAt]);

  const handleShareCode = async () => {
    if (!code) return;
    haptics.light();
    try {
      await Share.share({ message: `Voucher Açaí da Rose: ${code} (${resolvedName})` });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const storeLabel = activeStore ? getStoreShortLabel(activeStore) : 'Açaí da Rose';

  return (
    <View style={styles.container}>
      <SubPageHeader title={t('voucherHeaderTitle')} subtitle={resolvedName} backTo="/(tabs)/premios" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroTitleBlock}>
          <Text style={styles.heroTitle}>{t('voucherRedeemedTitle')}</Text>
          <Text style={styles.heroSub}>
            {t('voucherRedeemedSub', { store: storeLabel })}
          </Text>
        </View>

        {/* Resumo do Prémio */}
        <View style={styles.rewardSummaryCard}>
          <View style={styles.rewardSummaryLeft}>
            <View style={styles.rewardTitleRow}>
              <Text style={styles.rewardSummaryTitle} numberOfLines={1}>
                {resolvedName}
              </Text>
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>{t('freeBadge')}</Text>
              </View>
            </View>
            <View style={styles.storeRow}>
              <Store size={13} color={Colors.primary} />
              <Text style={styles.storeLabel}>{storeLabel}</Text>
            </View>
          </View>
        </View>

        {/* Cartão Ticket do Voucher */}
        <View style={styles.ticketCard}>
          <View style={styles.ticketTopBar} />

          <View style={styles.ticketBody}>
            {isRedeemed ? (
              <View style={{ alignItems: 'center', paddingVertical: 16, gap: 10 }}>
                <View style={styles.timerPill}>
                  <Check size={15} color={Colors.success} />
                  <Text style={styles.timerText}>{t('voucherValidatedBadge')}</Text>
                </View>
                <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.text, textAlign: 'center' }}>
                  {t('voucherValidatedTitle')}
                </Text>
                <Text style={{ fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18 }}>
                  {t('voucherValidatedBody')}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.timerPill}>
                  <Clock size={14} color={Colors.success} />
                  <Text style={styles.timerText}>
                    {countdown
                      ? countdown === 'Expirado'
                        ? t('voucherExpiredLabel')
                        : t('voucherValidFor', { time: countdown })
                      : t('validFor24h')}
                  </Text>
                </View>

                <View style={styles.qrFrame}>
                  <QRCode
                    value={code || 'ROSE-VOUCHER'}
                    size={196}
                    color={Colors.text}
                    backgroundColor={Colors.card}
                  />
                  <View style={styles.scannerStatusRow}>
                    <View style={styles.scannerDot} />
                    <Text style={styles.scannerStatusText}>{t('opticalReaderActive')}</Text>
                  </View>
                </View>
              </>
            )}

            <Text style={styles.authCodeLabel}>{t('authCodeLabel')}</Text>
            <View style={styles.authCodeBox}>
              <Text style={styles.authCodeText} numberOfLines={1}>
                {code || '---'}
              </Text>
              <TouchableOpacity
                style={styles.copyChip}
                onPress={handleShareCode}
                activeOpacity={0.75}
              >
                {copied ? (
                  <Check size={14} color={Colors.success} />
                ) : (
                  <Copy size={14} color={Colors.primary} />
                )}
                <Text style={[styles.copyChipText, copied && { color: Colors.success }]}>
                  {copied ? t('sentBtn') : t('shareBtn')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dashedDivider} />

            <View style={styles.guaranteeBox}>
              <ShieldCheck size={18} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.guaranteeTitle}>{t('counterGuaranteeTitle')}</Text>
                <Text style={styles.guaranteeText}>{t('counterGuaranteeSub')}</Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.navigate('/(tabs)/premios')}
          activeOpacity={0.8}
        >
          <QrIcon size={16} color={Colors.primary} />
          <Text style={styles.secondaryBtnText}>{t('viewAllVouchersBtn')}</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 116,
  },
  heroTitleBlock: {
    alignItems: 'center',
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.text,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    maxWidth: 300,
  },
  rewardSummaryCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  rewardSummaryLeft: {
    gap: 6,
  },
  rewardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rewardSummaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    flex: 1,
  },
  freeBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
  },
  freeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.success,
    letterSpacing: 0.4,
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  storeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  ticketCard: {
    backgroundColor: Colors.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  ticketTopBar: {
    height: 6,
    backgroundColor: Colors.primary,
  },
  ticketBody: {
    padding: 18,
    alignItems: 'center',
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    marginBottom: 18,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.success,
  },
  qrFrame: {
    padding: 18,
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },
  scannerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  scannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  scannerStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
  },
  authCodeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 8,
  },
  authCodeBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 8,
    gap: 8,
  },
  authCodeText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 1,
  },
  copyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  copyChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  dashedDivider: {
    width: '100%',
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    marginVertical: 18,
  },
  guaranteeBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.primarySurface,
    borderRadius: 14,
    padding: 12,
  },
  guaranteeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.text,
  },
  guaranteeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginTop: 2,
  },
  secondaryBtn: {
    marginTop: 14,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
});
