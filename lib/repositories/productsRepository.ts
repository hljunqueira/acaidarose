import { CatalogData, ProductContainer, ProductBase, ProductTopping } from '@/types'
import { supabaseServer } from '@/lib/supabase/server'
import { getMockStore, DEFAULT_TENANT } from '@/lib/supabase/mockStore'
import { v4 as uuidv4 } from 'uuid'

export async function getCatalogByTenant(tenantId: string = DEFAULT_TENANT.id): Promise<CatalogData> {
  const store = getMockStore()
  const overrides = (store.storeProductOverrides || {})[tenantId] || {}
  const priceOverrides = ((store as any).storePriceOverrides || {})[tenantId] || {}

  const mapItemAvailability = (item: any) => {
    const isOverrideSet = overrides[item.id] !== undefined
    const isAvailableInStore = isOverrideSet ? overrides[item.id] : (item.active !== false)
    const customPrice =
      priceOverrides[item.id] ??
      priceOverrides[item.id.replace('cnt-', 'cont-')] ??
      priceOverrides[item.id.replace('cont-', 'cnt-')]
    return {
      ...item,
      isAvailableInStore,
      ...(customPrice !== undefined
        ? { precoBase: customPrice, price: customPrice, precoCobrado: customPrice }
        : {}),
    }
  }

  const rawContainers = store.containers.filter((c: any) => !c.tenantId || c.tenantId === tenantId)
  const rawBases = store.bases.filter((b: any) => !b.tenantId || b.tenantId === tenantId)
  const rawToppings = store.toppings.filter((t: any) => !t.tenantId || t.tenantId === tenantId)

  return {
    containers: rawContainers.map(mapItemAvailability),
    bases: rawBases.map(mapItemAvailability),
    toppings: rawToppings.map(mapItemAvailability),
  }
}

export async function setStoreProductPrice(
  tenantId: string,
  productId: string,
  newPrice: number
): Promise<{ success: boolean; tenantId: string; productId: string; newPrice: number }> {
  const store = getMockStore() as any
  if (!store.storePriceOverrides) {
    store.storePriceOverrides = {}
  }
  if (!store.storePriceOverrides[tenantId]) {
    store.storePriceOverrides[tenantId] = {}
  }
  const val = Number(newPrice)
  store.storePriceOverrides[tenantId][productId] = val
  if (productId.startsWith('cnt-')) {
    store.storePriceOverrides[tenantId][productId.replace('cnt-', 'cont-')] = val
  } else if (productId.startsWith('cont-')) {
    store.storePriceOverrides[tenantId][productId.replace('cont-', 'cnt-')] = val
  }

  const matching = store.containers.find((c: any) =>
    c.id === productId ||
    (productId.includes('500') && c.weightGrams === 500) ||
    (productId.includes('750') && c.weightGrams === 750) ||
    (productId.includes('700') && c.weightGrams === 750) ||
    (productId.includes('350') && c.weightGrams === 350) ||
    (productId.includes('250') && c.weightGrams === 250) ||
    (productId.includes('1000') && c.weightGrams === 1000)
  )
  if (matching) {
    store.storePriceOverrides[tenantId][matching.id] = val
  }

  return { success: true, tenantId, productId, newPrice: val }
}

export async function toggleStoreItemAvailability(
  tenantId: string,
  productId: string,
  available: boolean
): Promise<{ success: boolean; tenantId: string; productId: string; available: boolean }> {
  const store = getMockStore()
  if (!store.storeProductOverrides[tenantId]) {
    store.storeProductOverrides[tenantId] = {}
  }
  store.storeProductOverrides[tenantId][productId] = available
  return { success: true, tenantId, productId, available }
}

export async function syncAllStoresCatalog(): Promise<{
  success: boolean
  totalStores: number
  syncedAt: string
  itemsCount: { containers: number; bases: number; toppings: number }
}> {
  const store = getMockStore()
  store.tenants.forEach((t) => {
    if (!store.storeProductOverrides[t.id]) {
      store.storeProductOverrides[t.id] = {}
    }
  })

  const syncedAt = new Date().toISOString()
  store.auditLogs = store.auditLogs || []
  store.auditLogs.unshift({
    id: 'log-' + Date.now(),
    tenantId: 'tenant-torres-novas',
    user: 'super@acairose.pt',
    action: 'SINCRONIZACAO_CARDAPIO',
    details: `Replicação Master disparada para ${store.tenants.length} unidades (${store.containers.length} copos, ${store.bases.length} bases, ${store.toppings.length} complementos)`,
    timestamp: syncedAt,
  })

  return {
    success: true,
    totalStores: store.tenants.length,
    syncedAt,
    itemsCount: {
      containers: store.containers.length,
      bases: store.bases.length,
      toppings: store.toppings.length,
    },
  }
}

export async function createProductItem(category: 'containers' | 'bases' | 'toppings', item: any): Promise<any> {
  const store = getMockStore()
  const doc = {
    ...item,
    id: item.id || uuidv4(),
    active: item.active !== undefined ? item.active : true,
    displayOrder: Number(item.displayOrder) || 0,
  }

  if (category === 'containers') store.containers.push(doc)
  else if (category === 'bases') store.bases.push(doc)
  else if (category === 'toppings') store.toppings.push(doc)

  return doc
}

export async function updateProductItem(category: 'containers' | 'bases' | 'toppings', id: string, item: any): Promise<any> {
  const store = getMockStore()
  let list: any[] = []
  if (category === 'containers') list = store.containers
  else if (category === 'bases') list = store.bases
  else if (category === 'toppings') list = store.toppings

  const idx = list.findIndex((x) => x.id === id)
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...item }
    return list[idx]
  }
  return null
}

export async function deleteProductItem(category: 'containers' | 'bases' | 'toppings', id: string): Promise<boolean> {
  const store = getMockStore()
  if (category === 'containers') store.containers = store.containers.filter((x: any) => x.id !== id)
  else if (category === 'bases') store.bases = store.bases.filter((x: any) => x.id !== id)
  else if (category === 'toppings') store.toppings = store.toppings.filter((x: any) => x.id !== id)
  return true
}
