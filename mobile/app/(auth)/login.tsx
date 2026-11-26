import React, { useEffect, useRef, useState } from 'react';
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
import { Image } from 'expo-image';
import * as LocalAuthentication from 'expo-local-authentication';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/hooks/useAuth';
import { useHaptics } from '@/hooks/useHaptics';
import { useLanguage } from '@/hooks/useLanguage';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Fingerprint, ArrowLeft, Eye, EyeOff, User, Lock, AlertCircle } from 'lucide-react-native';

function formatLoginIdentifier(raw: string): string {
  const trimmed = raw.trimStart();
  if (!trimmed || trimmed === '@') return '';

  // Se começar por '+' ou contiver apenas dígitos/espaços -> máscara de telemóvel
  if (/^[+\d\s]+$/.test(trimmed)) {
    const hasPlus = trimmed.startsWith('+');
    const digits = trimmed.replace(/\D/g, '').slice(0, hasPlus ? 15 : 12);
    if (!digits) return hasPlus ? '+' : '';
    if (hasPlus) {
      if (digits.startsWith('351')) {
        const rest = digits.slice(3, 12);
        const groups = rest.match(/.{1,3}/g)?.join(' ') || '';
        return groups ? `+351 ${groups}` : '+351';
      }
      return `+${digits.match(/.{1,3}/g)?.join(' ') || digits}`;
    }
    return digits.match(/.{1,3}/g)?.join(' ') || digits;
  }

  // Se digitar letras (nome de utilizador) -> garante prefixo '@' sem espaços
  const cleanUser = trimmed.replace(/^@+/, '').replace(/\s+/g, '');
  return cleanUser ? `@${cleanUser}` : '';
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login, loginBiometric, hasStoredSessionForBiometric } = useAuth();
  const { language, t } = useLanguage();
  const haptics = useHaptics();

  const passwordRef = useRef<any>(null);
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function checkBio() {
      try {
        const hw = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (mounted) {
          setBiometricAvailable(hw && enrolled);
        }
      } catch {
        if (mounted) setBiometricAvailable(false);
      }
    }
    checkBio();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogin = async () => {
    setErrorMsg(null);
    const rawTrimmed = loginInput.trim();
    if (!rawTrimmed || rawTrimmed === '@') {
      setErrorMsg('Indica o teu telemóvel ou @username.');
      return;
    }
    const clean = rawTrimmed.startsWith('@')
      ? rawTrimmed.replace(/\s+/g, '')
      : rawTrimmed.replace(/\s+/g, '');
    if (!password.trim()) {
      setErrorMsg('Indica a tua palavra-passe ou PIN.');
      return;
    }

    try {
      setLoading(true);
      await login(clean, password.trim());
      haptics.success();
      router.replace('/(tabs)');
    } catch (err: any) {
      haptics.warning();
      setErrorMsg(
        err.response?.data?.error || 'Não foi possível entrar. Verifica os teus dados.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBiometric = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const success = await loginBiometric();
      if (success) {
        haptics.success();
        router.replace('/(tabs)');
      } else {
        haptics.warning();
        setErrorMsg('Não foi possível autenticar com biometria. Entra com a tua palavra-passe.');
      }
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
      {/* Barra Superior Fixa: Voltar */}
      <View style={styles.topRowNav}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <View style={styles.backIconCircle}>
            <ArrowLeft size={18} color={Colors.primary} />
          </View>
          <Text style={styles.backText}>
            {language === 'ES' ? 'Inicio' : language === 'EN' ? 'Welcome' : 'Apresentação'}
          </Text>
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
          <View style={styles.header}>
            <Image
              source={require('@/assets/logo.png')}
              style={styles.logo}
              contentFit="contain"
            />
            <View style={styles.cashbackBadge}>
              <Text style={styles.cashbackBadgeText}>{t('cashback')}</Text>
            </View>
            <Text style={styles.title}>{t('loginTitle')}</Text>
            <Text style={styles.subtitle}>{t('loginSubtitle')}</Text>
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('userInputLabel')}</Text>
              <View style={styles.inputWrapper}>
                <User size={18} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={loginInput}
                  onChangeText={(val) => {
                    setLoginInput(formatLoginIdentifier(val));
                    if (errorMsg) setErrorMsg(null);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="default"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('passwordLabel')}</Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  ref={passwordRef}
                  style={styles.textInput}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
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

              <TouchableOpacity
                style={styles.forgotLinkRow}
                onPress={() => router.push('/(auth)/esqueci-senha')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.forgotLinkText}>{t('forgotPasswordLink')}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={Colors.textInverse} />
              ) : (
                <Text style={styles.loginButtonText}>{t('loginBtn')}</Text>
              )}
            </TouchableOpacity>

            {biometricAvailable && hasStoredSessionForBiometric && (
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometric}
                disabled={loading}
                activeOpacity={0.75}
              >
                <Fingerprint size={20} color={Colors.primary} />
                <Text style={styles.biometricText}>{t('biometricBtn')}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('noAccountYet')}</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/registo')}>
              <Text style={styles.registerLink}>{t('registerNow')}</Text>
            </TouchableOpacity>
          </View>
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
    paddingTop: 12,
    paddingBottom: 32,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  logo: {
    width: 146,
    height: 108,
    marginBottom: 8,
  },
  cashbackBadge: {
    backgroundColor: Colors.goldLight,
    borderColor: 'rgba(180, 83, 9, 0.25)',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 3,
    borderRadius: 20,
    marginBottom: 14,
  },
  cashbackBadgeText: {
    color: Colors.goldDark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 3.2,
    textTransform: 'uppercase',
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
    marginTop: 4,
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
  forgotLinkRow: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  loginButton: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
    elevation: 4,
  },
  loginButtonText: {
    ...Typography.headline,
    color: Colors.textInverse,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    marginTop: 12,
    borderRadius: 23,
    backgroundColor: Colors.primarySoft,
  },
  biometricText: {
    ...Typography.subhead,
    color: Colors.primary,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 26,
  },
  footerText: {
    ...Typography.subhead,
    color: Colors.textSecondary,
  },
  registerLink: {
    ...Typography.subhead,
    color: Colors.primary,
    fontWeight: '800',
  },
});
