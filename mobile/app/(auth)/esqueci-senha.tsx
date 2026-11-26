import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { api } from '@/services/api';
import { useHaptics } from '@/hooks/useHaptics';
import { useLanguage } from '@/hooks/useLanguage';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import {
  ArrowLeft,
  User,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptics = useHaptics();
  const { t } = useLanguage();

  const [step, setStep] = useState<'REQUEST' | 'RESET' | 'DONE'>('REQUEST');
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    const clean = identifier.trim();
    if (!clean) {
      setErrorMsg(t('forgotIdentifierLabel'));
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/api/loyalty/auth/forgot-password', { identifier: clean });
      haptics.success();
      setInfoMsg(res.data?.message || null);
      setStep('RESET');
    } catch (err: any) {
      haptics.warning();
      setErrorMsg(err.response?.data?.error || t('loadErrorSub'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setErrorMsg(null);
    if (!code.trim() || code.trim().length < 6) {
      setErrorMsg(t('resetCodeLabel'));
      return;
    }
    if (!newPassword.trim() || newPassword.trim().length < 4) {
      setErrorMsg(t('newPasswordLabel'));
      return;
    }

    try {
      setLoading(true);
      await api.post('/api/loyalty/auth/reset-password', {
        identifier: identifier.trim(),
        code: code.trim(),
        newPassword: newPassword.trim(),
      });
      haptics.success();
      setStep('DONE');
    } catch (err: any) {
      haptics.warning();
      setErrorMsg(err.response?.data?.error || t('loadErrorSub'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.safeArea,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.topRowNav}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/(auth)/login')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <View style={styles.backIconCircle}>
            <ArrowLeft size={18} color={Colors.primary} />
          </View>
          <Text style={styles.backText}>{t('loginLink')}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 'DONE' ? (
            <View style={styles.doneCard}>
              <View style={styles.doneIconCircle}>
                <CheckCircle2 size={36} color={Colors.success} />
              </View>
              <Text style={styles.title}>{t('resetSuccessTitle')}</Text>
              <Text style={styles.subtitle}>{t('resetSuccessSub')}</Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.replace('/(auth)/login')}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>{t('backToLoginBtn')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <View style={styles.heroIconCircle}>
                  <KeyRound size={28} color={Colors.primary} />
                </View>
                <Text style={styles.title}>{t('forgotPasswordTitle')}</Text>
                <Text style={styles.subtitle}>{t('forgotPasswordSubtitle')}</Text>
                <View style={{ marginTop: 14 }}>
                  <LanguageSwitcher />
                </View>
              </View>

              <View style={styles.form}>
                {errorMsg ? (
                  <View style={styles.errorBanner}>
                    <AlertCircle size={16} color={Colors.danger} />
                    <Text style={styles.errorBannerText}>{errorMsg}</Text>
                  </View>
                ) : null}

                {infoMsg ? (
                  <View style={styles.infoBanner}>
                    <CheckCircle2 size={16} color={Colors.success} />
                    <Text style={styles.infoBannerText}>{infoMsg}</Text>
                  </View>
                ) : null}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('forgotIdentifierLabel')}</Text>
                  <View style={styles.inputWrapper}>
                    <User size={18} color={Colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      value={identifier}
                      onChangeText={(val) => {
                        setIdentifier(val);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      editable={step === 'REQUEST'}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                    />
                  </View>
                </View>

                {step === 'RESET' ? (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>{t('resetCodeLabel')}</Text>
                      <View style={styles.inputWrapper}>
                        <KeyRound size={18} color={Colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                          style={styles.textInput}
                          value={code}
                          onChangeText={(val) => {
                            setCode(val.replace(/\D/g, ''));
                            if (errorMsg) setErrorMsg(null);
                          }}
                          keyboardType="number-pad"
                          maxLength={6}
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>{t('newPasswordLabel')}</Text>
                      <View style={styles.inputWrapper}>
                        <Lock size={18} color={Colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                          style={styles.textInput}
                          value={newPassword}
                          onChangeText={(val) => {
                            setNewPassword(val);
                            if (errorMsg) setErrorMsg(null);
                          }}
                          secureTextEntry={!showPassword}
                          autoCapitalize="none"
                        />
                        <TouchableOpacity
                          style={styles.eyeButton}
                          onPress={() => setShowPassword(!showPassword)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          {showPassword ? (
                            <EyeOff size={18} color={Colors.textMuted} />
                          ) : (
                            <Eye size={18} color={Colors.textMuted} />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={handleResetPassword}
                      disabled={loading}
                      activeOpacity={0.85}
                    >
                      {loading ? (
                        <ActivityIndicator color={Colors.textInverse} />
                      ) : (
                        <Text style={styles.primaryButtonText}>{t('confirmNewPasswordBtn')}</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.resendButton}
                      onPress={handleRequestCode}
                      disabled={loading}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.resendText}>{t('resendCodeBtn')}</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleRequestCode}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading ? (
                      <ActivityIndicator color={Colors.textInverse} />
                    ) : (
                      <Text style={styles.primaryButtonText}>{t('sendResetCodeBtn')}</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topRowNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '700',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 32,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  heroIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.subhead,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    maxWidth: 320,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.dangerLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  errorBannerText: {
    flex: 1,
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.successLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  infoBannerText: {
    flex: 1,
    color: Colors.success,
    fontSize: 13,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    ...Typography.footnote,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputWrapper: {
    height: 50,
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  eyeButton: {
    padding: 6,
  },
  primaryButton: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    width: '100%',
  },
  primaryButtonText: {
    ...Typography.headline,
    color: Colors.textInverse,
    fontWeight: '800',
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  resendText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  doneCard: {
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  doneIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
});
