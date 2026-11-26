import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { ModalHeader } from '@/components/ModalHeader';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import QRCode from 'react-native-qrcode-svg';
import { ShieldCheck, QrCode as QrIcon, RefreshCw } from 'lucide-react-native';

const ROTATION_SECONDS = 60;

interface QRCodeContentProps {
  onClose?: () => void;
  topInset?: number;
  bottomInset?: number;
}

export function QRCodeContent({ onClose, topInset, bottomInset }: QRCodeContentProps) {
  const { customer } = useAuth();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [secondsLeft, setSecondsLeft] = useState(ROTATION_SECONDS);
  const [qrTimestamp, setQrTimestamp] = useState(() => Math.floor(Date.now() / 1000));

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

  // Rotação a cada 60 segundos para evitar reutilização por fotografia/print
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setQrTimestamp(Math.floor(Date.now() / 1000));
          return ROTATION_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const qrPayload = customer
    ? JSON.stringify({
        id: customer.id,
        phone: customer.phone,
        type: 'CUSTOMER_IDENTIFIER',
        ts: qrTimestamp,
      })
    : 'INV_CUSTOMER';

  const progressPct = (secondsLeft / ROTATION_SECONDS) * 100;
  const resolvedTop = topInset ?? insets.top;
  const resolvedBottom = Math.max(bottomInset ?? insets.bottom, 16);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: resolvedTop, paddingBottom: resolvedBottom },
      ]}
    >
      <ModalHeader
        showGrabber={Boolean(onClose)}
        onClose={onClose}
      />

      <View style={styles.content}>
        <Text style={styles.customerName}>{customer?.name || t('customerFallback')}</Text>
        <Text style={[styles.customerMeta, { marginBottom: 22 }]}>
          {customer?.username ? `${customer.username} • ` : ''}
          {customer?.phone || ''}
        </Text>

        <View style={styles.qrWrapper}>
          <QRCode
            value={qrPayload}
            size={220}
            color={Colors.primaryDark}
            backgroundColor={Colors.card}
          />
        </View>

        <View style={styles.rotationBox}>
          <View style={styles.rotationLabelRow}>
            <RefreshCw size={12} color={Colors.primary} />
            <Text style={styles.rotationLabel}>
              {t('qrDynamicRenewal', { s: secondsLeft })}
            </Text>
          </View>
          <View style={styles.rotationTrack}>
            <View style={[styles.rotationFill, { width: `${progressPct}%` }]} />
          </View>
        </View>

        <View style={styles.securityBadge}>
          <ShieldCheck size={16} color={Colors.success} />
          <Text style={styles.securityText}>
            {t('qrScanHint')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 24,
  },
  customerName: {
    ...Typography.title2,
    color: Colors.text,
    fontWeight: '800',
    textAlign: 'center',
  },
  customerMeta: {
    ...Typography.subhead,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  qrWrapper: {
    padding: 20,
    backgroundColor: Colors.card,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 4,
  },
  rotationBox: {
    width: 240,
    marginTop: 18,
    alignItems: 'center',
  },
  rotationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  rotationLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  rotationTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primarySoft,
    overflow: 'hidden',
  },
  rotationFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 22,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  securityText: {
    ...Typography.caption,
    color: Colors.success,
    fontWeight: '700',
  },
});
