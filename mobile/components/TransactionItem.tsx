import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { PlusCircle, MinusCircle } from 'lucide-react-native';
import { TransactionItem as TransactionType } from '@/hooks/useLoyalty';
import { useLanguage } from '@/hooks/useLanguage';

interface TransactionItemProps {
  transaction: TransactionType;
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const { language } = useLanguage();
  const isCredit = transaction.type === 'CREDIT';
  const locale = language === 'EN' ? 'en-GB' : language === 'ES' ? 'es-ES' : 'pt-PT';
  const txDate = new Date(transaction.created_at);
  const formattedDate = txDate.toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = txDate.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });

  const storePart = transaction.tenant_city || transaction.tenant_name;
  const subline = storePart
    ? `${storePart} • ${formattedDate}, ${formattedTime}`
    : `${formattedDate}, ${formattedTime}`;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconWrapper,
          { backgroundColor: isCredit ? Colors.successLight : Colors.primarySoft },
        ]}
      >
        {isCredit ? (
          <PlusCircle size={20} color={Colors.success} />
        ) : (
          <MinusCircle size={20} color={Colors.primary} />
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.description}>
          {transaction.description}
        </Text>
        <Text style={styles.date} numberOfLines={1}>
          {subline}
        </Text>
      </View>

      <View style={styles.pointsBadge}>
        <View style={[styles.pointsPill, isCredit ? styles.creditPill : styles.debitPill]}>
          <Text style={[styles.pointsText, isCredit ? styles.creditText : styles.debitText]}>
            {isCredit ? `+${transaction.points}` : `-${transaction.points}`} pts
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.card,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
    paddingRight: 10,
  },
  description: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '600',
  },
  date: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 3,
  },
  pointsBadge: {
    alignItems: 'flex-end',
  },
  pointsPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  creditPill: {
    backgroundColor: Colors.successLight,
  },
  debitPill: {
    backgroundColor: Colors.primarySoft,
  },
  pointsText: {
    ...Typography.footnote,
    fontWeight: '800',
  },
  creditText: {
    color: Colors.success,
  },
  debitText: {
    color: Colors.primary,
  },
});
