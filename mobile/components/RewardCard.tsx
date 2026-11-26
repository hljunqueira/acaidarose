import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Image } from 'expo-image';
import { RewardItem } from '@/hooks/useLoyalty';
import { useHaptics } from '@/hooks/useHaptics';
import { useLanguage } from '@/hooks/useLanguage';
import { resolveMediaUrl } from '@/services/api';
import { Gift, CheckCircle2, Lock } from 'lucide-react-native';

interface RewardCardProps {
  reward: RewardItem;
  userBalance: number;
  onRedeem: (rewardId: string) => void;
  isRedeeming?: boolean;
}

export function RewardCard({ reward, userBalance, onRedeem, isRedeeming }: RewardCardProps) {
  const haptics = useHaptics();
  const { t } = useLanguage();
  const cost = Math.max(1, reward.points_cost || 1);
  const canAfford = userBalance >= reward.points_cost;
  const progressRatio = Math.min(1, Math.max(0, userBalance / cost));
  const progressPct = Math.round(progressRatio * 100);
  const pointsRemaining = Math.max(0, reward.points_cost - userBalance);
  const imageUri = resolveMediaUrl(reward.image_url);

  const handlePress = () => {
    if (canAfford && !isRedeeming) {
      haptics.success();
      onRedeem(reward.id);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.imageWrapper}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={styles.imageFallback}>
              <Gift size={28} color={Colors.primary} />
            </View>
          )}
          {reward.weight_grams ? (
            <View style={styles.weightBadge}>
              <Text style={styles.weightText}>{reward.weight_grams}g</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.metaRow}>
            {canAfford ? (
              <View style={styles.statusInline}>
                <View style={styles.availableDot} />
                <Text style={styles.availableText}>{t('availableStatus')}</Text>
              </View>
            ) : (
              <View style={styles.statusInline}>
                <Lock size={11} color={Colors.textMuted} />
                <Text style={styles.lockedText}>{t('lockedStatus')}</Text>
              </View>
            )}
          </View>

          <Text style={styles.rewardName} numberOfLines={2}>
            {reward.name}
          </Text>

          <View style={styles.pointsRow}>
            <Text style={[styles.pointsCost, !canAfford && styles.pointsCostLocked]}>
              {reward.points_cost.toLocaleString('pt-PT')}
            </Text>
            <Text style={styles.pointsLabel}>{t('points')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressHeaderRow}>
          <View style={styles.progressLeft}>
            {canAfford ? (
              <CheckCircle2 size={13} color={Colors.success} />
            ) : (
              <Lock size={12} color={Colors.goldDark} />
            )}
            <Text style={[styles.progressStatusText, canAfford ? styles.progressReady : styles.progressMissing]}>
              {canAfford
                ? t('readyLabel').toUpperCase()
                : t('missingPtsLabel', { n: pointsRemaining }).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.progressPctText}>{progressPct}%</Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${progressPct}%`,
                backgroundColor: canAfford ? Colors.success : Colors.goldWarm,
              },
            ]}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, canAfford ? styles.buttonActive : styles.buttonDisabled]}
        onPress={handlePress}
        disabled={!canAfford || isRedeeming}
        activeOpacity={0.85}
        accessibilityRole="button"
      >
        {isRedeeming ? (
          <ActivityIndicator size="small" color={Colors.textInverse} />
        ) : (
          <View style={styles.buttonInner}>
            {canAfford ? (
              <Gift size={16} color={Colors.textInverse} />
            ) : (
              <Lock size={15} color={Colors.textMuted} />
            )}
            <Text
              style={[
                styles.buttonText,
                canAfford ? styles.buttonTextActive : styles.buttonTextDisabled,
              ]}
            >
              {canAfford
                ? `${t('readyToRedeemBtn')} (${reward.points_cost} pts)`
                : t('lockedBtn', { n: reward.points_cost })}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  imageWrapper: {
    position: 'relative',
    width: 88,
    height: 88,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primarySoft,
  },
  weightBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  weightText: {
    fontSize: 10,
    color: Colors.text,
    fontWeight: '800',
  },
  infoContainer: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 2,
  },
  statusInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  availableDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  availableText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
  },
  lockedText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    lineHeight: 20,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    marginTop: 6,
  },
  pointsCost: {
    fontSize: 21,
    fontWeight: '900',
    color: Colors.goldDark,
    letterSpacing: -0.4,
  },
  pointsCostLocked: {
    color: Colors.text,
  },
  pointsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.goldDark,
  },
  progressSection: {
    marginTop: 12,
    marginBottom: 12,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  progressStatusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  progressReady: {
    color: Colors.success,
  },
  progressMissing: {
    color: Colors.goldDark,
  },
  progressPctText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.primarySoft,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  button: {
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  buttonTextActive: {
    color: Colors.textInverse,
  },
  buttonTextDisabled: {
    color: Colors.textMuted,
  },
});
