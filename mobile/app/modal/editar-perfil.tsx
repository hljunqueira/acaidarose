import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  User,
  Mail,
  Receipt,
  Calendar,
  Lock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Camera,
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { ModalHeader } from '@/components/ModalHeader';
import { useAuth } from '@/hooks/useAuth';
import { useHaptics } from '@/hooks/useHaptics';
import { useLanguage } from '@/hooks/useLanguage';
import { resolveMediaUrl } from '@/services/api';
import { pickAvatarFromLibrary, takeAvatarPhoto } from '@/utils/avatarPicker';

function isValidPortugueseNif(nif: string): boolean {
  if (!/^\d{9}$/.test(nif)) return false;
  const first = Number(nif[0]);
  if (![1, 2, 3, 5, 6, 8, 9].includes(first)) return false;
  let total = 0;
  for (let i = 0; i < 8; i++) {
    total += Number(nif[i]) * (9 - i);
  }
  const mod = total % 11;
  const check = mod < 2 ? 0 : 11 - mod;
  return check === Number(nif[8]);
}

export default function EditProfileModal() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { customer, updateProfile, uploadAvatar, removeAvatar } = useAuth();
  const haptics = useHaptics();
  const { t } = useLanguage();

  const [name, setName] = useState(customer?.name || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [nif, setNif] = useState(customer?.nif || '');
  const [birthDate, setBirthDate] = useState(
    customer?.birth_date ? String(customer.birth_date).slice(0, 10) : ''
  );

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const avatarUri = resolveMediaUrl(customer?.avatar_url);

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
      setErrorMsg(err.response?.data?.error || 'Não foi possível guardar a foto de perfil.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarPress = () => {
    if (uploadingAvatar) return;
    if (Platform.OS === 'web') {
      processAvatarPick('library');
      return;
    }

    const buttons: Array<{
      text: string;
      style?: 'default' | 'cancel' | 'destructive';
      onPress?: () => void;
    }> = [
        { text: 'Escolher da Galeria', onPress: () => processAvatarPick('library') },
        { text: 'Tirar Foto', onPress: () => processAvatarPick('camera') },
      ];

    if (avatarUri) {
      buttons.push({
        text: 'Remover Foto',
        style: 'destructive',
        onPress: async () => {
          try {
            setUploadingAvatar(true);
            await removeAvatar();
            haptics.light();
          } catch (err: any) {
            setErrorMsg(err.response?.data?.error || 'Não foi possível remover a foto.');
          } finally {
            setUploadingAvatar(false);
          }
        },
      });
    }

    buttons.push({ text: 'Cancelar', style: 'cancel' });
    Alert.alert('Foto de Perfil', 'Seleciona como queres atualizar a tua foto:', buttons);
  };

  const handleSave = async () => {
    setErrorMsg(null);
    if (name.trim().length < 2) {
      setErrorMsg('Indica um nome válido.');
      return;
    }

    const cleanEmail = email.trim();
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg('E-mail inválido.');
      return;
    }

    const cleanNif = nif.replace(/\s+/g, '').trim();
    if (cleanNif && !isValidPortugueseNif(cleanNif)) {
      setErrorMsg(t('nifInvalid'));
      return;
    }

    const cleanBirth = birthDate.trim();
    if (cleanBirth && !/^\d{4}-\d{2}-\d{2}$/.test(cleanBirth)) {
      setErrorMsg('Formato da data de nascimento: AAAA-MM-DD (ex: 1995-05-20).');
      return;
    }

    if (showPasswordSection && newPassword.trim()) {
      if (newPassword.trim().length < 4) {
        setErrorMsg('A nova palavra-passe deve ter pelo menos 4 caracteres.');
        return;
      }
      if (!currentPassword.trim()) {
        setErrorMsg('Indica a palavra-passe atual para confirmar a alteração.');
        return;
      }
    }

    try {
      setSaving(true);
      await updateProfile({
        name: name.trim(),
        email: cleanEmail || null,
        nif: cleanNif || null,
        birth_date: cleanBirth || null,
        ...(showPasswordSection && newPassword.trim()
          ? {
            current_password: currentPassword.trim(),
            new_password: newPassword.trim(),
          }
          : {}),
      });

      haptics.success();
      Alert.alert('Guardado', 'Os teus dados foram atualizados com sucesso.', [
        {
          text: 'OK',
          onPress: () => {
            if (router.canGoBack()) router.back();
            else router.navigate('/(tabs)/perfil');
          },
        },
      ]);
    } catch (err: any) {
      haptics.warning();
      setErrorMsg(err.response?.data?.error || 'Não foi possível guardar as alterações.');
    } finally {
      setSaving(false);
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
        title={t('editProfileBtn')}
        icon={<User size={18} color={Colors.primary} />}
        fallbackRoute="/(tabs)/perfil"
        showGrabber={Platform.OS === 'ios'}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Foto de Perfil */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarTouch}
              onPress={handleAvatarPress}
              activeOpacity={0.85}
              disabled={uploadingAvatar}
            >
              <View style={styles.avatarCircle}>
                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={styles.avatarImage}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={styles.avatarText}>
                    {name?.trim().charAt(0).toUpperCase() || 'U'}
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
            <TouchableOpacity onPress={handleAvatarPress} disabled={uploadingAvatar}>
              <Text style={styles.changePhotoText}>Alterar foto de perfil</Text>
            </TouchableOpacity>
          </View>

          {errorMsg ? (
            <View style={styles.errorBanner}>
              <AlertCircle size={16} color={Colors.danger} />
              <Text style={styles.errorBannerText}>{errorMsg}</Text>
            </View>
          ) : null}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('fullName')}</Text>
            <View style={styles.inputWrapper}>
              <User size={18} color={Colors.textMuted} style={styles.icon} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>E-mail {t('optional')}</Text>
            <View style={styles.inputWrapper}>
              <Mail size={18} color={Colors.textMuted} style={styles.icon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('nifLabel')}</Text>
            <View style={styles.inputWrapper}>
              <Receipt size={18} color={Colors.textMuted} style={styles.icon} />
              <TextInput
                style={styles.input}
                value={nif}
                onChangeText={setNif}
                keyboardType="numeric"
                maxLength={9}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Data de Nascimento (AAAA-MM-DD) {t('optional')}</Text>
            <View style={styles.inputWrapper}>
              <Calendar size={18} color={Colors.textMuted} style={styles.icon} />
              <TextInput
                style={styles.input}
                value={birthDate}
                onChangeText={setBirthDate}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
              />
            </View>
          </View>

          {/* Secção expansível de alteração de palavra-passe */}
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setShowPasswordSection(!showPasswordSection)}
            activeOpacity={0.75}
          >
            <View style={styles.passwordToggleLeft}>
              <Lock size={17} color={Colors.primary} />
              <Text style={styles.passwordToggleText}>Alterar Palavra-passe</Text>
            </View>
            {showPasswordSection ? (
              <ChevronUp size={18} color={Colors.textMuted} />
            ) : (
              <ChevronDown size={18} color={Colors.textMuted} />
            )}
          </TouchableOpacity>

          {showPasswordSection && (
            <View style={styles.passwordBox}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Palavra-passe Atual</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>
              </View>
              <View style={[styles.fieldGroup, { marginBottom: 0 }]}>
                <Text style={styles.label}>Nova Palavra-passe</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color={Colors.textInverse} />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Alterações</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarTouch: {
    position: 'relative',
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
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
  changePhotoText: {
    marginTop: 10,
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.dangerLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    flex: 1,
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
    height: '100%',
  },
  passwordToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  passwordToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passwordToggleText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  passwordBox: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  saveButton: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: Colors.textInverse,
    fontSize: 15,
    fontWeight: '800',
  },
});
