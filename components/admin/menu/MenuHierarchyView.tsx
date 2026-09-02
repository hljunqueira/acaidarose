'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { CatalogData } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import { useMenuConfigStore, CustomCategoryItem } from '@/lib/stores/menuConfigStore'
import {
  RefreshCw,
  Filter,
  Building2,
  SlidersHorizontal,
  FolderPlus,
} from 'lucide-react'
import ProductRowItem from './ProductRowItem'
import ProductEditDialog from './ProductEditDialog'
import FranchiseRequestDialog from './FranchiseRequestDialog'
import ContainerAssemblyRulesDialog from './ContainerAssemblyRulesDialog'
import OptionModelDialog from './OptionModelDialog'
import MenuFilterDialog, { MenuFilterOptions } from './MenuFilterDialog'
import ReplicateCatalogModal from './ReplicateCatalogModal'
import { emitCatalogSync, subscribeCatalogSync } from '@/lib/utils/catalogSync'

interface MenuHierarchyViewProps {
  tenantId: string
  initialSection?: string
}

export default function MenuHierarchyView({ tenantId }: MenuHierarchyViewProps) {
  const { user, authFetch } = useAuthStore()
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'FRANCHISOR_ADMIN' || tenantId?.startsWith('11111111') || tenantId === 'aveiro'

  const [catalog, setCatalog] = useState<CatalogData>({ containers: [], bases: [], toppings: [] })
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [replicateModalOpen, setReplicateModalOpen] = useState(false)

  // Menus e Categorias Oficiais do Store
  const { mainMenus, categories, addCategory } = useMenuConfigStore()

  // Nível 1: Menu Selecionado ('all_menus' lista todos os menus)
  const [selectedMainMenu, setSelectedMainMenu] = useState<string>('all_menus')

  // Nível 2: Categoria Selecionada ('all_cats' lista todas as categorias)
  const [selectedCategory, setSelectedCategory] = useState<string>('all_cats')

  // Modal para Adicionar Categoria Rápida
  const [addCatDialogOpen, setAddCatDialogOpen] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatEmoji, setNewCatEmoji] = useState('')
  const [newCatPrice, setNewCatPrice] = useState<number>(10.00)

  // Filtros Avançados
  const [filterOptions, setFilterOptions] = useState<MenuFilterOptions>({
    status: 'all',
    visibility: 'all',
  })
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)

  // Dialog de Edição/Criação Master
  const [editOpen, setEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [editingType, setEditingType] = useState<'containers' | 'bases' | 'toppings'>('containers')

  // Dialog de Solicitação à Franqueadora
  const [franchiseReqOpen, setFranchiseReqOpen] = useState(false)

  // Dialog de Regras de Montagem
  const [rulesOpen, setRulesOpen] = useState(false)

  // Dialog de Modelos de Opções
  const [optionModelOpen, setOptionModelOpen] = useState(false)


  const fetchCatalog = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch(`/api/products?tenantId=${encodeURIComponent(tenantId)}`)
      const data = await res.json()
      if (data) setCatalog(data)
    } catch {
      toast.error('Erro ao carregar cardápio')
    } finally {
      setLoading(false)
    }
  }, [tenantId, authFetch])

  useEffect(() => {
    fetchCatalog()
    const unsub = subscribeCatalogSync(() => {
      fetchCatalog()
    })
    return () => unsub()
  }, [fetchCatalog])

  const handlePublishChanges = async () => {
    setPublishing(true)
    try {
      const res = await authFetch('/api/products/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Falha ao publicar alterações')
      }
      emitCatalogSync({
        tenantId,
        entity: 'catalog',
        action: 'update',
      })
      toast.success('Alterações publicadas e sincronizadas com sucesso!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao publicar')
    } finally {
      setPublishing(false)
    }
  }

  const handleOpenNew = () => {
    if (!isSuperAdmin) {
      setFranchiseReqOpen(true)
      return
    }
    setEditingItem(null)
    if (selectedCategory === 'bases') {
      setEditingType('bases')
    } else if (selectedCategory.startsWith('toppings')) {
      setEditingType('toppings')
    } else {
      setEditingType('containers')
    }
    setEditOpen(true)
  }

  const handleEdit = (item: any) => {
    setEditingItem(item)
    const categoryType = item.weightGrams !== undefined ? 'containers' : item.description !== undefined ? 'bases' : 'toppings'
    setEditingType(categoryType)
    setEditOpen(true)
  }

  const handleToggleStatus = async (item: any) => {
    try {
      const isAvailable = item.isAvailableInStore !== undefined ? item.isAvailableInStore : item.active
      const nextAvailable = !isAvailable
      const categoryType = item.weightGrams !== undefined ? 'containers' : item.description !== undefined ? 'bases' : 'toppings'
      const res = await authFetch(`/api/products/toggle-availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          productId: item.id,
          category: categoryType,
          available: nextAvailable,
          active: nextAvailable,
        }),
      })

      if (!res.ok) throw new Error('Falha ao atualizar status')

      emitCatalogSync({
        tenantId,
        entity: 'product',
        action: 'toggle_active',
        entityId: item.id,
        active: nextAvailable,
      })

      if (nextAvailable && item.isCategoryPaused) {
        toast.warning(
          `Atenção: "${item.name}" foi ativado, mas a categoria ${item.categoryName ? `"${item.categoryName}"` : 'deste produto'} está PAUSADA nesta loja. O produto não aparecerá aos clientes até que a categoria seja reativada.`,
          { duration: 8000 }
        )
      } else {
        toast.success(
          nextAvailable
            ? `"${item.name}" ativado com sucesso!`
            : `"${item.name}" pausado com sucesso!`
        )
      }

      fetchCatalog()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao alterar status')
    }
  }

  const handleDelete = async (item: any) => {
    if (!isSuperAdmin) {
      toast.error('Apenas a Franqueadora pode excluir itens do cardápio master.')
      return
    }
    try {
      const categoryType = item.weightGrams !== undefined ? 'containers' : item.description !== undefined ? 'bases' : 'toppings'
      const res = await authFetch(`/api/products/${categoryType}/${item.id}?tenantId=${encodeURIComponent(tenantId)}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Falha ao excluir item')
      toast.success(`"${item.name}" excluído com sucesso!`)
      fetchCatalog()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir')
    }
  }

  const handleSaveProduct = async (collection: string, itemData: any) => {
    try {
      const isNew = !itemData.id
      const method = isNew ? 'POST' : 'PUT'
      const url = isNew
        ? `/api/products/${collection}?tenantId=${encodeURIComponent(tenantId)}`
        : `/api/products/${collection}/${itemData.id}?tenantId=${encodeURIComponent(tenantId)}`

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      })

      if (!res.ok) throw new Error('Falha ao salvar produto')

      toast.success(isNew ? 'Produto cadastrado com sucesso!' : 'Produto atualizado com sucesso!')
      fetchCatalog()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar')
    }
  }

  // Criação Rápida de Categoria
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) {
      toast.error('Informe o nome da categoria')
      return
    }
    const newCat: CustomCategoryItem = {
      id: `cat_${Date.now()}`,
      name: newCatName.trim().toUpperCase(),
      slug: newCatName.trim().toLowerCase().replace(/\s+/g, '-'),
      emoji: newCatEmoji || '',
      defaultPrice: Number(newCatPrice) || 10.00,
      menuId: selectedMainMenu !== 'all_menus' ? selectedMainMenu : 'menu_acai',
      displayOrder: categories.length + 1,
      active: true,
      itemsCount: 0,
    }
    addCategory(newCat)
    toast.success(`Categoria "${newCat.name}" criada com sucesso!`)
    setSelectedCategory(newCat.id)
    setNewCatName('')
    setAddCatDialogOpen(false)
  }

  // Filtragem dos Produtos por Categoria (Tamanho de Açaí) & Filtros Avançados
  const displayedItems = useMemo(() => {
    const list: Array<{ item: any; type: 'containers' | 'bases' | 'toppings' }> = []
    const containersList = catalog.containers || []
    const basesList = catalog.bases || []
    const toppingsList = catalog.toppings || []

    if (selectedCategory === 'all_cats') {
      containersList.forEach((c) => list.push({ item: c, type: 'containers' }))
      basesList.forEach((b) => list.push({ item: b, type: 'bases' }))
      toppingsList.forEach((t) => list.push({ item: t, type: 'toppings' }))
    } else if (selectedCategory === 'bases') {
      basesList.forEach((b) => list.push({ item: b, type: 'bases' }))
    } else if (selectedCategory === 'toppings_frutas') {
      toppingsList
        .filter((t) => t.category === 'Frutas' || ['banana', 'morango', 'kiwi', 'manga', 'uva'].some((f) => t.name.toLowerCase().includes(f)))
        .forEach((t) => list.push({ item: t, type: 'toppings' }))
    } else if (selectedCategory === 'toppings_trad') {
      toppingsList
        .filter((t) => !t.isPremium && t.category !== 'Frutas' && t.category !== 'Adicionais' && !['banana', 'morango', 'kiwi', 'manga', 'uva'].some((f) => t.name.toLowerCase().includes(f)))
        .forEach((t) => list.push({ item: t, type: 'toppings' }))
    } else if (selectedCategory === 'toppings_caldas') {
      toppingsList
        .filter((t) => t.isPremium || t.category === 'Adicionais' || (t.precoExtra && t.precoExtra > 0))
        .forEach((t) => list.push({ item: t, type: 'toppings' }))
    } else if (selectedCategory === 'cat_acai_250') {
      const found = containersList.find((c) => c.weightGrams === 250 || c.name.toLowerCase().includes('250'))
      if (found) list.push({ item: found, type: 'containers' })
    } else if (selectedCategory === 'cat_acai_350') {
      const found = containersList.find((c) => c.weightGrams === 350 || c.name.toLowerCase().includes('350'))
      if (found) list.push({ item: found, type: 'containers' })
    } else if (selectedCategory === 'cat_acai_500') {
      const found = containersList.find((c) => c.weightGrams === 500 || c.name.toLowerCase().includes('500'))
      if (found) list.push({ item: found, type: 'containers' })
    } else if (selectedCategory === 'cat_acai_750') {
      const found = containersList.find((c) => c.weightGrams === 750 || c.name.toLowerCase().includes('750'))
      if (found) list.push({ item: found, type: 'containers' })
    } else if (selectedCategory === 'cat_acai_1000') {
      const found = containersList.find((c) => c.weightGrams === 1000 || c.name.toLowerCase().includes('1') || c.name.toLowerCase().includes('barca'))
      if (found) list.push({ item: found, type: 'containers' })
    } else {
      // Outra categoria personalizada
      const catObj = categories.find((c) => c.id === selectedCategory)
      if (catObj) {
        containersList
          .filter((c) => ((c as any).category?.toUpperCase() === catObj.name.toUpperCase()) || c.name.toUpperCase().includes(catObj.name.toUpperCase()))
          .forEach((c) => list.push({ item: c, type: 'containers' }))
      }
    }

    // Aplicação dos Filtros Avançados
    return list.filter(({ item }) => {
      const active = item.active !== false
      const available = item.isAvailableInStore !== false && active
      const price = item.precoBase ?? item.price ?? 0

      // Filtro de Disponibilidade
      if (filterOptions.status === 'available' && !available) return false
      if (filterOptions.status === 'unavailable' && available) return false

      // Filtro de Visibilidade
      if (filterOptions.visibility === 'visible' && !active) return false
      if (filterOptions.visibility === 'hidden' && active) return false

      // Filtro de Preço
      if (filterOptions.minPrice !== undefined && price < filterOptions.minPrice) return false
      if (filterOptions.maxPrice !== undefined && price > filterOptions.maxPrice) return false

      return true
    })
  }, [catalog, selectedCategory, filterOptions, categories])

  const hasActiveFilters =
    filterOptions.status !== 'all' ||
    filterOptions.visibility !== 'all' ||
    filterOptions.minPrice !== undefined ||
    filterOptions.maxPrice !== undefined

  return (
    <div className="space-y-4">
      {/* 1. Header do Módulo & Botão Publicar Alterações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-purple-100 dark:border-white/10">
        <div>
          <h2 className="text-base sm:text-lg font-black text-purple-950 dark:text-white tracking-tight">Itens do cardápio</h2>
          <p className="text-xs text-purple-700/80 dark:text-purple-200/70 font-medium">
            Açaí da Rose · Produtos, Tamanhos e Regras de Complementos
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (isSuperAdmin) {
              setReplicateModalOpen(true)
            } else {
              handlePublishChanges()
            }
          }}
          disabled={publishing}
          className="w-full sm:w-auto h-10 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 dark:hover:from-pink-500 dark:hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-purple-700/20 dark:shadow-pink-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${publishing ? 'animate-spin' : ''}`} />
          <span>
            {publishing
              ? 'Publicando...'
              : isSuperAdmin
              ? 'Publicar & Replicar para Toda a Rede'
              : 'Salvar Alterações da Loja'}
          </span>
        </button>
      </div>

      {/* 2. NÍVEL 1: LISTA DE MENUS (FILTRO 'Todos os Menus' + Menus Reais com Scroll Horizontal) */}
      <div className="flex items-center gap-2 pt-1 overflow-x-auto no-scrollbar max-w-full pb-1">
        <button
          type="button"
          onClick={() => {
            setSelectedMainMenu('all_menus')
            setSelectedCategory('all_cats')
          }}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            selectedMainMenu === 'all_menus'
              ? 'bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 text-white shadow-md shadow-purple-700/20 dark:shadow-pink-600/30'
              : 'bg-white dark:bg-white/5 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-white/10 hover:bg-purple-50 dark:hover:bg-white/10 hover:text-purple-950 dark:hover:text-white shadow-xs'
          }`}
        >
          Todos os Menus
        </button>

        {mainMenus
          .filter((m) => m.id !== 'all_menus' && !m.name.toLowerCase().includes('todos os menus'))
          .map((m) => {
            const isSelected = selectedMainMenu === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setSelectedMainMenu(m.id)
                  setSelectedCategory('all_cats')
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 text-white shadow-md shadow-purple-700/20 dark:shadow-pink-600/30'
                    : 'bg-white dark:bg-white/5 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-white/10 hover:bg-purple-50 dark:hover:bg-white/10 hover:text-purple-950 dark:hover:text-white shadow-xs'
                }`}
              >
                {m.name}
              </button>
            )
          })}
      </div>

      <hr className="border-t border-purple-100 dark:border-white/10 my-1" />

      {/* 3. NÍVEL 2: CATEGORIAS & BARRA DE AÇÕES */}
      <div className="flex flex-col gap-2.5 pt-1">
        {/* Pílulas de Categorias com Scroll Horizontal */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('all_cats')}
            className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              selectedCategory === 'all_cats'
                ? 'bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 text-white shadow-xs'
                : 'bg-white dark:bg-white/5 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-white/10 hover:bg-purple-50 dark:hover:bg-white/10 hover:text-purple-950 dark:hover:text-white shadow-xs'
            }`}
          >
            Todas as categorias
          </button>

          {categories
            .filter((c) => c.id !== 'all_cats' && !c.name.toLowerCase().includes('todas as categorias'))
            .map((cat) => {
              const isSelected = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 text-white shadow-xs'
                      : 'bg-white dark:bg-white/5 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-white/10 hover:bg-purple-50 dark:hover:bg-white/10 hover:text-purple-950 dark:hover:text-white shadow-xs'
                  }`}
                >
                  {cat.name}
                </button>
              )
            })}

          {/* Botão Adicionar Categoria */}
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setAddCatDialogOpen(true)}
              className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-purple-100 dark:bg-pink-950/40 border border-purple-200 dark:border-pink-500/30 text-purple-900 dark:text-pink-300 hover:bg-purple-200/70 dark:hover:bg-pink-900/40 transition cursor-pointer shrink-0 whitespace-nowrap"
            >
              <span>Adicionar Categoria</span>
            </button>
          )}
        </div>

        {/* Barra de Ações Integrada */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full pb-1">
          {/* Solicitar à Franqueadora (Para Franqueados) */}
          {!isSuperAdmin && (
            <button
              type="button"
              onClick={() => setFranchiseReqOpen(true)}
              className="h-8 px-3 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-purple-950 dark:text-white text-xs font-bold hover:bg-purple-50 dark:hover:bg-white/10 flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 whitespace-nowrap"
            >
              <Building2 className="h-3.5 w-3.5 text-purple-700 dark:text-pink-400" />
              <span>Solicitar à Franqueadora</span>
            </button>
          )}

          {/* Adicionar Novo Item (Verde - Apenas Franqueadora Master) */}
          {isSuperAdmin && (
            <button
              type="button"
              onClick={handleOpenNew}
              className="h-8 px-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-sm cursor-pointer shrink-0 whitespace-nowrap"
            >
              <span>Novo Item</span>
            </button>
          )}

          {/* Modelos de Opções (Apenas Franqueadora) */}
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setOptionModelOpen(true)}
              className="h-8 px-3 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-purple-950 dark:text-white text-xs font-bold hover:bg-purple-50 dark:hover:bg-white/10 flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 whitespace-nowrap"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-purple-700 dark:text-pink-400" />
              <span>Modelos</span>
            </button>
          )}

          {/* Filtro com Contador Ativo */}
          <button
            type="button"
            onClick={() => setFilterDialogOpen(true)}
            className={`h-8 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs shrink-0 whitespace-nowrap ${
              hasActiveFilters
                ? 'bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 text-white border-purple-600 dark:border-pink-500 shadow-md'
                : 'border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-purple-950 dark:text-white hover:bg-purple-50 dark:hover:bg-white/10'
            }`}
          >
            <Filter className="h-3.5 w-3.5 text-purple-700 dark:text-pink-400" />
            <span>Filtro</span>
            {hasActiveFilters && (
              <span className="h-4 w-4 rounded-full bg-white text-purple-700 text-[10px] font-black flex items-center justify-center">
                !
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 5. LISTAGEM DE PRODUTOS */}
      <div className="space-y-2.5 pt-2">
        {loading ? (
          <div className="p-12 text-center text-xs text-purple-700 dark:text-purple-200/70 font-bold animate-pulse">
            Carregando produtos do cardápio...
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="p-12 text-center text-xs text-purple-700/80 dark:text-purple-200/60 font-bold bg-white dark:bg-white/5 rounded-2xl border border-dashed border-purple-200 dark:border-white/15">
            Nenhum produto encontrado nesta categoria ou filtro.
          </div>
        ) : (
          displayedItems.map(({ item, type }) => (
            <ProductRowItem
              key={item.id}
              product={item}
              categoryType={type}
              tenantId={tenantId}
              onEdit={handleEdit}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* 5.5 INFORMAÇÃO NUTRICIONAL & SELOS DE CONFORMIDADE (PADRÃO REDE) */}
      <div className="pt-3">
        <details className="group rounded-3xl bg-white dark:bg-[#160228]/95 border border-purple-150 dark:border-white/15 p-4 shadow-xs dark:shadow-xl text-slate-900 dark:text-white transition cursor-pointer">
          <summary className="flex items-center justify-between text-xs font-black text-purple-950 dark:text-white select-none list-none">
            <div className="flex items-center gap-2">
              <span>Selos Oficiais de Conformidade & Tabela Nutricional</span>
              <Badge className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-[9px] font-black uppercase">
                Padrão Açaí da Rose
              </Badge>
            </div>
            <span className="text-purple-600 dark:text-pink-400 group-open:rotate-180 transition-transform font-bold text-xs">
              ▼
            </span>
          </summary>

          <div className="pt-4 mt-3 border-t border-purple-100 dark:border-white/10 space-y-4 cursor-default">
            {/* Selos de Qualidade */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-white/5 border border-purple-150 dark:border-white/10 text-purple-950 dark:text-white font-bold flex items-center justify-center">
                100% VEGAN
              </div>
              <div className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-white/5 border border-purple-150 dark:border-white/10 text-purple-950 dark:text-white font-bold flex items-center justify-center">
                Antioxidantes
              </div>
              <div className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-white/5 border border-purple-150 dark:border-white/10 text-purple-950 dark:text-white font-bold flex items-center justify-center">
                Sem Leite
              </div>
              <div className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-white/5 border border-purple-150 dark:border-white/10 text-purple-950 dark:text-white font-bold flex items-center justify-center">
                Sem Glúten
              </div>
              <div className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-white/5 border border-purple-150 dark:border-white/10 text-purple-950 dark:text-white font-bold flex items-center justify-center">
                Sem Conservantes
              </div>
              <div className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-white/5 border border-purple-150 dark:border-white/10 text-purple-950 dark:text-white font-bold flex items-center justify-center">
                Sem OGM
              </div>
            </div>

            {/* Ingredientes & Tabela Nutricional */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
              <div className="md:col-span-5 p-3.5 rounded-2xl bg-purple-50/40 dark:bg-white/5 border border-purple-100 dark:border-white/10 space-y-1.5">
                <div className="font-bold text-purple-950 dark:text-white uppercase tracking-wider text-[10px]">
                  Ingredientes Oficiais (PT):
                </div>
                <p className="text-purple-900 dark:text-purple-200/90 text-[11px] leading-relaxed">
                  Polpa de Açaí premium, Água, Glucose, Açúcar demerara, Extrato natural de Guaraná, Estabilizante (goma de guar, goma tara, Carboximetilcelulose), Dextrose, Maltodextrina e Ácido cítrico.
                </p>
              </div>

              <div className="md:col-span-7 border border-purple-150 dark:border-white/15 rounded-2xl overflow-hidden shadow-xs dark:shadow-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-purple-100/70 dark:bg-white/10 text-purple-950 dark:text-white text-[10px] uppercase">
                    <tr>
                      <th className="p-2">Componente (Porção 100g)</th>
                      <th className="p-2 text-right">Quantidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100 dark:divide-white/10 text-[11px]">
                    <tr className="bg-purple-50/40 dark:bg-white/5 font-bold">
                      <td className="p-2">Valor Energético / Energia</td>
                      <td className="p-2 text-right text-purple-800 dark:text-pink-300 font-mono">111 kcal / 469 kJ</td>
                    </tr>
                    <tr>
                      <td className="p-2">Proteínas</td>
                      <td className="p-2 text-right font-mono">0,5 g</td>
                    </tr>
                    <tr>
                      <td className="p-2">Lípidos (saturados)</td>
                      <td className="p-2 text-right font-mono">2,3 g (0,6 g)</td>
                    </tr>
                    <tr>
                      <td className="p-2">Hidratos de Carbono (açúcares)</td>
                      <td className="p-2 text-right font-mono">20,9 g (20,7 g)</td>
                    </tr>
                    <tr>
                      <td className="p-2">Fibra Alimentar</td>
                      <td className="p-2 text-right font-mono">2,5 g</td>
                    </tr>
                    <tr>
                      <td className="p-2">Cálcio / Vit. C / Potássio</td>
                      <td className="p-2 text-right font-mono">103 mg / 13 mg / 28,2 mg</td>
                    </tr>
                    <tr>
                      <td className="p-2">Sal</td>
                      <td className="p-2 text-right font-mono">0,05 g</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </details>
      </div>

      {/* 6. MODAL ADICIONAR NOVA CATEGORIA */}
      <Dialog open={addCatDialogOpen} onOpenChange={setAddCatDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#160228] p-4 sm:p-5 rounded-2xl border border-white/15 shadow-2xl text-white">
          <DialogTitle className="text-base font-black text-white flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-pink-400" />
            <span>Adicionar Nova Categoria</span>
          </DialogTitle>

          <form onSubmit={handleCreateCategory} className="space-y-4 pt-3 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-purple-200">Nome da Categoria:</Label>
              <Input
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Ex: AÇAÍ ZERO AÇÚCAR"
                className="h-9 text-xs border-white/15 bg-white/10 text-white rounded-xl font-bold uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-purple-200">Abreviação / Tag:</Label>
                <Input
                  value={newCatEmoji}
                  onChange={(e) => setNewCatEmoji(e.target.value)}
                  placeholder="Ex: ZERO"
                  className="h-9 text-xs rounded-xl text-center bg-white/10 border-white/15 text-white uppercase"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-purple-200">Preço Sugerido (€):</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newCatPrice}
                  onChange={(e) => setNewCatPrice(Number(e.target.value))}
                  className="h-9 text-xs rounded-xl bg-white/10 border-white/15 text-white font-mono"
                />
              </div>
            </div>

            <DialogFooter className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddCatDialogOpen(false)}
                className="rounded-xl text-xs font-bold border-white/15 bg-white/5 hover:bg-white/10 text-white cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-pink-600/30 cursor-pointer"
              >
                Salvar Categoria
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 7. MODAIS DE SUPORTE */}
      <ProductEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        collection={editingType}
        item={editingItem}
        catalog={catalog}
        onSave={handleSaveProduct}
      />

      <FranchiseRequestDialog
        open={franchiseReqOpen}
        onOpenChange={setFranchiseReqOpen}
        tenantId={tenantId}
        catalog={catalog}
      />

      <ContainerAssemblyRulesDialog
        open={rulesOpen}
        onOpenChange={setRulesOpen}
        tenantId={tenantId}
      />

      <OptionModelDialog
        open={optionModelOpen}
        onOpenChange={setOptionModelOpen}
      />

      <MenuFilterDialog
        open={filterDialogOpen}
        onOpenChange={setFilterDialogOpen}
        currentFilters={filterOptions}
        onApplyFilters={(opts: MenuFilterOptions) => setFilterOptions(opts)}
      />

      <ReplicateCatalogModal
        open={replicateModalOpen}
        onOpenChange={setReplicateModalOpen}
        currentTenantId={tenantId}
        catalog={catalog}
        onSuccess={fetchCatalog}
      />
    </div>
  )
}
