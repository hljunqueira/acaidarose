'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { CatalogData } from '@/types'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import { useFranchiseStore } from '@/lib/stores/franchiseStore'
import ProductSection from './ProductSection'
import ProductEditDialog from './ProductEditDialog'
import TableQRCodeGeneratorDialog from './TableQRCodeGeneratorDialog'
import { UtensilsCrossed, RefreshCw, Store, QrCode } from 'lucide-react'

interface MenuAdminProps {
  tenantId: string
}

export default function MenuAdmin({ tenantId }: MenuAdminProps) {
  const [data, setData] = useState<CatalogData>({ containers: [], bases: [], toppings: [] })
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [editing, setEditing] = useState<{ collection: 'containers' | 'bases' | 'toppings'; item: any }>({
    collection: 'containers',
    item: null,
  })
  const { user, authFetch } = useAuthStore()
  const { currentTenant } = useFranchiseStore()

  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/products?tenantId=${encodeURIComponent(tenantId)}`)
      const d = await res.json()
      setData(d)
    } catch {
      toast.error('Erro ao carregar cardápio')
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSave = async (col: string, item: any) => {
    try {
      const res = item.id
        ? await authFetch(`/api/products/${col}/${item.id}`, { method: 'PUT', body: JSON.stringify(item) })
        : await authFetch(`/api/products/${col}`, { method: 'POST', body: JSON.stringify({ ...item, tenantId }) })
      if (!res.ok) throw new Error('Falha ao guardar')
      toast.success('Cardápio atualizado com sucesso!')
      loadData()
    } catch (e: any) {
      toast.error(e.message || 'Erro')
    }
  }

  const handleDelete = async (col: string, id: string) => {
    if (!confirm('Deseja remover este item do cardápio master?')) return
    try {
      const res = await authFetch(`/api/products/${col}/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao remover')
      toast.success('Item removido!')
      loadData()
    } catch (e: any) {
      toast.error(e.message || 'Erro')
    }
  }

  const handleToggleAvailability = async (collection: string, id: string, currentAvailable: boolean) => {
    const newStatus = !currentAvailable
    // Atualização otimista
    setData((prev) => {
      const updated = { ...prev }
      if (collection === 'containers') {
        updated.containers = updated.containers.map((x) => (x.id === id ? { ...x, isAvailableInStore: newStatus } : x))
      } else if (collection === 'bases') {
        updated.bases = updated.bases.map((x) => (x.id === id ? { ...x, isAvailableInStore: newStatus } : x))
      } else if (collection === 'toppings') {
        updated.toppings = updated.toppings.map((x) => (x.id === id ? { ...x, isAvailableInStore: newStatus } : x))
      }
      return updated
    })

    try {
      const res = await authFetch('/api/products/toggle-availability', {
        method: 'POST',
        body: JSON.stringify({
          tenantId,
          productId: id,
          available: newStatus,
        }),
      })
      if (!res.ok) throw new Error('Falha ao atualizar disponibilidade')
      toast.success(newStatus ? 'Item reativado no balcão!' : 'Item pausado / marcado como esgotado hoje.')
    } catch {
      toast.error('Erro ao alternar disponibilidade')
      loadData()
    }
  }

  const handleSyncAllStores = async () => {
    setSyncing(true)
    try {
      const res = await authFetch('/api/products/sync-all', { method: 'POST' })
      if (!res.ok) throw new Error('Erro ao sincronizar')
      toast.success('Cardápio Master sincronizado com sucesso para toda a rede!')
      loadData()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao sincronizar')
    } finally {
      setSyncing(false)
    }
  }

  // Separação de categorias de toppings
  const frutasList = data.toppings.filter((t) => t.category === 'Frutas')
  const toppingsList = data.toppings.filter((t) => t.category === 'Toppings' || t.category === 'Cereais' || t.category === 'Doces')
  const adicionaisList = data.toppings.filter((t) => t.category === 'Adicionais' || t.isSpecialAddon)

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header com Loja Ativa e Ações */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-purple-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                <span>Cardápio Oficial Açaí da Rose</span>
                <Badge variant="outline" className="text-[10px] font-extrabold bg-purple-50 text-purple-700 border-purple-200">
                  <Store className="h-3 w-3 mr-1" />
                  {currentTenant.name}
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isSuperAdmin
                  ? 'Gestão centralizada do cardápio master e disponibilidade por unidade'
                  : 'Controlo de disponibilidade de produtos (ativar / pausar esgotados) para esta loja'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão de Placas de QR Code para Mesas */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setQrDialogOpen(true)}
            className="text-xs font-bold gap-1.5 rounded-xl border-purple-200 hover:bg-purple-50 h-9"
          >
            <QrCode className="h-4 w-4 text-purple-600" />
            <span>Placas QR Code de Mesas</span>
          </Button>

          {isSuperAdmin && (
            <Button
              size="sm"
              onClick={handleSyncAllStores}
              disabled={syncing}
              className="bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs h-9 rounded-xl shadow-xs gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>Sincronizar Todas as Lojas</span>
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="containers" className="space-y-4">
        <TabsList className="bg-purple-50/80 p-1 rounded-2xl border border-purple-100">
          <TabsTrigger value="containers" className="text-xs font-bold rounded-xl data-[state=active]:bg-white data-[state=active]:text-purple-900">
            Tamanhos (250g a 1Kg)
          </TabsTrigger>
          <TabsTrigger value="bases" className="text-xs font-bold rounded-xl data-[state=active]:bg-white data-[state=active]:text-purple-900">
            Cremes Gelados (9 Opções)
          </TabsTrigger>
          <TabsTrigger value="frutas" className="text-xs font-bold rounded-xl data-[state=active]:bg-white data-[state=active]:text-purple-900">
            Frutas Frescas (5 Opções)
          </TabsTrigger>
          <TabsTrigger value="toppings" className="text-xs font-bold rounded-xl data-[state=active]:bg-white data-[state=active]:text-purple-900">
            Toppings (16 Opções)
          </TabsTrigger>
          <TabsTrigger value="adicionais" className="text-xs font-bold rounded-xl data-[state=active]:bg-white data-[state=active]:text-purple-900">
            Adicionais Especiais (Ninho/Pistache/Nutella)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="containers">
          <ProductSection
            title="Tamanhos Oficiais & Preços"
            items={data.containers}
            collection="containers"
            isSuperAdmin={isSuperAdmin}
            onNew={(c) => { setEditing({ collection: c, item: {} }); setDialogOpen(true) }}
            onEdit={(c, item) => { setEditing({ collection: c, item }); setDialogOpen(true) }}
            onDelete={handleDelete}
            onToggleAvailability={handleToggleAvailability}
          />
        </TabsContent>

        <TabsContent value="bases">
          <ProductSection
            title="Cremes Gelados (1 Opcional Incluso)"
            items={data.bases}
            collection="bases"
            isSuperAdmin={isSuperAdmin}
            onNew={(c) => { setEditing({ collection: c, item: {} }); setDialogOpen(true) }}
            onEdit={(c, item) => { setEditing({ collection: c, item }); setDialogOpen(true) }}
            onDelete={handleDelete}
            onToggleAvailability={handleToggleAvailability}
          />
        </TabsContent>

        <TabsContent value="frutas">
          <ProductSection
            title="Frutas Frescas"
            items={frutasList}
            collection="toppings"
            isSuperAdmin={isSuperAdmin}
            onNew={(c) => { setEditing({ collection: c, item: { category: 'Frutas' } }); setDialogOpen(true) }}
            onEdit={(c, item) => { setEditing({ collection: c, item }); setDialogOpen(true) }}
            onDelete={handleDelete}
            onToggleAvailability={handleToggleAvailability}
          />
        </TabsContent>

        <TabsContent value="toppings">
          <ProductSection
            title="Toppings & Acompanhamentos Inclusos"
            items={toppingsList}
            collection="toppings"
            isSuperAdmin={isSuperAdmin}
            onNew={(c) => { setEditing({ collection: c, item: { category: 'Toppings' } }); setDialogOpen(true) }}
            onEdit={(c, item) => { setEditing({ collection: c, item }); setDialogOpen(true) }}
            onDelete={handleDelete}
            onToggleAvailability={handleToggleAvailability}
          />
        </TabsContent>

        <TabsContent value="adicionais">
          <ProductSection
            title="Adicionais Especiais (Preço Dinâmico por Peso)"
            items={adicionaisList}
            collection="toppings"
            isSuperAdmin={isSuperAdmin}
            onNew={(c) => { setEditing({ collection: c, item: { category: 'Adicionais', isSpecialAddon: true } }); setDialogOpen(true) }}
            onEdit={(c, item) => { setEditing({ collection: c, item }); setDialogOpen(true) }}
            onDelete={handleDelete}
            onToggleAvailability={handleToggleAvailability}
          />
        </TabsContent>
      </Tabs>

      <ProductEditDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        collection={editing.collection}
        item={editing.item}
        onSave={handleSave}
      />

      <TableQRCodeGeneratorDialog
        open={qrDialogOpen}
        onOpenChange={setQrDialogOpen}
        tenantId={tenantId}
        storeName={currentTenant.name}
      />
    </div>
  )
}
