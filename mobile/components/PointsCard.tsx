import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { QrCode } from 'lucide-react-native';

function AcaiCupIcon({ size = 15 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Colher */}
      <Path
        d="M16.5 3.5L13.5 9"
        stroke="#B45309"
        strokeWidth={2}
        strokeLinecap="round"
      />
      {/* Creme de Açaí */}
      <Path
        d="M6 10C6 6.8 8.7 4.5 12 4.5C15.3 4.5 18 6.8 18 10H6Z"
        fill="#6B1B7B"
      />
      {/* Granola / destaque subtil */}
      <Circle cx="9.8" cy="7.5" r="1" fill="#F59E0B" />
      <Circle cx="12.5" cy="6.8" r="0.9" fill="#FDE68A" />
      {/* Copo */}
      <Path
        d="M5.5 10H18.5L16.6 20C16.4 20.9 15.6 21.5 14.7 21.5H9.3C8.4 21.5 7.6 20.9 7.4 20L5.5 10Z"
        fill="#FFFFFF"
        stroke="#6B1B7B"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      {/* Faixa da marca no copo */}
      <Path d="M6.6 14.5H17.4" stroke="#C026D3" strokeWidth={1.6} />
    </Svg>
  );
}
import { useHaptics } from '@/hooks/useHaptics';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { Colors } from '@/constants/Colors';
import { QRCodeContent } from './QRCodeContent';

interface PointsCardProps {
  balance: number;
  nextReward?: { name: string; points_cost: number } | null;
  unlockedCount?: number;
}

export function PointsCard({ balance, nextReward, unlockedCount = 0 }: PointsCardProps) {
  const router = useRouter();
  const haptics = useHaptics();
  const { customer } = useAuth();
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const [showQRModal, setShowQRModal] = useState(false);

  const handleOpenQR = () => {
    haptics.medium();
    setShowQRModal(true);
  };

  const identifierText = [customer?.phone, customer?.username].filter(Boolean).join('  ·  ') || '—';

  const locale = language === 'EN' ? 'en-GB' : language === 'ES' ? 'es-ES' : 'pt-PT';

  // Progresso discreto: se já houver prémios desbloqueados, barra cheia celebrando o resgate disponível
  const hasGoal = Boolean((nextReward && nextReward.points_cost > 0) || unlockedCount > 0);
  const progressRatio =
    unlockedCount > 0
      ? 1
      : hasGoal
        ? Math.min(1, Math.max(0, balance / (nextReward?.points_cost || 1)))
        : 0;
  const remainingPts =
    unlockedCount > 0 ? 0 : hasGoal ? Math.max(0, (nextReward?.points_cost || 0) - balance) : 0;

  const unlockedLabel = (() => {
    if (unlockedCount <= 0) return '';
    if (unlockedCount === 1) {
      if (language === 'EN') return '1 reward ready to redeem · View rewards';
      if (language === 'ES') return 'Tienes 1 premio listo para canjear · Ver premios';
      return 'Tens 1 prémio pronto para resgatar · Ver prémios';
    }
    if (language === 'EN') return `${unlockedCount} rewards ready to redeem · View rewards`;
    if (language === 'ES') return `Tienes ${unlockedCount} premios listos para canjear · Ver premios`;
    return `Tens ${unlockedCount} prémios prontos para resgatar · Ver prémios`;
  })();

  // Animações nativas 60fps (RN Animated integrado, sem dependências externas)
  const progressAnim = useRef(new Animated.Value(0)).current;
  const balanceScale = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressRatio * 100,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progressRatio, progressAnim]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(balanceScale, {
        toValue: 1.06,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(balanceScale, {
        toValue: 1,
        friction: 6,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [balance, balanceScale]);

  const animatedProgressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const animatedThumbLeft = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['4%', '96%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.cardWrapper}>
      <LinearGradient
        colors={[Colors.primarySurface, Colors.card, Colors.primarySurface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardContainer}
      >
        <View style={styles.cardTopRow}>
          <Text style={styles.cardBrandText}>{t('currentPoints')}</Text>
        </View>

        <View style={styles.balanceSection}>
          <Animated.View
            style={[styles.balanceNumbersRow, { transform: [{ scale: balanceScale }] }]}
          >
            <Text style={styles.balanceNumber}>
              {balance.toLocaleString(locale)}
            </Text>
            <Text style={styles.pointsWord}>{t('points')}</Text>
          </Animated.View>
        </View>

        {hasGoal && nextReward && (
          <TouchableOpacity
            style={styles.goalBox}
            onPress={() => {
              haptics.light();
              router.navigate('/(tabs)/premios');
            }}
            activeOpacity={0.75}
            accessibilityRole="button"
          >
            <View style={styles.goalTrackWrap}>
              <View style={styles.goalTrack}>
                <Animated.View style={[styles.goalFill, { width: animatedProgressWidth }]} />
              </View>
              <Animated.View
                style={[styles.goalThumb, { left: animatedThumbLeft }]}
              >
                <AcaiCupIcon size={15} />
              </Animated.View>
            </View>
            <Text style={styles.goalText} numberOfLines={1}>
              {unlockedCount > 0
                ? unlockedLabel
                : remainingPts === 0 && nextReward
                  ? t('readyToRedeemReward', { name: nextReward.name })
                  : nextReward
                    ? t('pointsToNextReward', { n: remainingPts, name: nextReward.name })
                    : ''}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.identificadorBox}>
          <Text style={styles.identificadorPhone} numberOfLines={1}>
            {identifierText}
          </Text>
        </View>

        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <Pressable
            style={styles.scanButton}
            onPress={handleOpenQR}
            onPressIn={() => {
              Animated.spring(buttonScale, {
                toValue: 0.965,
                friction: 7,
                tension: 200,
                useNativeDriver: true,
              }).start();
            }}
            onPressOut={() => {
              Animated.spring(buttonScale, {
                toValue: 1,
                friction: 6,
                tension: 160,
                useNativeDriver: true,
              }).start();
            }}
            accessibilityRole="button"
            accessibilityLabel={t('tapToScan')}
          >
            <QrCode size={19} color={Colors.textInverse} />
            <Text style={styles.scanButtonText}>{t('tapToScan')}</Text>
          </Pressable>
        </Animated.View>
      </LinearGradient>

      <Modal
        visible={showQRModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowQRModal(false)}
      >
        <QRCodeContent
          onClose={() => setShowQRModal(false)}
          topInset={Platform.OS === 'ios' ? 8 : insets.top}
          bottomInset={insets.bottom}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 22,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  cardContainer: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  cardBrandText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  balanceSection: {
    marginVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceNumbersRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 8,
    marginTop: 2,
  },
  balanceNumber: {
    color: Colors.goldDark,
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1,
  },
  pointsWord: {
    color: Colors.goldWarm,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  goalBox: {
    marginTop: 10,
    alignItems: 'center',
  },
  goalTrackWrap: {
    width: '100%',
    height: 24,
    justifyContent: 'center',
    position: 'relative',
  },
  goalTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primarySoft,
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  goalThumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    marginLeft: -12,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 3,
  },
  goalText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 5,
    textAlign: 'center',
  },
  identificadorBox: {
    marginTop: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identificadorLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  identificadorPhone: {
    color: Colors.text,
    fontSize: 13.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  scanButton: {
    marginTop: 10,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  scanButtonText: {
    color: Colors.textInverse,
    fontSize: 14,
    fontWeight: '800',
  },
});
