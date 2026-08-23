'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { CatalogData } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import { useMenuConfigStore, CustomCategoryItem } from '@/lib/stores/menuConfigStore'
import {
  PlusCircle,
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

interface MenuHierarchyViewProps {
  tenantId: string
  initialSection?: string
}

export default function MenuHierarchyView({ tenantId }: MenuHierarchyViewProps) {
  const [catalog, setCatalog] = useState<CatalogData>({ containers: [], bases: [], toppings: [] })
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)

  // Menus e Categorias Oficiais do Store
  const { mainMenus, categories, addCategory } = useMenuConfigStore()

  // Nível 1: Menu Selecionado ('all_menus' lista todos os menus)
  const [selectedMainMenu, setSelectedMainMenu] = useState<string>('all_menus')

  // Nível 2: Categoria Selecionada ('all_cats' lista todas as categorias)
  const [selectedCategory, setSelectedCategory] = useState<string>('all_cats')

  // Modal para Adicionar Categoria Rápida
  const [addCatDialogOpen, setAddCatDialogOpen] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatEmoji, setNewCatEmoji] = useState('🍧')
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

  const { user, authFetch } = useAuthStore()
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

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
    setEditingType('containers')
    setEditOpen(true)
  }

  const handleEdit = (item: any) => {
    setEditingItem(item)
    setEditingType('containers')
    setEditOpen(true)
  }

  const handleToggleStatus = async (item: any) => {
    try {
      const isAvailable = item.isAvailableInStore !== undefined ? item.isAvailableInStore : item.active
      const res = await authFetch(`/api/products/toggle-availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          productId: item.id,
          category: 'containers',
          available: isAvailable,
          active: item.active,
        }),
      })

      if (!res.ok) throw new Error('Falha ao atualizar status')
      setCatalog((prev) => ({
        ...prev,
        containers: prev.containers.map((c) =>
          c.id === item.id
            ? {
                ...c,
                active: item.active !== undefined ? item.active : c.active,
                isAvailableInStore: item.isAvailableInStore !== undefined ? item.isAvailableInStore : c.isAvailableInStore,
              }
            : c
        ),
      }))
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
      const res = await authFetch(`/api/products/containers/${item.id}?tenantId=${encodeURIComponent(tenantId)}`, {
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
      emoji: newCatEmoji || '🍧',
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

    if (selectedCategory === 'all_cats') {
      containersList.forEach((c) => {
        list.push({ item: c, type: 'containers' })
      })
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
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-purple-100 dark:border-white/10">
        <div>
          <h2 className="text-lg font-black text-purple-950 dark:text-white tracking-tight">Itens do cardápio</h2>
          <p className="text-xs text-purple-700/80 dark:text-purple-200/70 font-medium">
            Açaí da Rose · Produtos, Tamanhos e Regras de Complementos
          </p>
        </div>

        <button
          type="button"
          onClick={handlePublishChanges}
          disabled={publishing}
          className="h-10 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 dark:hover:from-pink-500 dark:hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-purple-700/20 dark:shadow-pink-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
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

      {/* 2. NÍVEL 1: LISTA DE MENUS (FILTRO 'Todos os Menus' + Menus Reais) */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => {
            setSelectedMainMenu('all_menus')
            setSelectedCategory('all_cats')
          }}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
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
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
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

      <hr className="border-t border-purple-100 dark:border-white/10 my-2" />

      {/* 3. NÍVEL 2: LISTA DE CATEGORIAS (FILTRO 'Todas as categorias' + Categorias Reais) */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedCategory('all_cats')}
          className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
            selectedCategory === 'all_cats'
              ? 'bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 text-white shadow-md shadow-purple-700/20 dark:shadow-pink-600/30'
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
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 text-white shadow-md shadow-purple-700/20 dark:shadow-pink-600/30'
                    : 'bg-white dark:bg-white/5 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-white/10 hover:bg-purple-50 dark:hover:bg-white/10 hover:text-purple-950 dark:hover:text-white shadow-xs'
                }`}
              >
                {cat.name}
              </button>
            )
          })}

        {/* Botão + Adicionar Categoria */}
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setAddCatDialogOpen(true)}
            className="px-3.5 py-1.5 rounded-full text-[11px] font-bold bg-purple-700 dark:bg-pink-600 hover:bg-purple-800 dark:hover:bg-pink-500 text-white flex items-center gap-1 transition cursor-pointer shadow-sm"
          >
            <PlusCircle className="h-3 w-3" />
            <span>Adicionar Categoria</span>
          </button>
        )}
      </div>

      {/* 4. BARRA DE AÇÕES INFERIOR DIREITA */}
      <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3">
        {/* Solicitar à Franqueadora (Para Franqueados) */}
        {!isSuperAdmin && (
          <button
            type="button"
            onClick={() => setFranchiseReqOpen(true)}
            className="h-9 px-3.5 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-purple-950 dark:text-white text-xs font-bold hover:bg-purple-50 dark:hover:bg-white/10 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Building2 className="h-3.5 w-3.5 text-purple-700 dark:text-pink-400" />
            <span>Solicitar à Franqueadora</span>
          </button>
        )}

        {/* + Adicionar Novo Item (Verde) */}
        <button
          type="button"
          onClick={handleOpenNew}
          className="h-9 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span>{isSuperAdmin ? 'Adicionar Novo Item' : 'Sugerir Produto'}</span>
        </button>

        {/* Modelos de Opções (Apenas Franqueadora) */}
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setOptionModelOpen(true)}
            className="h-9 px-3.5 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-purple-950 dark:text-white text-xs font-bold hover:bg-purple-50 dark:hover:bg-white/10 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-purple-700 dark:text-pink-400" />
            <span>Modelos de Opções</span>
          </button>
        )}

        {/* Filtro com Contador Ativo */}
        <button
          type="button"
          onClick={() => setFilterDialogOpen(true)}
          className={`h-9 px-3.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs ${
            hasActiveFilters
              ? 'bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 text-white border-purple-600 dark:border-pink-500 shadow-md'
              : 'border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-purple-950 dark:text-white hover:bg-purple-50 dark:hover:bg-white/10'
          }`}
        >
          <Filter className="h-3.5 w-3.5 text-purple-700 dark:text-pink-400" />
          <span>Filtro</span>
          {hasActiveFilters && (
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </button>
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

      {/* 6. MODAL ADICIONAR NOVA CATEGORIA */}
      <Dialog open={addCatDialogOpen} onOpenChange={setAddCatDialogOpen}>
        <DialogContent className="max-w-md bg-[#160228] p-5 rounded-2xl border border-white/15 shadow-2xl text-white">
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
                <Label className="text-xs font-bold text-purple-200">Emoji / Ícone:</Label>
                <Input
                  value={newCatEmoji}
                  onChange={(e) => setNewCatEmoji(e.target.value)}
                  placeholder="🍧"
                  className="h-9 text-base rounded-xl text-center bg-white/10 border-white/15 text-white"
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
        onSave={handleSaveProduct}
      />

      <FranchiseRequestDialog
        open={franchiseReqOpen}
        onOpenChange={setFranchiseReqOpen}
        tenantId={tenantId}
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
    </div>
  )
}
