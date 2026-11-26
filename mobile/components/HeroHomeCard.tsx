import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Image } from 'expo-image';

export function HeroHomeCard() {
  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>O Teu Açaí Favorito</Text>
        </View>
        <Text style={styles.headline}>
          Açaí Não se Explica:
        </Text>
        <Text style={styles.subheadline}>
          Experimenta, Apaixona e Repete.
        </Text>
      </View>

      <Image
        source={require('@/assets/acai_copo_hero.png')}
        style={styles.image}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 20,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  content: {
    flex: 1,
    paddingRight: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  tagText: {
    ...Typography.caption,
    color: Colors.gold,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  headline: {
    ...Typography.headline,
    color: Colors.textInverse,
    fontWeight: '800',
    fontSize: 17,
    lineHeight: 22,
  },
  subheadline: {
    ...Typography.subhead,
    color: Colors.textInverse,
    fontWeight: '600',
    opacity: 0.9,
    marginTop: 2,
  },
  image: {
    width: 82,
    height: 82,
  },
});
