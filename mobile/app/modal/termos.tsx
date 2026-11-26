import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useNavigation } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { TERMS_CONTENT } from '@/constants/LegalContent';
import { Colors } from '@/constants/Colors';
import { ModalHeader } from '@/components/ModalHeader';
import { FileText, CheckCircle2 } from 'lucide-react-native';

export default function TermosModal() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const { customer } = useAuth();
  const { language, t } = useLanguage();
  const doc = TERMS_CONTENT[language] || TERMS_CONTENT.PT;
  const fallback = customer ? '/(tabs)/perfil' : '/(auth)/registo';

  const handleClose = () => {
    try {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else if (typeof router.canGoBack === 'function' && router.canGoBack()) {
        router.back();
      } else {
        router.replace(fallback as any);
      }
    } catch {
      router.replace(fallback as any);
    }
  };

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
        title={t('termsOfUse')}
        icon={<FileText size={18} color={Colors.primary} />}
        fallbackRoute={fallback}
        showGrabber={Platform.OS === 'ios'}
        onClose={handleClose}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdate}>{doc.lastUpdate}</Text>
        <Text style={styles.paragraph}>{doc.intro}</Text>

        {doc.sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionText}>{section.body}</Text>
          </View>
        ))}

        <TouchableOpacity style={styles.acceptButton} onPress={handleClose} activeOpacity={0.85}>
          <CheckCircle2 size={18} color={Colors.textInverse} />
          <Text style={styles.acceptButtonText}>{t('understandAndAcceptBtn')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  lastUpdate: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
    marginBottom: 16,
  },
  section: {
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  acceptButton: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  acceptButtonText: {
    color: Colors.textInverse,
    fontSize: 14,
    fontWeight: '800',
  },
});
