import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { AlertCircle } from 'lucide-react-native';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  variant?: 'default' | 'error';
}

export function EmptyState({
  title,
  description,
  actionText,
  onAction,
  variant = 'default',
}: EmptyStateProps) {
  const isError = variant === 'error';

  return (
    <View style={[styles.container, isError && styles.containerError]}>
      {isError && (
        <View style={styles.errorIconCircle}>
          <AlertCircle size={22} color={Colors.danger} />
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionText && onAction && (
        <TouchableOpacity style={styles.button} onPress={onAction} activeOpacity={0.8}>
          <Text style={styles.buttonText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginVertical: 20,
    backgroundColor: Colors.primarySurface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  containerError: {
    backgroundColor: Colors.dangerLight,
    borderColor: 'rgba(186, 26, 26, 0.2)',
  },
  errorIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    ...Typography.headline,
    color: Colors.text,
    textAlign: 'center',
    fontWeight: '700',
  },
  description: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 21,
  },
  button: {
    marginTop: 18,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 12,
  },
  buttonText: {
    ...Typography.subhead,
    color: Colors.textInverse,
    fontWeight: '700',
  },
});
