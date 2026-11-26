import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface CatalogMenu {
  id: string;
  name: string;
  nameEn?: string | null;
  nameEs?: string | null;
  code?: string;
  description?: string | null;
  displayOrder?: number;
  active: boolean;
}

export interface CatalogCategory {
  id: string;
  name: string;
  nameEn?: string | null;
  nameEs?: string | null;
  slug: string;
  menuId?: string | null;
  displayOrder?: number;
  active: boolean;
}

export interface CatalogOptionItem {
  id?: string;
  name: string;
  nameEn?: string | null;
  nameEs?: string | null;
  price?: number;
  active?: boolean;
}

export interface CatalogOptionGroup {
  id?: string;
  name: string;
  nameEn?: string | null;
  nameEs?: string | null;
  subtitle?: string | null;
  subtitleEn?: string | null;
  subtitleEs?: string | null;
  maxQty?: number;
  additionalPrice?: number;
  active?: boolean;
  options?: CatalogOptionItem[];
}

export interface CatalogContainer {
  id: string;
  name: string;
  nameEn?: string | null;
  nameEs?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  descriptionEs?: string | null;
  weightGrams?: number | null;
  precoBase: number;
  image?: string | null;
  videoUrl?: string | null;
  videoPoster?: string | null;
  displayOrder?: number;
  active: boolean;
  isAvailableInStore?: boolean;
  isCategoryPaused?: boolean;
  categoryName?: string;
  categoryId?: string | null;
  menuId?: string | null;
  optionGroups?: CatalogOptionGroup[];
}

export interface CatalogResponse {
  menus: CatalogMenu[];
  categories: CatalogCategory[];
  containers: CatalogContainer[];
  tenantId: string;
  tenantName: string;
  tenantOpeningHours?: Record<string, { open: string; close: string; closed?: boolean }> | null;
}

export function useMenu(tenantId?: string | null) {
  return useQuery({
    queryKey: ['store_menu', tenantId || 'default'],
    queryFn: async () => {
      const res = await api.get('/api/products', {
        params: tenantId ? { loja: tenantId } : undefined,
      });
      return res.data as CatalogResponse;
    },
    staleTime: 1000 * 60 * 3,
    retry: 2,
  });
}
