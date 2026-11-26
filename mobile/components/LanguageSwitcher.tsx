import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Language, useLanguage } from '@/hooks/useLanguage';
import { useHaptics } from '@/hooks/useHaptics';

const LANGUAGES: Array<{ code: Language; label: string }> = [
  { code: 'PT', label: '🇵🇹 PT' },
  { code: 'EN', label: '🇺🇸 EN' },
  { code: 'ES', label: '🇪🇸 ES' },
];

interface LanguageSwitcherProps {
  compact?: boolean;
}

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();
  const haptics = useHaptics();

  if (compact) {
    const currentIdx = LANGUAGES.findIndex((l) => l.code === language);
    const current = LANGUAGES[currentIdx >= 0 ? currentIdx : 0];
    const next = LANGUAGES[(currentIdx + 1) % LANGUAGES.length];

    return (
      <TouchableOpacity
        style={styles.compactPill}
        onPress={() => {
          haptics.light();
          setLanguage(next.code);
        }}
        activeOpacity={0.75}
        hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={`Idioma atual ${current.code}. Tocar para mudar para ${next.code}`}
      >
        <Text style={styles.compactText}>{current.label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.langPill}>
      {LANGUAGES.map((item) => {
        const active = language === item.code;
        return (
          <TouchableOpacity
            key={item.code}
            style={[styles.langBtn, active && styles.langBtnActive]}
            onPress={() => {
              haptics.light();
              setLanguage(item.code);
            }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.langText, active && styles.langTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: Colors.primarySurface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 24,
    padding: 4,
    gap: 4,
  },
  langBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langBtnActive: {
    backgroundColor: Colors.primary,
  },
  langText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  langTextActive: {
    color: Colors.textInverse,
  },
  compactPill: {
    backgroundColor: Colors.primarySurface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactText: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: '700',
  },
});
