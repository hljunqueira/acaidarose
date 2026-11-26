import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';

interface CampaignCardProps {
  campaign?: {
    title: string;
    multiplier: number;
    description?: string | null;
  } | null;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  // Sem fallback estático: só renderiza se existir campanha real ativa no PostgreSQL
  if (!campaign) return null;

  const multiplier = Number(campaign.multiplier) || 1;
  const description =
    campaign.description ||
    `Todas as compras elegíveis acumulam ${multiplier}x pontos no balcão.`;

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[Colors.primary, Colors.brandDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.card}
      >
        <View style={styles.iconCircle}>
          <Zap size={20} color={Colors.primary} fill={Colors.primary} />
        </View>

        <View style={styles.contentCol}>
          <View style={styles.headerRow}>
            <View style={styles.exclusiveBadge}>
              <Text style={styles.exclusiveBadgeText}>{multiplier}X PONTOS</Text>
            </View>
            <Text style={styles.titleText} numberOfLines={1}>
              {campaign.title}
            </Text>
          </View>

          <Text style={styles.descriptionText}>{description}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 4,
  },
  card: {
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentCol: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  exclusiveBadge: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  exclusiveBadgeText: {
    color: Colors.primaryDark,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  titleText: {
    color: Colors.textInverse,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    flex: 1,
  },
  descriptionText: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
    fontWeight: '400',
  },
});
