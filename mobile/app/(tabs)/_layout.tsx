import React from 'react';
import { Tabs, Redirect, useRouter, useSegments } from 'expo-router';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Home, Gift, User } from 'lucide-react-native';
import { GlobalHeader } from '@/components/GlobalHeader';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';

const VISIBLE_TABS = new Set(['index', 'premios', 'perfil']);

function MinimalistFloatingTabBar({
  state,
  descriptors,
  navigation,
  bottomInset,
}: any) {
  const router = useRouter();
  const visibleRoutes = (state?.routes || []).filter((r: any) => VISIBLE_TABS.has(r.name));

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: Math.max(bottomInset, 12),
        alignItems: 'center',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 8,
          paddingVertical: 6,
          borderRadius: 999,
          backgroundColor: Colors.card,
          borderWidth: 1,
          borderColor: Colors.border,
          shadowColor: Colors.primaryDark,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.1,
          shadowRadius: 14,
          elevation: 8,
        }}
      >
        {visibleRoutes.map((route: any) => {
          const options = descriptors?.[route.key]?.options || {};
          const label = options.title ?? route.name;
          const isFocused = state?.routes?.[state?.index]?.key === route.key;
          const color = isFocused ? Colors.primary : Colors.textMuted;

          const IconComp =
            route.name === 'index'
              ? Home
              : route.name === 'premios'
              ? Gift
              : User;

          const targetPath =
            route.name === 'index' ? '/(tabs)' : `/(tabs)/${route.name}`;

          const onPress = () => {
            if (isFocused) return;
            if (typeof navigation?.navigate === 'function') {
              navigation.navigate(route.name);
            } else {
              router.navigate(targetPath as any);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              activeOpacity={0.75}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingHorizontal: isFocused ? 16 : 14,
                paddingVertical: 9,
                borderRadius: 999,
                backgroundColor: isFocused ? Colors.primarySoft : 'transparent',
              }}
            >
              <IconComp size={18} color={color} strokeWidth={isFocused ? 2.4 : 1.9} />
              {isFocused ? (
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '800',
                    color: Colors.primary,
                  }}
                >
                  {label}
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const segments = useSegments() as string[];
  const activeRoute = segments[1];
  const showGlobalHeader = activeRoute !== 'perfil' && activeRoute !== 'editar-perfil';

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: Colors.background,
        }}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      {showGlobalHeader ? <GlobalHeader /> : null}

      <View style={{ flex: 1 }}>
        <Tabs
          tabBar={(props) => (
            <MinimalistFloatingTabBar {...props} bottomInset={insets.bottom} />
          )}
          screenOptions={{
            headerShown: false,
          }}
        >
          <Tabs.Screen name="index" options={{ title: t('tabHome') }} />
          <Tabs.Screen name="premios" options={{ title: t('tabRewards') }} />
          <Tabs.Screen name="perfil" options={{ title: t('tabProfile') }} />

          {/* Sub-páginas dentro do mesmo layout com topo e menu inferior fixos */}
          <Tabs.Screen
            name="ementa"
            options={{ tabBarItemStyle: { display: 'none' }, tabBarButton: () => null }}
          />
          <Tabs.Screen
            name="extrato"
            options={{ tabBarItemStyle: { display: 'none' }, tabBarButton: () => null }}
          />
          <Tabs.Screen
            name="lojas"
            options={{ tabBarItemStyle: { display: 'none' }, tabBarButton: () => null }}
          />
          <Tabs.Screen
            name="editar-perfil"
            options={{ tabBarItemStyle: { display: 'none' }, tabBarButton: () => null }}
          />
          <Tabs.Screen
            name="voucher"
            options={{ tabBarItemStyle: { display: 'none' }, tabBarButton: () => null }}
          />
          <Tabs.Screen
            name="termos"
            options={{ tabBarItemStyle: { display: 'none' }, tabBarButton: () => null }}
          />
          <Tabs.Screen
            name="privacidade"
            options={{ tabBarItemStyle: { display: 'none' }, tabBarButton: () => null }}
          />
          <Tabs.Screen
            name="convidar"
            options={{ tabBarItemStyle: { display: 'none' }, tabBarButton: () => null }}
          />
        </Tabs>
      </View>
    </SafeAreaView>
  );
}
