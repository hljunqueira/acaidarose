import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  Switch,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import * as LocalAuthentication from 'expo-local-authentication';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/hooks/useAuth';
import { useLoyalty } from '@/hooks/useLoyalty';
import { useLanguage } from '@/hooks/useLanguage';
import { useStores, getStoreShortLabel } from '@/hooks/useStores';
import { useHaptics } from '@/hooks/useHaptics';
import { api, resolveMediaUrl } from '@/services/api';
import { pickAvatarFromLibrary, takeAvatarPhoto } from '@/utils/avatarPicker';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useRouter } from 'expo-router';
import {
  Share2,
  Shield,
  FileText,
  LogOut,
  Trash2,
  MapPin,
  Fingerprint,
  Pencil,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Globe,
  Camera,
  Clock,
  QrCode,
  Gift,
  AlertTriangle,
  Receipt,
} from 'lucide-react-native';

const FAQ_KEYS = [
  { id: 'validity', qKey: 'faq1Q' as const, aKey: 'faq1A' as const },
  { id: 'earn', qKey: 'faq2Q' as const, aKey: 'faq2A' as const },
  { id: 'redeem', qKey: 'faq3Q' as const, aKey: 'faq3A' as const },
];

export default function ProfileScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  const {
    customer,
    logout,
    deleteAccount,
    uploadAvatar,
    removeAvatar,
    biometricEnabled,
    setBiometricEnabled,
  } = useAuth();
  const { t } = useLanguage();
  const { referralConfig } = useLoyalty();
  const { activeStore } = useStores();

  const [biometricSupported, setBiometricSupported] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const { data: contentConfig } = useQuery({
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

  const dynamicFaq =
    Array.isArray(contentConfig?.faq) && contentConfig.faq.length > 0
      ? contentConfig.faq
      : null;

  const avatarUri = resolveMediaUrl(customer?.avatar_url);

  useEffect(() => {
    let mounted = true;
    async function checkBio() {
      try {
        const hw = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (mounted) setBiometricSupported(hw && enrolled);
      } catch {
        if (mounted) setBiometricSupported(false);
      }
    }
    checkBio();
    return () => {
      mounted = false;
    };
  }, []);

  const processAvatarPick = async (source: 'library' | 'camera') => {
    try {
      const picked =
        source === 'camera' ? await takeAvatarPhoto() : await pickAvatarFromLibrary();
      if (!picked) return;

      setUploadingAvatar(true);
      await uploadAvatar(picked.base64, picked.mimeType);
      haptics.success();
    } catch (err: any) {
      haptics.warning();
      Alert.alert(
        'Erro',
        err.response?.data?.error || 'Não foi possível guardar a foto de perfil.'
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setUploadingAvatar(true);
      await removeAvatar();
      haptics.light();
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível remover a foto.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  const handleAvatarPress = () => {
    if (uploadingAvatar) return;
    haptics.light();

    if (Platform.OS === 'web') {
      processAvatarPick('library');
      return;
    }

    const buttons: Array<{ text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }> = [
      {
        text: 'Escolher da Galeria',
        onPress: () => processAvatarPick('library'),
      },
      {
        text: 'Tirar Foto',
        onPress: () => processAvatarPick('camera'),
      },
    ];

    if (avatarUri) {
      buttons.push({
        text: 'Remover Foto',
        style: 'destructive',
        onPress: handleRemoveAvatar,
      });
    }

    buttons.push({ text: 'Cancelar', style: 'cancel' });
    Alert.alert('Foto de Perfil', 'Seleciona como queres atualizar a tua foto:', buttons);
  };

  const handleShareReferral = async () => {
    if (!customer?.referral_code) return;
    try {
      await Share.share({
        message: `Vem provar o melhor açaí! Descarrega a app do Açaí da Rose e usa o meu código ${customer.referral_code} para ganhares bónus: https://acaidarose.pt/convite/${customer.referral_code}`,
      });
    } catch {}
  };

  const handleLogout = () => {
    Alert.alert(t('logoutBtn'), 'Tens a certeza de que desejas sair da tua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('deleteAccountBtn'),
      'Esta ação é definitiva e removerá todos os teus dados pessoais e pontos acumulados no servidor. Desejas prosseguir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, Eliminar Definitivamente',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteAccount();
              Alert.alert(
                'Conta Eliminada',
                'A tua conta foi eliminada e anonimizada conforme as diretrizes do RGPD.'
              );
              router.replace('/(auth)/login');
            } catch (err: any) {
              Alert.alert(
                'Erro',
                err.response?.data?.error ||
                  'Não foi possível eliminar a conta agora. Tenta novamente.'
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.header}>
        <Image
          source={require('@/assets/logo.png')}
          style={styles.brandLogo}
          contentFit="contain"
        />
        <View style={styles.cashbackBadge}>
          <Text style={styles.cashbackBadgeText}>{t('cashback')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Card de Identidade Centrado */}
        <View style={styles.heroCard}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleAvatarPress}
            activeOpacity={0.85}
            disabled={uploadingAvatar}
            accessibilityRole="button"
            accessibilityLabel="Alterar foto de perfil"
          >
            <View style={styles.avatarCircle}>
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={styles.avatarImage}
                  contentFit="cover"
                  transition={180}
                />
              ) : (
                <Text style={styles.avatarText}>
                  {customer?.name?.trim().charAt(0).toUpperCase() || 'U'}
                </Text>
              )}

              {uploadingAvatar && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color={Colors.textInverse} />
                </View>
              )}
            </View>

            <View style={styles.cameraBadge}>
              <Camera size={14} color={Colors.textInverse} />
            </View>
          </TouchableOpacity>

          <Text style={styles.heroName} numberOfLines={1}>
            {customer?.name || 'Cliente'}
          </Text>

          <View style={styles.heroMetaRow}>
            {customer?.username ? (
              <Text style={styles.heroUsername}>{customer.username}</Text>
            ) : null}
            {customer?.username && customer?.phone ? (
              <Text style={styles.heroDot}>•</Text>
            ) : null}
            {customer?.phone ? (
              <Text style={styles.heroPhone}>{customer.phone}</Text>
            ) : null}
          </View>

          {customer?.nif ? (
            <View style={styles.nifChip}>
              <Text style={styles.nifChipText}>NIF: {customer.nif}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => router.navigate('/(tabs)/editar-perfil')}
            activeOpacity={0.8}
          >
            <Pencil size={15} color={Colors.primary} />
            <Text style={styles.editProfileButtonText}>{t('editProfileBtn')}</Text>
          </TouchableOpacity>
        </View>

        {/* Preferências */}
        <Text style={styles.groupLabel}>{t('preferencesSection')}</Text>
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.rowButton}
            onPress={() =>
              router.navigate({
                pathname: '/(tabs)/extrato',
                params: { returnTo: '/(tabs)/perfil' },
              })
            }
            activeOpacity={0.75}
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowIconCircle}>
                <Receipt size={18} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{t('statementTitle')}</Text>
                <Text style={styles.rowSubtitle} numberOfLines={1}>
                  {t('recentActivity')}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.rowButton}
            onPress={() =>
              router.navigate({
                pathname: '/(tabs)/lojas',
                params: { returnTo: '/(tabs)/perfil' },
              })
            }
            activeOpacity={0.75}
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowIconCircle}>
                <MapPin size={18} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{t('activeStoreLabel')}</Text>
                <Text style={styles.rowSubtitle} numberOfLines={1}>
                  {activeStore ? getStoreShortLabel(activeStore) : t('loadingStore')}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Idioma em 2 linhas para evitar aperto com 3 bandeiras */}
          <View style={styles.languageBlock}>
            <View style={styles.rowLeft}>
              <View style={styles.rowIconCircle}>
                <Globe size={18} color={Colors.primary} />
              </View>
              <Text style={styles.rowTitle}>{t('languageLabel')}</Text>
            </View>
            <View style={styles.languageSwitcherWrap}>
              <LanguageSwitcher />
            </View>
          </View>

          {biometricSupported && (
            <>
              <View style={styles.divider} />
              <View style={styles.rowButton}>
                <View style={styles.rowLeft}>
                  <View style={styles.rowIconCircle}>
                    <Fingerprint size={18} color={Colors.primary} />
                  </View>
                  <Text style={styles.rowTitle}>{t('biometricUnlockLabel')}</Text>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={(val) => setBiometricEnabled(val)}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor={Colors.card}
                />
              </View>
            </>
          )}
        </View>

        {/* Convidar Amigos (visível apenas se ativo no Admin) */}
        {referralConfig.enabled && customer?.referral_code ? (
          <>
            <Text style={styles.groupLabel}>{t('inviteSection')}</Text>
            <View style={styles.sectionCard}>
              <View style={styles.inviteRow}>
                <View style={styles.rowLeft}>
                  <View style={[styles.rowIconCircle, { backgroundColor: Colors.successLight }]}>
                    <Share2 size={18} color={Colors.success} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{t('shareFriendCode')}</Text>
                    <Text style={styles.rowSubtitle}>
                      {customer.referral_code} •{' '}
                      {t('invitedFriendsCount', { n: customer.referrals_count ?? 0 })}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.sharePillBtn}
                  onPress={handleShareReferral}
                  activeOpacity={0.8}
                >
                  <Text style={styles.sharePillBtnText}>Partilhar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : null}

        {/* Privacidade & Termos */}
        <Text style={styles.groupLabel}>{t('legalSection')}</Text>
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.rowButton}
            onPress={() => router.navigate('/(tabs)/termos')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowIconCircle}>
                <FileText size={18} color={Colors.textSecondary} />
              </View>
              <Text style={styles.rowTitle}>{t('termsTitle')}</Text>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.rowButton}
            onPress={() => router.navigate('/(tabs)/privacidade')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowIconCircle}>
                <Shield size={18} color={Colors.textSecondary} />
              </View>
              <Text style={styles.rowTitle}>{t('privacyTitle')}</Text>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Dúvidas Frequentes (FAQ) */}
        <Text style={styles.groupLabel}>{t('faqSection').toUpperCase()}</Text>
        <View style={styles.faqList}>
          {(dynamicFaq
            ? dynamicFaq.map((item) => ({
                id: item.id,
                question: item.question,
                answer: item.answer,
              }))
            : FAQ_KEYS.map((item) => ({
                id: item.id,
                question: t(item.qKey),
                answer: t(item.aKey),
              }))
          ).map((item, idx) => {
            const isOpen = openFaqId === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.faqCard}
                onPress={() => {
                  haptics.light();
                  setOpenFaqId(isOpen ? null : item.id);
                }}
                activeOpacity={0.75}
              >
                <View style={styles.faqHeaderRow}>
                  <View style={styles.faqIconCircle}>
                    {idx % 3 === 0 ? (
                      <Clock size={16} color={Colors.primary} />
                    ) : idx % 3 === 1 ? (
                      <QrCode size={16} color={Colors.primary} />
                    ) : (
                      <Gift size={16} color={Colors.success} />
                    )}
                  </View>
                  <Text style={styles.faqQuestion}>{item.question}</Text>
                  {isOpen ? (
                    <ChevronUp size={18} color={Colors.textMuted} />
                  ) : (
                    <ChevronDown size={18} color={Colors.textMuted} />
                  )}
                </View>
                {isOpen && <Text style={styles.faqAnswer}>{item.answer}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Segurança e Dados Pessoais (RGPD) */}
        <Text style={[styles.groupLabel, { color: Colors.danger }]}>
          {t('securitySection').toUpperCase()}
        </Text>
        <View style={styles.dangerCard}>
          <View style={styles.dangerInfoRow}>
            <View style={styles.dangerIconCircle}>
              <AlertTriangle size={18} color={Colors.danger} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dangerTitle}>{t('rgpdCardTitle')}</Text>
              <Text style={styles.dangerDesc}>{t('rgpdCardDesc')}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteAccount}
            disabled={deleting}
            activeOpacity={0.75}
          >
            {deleting ? (
              <ActivityIndicator size="small" color={Colors.danger} />
            ) : (
              <Trash2 size={16} color={Colors.danger} />
            )}
            <Text style={styles.deleteText}>{t('deleteAccountBtn')}</Text>
          </TouchableOpacity>
        </View>

        {/* Terminar Sessão */}
        <TouchableOpacity style={styles.logoutCard} onPress={handleLogout} activeOpacity={0.75}>
          <LogOut size={18} color={Colors.text} />
          <Text style={styles.logoutText}>{t('logoutBtn')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.backgroundSubtle,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  brandLogo: {
    width: 112,
    height: 52,
    marginBottom: 4,
  },
  cashbackBadge: {
    backgroundColor: Colors.goldLight,
    borderColor: 'rgba(180, 83, 9, 0.25)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 16,
  },
  cashbackBadgeText: {
    color: Colors.goldDark,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  heroCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: Colors.primarySoft,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 32,
    color: Colors.textInverse,
    fontWeight: '800',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(40, 20, 45, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    borderWidth: 2.5,
    borderColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: {
    ...Typography.title3,
    color: Colors.text,
    fontWeight: '800',
    textAlign: 'center',
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  heroUsername: {
    ...Typography.subhead,
    color: Colors.primary,
    fontWeight: '700',
  },
  heroDot: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  heroPhone: {
    ...Typography.footnote,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  nifChip: {
    marginTop: 8,
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  nifChipText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  editProfileButton: {
    marginTop: 14,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 11,
  },
  editProfileButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  groupLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 0.9,
    marginBottom: 8,
    marginLeft: 6,
  },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
  },
  rowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    gap: 10,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '600',
    flexShrink: 1,
  },
  rowSubtitle: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 10,
  },
  languageBlock: {
    gap: 10,
    paddingVertical: 2,
  },
  languageSwitcherWrap: {
    alignSelf: 'flex-start',
    marginLeft: 48,
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sharePillBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  sharePillBtnText: {
    color: Colors.textInverse,
    fontSize: 12,
    fontWeight: '800',
  },
  faqList: {
    gap: 8,
    marginBottom: 20,
  },
  faqCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  faqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  faqIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  faqAnswer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  dangerCard: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.2)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  dangerInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  dangerIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(186, 26, 26, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
  },
  dangerDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginTop: 2,
  },
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 24,
    paddingVertical: 14,
    marginTop: 4,
  },
  logoutText: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '700',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.28)',
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  deleteText: {
    ...Typography.footnote,
    color: Colors.danger,
    fontWeight: '700',
  },
});
