import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useHaptics } from '@/hooks/useHaptics';
import { useLanguage } from '@/hooks/useLanguage';
import { COUNTRY_CODES, CountryCode } from '@/constants/CountryCodes';
import { Colors } from '@/constants/Colors';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { api } from '@/services/api';
import {
  ChevronLeft,
  ChevronDown,
  User,
  Lock,
  Eye,
  EyeOff,
  Gift,
  Receipt,
  Check,
  ArrowRight,
  ShieldCheck,
  Award,
  Search,
  X,
  AlertCircle,
} from 'lucide-react-native';

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

function formatPhoneByCountry(raw: string, dialCode: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (dialCode === '+351') {
    const pt = digits.slice(0, 9);
    return pt.match(/.{1,3}/g)?.join(' ') || pt;
  }
  if (dialCode === '+55') {
    const br = digits.slice(0, 11);
    if (br.length <= 2) return `(${br}`;
    if (br.length <= 6) return `(${br.slice(0, 2)}) ${br.slice(2)}`;
    if (br.length <= 10) return `(${br.slice(0, 2)}) ${br.slice(2, 6)}-${br.slice(6)}`;
    return `(${br.slice(0, 2)}) ${br.slice(2, 7)}-${br.slice(7)}`;
  }
  const intl = digits.slice(0, 12);
  return intl.match(/.{1,3}/g)?.join(' ') || intl;
}

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { ref: deepLinkRef } = useLocalSearchParams<{ ref?: string }>();
  const { register } = useAuth();
  const haptics = useHaptics();
  const { t } = useLanguage();

  const usernameRef = useRef<any>(null);
  const phoneRef = useRef<any>(null);
  const passwordRef = useRef<any>(null);
  const referralRef = useRef<any>(null);
  const nifRef = useRef<any>(null);

  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [searchCountry, setSearchCountry] = useState('');

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken' | 'invalid'
  >('idle');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [referralEnabled, setReferralEnabled] = useState(false);
  const [nif, setNif] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false); // RGPD exige opt-in explícito
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .get('/api/loyalty/settings')
      .then((res) => {
        if (mounted && typeof res.data?.referral?.enabled === 'boolean') {
          setReferralEnabled(res.data.referral.enabled);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (deepLinkRef && typeof deepLinkRef === 'string') {
      setReferralCode(deepLinkRef.trim().toUpperCase());
    }
  }, [deepLinkRef]);

  const cleanUsername = username.replace(/^@+/, '').trim().toLowerCase();

  // Verificação real com debounce na API
  useEffect(() => {
    if (!cleanUsername) {
      setUsernameStatus('idle');
      return;
    }
    if (!/^[a-zA-Z0-9._-]{3,30}$/.test(cleanUsername)) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/api/loyalty/auth/check-username', {
          params: { username: cleanUsername },
        });
        if (res.data?.valid === false) {
          setUsernameStatus('invalid');
        } else {
          setUsernameStatus(res.data?.available ? 'available' : 'taken');
        }
      } catch {
        setUsernameStatus('idle');
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [cleanUsername]);

  const cleanPhone = phone.replace(/\D/g, '');
  const minDigits = selectedCountry.dial_code === '+351' ? 9 : 6;
  const isPhoneValid = cleanPhone.length >= minDigits;

  const cleanNif = nif.replace(/\s+/g, '').trim();
  const isNifError = cleanNif.length > 0 && !isValidPortugueseNif(cleanNif);

  const filteredCountries = COUNTRY_CODES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchCountry.toLowerCase()) ||
      c.dial_code.includes(searchCountry) ||
      c.code.toLowerCase().includes(searchCountry.toLowerCase())
  );

  const getPasswordStrength = () => {
    if (!password) return { level: 0, label: '', color: Colors.textMuted };
    if (password.length < 4) return { level: 1, label: 'Curta', color: Colors.danger };

    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSymbolOrUpper = /[^a-zA-Z0-9]/.test(password) || /[A-Z]/.test(password);

    if (password.length >= 8 && hasLetters && hasNumbers && hasSymbolOrUpper) {
      return { level: 4, label: 'Forte', color: Colors.success };
    }
    if (password.length >= 6 && hasLetters && hasNumbers) {
      return { level: 3, label: 'Boa', color: Colors.success };
    }
    return { level: 2, label: 'Média', color: Colors.warning };
  };

  const strength = getPasswordStrength();

  const handleRegister = async () => {
    setErrorMsg(null);

    if (name.trim().length < 2) {
      setErrorMsg('Por favor, indica o teu nome completo.');
      return;
    }

    if (cleanUsername && (usernameStatus === 'taken' || usernameStatus === 'invalid')) {
      setErrorMsg(
        usernameStatus === 'taken'
          ? 'Esse @username já está a ser utilizado. Escolhe outro.'
          : 'O @username deve ter pelo menos 3 caracteres válidos.'
      );
      return;
    }

    if (!cleanPhone || !isPhoneValid) {
      setErrorMsg(`Indica um telemóvel válido com pelo menos ${minDigits} dígitos.`);
      return;
    }

    if (!password.trim() || password.length < 4) {
      setErrorMsg('A palavra-passe deve ter pelo menos 4 caracteres.');
      return;
    }

    if (isNifError) {
      setErrorMsg(t('nifInvalid'));
      return;
    }

    if (!agreeTerms) {
      setErrorMsg('Para criar a tua conta, aceita os Termos de Utilização e a Política de Privacidade (RGPD).');
      return;
    }

    try {
      setLoading(true);
      const fullPhone = `${selectedCountry.dial_code}${cleanPhone}`;

      await register({
        phone: fullPhone,
        name: name.trim(),
        pass: password.trim(),
        username: cleanUsername ? `@${cleanUsername}` : undefined,
        nif: cleanNif || undefined,
        referralCode: referralCode.trim() || undefined,
      });

      haptics.success();
      Alert.alert(
        'Bem-vindo(a)!',
        'A tua conta foi criada com sucesso! Já podes acumular pontos e resgatar açaí.',
        [{ text: 'Começar', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (err: any) {
      haptics.warning();
      setErrorMsg(err.response?.data?.error || 'Não foi possível concluir o registo.');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit =
    !loading &&
    name.trim().length >= 2 &&
    isPhoneValid &&
    password.length >= 4 &&
    agreeTerms &&
    !isNifError &&
    usernameStatus !== 'taken' &&
    usernameStatus !== 'invalid';

  return (
    <View
      style={[
        styles.safeArea,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ChevronLeft size={22} color={Colors.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>
            {t('createAccountTitle')}
          </Text>

          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: 'center', marginBottom: 14 }}>
            <LanguageSwitcher />
          </View>
          <View style={styles.formCard}>
            {errorMsg ? (
              <View style={styles.errorBanner}>
                <AlertCircle size={16} color={Colors.danger} />
                <Text style={styles.errorBannerText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* 1. Nome Completo */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{t('fullName')}</Text>
                <Text style={styles.requiredTag}>{t('required')}</Text>
              </View>
              <View style={styles.inputWrapper}>
                <User size={18} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => usernameRef.current?.focus()}
                />
              </View>
            </View>

            {/* 2. @username */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{t('chooseUsername')}</Text>
              </View>
              <View style={styles.inputWrapper}>
                <View style={styles.atBadge}>
                  <Text style={styles.atBadgeText}>@</Text>
                </View>
                <TextInput
                  ref={usernameRef}
                  style={[styles.textInput, { paddingLeft: 8 }]}
                  value={cleanUsername}
                  onChangeText={(val) => setUsername(val.replace(/^@+/, ''))}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => phoneRef.current?.focus()}
                />
                {usernameStatus === 'checking' && (
                  <ActivityIndicator size="small" color={Colors.primary} />
                )}
                {usernameStatus === 'available' && (
                  <View style={styles.validCheckIcon}>
                    <Check size={16} color={Colors.success} />
                  </View>
                )}
              </View>
              {usernameStatus === 'checking' && (
                <Text style={styles.checkingText}>{t('checking')}</Text>
              )}
              {usernameStatus === 'available' && (
                <View style={styles.liveAvailablePill}>
                  <Check size={12} color={Colors.success} />
                  <Text style={styles.liveAvailableText}>
                    @{cleanUsername} {t('usernameAvailable')}
                  </Text>
                </View>
              )}
              {usernameStatus === 'taken' && (
                <View style={styles.liveErrorPill}>
                  <Text style={styles.liveErrorText}>
                    @{cleanUsername} {t('usernameTaken')}
                  </Text>
                </View>
              )}
              {usernameStatus === 'invalid' && (
                <Text style={styles.hintErrorText}>{t('usernameInvalid')}</Text>
              )}
            </View>

            {/* 3. Telemóvel */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{t('phoneSms')}</Text>
                <Text style={styles.requiredTag}>{t('required')}</Text>
              </View>
              <View style={styles.phoneInputRow}>
                <TouchableOpacity
                  style={styles.countryCodePill}
                  onPress={() => setShowCountryModal(true)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                  <Text style={styles.countryCodeText}>{selectedCountry.dial_code}</Text>
                  <ChevronDown size={14} color={Colors.textMuted} />
                </TouchableOpacity>

                <View style={[styles.inputWrapper, { flex: 1 }]}>
                  <TextInput
                    ref={phoneRef}
                    style={styles.textInput}
                    value={phone}
                    onChangeText={(val) => setPhone(formatPhoneByCountry(val, selectedCountry.dial_code))}
                    keyboardType="phone-pad"
                    maxLength={16}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                  {isPhoneValid && (
                    <View style={styles.validCheckIcon}>
                      <Check size={16} color={Colors.success} />
                    </View>
                  )}
                </View>
              </View>
              {isPhoneValid && (
                <View style={styles.digitsValidBadge}>
                  <View style={styles.greenDot} />
                  <Text style={styles.digitsValidText}>
                    {minDigits}+ {t('validDigits')}
                  </Text>
                </View>
              )}
            </View>

            {/* 4. Palavra-passe Segura */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{t('securePassword')}</Text>
                {strength.level > 0 && (
                  <Text style={[styles.strengthText, { color: strength.color }]}>
                    {strength.label}
                  </Text>
                )}
              </View>
              <View style={styles.inputWrapper}>
                <Lock size={18} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  ref={passwordRef}
                  style={[styles.textInput, { paddingRight: 40 }]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => referralRef.current?.focus()}
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

              {password.length > 0 && (
                <View style={styles.strengthBarRow}>
                  {[1, 2, 3, 4].map((seg) => (
                    <View
                      key={seg}
                      style={[
                        styles.strengthSegment,
                        {
                          backgroundColor:
                            seg <= strength.level ? strength.color : Colors.border,
                        },
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* 5. Código de Amigo (visível apenas se ativo no Admin) */}
            {referralEnabled ? (
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>{t('friendCode')}</Text>
                  <View style={styles.bonusPointsBadge}>
                    <Award size={11} color={Colors.goldDark} />
                    <Text style={styles.bonusPointsText}>{t('optionalBonus')}</Text>
                  </View>
                </View>
                <View style={styles.inputWrapper}>
                  <Gift size={18} color={Colors.goldDark} style={styles.inputIcon} />
                  <TextInput
                    ref={referralRef}
                    style={styles.textInput}
                    value={referralCode}
                    onChangeText={(val) => setReferralCode(val.toUpperCase())}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => nifRef.current?.focus()}
                  />
                </View>
              </View>
            ) : null}

            {/* 6. NIF Opcional */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{t('nifLabel')}</Text>
              </View>
              <View style={[styles.inputWrapper, isNifError && styles.inputWrapperError]}>
                <Receipt size={18} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  ref={nifRef}
                  style={styles.textInput}
                  value={nif}
                  onChangeText={setNif}
                  keyboardType="numeric"
                  maxLength={9}
                  returnKeyType="done"
                />
              </View>
              {isNifError && <Text style={styles.hintErrorText}>{t('nifInvalid')}</Text>}
            </View>

            {/* Boas-Vindas */}
            <View style={styles.welcomePerkCard}>
              <View style={styles.perkIconWrapper}>
                <ShieldCheck size={20} color={Colors.primary} />
              </View>
              <View style={styles.perkTextCol}>
                <Text style={styles.perkTitle}>{t('welcomePerkTitle')}</Text>
                <Text style={styles.perkSubtitle}>{t('welcomePerkSub')}</Text>
              </View>
            </View>

            {/* Consentimento RGPD (Opt-in Explícito) */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setAgreeTerms(!agreeTerms)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, agreeTerms && styles.checkboxActive]}>
                {agreeTerms && <Check size={14} color={Colors.textInverse} />}
              </View>
              <Text style={styles.termsText}>
                {t('agreeTerms1')}{' '}
                <Text
                  style={styles.termsLink}
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push('/modal/termos');
                  }}
                >
                  {t('termsOfUse')}
                </Text>{' '}
                {t('andWord')}{' '}
                <Text
                  style={styles.termsLink}
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push('/modal/privacidade');
                  }}
                >
                  {t('privacyPolicy')}
                </Text>{' '}
                {t('brandSuffix')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={Colors.textInverse} />
              ) : (
                <View style={styles.submitBtnContent}>
                  <Text style={styles.submitButtonText}>{t('createAccountBtn')}</Text>
                  <ArrowRight size={18} color={Colors.textInverse} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.loginFooter}>
            <Text style={styles.loginFooterText}>{t('alreadyHaveAccount')}</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.loginFooterLink}>{t('loginLink')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de DDI */}
      <Modal
        visible={showCountryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowCountryModal(false);
          setSearchCountry('');
        }}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              setShowCountryModal(false);
              setSearchCountry('');
            }}
          />
          <View style={styles.modalCardWrapper}>
            <SafeAreaView style={styles.modalCard} edges={['bottom']}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {t('selectDdi')}
                </Text>
                <Pressable
                  style={({ pressed }) => [styles.modalCloseBtn, pressed && { opacity: 0.65 }]}
                  onPress={() => {
                    setShowCountryModal(false);
                    setSearchCountry('');
                  }}
                  hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                  accessible={true}
                  accessibilityLabel="Fechar"
                  accessibilityRole="button"
                >
                  <View pointerEvents="none">
                    <X size={20} color={Colors.text} />
                  </View>
                </Pressable>
              </View>

              <View style={styles.modalSearchWrapper}>
                <Search size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.modalSearchInput}
                  value={searchCountry}
                  onChangeText={setSearchCountry}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {searchCountry.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchCountry('')}>
                    <X size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              <FlatList
                data={filteredCountries}
                keyExtractor={(item) => `${item.code}-${item.dial_code}`}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isSelected =
                    selectedCountry.code === item.code &&
                    selectedCountry.dial_code === item.dial_code;

                  return (
                    <TouchableOpacity
                      style={[styles.countryRow, isSelected && styles.countryRowActive]}
                      onPress={() => {
                        setSelectedCountry(item);
                        setShowCountryModal(false);
                        setSearchCountry('');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.countryRowFlag}>{item.flag}</Text>
                      <Text style={styles.countryRowName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.countryRowDial}>{item.dial_code}</Text>
                      {isSelected && (
                        <Check size={18} color={Colors.primary} style={{ marginLeft: 8 }} />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.card,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: 14,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
    flex: 1,
    marginHorizontal: 10,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: Colors.card,
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
  fieldGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  requiredTag: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '600',
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
  inputWrapperError: {
    borderColor: Colors.danger,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
    height: '100%',
  },
  atBadge: {
    backgroundColor: Colors.primarySoft,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
  },
  atBadgeText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  validCheckIcon: {
    marginLeft: 6,
  },
  checkingText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  liveAvailablePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  liveAvailableText: {
    color: Colors.success,
    fontSize: 11,
    fontWeight: '700',
  },
  liveErrorPill: {
    backgroundColor: Colors.dangerLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  liveErrorText: {
    color: Colors.danger,
    fontSize: 11,
    fontWeight: '700',
  },
  hintErrorText: {
    color: Colors.danger,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countryCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 48,
  },
  countryFlag: {
    fontSize: 16,
  },
  countryCodeText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  digitsValidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  digitsValidText: {
    color: Colors.success,
    fontSize: 11,
    fontWeight: '700',
  },
  eyeButton: {
    padding: 6,
  },
  strengthText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  strengthBarRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  bonusPointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.goldLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  bonusPointsText: {
    color: Colors.goldDark,
    fontSize: 10,
    fontWeight: '800',
  },
  welcomePerkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 12,
    marginVertical: 10,
  },
  perkIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkTextCol: {
    flex: 1,
  },
  perkTitle: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  perkSubtitle: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 15,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 6,
    marginBottom: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    backgroundColor: Colors.card,
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
  },
  termsText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  submitButton: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: Colors.textInverse,
    fontSize: 15,
    fontWeight: '800',
  },
  loginFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
  },
  loginFooterText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  loginFooterLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(40, 20, 45, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCardWrapper: {
    height: '78%',
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalCard: {
    flex: 1,
    backgroundColor: Colors.card,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
    flex: 1,
    marginRight: 12,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSearchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  modalSearchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  countryRowActive: {
    backgroundColor: Colors.primarySurface,
  },
  countryRowFlag: {
    fontSize: 20,
    marginRight: 10,
  },
  countryRowName: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  countryRowDial: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '700',
  },
});
