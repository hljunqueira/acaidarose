import * as SecureStore from 'expo-secure-store';

const KEY_ACCESS_TOKEN = 'rose_access_token';
const KEY_REFRESH_TOKEN = 'rose_refresh_token';
const KEY_CUSTOMER_DATA = 'rose_customer_data';
const KEY_ACTIVE_STORE_ID = 'rose_active_store_id';
const KEY_BIOMETRIC_ENABLED = 'rose_biometric_enabled';
const KEY_APP_LANGUAGE = 'rose_app_language';

export const authStorage = {
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(KEY_ACCESS_TOKEN, accessToken);
      await SecureStore.setItemAsync(KEY_REFRESH_TOKEN, refreshToken);
    } catch (e) {
      console.warn('Erro ao salvar tokens no SecureStore:', e);
    }
  },

  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(KEY_ACCESS_TOKEN);
    } catch {
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(KEY_REFRESH_TOKEN);
    } catch {
      return null;
    }
  },

  async saveCustomerData(customer: any): Promise<void> {
    try {
      await SecureStore.setItemAsync(KEY_CUSTOMER_DATA, JSON.stringify(customer));
    } catch (e) {
      console.warn('Erro ao salvar dados do cliente:', e);
    }
  },

  async getCustomerData(): Promise<any | null> {
    try {
      const data = await SecureStore.getItemAsync(KEY_CUSTOMER_DATA);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async saveActiveStoreId(tenantId: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(KEY_ACTIVE_STORE_ID, tenantId);
    } catch (e) {
      console.warn('Erro ao salvar loja ativa:', e);
    }
  },

  async getActiveStoreId(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(KEY_ACTIVE_STORE_ID);
    } catch {
      return null;
    }
  },

  async saveBiometricEnabled(enabled: boolean): Promise<void> {
    try {
      await SecureStore.setItemAsync(KEY_BIOMETRIC_ENABLED, enabled ? '1' : '0');
    } catch (e) {
      console.warn('Erro ao salvar preferência biométrica:', e);
    }
  },

  async getBiometricEnabled(): Promise<boolean> {
    try {
      const val = await SecureStore.getItemAsync(KEY_BIOMETRIC_ENABLED);
      return val === '1';
    } catch {
      return false;
    }
  },

  async saveLanguage(lang: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(KEY_APP_LANGUAGE, lang);
    } catch {}
  },

  async getLanguage(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(KEY_APP_LANGUAGE);
    } catch {
      return null;
    }
  },

  async clearSession(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(KEY_ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(KEY_REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(KEY_CUSTOMER_DATA);
    } catch (e) {
      console.warn('Erro ao limpar sessão:', e);
    }
  },
};
