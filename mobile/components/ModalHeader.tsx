import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useHaptics } from '@/hooks/useHaptics';

interface ModalHeaderProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBgColor?: string;
  iconBorderColor?: string;
  fallbackRoute?: string;
  showGrabber?: boolean;
  onClose?: () => void;
}

export function ModalHeader({
  title,
  subtitle,
  icon,
  iconBgColor = Colors.primarySurface,
  iconBorderColor = Colors.border,
  fallbackRoute = '/(tabs)',
  showGrabber = false,
  onClose,
}: ModalHeaderProps) {
  const router = useRouter();
  const navigation = useNavigation();
  const haptics = useHaptics();
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleClose = () => {
    haptics.light();

    if (onClose) {
      onClose();
      return;
    }

    const canNavGoBack = typeof navigation?.canGoBack === 'function' && navigation.canGoBack();
    const canRouterBack = typeof router?.canGoBack === 'function' && router.canGoBack();

    try {
      if (canNavGoBack) {
        navigation.goBack();
      } else if (canRouterBack) {
        router.back();
      } else {
        router.replace(fallbackRoute as any);
        return;
      }
    } catch {
      router.replace(fallbackRoute as any);
      return;
    }

    setTimeout(() => {
      if (isMountedRef.current) {
        try {
          if (typeof router.dismissAll === 'function') {
            router.dismissAll();
          }
        } catch { }
        try {
          router.replace(fallbackRoute as any);
        } catch { }
      }
    }, 120);
  };

  return (
    <View style={styles.wrapper}>
      {showGrabber && (
        <View style={styles.grabberRow}>
          <View style={styles.grabberPill} />
        </View>
      )}

      <View style={[styles.header, showGrabber && styles.headerWithGrabber]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          activeOpacity={0.35}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          accessible={true}
          accessibilityLabel="Fechar"
          accessibilityRole="button"
        >
          <Text style={styles.closeGlyph}>✕</Text>
        </TouchableOpacity>

        {(icon || title || subtitle) ? (
          <View style={styles.titleGroup}>
            {icon ? (
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: iconBgColor, borderColor: iconBorderColor },
                ]}
              >
                {icon}
              </View>
            ) : null}

            {(title || subtitle) ? (
              <View style={styles.textCol}>
                {title ? (
                  <Text style={styles.title} numberOfLines={1}>
                    {title}
                  </Text>
                ) : null}
                {subtitle ? (
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    zIndex: 20,
  },
  grabberRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 2,
  },
  grabberPill: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 16 : 14,
    paddingBottom: 14,
  },
  headerWithGrabber: {
    paddingTop: 10,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 12,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textMuted,
    marginTop: 1,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  closeGlyph: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 20,
    textAlign: 'center',
  },
});
