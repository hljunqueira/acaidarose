import axios, { AxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { authStorage } from './authStorage';

function resolveApiBaseUrl(): string {
  const envUrl = (process.env.EXPO_PUBLIC_API_URL || '').trim();
  const isLocalEnvUrl =
    !envUrl ||
    /^http:\/\/(localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(envUrl);

  // Em modo de desenvolvimento (Expo Go / LAN), usa automaticamente o IP atual do Metro na porta 3000
  // evitando quebra quando o IP do Wi-Fi do PC muda
  if (__DEV__ && isLocalEnvUrl) {
    const hostUri =
      Constants.expoConfig?.hostUri ||
      (Constants as any)?.manifest2?.extra?.expoGo?.debuggerHost ||
      (Constants as any)?.manifest?.debuggerHost ||
      '';
    const metroHost = String(hostUri).split(':')[0]?.trim();
    if (metroHost && metroHost !== 'localhost' && metroHost !== '127.0.0.1') {
      return `http://${metroHost}:3000`;
    }
  }

  return envUrl || 'http://localhost:3000';
}

export const API_BASE_URL = resolveApiBaseUrl();

export function resolveMediaUrl(url?: string | null): string | null {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('file://')
  ) {
    return trimmed;
  }
  return `${API_BASE_URL}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'User-Agent': 'AcaidaRose-MobileApp/1.0.0',
  },
});

let sessionExpiredHandler: (() => void) | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function registerSessionExpiredHandler(cb: () => void) {
  sessionExpiredHandler = cb;
}

async function performTokenRefresh(): Promise<string | null> {
  const refreshToken = await authStorage.getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const res = await axios.post(
      `${API_BASE_URL}/api/loyalty/auth/refresh`,
      { refreshToken },
      {
        timeout: 12000,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'AcaidaRose-MobileApp/1.0.0',
        },
      }
    );

    const { accessToken, refreshToken: newRefreshToken, customer } = res.data || {};
    if (!accessToken || !newRefreshToken) {
      return null;
    }

    await authStorage.saveTokens(accessToken, newRefreshToken);
    if (customer) {
      await authStorage.saveCustomerData(customer);
    }
    return accessToken;
  } catch {
    return null;
  }
}

// Interceptor para injetar o Access Token automaticamente
api.interceptors.request.use(async (config) => {
  const token = await authStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de resposta com rotação silenciosa de Refresh Token em 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url || '';

    const isAuthRoute =
      requestUrl.includes('/api/loyalty/auth/login') ||
      requestUrl.includes('/api/loyalty/auth/register') ||
      requestUrl.includes('/api/loyalty/auth/refresh');

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = performTokenRefresh().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;
      if (newToken) {
        originalRequest.headers = {
          ...(originalRequest.headers || {}),
          Authorization: `Bearer ${newToken}`,
        };
        return api(originalRequest);
      }

      await authStorage.clearSession();
      sessionExpiredHandler?.();
    }

    return Promise.reject(error);
  }
);
