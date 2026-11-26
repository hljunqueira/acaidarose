import { create } from 'zustand';
import { Platform } from 'react-native';
import { authStorage } from '@/services/authStorage';
import { api, registerSessionExpiredHandler } from '@/services/api';
import * as LocalAuthentication from 'expo-local-authentication';

export interface CustomerState {
  id: string;
  name: string;
  username: string;
  phone: string;
  email: string | null;
  nif?: string | null;
  birth_date?: string | null;
  points_balance: number;
  referral_code: string;
  referrals_count?: number;
  avatar_url: string | null;
  tenant_id: string | null;
}

export interface UpdateProfileInput {
  name?: string;
  email?: string | null;
  nif?: string | null;
  birth_date?: string | null;
  tenant_id?: string | null;
  avatar_url?: string | null;
  current_password?: string;
  new_password?: string;
}

interface AuthStore {
  customer: CustomerState | null;
  activeStoreId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  biometricEnabled: boolean;
  hasStoredSessionForBiometric: boolean;
  login: (login: string, pass: string) => Promise<void>;
  register: (
    phoneOrData:
      | string
      | {
          phone: string;
          name: string;
          pass: string;
          username?: string;
          nif?: string;
          referralCode?: string;
        },
    name?: string,
    pass?: string,
    referralCode?: string,
    username?: string,
    nif?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  forceLogout: () => void;
  loadSession: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: UpdateProfileInput) => Promise<CustomerState>;
  uploadAvatar: (base64: string, mimeType: string) => Promise<CustomerState>;
  removeAvatar: () => Promise<CustomerState>;
  deleteAccount: () => Promise<void>;
  loginBiometric: () => Promise<boolean>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  setActiveStoreId: (tenantId: string) => Promise<void>;
  updatePointsBalance: (newBalance: number) => void;
}

async function registerDevicePushToken(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const Constants = (await import('expo-constants')).default;
    if (
      Constants?.appOwnership === 'expo' ||
      (Constants as any)?.executionEnvironment === 'storeClient'
    ) {
      return;
    }

    const Notifications = await import('expo-notifications');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      (Constants as any).easConfig?.projectId;

    const tokenResponse = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    const pushToken = tokenResponse?.data;
    if (!pushToken) return;

    const pushPlatform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : null;
    await api.post('/api/loyalty/push-token', {
      push_token: pushToken,
      push_platform: pushPlatform,
    });
  } catch {
    // Falha silenciosa em simuladores / Expo Go sem suporte a push remoto
  }
}

