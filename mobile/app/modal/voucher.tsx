import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { ModalHeader } from '@/components/ModalHeader';
import { useLocalSearchParams } from 'expo-router';
import { useLoyalty } from '@/hooks/useLoyalty';
import QRCode from 'react-native-qrcode-svg';
import { Clock, ShieldAlert, Ticket } from 'lucide-react-native';
import * as ScreenCapture from 'expo-screen-capture';
import * as Brightness from 'expo-brightness';

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

export default function VoucherModal() {
  const insets = useSafeAreaInsets();
  const { code, name, expiresAt } = useLocalSearchParams<{
    code: string;
    name?: string;
    expiresAt?: string;
  }>();
  const { vouchers } = useLoyalty();

  const matchedVoucher = useMemo(
    () => vouchers.find((v) => v.voucher_code === code),
    [vouchers, code]
  );

  const resolvedName = name || matchedVoucher?.reward?.name || 'Prémio Açaí da Rose';
  const resolvedExpiresAt = expiresAt || matchedVoucher?.expires_at || null;
  const [countdown, setCountdown] = useState<string | null>(() =>
    formatCountdown(resolvedExpiresAt)
  );

  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync().catch(() => {});

    let originalBrightness = 0.5;
    Brightness.getBrightnessAsync()
      .then((b) => {
        originalBrightness = b;
        return Brightness.setBrightnessAsync(1.0);
      })
      .catch(() => {});

    return () => {
      ScreenCapture.allowScreenCaptureAsync().catch(() => {});
      Brightness.setBrightnessAsync(originalBrightness).catch(() => {});
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
        title="Voucher de Resgate"
        subtitle={resolvedName}
        icon={<Ticket size={18} color={Colors.primary} />}
        showGrabber={Platform.OS === 'ios'}
      />

      <View style={styles.content}>
        <View style={styles.timerBadge}>
          <Clock size={16} color={Colors.goldDark} />
          <Text style={styles.timerText}>
            {countdown
              ? countdown === 'Expirado'
                ? 'Voucher expirado'
                : `Expira em ${countdown}`
              : 'Válido por 24 horas no balcão'}
          </Text>
        </View>

        <Text style={styles.rewardTitle}>{resolvedName}</Text>

        <View style={styles.qrWrapper}>
          <QRCode
            value={code || 'ROSE-VOUCHER'}
            size={200}
            color={Colors.primaryDark}
            backgroundColor={Colors.card}
          />
        </View>

        <Text style={styles.codeText}>{code || '---'}</Text>
        <Text style={styles.instructions}>
          Mostra este ecrã ao operador de caixa para retirar a tua oferta no balcão.
        </Text>

        <View style={styles.refundNote}>
          <ShieldAlert size={16} color={Colors.textSecondary} />
          <Text style={styles.refundNoteText}>
            Não conseguiste ir à loja? Os teus pontos voltam automaticamente para a tua conta após 24 horas.
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
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.goldLight,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    marginBottom: 14,
  },
  timerText: {
    ...Typography.caption,
    color: Colors.goldDark,
    fontWeight: '800',
  },
  rewardTitle: {
    ...Typography.headline,
    color: Colors.text,
    fontWeight: '800',
    marginBottom: 18,
    textAlign: 'center',
  },
  qrWrapper: {
    padding: 18,
    backgroundColor: Colors.card,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  codeText: {
    ...Typography.title2,
    color: Colors.primary,
    fontWeight: '800',
    marginTop: 18,
    letterSpacing: 1.2,
  },
  instructions: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 270,
  },
  refundNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 26,
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    borderRadius: 14,
    maxWidth: 320,
  },
  refundNoteText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
});
