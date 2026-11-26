import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { api } from '@/services/api';
import { useAuth } from './useAuth';
import { authStorage } from '@/services/authStorage';

export interface StoreTenant {
  id: string;
  name: string;
  slug: string;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  openingHours?: Record<string, { open: string; close: string; closed?: boolean }> | null;
  aboutText?: string | null;
  instagramUrl?: string | null;
  googleMapsUrl?: string | null;
  isHeadquarters?: boolean;
  active: boolean;
}

function extractCoordsFromMapsUrl(url?: string | null): { latitude: number; longitude: number } | null {
  if (!url) return null;
  // Padrões comuns Google Maps: @40.1508,-8.8564 ou q=40.1508,-8.8564
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return { latitude: parseFloat(atMatch[1]), longitude: parseFloat(atMatch[2]) };
  }
  const qMatch = url.match(/[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) {
    return { latitude: parseFloat(qMatch[1]), longitude: parseFloat(qMatch[2]) };
  }
  return null;
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function cleanStoreDisplayName(rawName?: string | null): string {
  if (!rawName) return '';
  return rawName
    .replace(/\s*\((?:matriz|franquia|filial[^)]*)\)\s*/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function getStoreShortLabel(store?: StoreTenant | null): string {
  if (!store) return '';
  if (store.city?.trim()) return store.city.trim();
  return cleanStoreDisplayName(store.name).replace(/^Loja\s*\d+\s*-\s*/i, '').trim();
}

export function useStores() {
  const { activeStoreId, setActiveStoreId } = useAuth();
  const [distanceByStoreId, setDistanceByStoreId] = useState<Record<string, number>>({});
  const [isGpsDetected, setIsGpsDetected] = useState(false);

  const tenantsQuery = useQuery({
    queryKey: ['tenants', 'cashbackOnly'],
    queryFn: async () => {
      const res = await api.get('/api/tenants', { params: { cashbackOnly: 'true' } });
      const list = (res.data?.tenants || []) as StoreTenant[];
      return list
        .filter((t) => t.active !== false)
        .map((t) => ({
          ...t,
          name: cleanStoreDisplayName(t.name),
        }));
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 30,
    refetchOnWindowFocus: true,
  });

  const stores = tenantsQuery.data || [];

  // Define loja inicial dinamicamente se ainda não houver seleção guardada
  useEffect(() => {
    if (!stores.length) return;
    const exists = activeStoreId && stores.some((s) => s.id === activeStoreId);
    if (!exists) {
      const defaultStore = stores.find((s) => s.isHeadquarters) || stores[0];
      if (defaultStore) {
        setActiveStoreId(defaultStore.id);
      }
    }
  }, [stores, activeStoreId, setActiveStoreId]);

  // Deteção de loja mais próxima por GPS (opcional e não-bloqueante)
  useEffect(() => {
    if (!stores.length) return;
    let mounted = true;

    async function detectGpsDistances() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || !mounted) return;

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!loc?.coords || !mounted) return;

        const { latitude, longitude } = loc.coords;
        const distances: Record<string, number> = {};
        let closestStore: StoreTenant | null = null;
        let minDistance = Infinity;

        for (const store of stores) {
          let coords = extractCoordsFromMapsUrl(store.googleMapsUrl);
          if (!coords && (store.address || store.city)) {
            try {
              const queryAddress = [store.address, store.city, 'Portugal'].filter(Boolean).join(', ');
              const geo = await Location.geocodeAsync(queryAddress);
              if (geo?.[0]) {
                coords = { latitude: geo[0].latitude, longitude: geo[0].longitude };
              }
            } catch {
              // Ignora falha de geocoding individual
            }
          }

          if (coords) {
            const dist = getDistanceKm(latitude, longitude, coords.latitude, coords.longitude);
            distances[store.id] = dist;
            if (dist < minDistance) {
              minDistance = dist;
              closestStore = store;
            }
          }
        }

        if (!mounted) return;
        if (Object.keys(distances).length > 0) {
          setDistanceByStoreId(distances);
          setIsGpsDetected(true);
        }

        // Só auto-seleciona a loja mais próxima se o utilizador ainda não escolheu manualmente uma loja
        const manuallySaved = await authStorage.getActiveStoreId();
        if (!manuallySaved && closestStore && mounted) {
          setActiveStoreId(closestStore.id);
        }
      } catch {
        // Fallback silencioso
      }
    }

    detectGpsDistances();
    return () => {
      mounted = false;
    };
  }, [stores.length]);

  const activeStore = useMemo(() => {
    if (!stores.length) return null;
    return (
      stores.find((s) => s.id === activeStoreId) ||
      stores.find((s) => s.isHeadquarters) ||
      stores[0]
    );
  }, [stores, activeStoreId]);

  const nearestStore = useMemo(() => {
    if (!isGpsDetected || !stores.length) return null;
    let best: StoreTenant | null = null;
    let bestDist = Infinity;
    for (const s of stores) {
      const d = distanceByStoreId[s.id];
      if (d !== undefined && d < bestDist) {
        bestDist = d;
        best = s;
      }
    }
    return best;
  }, [stores, distanceByStoreId, isGpsDetected]);

  return {
    stores,
    activeStore,
    activeStoreId: activeStore?.id || activeStoreId,
    nearestStore,
    distanceByStoreId,
    activeDistanceKm: activeStore ? distanceByStoreId[activeStore.id] ?? null : null,
    isGpsDetected,
    isLoading: tenantsQuery.isLoading,
    isError: tenantsQuery.isError,
    refetch: tenantsQuery.refetch,
  };
}