export const useAuth = create<AuthStore>((set, get) => ({
  customer: null,
  activeStoreId: null,
  isLoading: true,
  isAuthenticated: false,
  biometricEnabled: false,
  hasStoredSessionForBiometric: false,

  forceLogout() {
    set({
      customer: null,
      isAuthenticated: false,
      hasStoredSessionForBiometric: false,
    });
  },

  async loadSession() {
    set({ isLoading: true });
    try {
      const [token, refreshToken, cachedCustomer, savedStore, bioEnabled] = await Promise.all([
        authStorage.getAccessToken(),
        authStorage.getRefreshToken(),
        authStorage.getCustomerData(),
        authStorage.getActiveStoreId(),
        authStorage.getBiometricEnabled(),
      ]);

      const resolvedStore = savedStore || cachedCustomer?.tenant_id || null;

      if (token && cachedCustomer) {
        set({
          customer: cachedCustomer,
          isAuthenticated: true,
          activeStoreId: resolvedStore,
          biometricEnabled: bioEnabled,
          hasStoredSessionForBiometric: Boolean(refreshToken && bioEnabled),
        });

        // Atualiza perfil em segundo plano e regista push token
        get().refreshProfile().catch(() => {});
        registerDevicePushToken().catch(() => {});
      } else {
        set({
          activeStoreId: resolvedStore,
          biometricEnabled: bioEnabled,
          hasStoredSessionForBiometric: Boolean(refreshToken && bioEnabled),
        });
      }
    } catch (e) {
      console.warn('Erro ao carregar sessão:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  async refreshProfile() {
    try {
      const res = await api.get('/api/loyalty/profile');
      if (res.data?.customer) {
        await authStorage.saveCustomerData(res.data.customer);
        set({ customer: res.data.customer });
      }
    } catch {
      // Tratado silenciosamente (401 dispara interceptor de refresh)
    }
  },

  async updateProfile(data: UpdateProfileInput) {
    const res = await api.patch('/api/loyalty/profile', data);
    const updated = res.data.customer as CustomerState;
    await authStorage.saveCustomerData(updated);
    set({ customer: updated });
    return updated;
  },

  async uploadAvatar(base64: string, mimeType: string) {
    const res = await api.post('/api/loyalty/avatar', {
      imageBase64: base64,
      mimeType,
    });
    const updated = res.data.customer as CustomerState;
    await authStorage.saveCustomerData(updated);
    set({ customer: updated });
    return updated;
  },

  async removeAvatar() {
    const res = await api.patch('/api/loyalty/profile', { avatar_url: null });
    const updated = res.data.customer as CustomerState;
    await authStorage.saveCustomerData(updated);
    set({ customer: updated });
    return updated;
  },

  async deleteAccount() {
    await api.delete('/api/loyalty/profile');
    await authStorage.clearSession();
    set({
      customer: null,
      isAuthenticated: false,
      hasStoredSessionForBiometric: false,
    });
  },

  async login(loginText: string, pass: string) {
    const res = await api.post('/api/loyalty/auth/login', {
      login: loginText,
      password: pass,
    });

    const { customer, accessToken, refreshToken } = res.data;
    await authStorage.saveTokens(accessToken, refreshToken);
    await authStorage.saveCustomerData(customer);

    const savedBio = await authStorage.getBiometricEnabled();
    const hasHardware = await LocalAuthentication.hasHardwareAsync().catch(() => false);
    const isEnrolled = await LocalAuthentication.isEnrolledAsync().catch(() => false);

    // Ativa biometria por defeito se o dispositivo suportar e nunca tiver sido desativada
    let bioEnabled = savedBio;
    if (!savedBio && hasHardware && isEnrolled) {
      await authStorage.saveBiometricEnabled(true);
      bioEnabled = true;
    }

    set({
      customer,
      isAuthenticated: true,
      activeStoreId: get().activeStoreId || customer.tenant_id || null,
      biometricEnabled: bioEnabled,
      hasStoredSessionForBiometric: Boolean(refreshToken && bioEnabled),
    });

    get().refreshProfile().catch(() => {});
    registerDevicePushToken().catch(() => {});
  },

  async register(
    phoneOrData:
      | string
      | {
          phone: string;
          name: string;
          pass: string;
          username?: string;
          nif?: string;
          referralCode?: string;
        },
    name?: string,
    pass?: string,
    referralCode?: string,
    username?: string,
    nif?: string
  ) {
    let payload: any = {};
    if (typeof phoneOrData === 'object') {
      payload = {
        phone: phoneOrData.phone,
        name: phoneOrData.name,
        password: phoneOrData.pass,
        username: phoneOrData.username,
        nif: phoneOrData.nif,
        referral_code: phoneOrData.referralCode,
        tenant_id: get().activeStoreId || undefined,
      };
    } else {
      payload = {
        phone: phoneOrData,
        name,
        password: pass,
        username,
        nif,
        referral_code: referralCode,
        tenant_id: get().activeStoreId || undefined,
      };
    }

    const res = await api.post('/api/loyalty/auth/register', payload);

    const { customer, accessToken, refreshToken } = res.data;
    await authStorage.saveTokens(accessToken, refreshToken);
    await authStorage.saveCustomerData(customer);

    set({
      customer,
      isAuthenticated: true,
      hasStoredSessionForBiometric: Boolean(refreshToken && get().biometricEnabled),
    });

    registerDevicePushToken().catch(() => {});
  },

  async logout() {
    const bioEnabled = get().biometricEnabled;
    if (bioEnabled) {
      // Mantém refreshToken apenas se biometria estiver ativa, mas invalida accessToken e estado ativo
      const refresh = await authStorage.getRefreshToken();
      await authStorage.clearSession();
      if (refresh) {
        await authStorage.saveTokens('', refresh);
      }
      set({
        customer: null,
        isAuthenticated: false,
        hasStoredSessionForBiometric: Boolean(refresh),
      });
    } else {
      await authStorage.clearSession();
      set({
        customer: null,
        isAuthenticated: false,
        hasStoredSessionForBiometric: false,
      });
    }
  },

  async loginBiometric(): Promise<boolean> {
    try {
      const storedRefresh = await authStorage.getRefreshToken();
      if (!storedRefresh) return false;

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) return false;

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Entra com Face ID ou Touch ID',
        fallbackLabel: 'Usar Palavra-passe',
        cancelLabel: 'Cancelar',
      });

      if (!result.success) return false;

      const res = await api.post('/api/loyalty/auth/refresh', {
        refreshToken: storedRefresh,
      });

      const { customer, accessToken, refreshToken } = res.data || {};
      if (!customer || !accessToken || !refreshToken) {
        return false;
      }

      await authStorage.saveTokens(accessToken, refreshToken);
      await authStorage.saveCustomerData(customer);

      set({
        customer,
        isAuthenticated: true,
        activeStoreId: get().activeStoreId || customer.tenant_id || null,
        hasStoredSessionForBiometric: true,
      });

      get().refreshProfile().catch(() => {});
      registerDevicePushToken().catch(() => {});
      return true;
    } catch {
      return false;
    }
  },

  async setBiometricEnabled(enabled: boolean) {
    await authStorage.saveBiometricEnabled(enabled);
    const refresh = await authStorage.getRefreshToken();
    set({
      biometricEnabled: enabled,
      hasStoredSessionForBiometric: Boolean(enabled && refresh),
    });
  },

  async setActiveStoreId(tenantId: string) {
    await authStorage.saveActiveStoreId(tenantId);
    set({ activeStoreId: tenantId });
  },

  updatePointsBalance(newBalance: number) {
    const current = get().customer;
    if (current) {
      const updated = { ...current, points_balance: newBalance };
      set({ customer: updated });
      authStorage.saveCustomerData(updated);
    }
  },
}));

registerSessionExpiredHandler(() => {
  useAuth.getState().forceLogout();
});
