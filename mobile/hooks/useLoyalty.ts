import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuth } from './useAuth';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  image_url?: string | null;
  tenant_id: string | null;
  created_at: string;
}

export interface CampaignItem {
  id: string;
  tenant_id?: string | null;
  campaign_type: 'MULTIPLIER' | 'HIGHLIGHT' | 'AD';
  title: string;
  subtitle?: string | null;
  description?: string | null;
  content?: string | null;
  multiplier: number;
  banner_url: string | null;
  link_url?: string | null;
  start_date?: string;
  end_date?: string;
}

export interface RewardItem {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  category: string;
  image_url: string | null;
  preco_base?: number | null;
  weight_grams?: number | null;
}

export interface VoucherItem {
  id: string;
  voucher_code: string;
  status: 'ACTIVE' | 'REDEEMED' | 'EXPIRED' | 'REFUNDED';
  expires_at: string;
  redeemed_at: string | null;
  reward?: {
    name: string;
    points_cost: number;
    category: string;
    image_url: string | null;
  };
}

export interface TransactionItem {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  points: number;
  description: string;
  status: string;
  created_at: string;
  tenant_id?: string;
  tenant_name?: string | null;
  tenant_city?: string | null;
}

export function useLoyalty() {
  const queryClient = useQueryClient();
  const { activeStoreId, isAuthenticated, customer, updatePointsBalance } = useAuth();
  const [redeemingRewardId, setRedeemingRewardId] = useState<string | null>(null);

  // 1. Catálogo de Prémios Ativos da loja selecionada
  const rewardsQuery = useQuery({
    queryKey: ['loyalty_rewards', activeStoreId],
    queryFn: async () => {
      const res = await api.get('/api/loyalty/rewards', {
        params: activeStoreId ? { tenantId: activeStoreId } : undefined,
      });
      return res.data as {
        rewards: RewardItem[];
        campaign: {
          title: string;
          multiplier: number;
          description?: string | null;
          banner_url: string | null;
        } | null;
        campaigns?: CampaignItem[];
        referral?: {
          enabled: boolean;
          bonus_points: number;
        };
      };
    },
    staleTime: 1000 * 10,
    refetchInterval: 1000 * 30,
    refetchOnWindowFocus: true,
  });

  // 2. Vouchers do Cliente (só quando autenticado)
  const vouchersQuery = useQuery({
    queryKey: ['loyalty_vouchers', customer?.id],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await api.get('/api/loyalty/vouchers');
      return (res.data?.vouchers || []) as VoucherItem[];
    },
    staleTime: 1000 * 5,
    refetchInterval: isAuthenticated ? 1000 * 8 : false,
    refetchOnWindowFocus: true,
  });

  // 3. Extrato de Transações (só quando autenticado)
  const transactionsQuery = useQuery({
    queryKey: ['loyalty_transactions', customer?.id],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await api.get('/api/loyalty/transactions', {
        params: { limit: 50 },
      });
      if (res.data?.balance !== undefined) {
        updatePointsBalance(res.data.balance);
      }
      return {
        balance: res.data?.balance ?? 0,
        transactions: (res.data?.transactions || []) as TransactionItem[],
      };
    },
    staleTime: 1000 * 5,
    refetchInterval: isAuthenticated ? 1000 * 8 : false,
    refetchOnWindowFocus: true,
  });

  // 4. Notificações / Avisos da Franqueadora (funciona também no Expo Go via notificação local + banner)
  const notificationsQuery = useQuery({
    queryKey: ['loyalty_notifications', customer?.id, activeStoreId],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await api.get('/api/loyalty/notifications', {
        params: activeStoreId ? { tenantId: activeStoreId } : undefined,
      });
      return (res.data?.notifications || []) as NotificationItem[];
    },
    staleTime: 1000 * 5,
    refetchInterval: isAuthenticated ? 1000 * 10 : false,
    refetchOnWindowFocus: true,
  });

  const lastNotifiedIdRef = useRef<string | null>(null);
  const notificationsList = notificationsQuery.data || [];

  useEffect(() => {
    const latest = notificationsList[0];
    if (!latest) return;

    if (lastNotifiedIdRef.current === null) {
      // Primeira carga: marca como visto sem disparar spam de notificações antigas
      lastNotifiedIdRef.current = latest.id;
      return;
    }

    if (lastNotifiedIdRef.current !== latest.id) {
      lastNotifiedIdRef.current = latest.id;
      if (Platform.OS !== 'web') {
        (async () => {
          try {
            const Notifications = await import('expo-notifications');
            const { status } = await Notifications.getPermissionsAsync();
            let granted = status === 'granted';
            if (!granted) {
              const req = await Notifications.requestPermissionsAsync();
              granted = req.status === 'granted';
            }
            if (granted) {
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: latest.title,
                  body: latest.body,
                  sound: true,
                },
                trigger: null,
              });
            }
          } catch {}
        })();
      }
    }
  }, [notificationsList]);

  // 5. Mutação de Resgate de Prêmio
  const redeemMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      setRedeemingRewardId(rewardId);
      const res = await api.post('/api/loyalty/rewards/redeem', {
        reward_id: rewardId,
        tenant_id: activeStoreId || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty_vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty_transactions'] });
    },
    onSettled: () => {
      setRedeemingRewardId(null);
    },
  });

  const allVouchers = vouchersQuery.data || [];
  const activeVouchers = allVouchers.filter(
    (v) => v.status === 'ACTIVE' && new Date(v.expires_at) > new Date()
  );

  return {
    rewards: rewardsQuery.data?.rewards || [],
    campaign: rewardsQuery.data?.campaign || null,
    campaigns: rewardsQuery.data?.campaigns || [],
    referralConfig: rewardsQuery.data?.referral ?? { enabled: false, bonus_points: 10 },
    isLoadingRewards: rewardsQuery.isLoading,
    isRefetchingRewards: rewardsQuery.isRefetching,
    isErrorRewards: rewardsQuery.isError,
    refetchRewards: rewardsQuery.refetch,

    vouchers: allVouchers,
    activeVouchers,
    isLoadingVouchers: vouchersQuery.isLoading,
    isRefetchingVouchers: vouchersQuery.isRefetching,
    isErrorVouchers: vouchersQuery.isError,
    refetchVouchers: vouchersQuery.refetch,

    transactions: transactionsQuery.data?.transactions || [],
    balance: transactionsQuery.data?.balance ?? customer?.points_balance ?? 0,
    isLoadingTransactions: transactionsQuery.isLoading,
    isRefetchingTransactions: transactionsQuery.isRefetching,
    isErrorTransactions: transactionsQuery.isError,
    refetchTransactions: transactionsQuery.refetch,

    notifications: notificationsList,
    refetchNotifications: notificationsQuery.refetch,

    redeemReward: redeemMutation.mutateAsync,
    isRedeeming: redeemMutation.isPending,
    redeemingRewardId,
  };
}
