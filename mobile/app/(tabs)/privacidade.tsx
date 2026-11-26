import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/Colors';
import { SubPageHeader } from '@/components/SubPageHeader';
import { useLanguage } from '@/hooks/useLanguage';
import { PRIVACY_CONTENT } from '@/constants/LegalContent';
import { api } from '@/services/api';
import { CheckCircle2 } from 'lucide-react-native';

export default function PrivacidadeTabScreen() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const doc = PRIVACY_CONTENT[language] || PRIVACY_CONTENT.PT;

  const { data: settingsData } = useQuery({
    queryKey: ['loyalty_settings_content'],
    queryFn: async () => {
      const res = await api.get('/api/loyalty/settings');
      return res.data?.content as {
        faq?: Array<{ id: string; question: string; answer: string }>;
        terms_text?: string;
        privacy_text?: string;
      } | undefined;
    },
    staleTime: 1000 * 60,
  });

  const customPrivacy = settingsData?.privacy_text?.trim() || '';

  return (
    <View style={styles.container}>
      <SubPageHeader title={t('privacyPolicy')} backTo="/(tabs)/perfil" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {customPrivacy ? (
          <View style={styles.section}>
            <Text style={styles.sectionText}>{customPrivacy}</Text>
          </View>
        ) : (
          <>
            <Text style={styles.lastUpdate}>{doc.lastUpdate}</Text>
            <Text style={styles.paragraph}>{doc.intro}</Text>

            {doc.sections.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionText}>{section.body}</Text>
              </View>
            ))}
          </>
        )}

        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => router.navigate('/(tabs)/perfil')}
          activeOpacity={0.85}
        >
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
    paddingBottom: 116,
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
