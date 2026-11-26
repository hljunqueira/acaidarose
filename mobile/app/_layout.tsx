import React, { useEffect } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

function extractReferralFromUrl(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/convite\/([A-Za-z0-9_-]+)/i);
  if (match?.[1]) {
    return match[1].toUpperCase();
  }
  const parsed = Linking.parse(url);
  const queryRef = parsed.queryParams?.ref;
  if (typeof queryRef === 'string' && queryRef.trim()) {
    return queryRef.trim().toUpperCase();
  }
  return null;
}

export default function RootLayout() {
  const router = useRouter();
  const { loadSession } = useAuth();
  const { loadLanguage } = useLanguage();

  useEffect(() => {
    loadSession();
    loadLanguage();

    // Configura apresentação de notificações push em primeiro plano + canal Android
    if (Platform.OS !== 'web') {
      (async () => {
        try {
          const Notifications = await import('expo-notifications');
          Notifications.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowAlert: true,
              shouldPlaySound: true,
              shouldSetBadge: false,
              shouldShowBanner: true,
              shouldShowList: true,
            }),
          });
          if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
              name: 'Açaí da Rose Cashback',
              importance: Notifications.AndroidImportance.HIGH,
              vibrationPattern: [0, 250, 250, 250],
              lightColor: '#7C1D7E',
            });
          }
        } catch {
          // Ignora em ambientes sem suporte nativo a notificações
        }
      })();
    }
  }, []);

  // Sincroniza foco da app com React Query (ao voltar do background invalida/atualiza queries)
  useEffect(() => {
    const onAppStateChange = (status: AppStateStatus) => {
      if (Platform.OS !== 'web') {
        focusManager.setFocused(status === 'active');
      }
      if (status === 'active') {
        queryClient.invalidateQueries({ queryKey: ['loyalty_vouchers'] });
        queryClient.invalidateQueries({ queryKey: ['loyalty_transactions'] });
        queryClient.invalidateQueries({ queryKey: ['loyalty_rewards'] });
        queryClient.invalidateQueries({ queryKey: ['tenants'] });
      }
    };
    const sub = AppState.addEventListener('change', onAppStateChange);
    return () => sub.remove();
  }, []);

  // Deep linking para links de convite (https://acaidarose.pt/convite/:code ou acaidarose://convite/:code)
  useEffect(() => {
    const handleIncomingUrl = (url: string | null) => {
      const refCode = extractReferralFromUrl(url);
      if (refCode && !useAuth.getState().isAuthenticated) {
        router.push({ pathname: '/(auth)/registo', params: { ref: refCode } });
      }
    };

    Linking.getInitialURL().then(handleIncomingUrl).catch(() => { });
    const sub = Linking.addEventListener('url', (event) => handleIncomingUrl(event.url));
    return () => sub.remove();
  }, [router]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal/qrcode"
            options={{ presentation: 'modal', gestureEnabled: true, headerShown: false }}
          />
          <Stack.Screen
            name="modal/voucher"
            options={{ presentation: 'modal', gestureEnabled: true, headerShown: false }}
          />
          <Stack.Screen
            name="modal/lojas"
            options={{ presentation: 'modal', gestureEnabled: true, headerShown: false }}
          />
          <Stack.Screen
            name="modal/ementa"
            options={{ presentation: 'modal', gestureEnabled: true, headerShown: false }}
          />
          <Stack.Screen
            name="modal/editar-perfil"
            options={{ presentation: 'modal', gestureEnabled: true, headerShown: false }}
          />
          <Stack.Screen
            name="modal/termos"
            options={{ presentation: 'modal', gestureEnabled: true, headerShown: false }}
          />
          <Stack.Screen
            name="modal/privacidade"
            options={{ presentation: 'modal', gestureEnabled: true, headerShown: false }}
          />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
