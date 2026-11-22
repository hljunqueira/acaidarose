'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import {
  GripVertical,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Camera,
  Lock,
  Info,
  ChevronDown,
  ChevronUp,
  Building2,
} from 'lucide-react'
import OptionModelDialog, { OptionModelData } from './OptionModelDialog'
import OptionModelsManagerDialog from './OptionModelsManagerDialog'
import FranchiseRequestDialog from './FranchiseRequestDialog'
import { useMenuConfigStore } from '@/lib/stores/menuConfigStore'
import { usePublishStore } from '@/lib/stores/publishStore'
import { FIGUEIRA_HQ_ID, canManageMasterCatalog, canEditProductPrices } from '@/lib/utils/permissions'

interface ProductEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collection: 'containers' | 'bases' | 'toppings'
  item: any
  catalog?: any
  defaultCategoryId?: string
  tenantId?: string
  availableOptionModels?: OptionModelData[]
  onSave: (collection: string, item: any) => Promise<void>
}

export default function ProductEditDialog({
  open,
  onOpenChange,
  collection,
  item,
  catalog,
  defaultCategoryId,
  tenantId,
  availableOptionModels,
  onSave,
}: ProductEditDialogProps) {
  const { user, authFetch } = useAuthStore()
  const { markDirty } = usePublishStore()
  const effectiveTenant = tenantId || item?.tenantId || user?.tenantId
  const isSuperAdmin = canManageMasterCatalog(user, effectiveTenant)
  const isPriceEditable = canEditProductPrices(user, effectiveTenant)
  const { categories: storeCategories } = useMenuConfigStore()
  const [dbOptionModels, setDbOptionModels] = useState<OptionModelData[]>(availableOptionModels || [])

  useEffect(() => {
    if (availableOptionModels && availableOptionModels.length > 0) {
      setDbOptionModels(availableOptionModels)
    }
  }, [availableOptionModels])

  // Busca modelos persistidos no PostgreSQL ao abrir
  useEffect(() => {
    if (open) {
      const fetchModels = async () => {
        try {
          const res = await authFetch(`/api/option-models?tenantId=${encodeURIComponent(effectiveTenant || FIGUEIRA_HQ_ID)}`)
          if (res.ok) {
            const data = await res.json()
            if (Array.isArray(data)) {
              setDbOptionModels(data)
            }
          }
        } catch (e) {
          console.error('Erro ao buscar modelos de opções em ProductEditDialog:', e)
        }
      }
      fetchModels()
    }
  }, [open, effectiveTenant, authFetch])

  // Categorias canônicas dinâmicas direto do catálogo / banco de dados (sem mocks/seeds)
  const allCategories = useMemo(() => {
    if (catalog?.categories && Array.isArray(catalog.categories) && catalog.categories.length > 0) {
      return catalog.categories.filter((c: any) => c.id !== 'all_cats' && !c.name?.toLowerCase().includes('todas as categorias'))
    }
    return storeCategories.filter((c: any) => c.id !== 'all_cats' && !c.name?.toLowerCase().includes('todas as categorias'))
  }, [catalog?.categories, storeCategories])

  const menuByIdMap = useMemo(() => {
    const map = new Map<string, string>()
    if (catalog?.menus && Array.isArray(catalog.menus)) {
      catalog.menus.forEach((m: any) => map.set(m.id, m.name))
    }
    return map
  }, [catalog?.menus])

  // Modelos de opções configurados no banco de dados pela Franqueadora
  const allAvailableModels = useMemo(() => {
    return dbOptionModels
  }, [dbOptionModels])

  const [form, setForm] = useState<any>({
    name: '',
    description: '',
    categoryId: '',
    category: '',
    weightGrams: null,
    price: '',
    code: '2885',
    image: '',
    videoUrl: '',
    availableHours: { days: [0, 1, 2, 3, 4, 5, 6], startTime: '00:00', endTime: '23:59' },
    limiteBases: 1,
    limiteFrutas: 2,
    limiteToppings: 3,
    isPremium: false,
  })
  const [saving, setSaving] = useState(false)
  const [optionModelOpen, setOptionModelOpen] = useState(false)
  const [optionModelsManagerOpen, setOptionModelsManagerOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<OptionModelData | null>(null)
  const [franchiseRequestOpen, setFranchiseRequestOpen] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isVideo = file.type.startsWith('video/')

    // 1. Preview imediato em tempo real via ObjectURL (zero atraso de leitura base64)
    const localPreviewUrl = URL.createObjectURL(file)
    if (isVideo) {
      setForm((prev: any) => ({
        ...prev,
        videoUrl: localPreviewUrl,
      }))
    } else {
      setForm((prev: any) => ({
        ...prev,
        image: localPreviewUrl,
      }))
    }

    // 2. Upload de alto desempenho em stream para /api/upload (armazenamento estático direto)
    setUploadingMedia(true)
    const toastId = toast.loading(isVideo ? 'A enviar vídeo de apresentação...' : 'A enviar imagem...')
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Falha no upload do ficheiro')

      const data = await res.json()
      if (data?.url) {
        if (isVideo) {
          setForm((prev: any) => ({
            ...prev,
            videoUrl: data.url,
          }))
          toast.success('Vídeo de apresentação carregado com sucesso!', { id: toastId })
        } else {
          setForm((prev: any) => ({
            ...prev,
            image: data.url,
          }))
          toast.success('Imagem de apresentação carregada com sucesso!', { id: toastId })
        }
      }
    } catch (err: any) {
      toast.error('Erro ao enviar ficheiro de mídia. Tente novamente.', { id: toastId })
      console.error(err)
    } finally {
      setUploadingMedia(false)
    }
  }

  // Estado para controlar quais grupos de opções estão expandidos (colapsáveis)
  // Por padrão, todos iniciam fechados (colapsados)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const [linkedOptionGroups, setLinkedOptionGroups] = useState<(OptionModelData & { active?: boolean })[]>([])

  useEffect(() => {
    // Ao abrir ou trocar de item, garante que todos os grupos iniciem fechados
    setExpandedGroups({})

    if (item) {
      if (Array.isArray(item.optionGroups)) {
        setLinkedOptionGroups(item.optionGroups)
      } else {
        setLinkedOptionGroups([])
      }

      const initialCatId =
        item.categoryId ||
        item.category_id ||
        (allCategories.find((c: any) => c.name === item.category)?.id) ||
        defaultCategoryId ||
        (allCategories[0]?.id || '')

      const matchedCategory = allCategories.find((c: any) => c.id === initialCatId)
      const initialCatName = matchedCategory ? matchedCategory.name : (item.category || item.categoryName || '')
      const weight = item.weightGrams ?? matchedCategory?.weightGrams ?? matchedCategory?.weight_grams ?? null

      const basesGroup = (item.optionGroups || []).find((g: any) => g.id === 'model-bases' || (g.name && (g.name.toLowerCase().includes('creme') || g.name.toLowerCase().includes('base'))))
      const frutasGroup = (item.optionGroups || []).find((g: any) => g.id === 'model-frutas' || (g.name && g.name.toLowerCase().includes('fruta')))
      const toppingsGroup = (item.optionGroups || []).find((g: any) => g.id === 'model-toppings' || (g.name && (g.name.toLowerCase().includes('acompanhamento') || g.name.toLowerCase().includes('topping'))))

      setForm({
        name: item.name || '',
        description: item.description || '',
        categoryId: initialCatId,
        category: initialCatName,
        weightGrams: weight,
        price: item.precoExtra !== undefined ? Number(item.precoExtra) : (item.precoBase !== undefined ? Number(item.precoBase) : (item.price || '')),
        isPremium: !!item.isPremium,
        code: item.code || '2885',
        image: item.image || item.imageUrl || '',
        videoUrl: item.videoUrl || '',
        availableHours: item.availableHours || null,
        limiteBases: item.limiteBases !== undefined && item.limiteBases !== null
          ? Number(item.limiteBases)
          : (item.limite_bases !== undefined && item.limite_bases !== null
            ? Number(item.limite_bases)
            : (basesGroup?.maxQty !== undefined && basesGroup?.maxQty !== null ? Number(basesGroup.maxQty) : 0)),
        limiteFrutas: item.limiteFrutas !== undefined && item.limiteFrutas !== null
          ? Number(item.limiteFrutas)
          : (item.limite_frutas !== undefined && item.limite_frutas !== null
            ? Number(item.limite_frutas)
            : (frutasGroup?.maxQty !== undefined && frutasGroup?.maxQty !== null ? Number(frutasGroup.maxQty) : 0)),
        limiteToppings: item.limiteToppings !== undefined && item.limiteToppings !== null
          ? Number(item.limiteToppings)
          : (item.limite_toppings !== undefined && item.limite_toppings !== null
            ? Number(item.limite_toppings)
            : (item.limiteComplementosGratis !== undefined && item.limiteComplementosGratis !== null
              ? Number(item.limiteComplementosGratis)
              : (toppingsGroup?.maxQty !== undefined && toppingsGroup?.maxQty !== null ? Number(toppingsGroup.maxQty) : 0))),
      })
    } else {
      // Novo item SEMPRE inicia sem modelos de opções vinculados (o usuário vincula se quiser)
      setLinkedOptionGroups([])

      const initialCatId = defaultCategoryId || (allCategories[0]?.id || '')
      const matchedCategory = allCategories.find((c: any) => c.id === initialCatId)
      const initialCatName = matchedCategory ? matchedCategory.name : (collection === 'toppings' ? 'Frutas' : collection === 'bases' ? 'Bases' : '')
      const weight = matchedCategory?.weightGrams || matchedCategory?.weight_grams || null
      const defaultPrice = matchedCategory?.defaultPrice ? String(matchedCategory.defaultPrice) : ''

      setForm({
        name: '',
        description: '',
        categoryId: initialCatId,
        category: collection === 'toppings' ? 'Frutas' : collection === 'bases' ? 'Bases' : initialCatName,
        weightGrams: weight,
        price: defaultPrice,
        isPremium: false,
        code: '2885',
        image: '',
        videoUrl: '',
        availableHours: null,
        limiteBases: 0,
        limiteFrutas: 0,
        limiteToppings: 0,
      })
    }
  }, [item, collection, catalog, open, defaultCategoryId, allCategories])

  const handleUpdateGroupRules = (groupId: string | undefined, patch: Partial<OptionModelData>) => {
    setLinkedOptionGroups((prev) =>
      prev.map((g) => (g.id === groupId || g.name === groupId ? { ...g, ...patch } : g))
    )
  }

  const toggleGroupExpanded = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSuperAdmin) {
      setSaving(true)
      try {
        const targetTenant = effectiveTenant || user?.tenantId
        if (!targetTenant) throw new Error('Identificador da loja não encontrado')

        // 1. Salva a visibilidade de cada grupo vinculado na tabela store_product_overrides
        for (const grp of linkedOptionGroups) {
          if (grp.id) {
            const isGroupActive = grp.active !== false
            await authFetch('/api/products/toggle-availability', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tenantId: targetTenant,
                productId: grp.id,
                visible: isGroupActive,
                applyToAll: false,
              }),
            })
          }

          // Salva cada opção individual do grupo na loja ativa
          if (Array.isArray(grp.options)) {
            for (const opt of grp.options) {
              const optKey = opt.code || opt.id || opt.name
              if (optKey && opt.active !== undefined) {
                await authFetch('/api/products/toggle-availability', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    tenantId: targetTenant,
                    productId: optKey,
                    visible: opt.active !== false,
                    applyToAll: false,
                  }),
                })
              }
            }
          }
        }

        // 2. Notifica versão e marca pendência da loja
        await markDirty(
          targetTenant,
          `Visibilidade de opcionais do produto "${form.name}" atualizada nesta loja`,
          {
            entity: 'product_option_groups',
            entityId: item?.id,
            productName: form.name,
          },
          authFetch
        )

        toast.success(`Visibilidade dos opcionais de "${form.name}" guardada com sucesso nesta loja!`)
        onOpenChange(false)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('catalog_sync', { detail: { tenantId: targetTenant } }))
        }
      } catch (err: any) {
        toast.error(err.message || 'Erro ao guardar alterações da loja')
      } finally {
        setSaving(false)
      }
      return
    }
    setSaving(true)
    try {
      const isTopping = collection === 'toppings'
      const isBase = collection === 'bases'

      const payload: any = {
        ...item,
        name: form.name,
        description: form.description,
        image: form.image,
        videoUrl: form.videoUrl,
        availableHours: item?.availableHours ?? null,
      }

      if (isTopping) {
        payload.category = form.category || 'Toppings'
        payload.precoExtra = Number(form.price) || 0
        payload.price = Number(form.price) || 0
        payload.isPremium = !!form.isPremium
      } else if (isBase) {
        payload.precoExtra = 0
      } else {
        payload.precoBase = Number(form.price) || 0
        payload.price = Number(form.price) || 0
        payload.category = form.category
        payload.categoryId = form.categoryId
        payload.weightGrams = form.weightGrams ? Number(form.weightGrams) : null

        const currentCat = allCategories.find((c: any) => c.id === form.categoryId)
        const catNameLower = (form.category || currentCat?.name || '').toLowerCase()
        const prodNameLower = (form.name || '').toLowerCase()

        const isNonAcai =
          form.categoryId === 'cat-milkshakes' ||
          catNameLower.includes('shake') ||
          catNameLower.includes('lanche') ||
          catNameLower.includes('bebida') ||
          catNameLower.includes('café') ||
          catNameLower.includes('chá') ||
          catNameLower.includes('chocolate') ||
          prodNameLower.includes('shake') ||
          prodNameLower.includes('batido')

        const isAcaiContainer = !isNonAcai && (
          catNameLower.includes('açaí') ||
          catNameLower.includes('acai') ||
          catNameLower.includes('copo') ||
          catNameLower.includes('taça') ||
          catNameLower.includes('taca') ||
          catNameLower.includes('tigela')
        )

        payload.productType = isAcaiContainer ? 'CONTAINER' : 'ITEM'
        const syncedOptionGroups = (linkedOptionGroups || []).map((g, idx) => {
          let maxQty = g.maxQty
          if (g.id === 'model-bases' || (g.name && (g.name.toLowerCase().includes('creme') || g.name.toLowerCase().includes('base')))) {
            maxQty = Number(form.limiteBases ?? 0)
          } else if (g.id === 'model-frutas' || (g.name && g.name.toLowerCase().includes('fruta'))) {
            maxQty = Number(form.limiteFrutas ?? 0)
          } else if (g.id === 'model-toppings' || (g.name && (g.name.toLowerCase().includes('acompanhamento') || g.name.toLowerCase().includes('topping')))) {
            maxQty = Number(form.limiteToppings ?? 0)
          }

          // No template mestre do produto, as opções mantêm os preços e visibilidade padrão
          // Desativações por loja ficam isoladas na tabela store_product_overrides através dos cliques no botão de visibilidade
          const cleanOptions = (g.options || []).map((opt: any) => ({
            ...opt,
            active: true,
          }))

          return {
            ...g,
            displayOrder: idx + 1,
            display_order: idx + 1,
            maxQty,
            options: cleanOptions,
          }
        })
        payload.optionGroups = syncedOptionGroups

        if (isAcaiContainer) {
          payload.limiteBases = Number(form.limiteBases ?? 0)
          payload.limiteFrutas = Number(form.limiteFrutas ?? 0)
          payload.limiteToppings = Number(form.limiteToppings ?? 0)
          payload.limiteComplementosGratis = Number(form.limiteToppings ?? 0)
        } else {
          payload.limiteBases = 0
          payload.limiteFrutas = 0
          payload.limiteToppings = 0
          payload.limiteComplementosGratis = 0
        }
      }

      await onSave(collection, payload)
      toast.success(`"${form.name}" guardado com sucesso!`)
      onOpenChange(false)
    } catch {
      toast.error('Erro ao guardar produto')
    } finally {
      setSaving(false)
    }
  }

  const handleOpenNewOptionModel = () => {
    setOptionModelsManagerOpen(true)
  }

  const handleEditOptionModel = (group: OptionModelData) => {
    setEditingModel(group)
    setOptionModelOpen(true)
  }

  const handleSaveOptionModel = async (savedModel: OptionModelData) => {
    const isModelActive = savedModel.active !== false
    const targetTenant = effectiveTenant || FIGUEIRA_HQ_ID

    // 1. Atualização imediata em memória dos grupos vinculados
    setLinkedOptionGroups((prev) => {
      const exists = prev.find((g) => g.id === savedModel.id || g.name === savedModel.name)
      if (exists) {
        return prev.map((g) => (g.id === savedModel.id || g.name === savedModel.name ? { ...savedModel, active: isModelActive } : g))
      }
      return [...prev, { ...savedModel, active: isModelActive }]
    })

    // 2. Persistência real e imediata no PostgreSQL (product_option_models)
    const isNew = !savedModel.id || savedModel.id.startsWith('model-')
    try {
      if (isNew) {
        const res = await authFetch(`/api/option-models?tenantId=${encodeURIComponent(targetTenant)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...savedModel, tenantId: targetTenant }),
        })
        if (res.ok) {
          const created = await res.json()
          savedModel = { ...savedModel, id: created.id }
        }
      } else {
        const res = await authFetch(`/api/option-models/${savedModel.id}?tenantId=${encodeURIComponent(targetTenant)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...savedModel,
            tenantId: targetTenant,
            applyToAll: isSuperAdmin && Boolean((savedModel as any).applyToAll),
          }),
        })
        if (res.ok) {
          const updated = await res.json()
          savedModel = { ...savedModel, ...updated }
        }
      }

      if (targetTenant) {
        const diffs: Array<{ field: string; label: string; previousValue: any; newValue: any }> = []
        if (editingModel) {
          if (editingModel.name !== savedModel.name) {
            diffs.push({ field: 'name', label: 'Nome do Modelo', previousValue: editingModel.name, newValue: savedModel.name })
          }
          if ((editingModel.subtitle || '') !== (savedModel.subtitle || '')) {
            diffs.push({
              field: 'subtitle',
              label: 'Subtítulo Visual',
              previousValue: editingModel.subtitle || '(Vazio)',
              newValue: savedModel.subtitle || '(Vazio)',
            })
          }
          if (Number(editingModel.additionalPrice || 0) !== Number(savedModel.additionalPrice || 0)) {
            diffs.push({
              field: 'additionalPrice',
              label: 'Valor Adicional',
              previousValue: `${Number(editingModel.additionalPrice || 0).toFixed(2)} €`,
              newValue: `${Number(savedModel.additionalPrice || 0).toFixed(2)} €`,
            })
          }
          if (editingModel.priceType !== savedModel.priceType) {
            diffs.push({
              field: 'priceType',
              label: 'Forma de Preço',
              previousValue: editingModel.priceType,
              newValue: savedModel.priceType,
            })
          }
          if (editingModel.minQty !== savedModel.minQty) {
            diffs.push({ field: 'minQty', label: 'Qtd. Mínima', previousValue: editingModel.minQty, newValue: savedModel.minQty })
          }
          if (editingModel.maxQty !== savedModel.maxQty) {
            diffs.push({ field: 'maxQty', label: 'Qtd. Grátis/Limite', previousValue: editingModel.maxQty, newValue: savedModel.maxQty })
          }
        }

        markDirty(
          targetTenant,
          diffs.length > 0
            ? `Modelo "${savedModel.name}": ${diffs.map((d) => d.label).join(', ')}`
            : `Modelo de opções "${savedModel.name}" atualizado`,
          {
            entity: 'option_model',
            entityId: savedModel.id,
            details: diffs,
          },
          authFetch
        )
      }
      toast.success(`Modelo "${savedModel.name}" salvo no banco de dados!`)
    } catch (e: any) {
      console.error('Erro ao sincronizar modelo no servidor:', e)
      toast.error('Erro ao salvar modelo no banco de dados.')
    }
  }

  // Alterna o grupo inteiro (ativo / inativo) - Franqueadora e Filial podem alternar visibilidade local
  const handleToggleGroupActive = (groupId?: string, groupName?: string) => {
    setLinkedOptionGroups((prev) =>
      prev.map((g) => {
        if ((groupId && g.id === groupId) || g.name === groupName) {
          const next = g.active === false ? true : false
          toast.success(next ? `Grupo "${g.name}" visível na loja.` : `Grupo "${g.name}" pausado/invisível na loja.`)
          return { ...g, active: next }
        }
        return g
      })
    )
  }

  // Alterna um item individual de opcional dentro do grupo (ex: Morango, Nutella) - Franqueadora e Filial podem alternar!
  const handleToggleOptionItemActive = (groupId: string, optionId: string) => {
    setLinkedOptionGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId || (!g.id && g.name === groupId)) {
          const updatedOptions = (g.options || []).map((opt) => {
            if (opt.id === optionId) {
              const next = opt.active === false ? true : false
              toast.success(next ? `Opcional "${opt.name}" agora está visível no cardápio.` : `Opcional "${opt.name}" oculto no cardápio.`)
              return { ...opt, active: next }
            }
            return opt
          })
          return { ...g, options: updatedOptions }
        }
        return g
      })
    )
  }

  const handleUnlinkGroup = (groupId?: string, groupName?: string) => {
    if (!isSuperAdmin) return
    setLinkedOptionGroups((prev) => prev.filter((g) => (groupId ? g.id !== groupId : g.name !== groupName)))
    toast.success('Modelo de opção desvinculado deste produto.')
  }

  const handleSelectAndLinkModel = (modelId: string) => {
    if (!isSuperAdmin) return
    const found = allAvailableModels.find((m: OptionModelData) => m.id === modelId)
    if (!found) return
    handleSaveOptionModel(found)
    toast.success(`Modelo "${found.name}" vinculado com sucesso!`)
  }

  // Reordenação de Modelos de Opções (Drag & Drop e Botões de Subir/Descer)
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null)

  const handleDragStartGroup = (e: React.DragEvent, id: string) => {
    setDraggedGroupId(id)
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDropGroup = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedGroupId || draggedGroupId === targetId) return

    const sourceIndex = linkedOptionGroups.findIndex((g) => (g.id || g.name) === draggedGroupId)
    const targetIndex = linkedOptionGroups.findIndex((g) => (g.id || g.name) === targetId)
    if (sourceIndex === -1 || targetIndex === -1) return

    const updated = [...linkedOptionGroups]
    const [moved] = updated.splice(sourceIndex, 1)
    updated.splice(targetIndex, 0, moved)
    setLinkedOptionGroups(updated)
    setDraggedGroupId(null)
  }

  const handleMoveGroup = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= linkedOptionGroups.length) return
    const updated = [...linkedOptionGroups]
    const [moved] = updated.splice(index, 1)
    updated.splice(targetIndex, 0, moved)
    setLinkedOptionGroups(updated)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[90vh] flex flex-col p-0 bg-white dark:bg-[#160228] text-slate-900 dark:text-white border border-purple-100 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xl [&>button]:hidden">
        <div className="p-4 px-6 border-b border-purple-100 dark:border-white/10 bg-purple-50/50 dark:bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-sm font-black text-purple-950 dark:text-white tracking-tight">
              {isSuperAdmin
                ? item
                  ? 'Editar Produto — Franqueadora Master'
                  : 'Novo Produto — Franqueadora Master'
                : 'Editar Produto — Modo Franquia'}
            </DialogTitle>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isSuperAdmin
                ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-700/50'
                : 'bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800/40'
              }`}>
              {isSuperAdmin ? 'Modo Master' : 'Modo Franquia (Apenas Visibilidade)'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-xs font-bold text-purple-700 dark:text-purple-300 hover:text-purple-950 dark:hover:text-white cursor-pointer px-2.5 py-1 rounded-lg hover:bg-purple-100/50 dark:hover:bg-white/10 transition"
          >
            Fechar
          </button>
        </div>

        {!isSuperAdmin && (
          <div className="px-6 py-2.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200/60 dark:border-amber-500/20 flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200">
            <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span>
              <strong>Modo Franquia:</strong> Esta unidade pode apenas alternar a visibilidade (ativo/pausado) dos opcionais e acompanhamentos. Estrutura, mídias, nomes, descrições e preços são padronizados pela Franqueadora.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-purple-100 dark:divide-white/10 text-xs">
          {/* LADO ESQUERDO: FOTO, NOME, DESCRIÇÃO, CATEGORIA */}
          <div className="p-6 md:w-[46%] space-y-4">
            {/* Seção Mídia de Apresentação Unificada (Sem Ícones) */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-purple-950 dark:text-white">
                Mídia de Apresentação:
              </Label>
              <div className="flex items-center gap-3">
                {/* Preview Box */}
                <div className="h-20 w-20 rounded-xl overflow-hidden bg-purple-50 dark:bg-white/5 border border-purple-200 dark:border-white/10 flex-shrink-0 relative">
                  {form.videoUrl ? (
                    <video
                      src={form.videoUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  ) : form.image ? (
                    <img src={form.image} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-purple-950/20 text-purple-300 dark:text-purple-600 font-bold text-[10px] uppercase tracking-widest text-center p-1">
                      Sem Mídia
                    </div>
                  )}
                </div>

                {/* Dropzone de Upload Sóbrio (Sem ícones) */}
                <div
                  onClick={isSuperAdmin ? triggerFileSelect : undefined}
                  className={`h-20 flex-1 border border-dashed border-purple-200 dark:border-white/20 rounded-xl flex flex-col items-center justify-center text-center p-2 transition ${isSuperAdmin
                      ? 'bg-purple-50/20 dark:bg-white/5 hover:bg-purple-50/40 dark:hover:bg-white/10 cursor-pointer'
                      : 'bg-zinc-100/50 dark:bg-white/5 cursor-not-allowed opacity-60'
                    }`}
                >
                  <span className="text-[10px] font-black text-purple-950 dark:text-white uppercase tracking-wider">
                    {isSuperAdmin ? 'Carregar Ficheiro' : 'Mídia Padronizada Master'}
                  </span>
                  <span className="text-[8px] text-purple-700/80 dark:text-purple-300/70 mt-0.5 leading-tight">
                    {isSuperAdmin ? 'Selecione um vídeo ou imagem da sua galeria' : 'Definido pela Franqueadora'}
                  </span>
                  {isSuperAdmin && (
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="video/*,image/*"
                      className="hidden"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-purple-950 dark:text-white">Nome do Produto:</Label>
                {!isSuperAdmin && (
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Padrão Master
                  </span>
                )}
              </div>
              <Input
                required
                readOnly={!isSuperAdmin}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Açaí 500g"
                className={`h-9 text-xs rounded-lg font-bold border-purple-200 dark:border-white/15 ${isSuperAdmin
                    ? 'bg-white dark:bg-white/5 text-purple-950 dark:text-white'
                    : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 cursor-not-allowed'
                  }`}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-purple-950 dark:text-white">Descrição Oficial:</Label>
              <textarea
                readOnly={!isSuperAdmin}
                value={form.description}
                onChange={(e) => isSuperAdmin && setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Descrição dos ingredientes e regras..."
                className={`w-full p-2.5 text-xs border border-purple-200 dark:border-white/15 rounded-lg focus:outline-none ${isSuperAdmin
                    ? 'bg-white dark:bg-white/5 text-purple-950 dark:text-white focus:ring-1 focus:ring-purple-500'
                    : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 cursor-not-allowed'
                  }`}
              />
            </div>

            {collection === 'containers' && (
              <div className="space-y-1">
                <Label className="text-xs font-bold text-purple-950 dark:text-white">Categoria do Cardápio:</Label>
                <select
                  disabled={!isSuperAdmin}
                  value={form.categoryId || ''}
                  onChange={(e) => {
                    if (!isSuperAdmin) return
                    const selectedId = e.target.value
                    const found = allCategories.find((c: any) => c.id === selectedId)
                    setForm((prev: any) => ({
                      ...prev,
                      categoryId: selectedId,
                      category: found ? found.name : prev.category,
                      weightGrams: found?.weightGrams || found?.weight_grams || null,
                      price: prev.price || (found?.defaultPrice ? String(found.defaultPrice) : prev.price),
                    }))
                  }}
                  className={`w-full h-9 px-2.5 text-xs border border-purple-200 dark:border-white/15 rounded-lg font-bold ${isSuperAdmin
                      ? 'bg-white dark:bg-[#160228] text-purple-950 dark:text-white focus:ring-1 focus:ring-purple-500 cursor-pointer'
                      : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 cursor-not-allowed'
                    }`}
                >
                  {allCategories.map((c: any) => {
                    const menuName = menuByIdMap.get(c.menuId)
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name}{menuName ? ` (${menuName})` : ''}
                      </option>
                    )
                  })}
                </select>
              </div>
            )}

            {collection === 'containers' && (
              <div className="p-3.5 border border-purple-150 dark:border-white/10 rounded-xl bg-purple-50/40 dark:bg-white/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-purple-950 dark:text-white">
                    Cotas Inclusas no Copo/Taça:
                  </Label>
                  {!isSuperAdmin && (
                    <span className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Padrão Master
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-purple-900 dark:text-purple-300">
                      Cremes Inclusos:
                    </span>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      disabled={!isSuperAdmin}
                      value={form.limiteBases ?? 0}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setForm({ ...form, limiteBases: val })
                        setLinkedOptionGroups((prev) =>
                          prev.map((g) => {
                            if (g.id === 'model-bases' || (g.name && (g.name.toLowerCase().includes('creme') || g.name.toLowerCase().includes('base')))) {
                              return { ...g, maxQty: val }
                            }
                            return g
                          })
                        )
                      }}
                      className="h-8 text-xs font-bold font-mono bg-white dark:bg-white/10 border-purple-200 dark:border-white/15"
                    />
                    <span className="text-[9px] text-purple-600 dark:text-purple-400 block leading-tight">
                      Cota gratuita
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-purple-900 dark:text-purple-300">
                      Frutas Inclusas:
                    </span>
                    <Input
                      type="number"
                      min="0"
                      max="999"
                      disabled={!isSuperAdmin}
                      value={form.limiteFrutas ?? 0}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setForm({ ...form, limiteFrutas: val })
                        setLinkedOptionGroups((prev) =>
                          prev.map((g) => {
                            if (g.id === 'model-frutas' || (g.name && g.name.toLowerCase().includes('fruta'))) {
                              return { ...g, maxQty: val }
                            }
                            return g
                          })
                        )
                      }}
                      className="h-8 text-xs font-bold font-mono bg-white dark:bg-white/10 border-purple-200 dark:border-white/15"
                    />
                    <span className="text-[9px] text-purple-600 dark:text-purple-400 block leading-tight">
                      999 = ilimitado
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-purple-900 dark:text-purple-300">
                      Toppings Inclusos:
                    </span>
                    <Input
                      type="number"
                      min="0"
                      max="999"
                      disabled={!isSuperAdmin}
                      value={form.limiteToppings ?? 0}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setForm({ ...form, limiteToppings: val })
                        setLinkedOptionGroups((prev) =>
                          prev.map((g) => {
                            if (g.id === 'model-toppings' || (g.name && (g.name.toLowerCase().includes('acompanhamento') || g.name.toLowerCase().includes('topping')))) {
                              return { ...g, maxQty: val }
                            }
                            return g
                          })
                        )
                      }}
                      className="h-8 text-xs font-bold font-mono bg-white dark:bg-white/10 border-purple-200 dark:border-white/15"
                    />
                    <span className="text-[9px] text-purple-600 dark:text-purple-400 block leading-tight">
                      999 = ilimitado
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* LADO DIREITO: PREÇO & GRUPOS DE OPCIONAIS COLAPSÁVEIS COM CONTROLE DE VISIBILIDADE */}
          <div className="p-6 md:w-[54%] space-y-4">
            <div className="space-y-2">
              <h3 className="font-bold text-purple-950 dark:text-white text-xs">Preço de Tabela:</h3>
              <div className="p-3.5 border border-purple-100 dark:border-white/10 rounded-xl bg-purple-50/40 dark:bg-white/5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-purple-950 dark:text-white">{form.name || 'Produto'}</div>
                  <div className="text-[11px] text-purple-700 dark:text-purple-300/70">
                    {isPriceEditable ? 'Preço Master da Matriz' : 'Preço Oficial Fixado pela Matriz (Figueira da Foz)'}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-purple-900 dark:text-purple-200">€</span>
                  <input
                    type="number"
                    step="0.01"
                    disabled={!isPriceEditable}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className={`w-20 h-8 px-2 text-xs font-bold font-mono border rounded-lg ${isPriceEditable
                        ? 'border-purple-300 dark:border-white/20 bg-white dark:bg-white/10 text-purple-950 dark:text-white'
                        : 'border-zinc-300 dark:border-white/10 bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 cursor-not-allowed text-right'
                      }`}
                  />
                  {!isPriceEditable && <Lock className="h-3 w-3 text-zinc-400" />}
                </div>
              </div>
            </div>

            {collection === 'toppings' ? (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-purple-950 dark:text-white">Categoria do Opcional:</Label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full h-9 px-2.5 text-xs border border-purple-200 dark:border-white/15 rounded-lg font-bold bg-white dark:bg-[#160228] text-purple-950 dark:text-white"
                  >
                    <option value="Frutas">Frutas Frescas</option>
                    <option value="Toppings">Toppings & Crocantes Tradicionais</option>
                    <option value="Adicionais">Caldas & Adicionais Nobres (Premium)</option>
                  </select>
                </div>

                <div className="p-3.5 border border-purple-150 dark:border-white/10 rounded-xl bg-purple-50/30 dark:bg-white/5 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isPremium}
                      onChange={(e) => setForm({ ...form, isPremium: e.target.checked })}
                      className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-purple-950 dark:text-white">
                      Item Nobre / Especial (Cobrança Individual)
                    </span>
                  </label>
                  <p className="text-[10px] text-purple-700/80 dark:text-purple-300/70">
                    Se ativado, o item é cobrado à parte conforme o valor de tabela cadastrado acima, mesmo nas taças maiores.
                  </p>
                </div>
              </div>
            ) : collection === 'bases' ? (
              <div className="space-y-3 pt-2">
                <div className="p-3.5 border border-purple-150 dark:border-white/10 rounded-xl bg-purple-50/30 dark:bg-white/5 space-y-1">
                  <h4 className="text-xs font-bold text-purple-950 dark:text-white">Regras de Base & Cremes</h4>
                  <p className="text-[10px] text-purple-700/80 dark:text-purple-300/70">
                    Bases e cremes gelados (Açaí, Cupuaçu, Pitaya) são montados conforme o limite de cremes da taça escolhida pelo cliente.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-purple-950 dark:text-white text-xs">Opções:</h3>
                  <button
                    type="button"
                    onClick={handleOpenNewOptionModel}
                    className="text-purple-700 dark:text-pink-400 hover:underline font-bold text-xs cursor-pointer flex-shrink-0"
                  >
                    Modelos de Opções
                  </button>
                </div>

                {isSuperAdmin && (
                  <div className="space-y-1">
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        handleSelectAndLinkModel(e.target.value)
                        e.target.value = ''
                      }}
                      className="w-full h-9 px-3 text-xs border border-purple-200 dark:border-white/15 rounded-xl bg-white dark:bg-white/5 text-purple-900 dark:text-purple-200 focus:outline-none cursor-pointer font-medium"
                    >
                      <option value="" disabled>
                        Clique para vincular um modelo de opção
                      </option>
                      {allAvailableModels.map((m: OptionModelData) => (
                        <option key={m.id} value={m.id}>
                          {m.name}{m.active === false ? ' (Invisível)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* LISTA DE MODELOS DE OPCIONAIS VINCULADOS (CLEAN & COMPACTO) */}
                <div className="space-y-2.5">
                  {linkedOptionGroups.length === 0 ? (
                    <div className="text-center py-6 px-4 border border-dashed border-purple-200 dark:border-white/10 rounded-2xl bg-purple-50/20 dark:bg-white/[0.02]">
                      <p className="text-xs text-purple-600 dark:text-purple-300 font-medium">
                        Nenhum modelo de opções vinculado a este produto.
                      </p>
                      <p className="text-[10px] text-purple-400 dark:text-purple-300/60 mt-1">
                        Selecione um modelo no campo acima para vincular.
                      </p>
                    </div>
                  ) : (
                    linkedOptionGroups.map((grp, idx) => {
                      const isGroupActive = grp.active !== false
                      const groupId = grp.id || grp.name
                      const optionsList = grp.options || []
                      const isDragging = draggedGroupId === groupId

                      return (
                        <div
                          key={groupId}
                          draggable={isSuperAdmin}
                          onDragStart={(e) => handleDragStartGroup(e, groupId)}
                          onDragOver={(e) => {
                            e.preventDefault()
                            e.dataTransfer.dropEffect = 'move'
                          }}
                          onDragEnd={() => setDraggedGroupId(null)}
                          onDrop={(e) => handleDropGroup(e, groupId)}
                          className={`rounded-xl border transition-all overflow-hidden p-3 flex items-center justify-between select-none ${isDragging
                              ? 'opacity-40 border-purple-500 border-dashed bg-purple-50/50 dark:bg-purple-950/20'
                              : isGroupActive
                                ? 'border-purple-150 dark:border-white/10 bg-white dark:bg-white/5 shadow-xs hover:border-purple-300 dark:hover:border-white/20'
                                : 'border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/[0.02] opacity-75'
                            }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <div
                              className="cursor-grab active:cursor-grabbing p-1 text-purple-400 hover:text-purple-700 dark:text-purple-300/40 dark:hover:text-white transition shrink-0"
                              title="Arrastar para reordenar"
                            >
                              <GripVertical className="h-4 w-4 shrink-0" />
                            </div>
                            <span className={`font-bold text-xs truncate ${isGroupActive ? 'text-purple-950 dark:text-white' : 'line-through text-zinc-400'}`}>
                              {grp.name}
                            </span>
                            <span className="text-[10px] font-mono text-purple-600 dark:text-pink-300 font-bold flex-shrink-0">
                              ({optionsList.length} itens)
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {isSuperAdmin && (
                              <div className="flex items-center gap-0.5 mr-1">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveGroup(idx, 'up')}
                                  className="p-1 text-purple-600 dark:text-purple-300 hover:text-purple-950 dark:hover:text-white hover:bg-purple-100/70 dark:hover:bg-white/10 rounded-md cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition"
                                  title="Mover para cima"
                                >
                                  <ChevronUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === linkedOptionGroups.length - 1}
                                  onClick={() => handleMoveGroup(idx, 'down')}
                                  className="p-1 text-purple-600 dark:text-purple-300 hover:text-purple-950 dark:hover:text-white hover:bg-purple-100/70 dark:hover:bg-white/10 rounded-md cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition"
                                  title="Mover para baixo"
                                >
                                  <ChevronDown className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}

                            {/* Alternar visibilidade do grupo na loja */}
                            <button
                              type="button"
                              onClick={() => handleToggleGroupActive(grp.id, grp.name)}
                              className="p-1 rounded-md hover:bg-purple-100/70 dark:hover:bg-white/10 transition cursor-pointer"
                              title={isGroupActive ? 'Grupo Ativo na Loja' : 'Grupo Oculto na Loja'}
                            >
                              {isGroupActive ? (
                                <Eye className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-red-500" />
                              )}
                            </button>

                            {/* Botão Editar Modelo - Franqueadora (completo) e Franquias (apenas visibilidade dos itens) */}
                            <button
                              type="button"
                              onClick={() => handleEditOptionModel(grp)}
                              className="p-1 text-purple-700 dark:text-purple-300 hover:text-purple-950 dark:hover:text-white hover:bg-purple-100/70 dark:hover:bg-white/10 rounded-md cursor-pointer transition"
                              title={isSuperAdmin ? "Editar Modelo de Opções" : "Gerir Visibilidade dos Itens"}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>

                            {isSuperAdmin && (
                              <button
                                type="button"
                                onClick={() => handleUnlinkGroup(grp.id, grp.name)}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md cursor-pointer transition"
                                title="Desvincular Modelo deste Produto"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {!isSuperAdmin && (
                              <span className="text-[10px] text-purple-700 dark:text-purple-300/70 font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-white/5 border border-purple-200 dark:border-white/10">
                                {isGroupActive ? 'Ativo' : 'Oculto'}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </form>

        <div className="p-4 px-6 bg-purple-50/50 dark:bg-white/5 border-t border-purple-100 dark:border-white/10 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {!isSuperAdmin && (
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 px-2.5 py-1 rounded-lg flex items-center gap-1">
                <span>🔒 Modo Franquia — Apenas visibilidade local</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isSuperAdmin && (
              <button
                type="button"
                onClick={() => setFranchiseRequestOpen(true)}
                className="px-3.5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl cursor-pointer shadow-sm transition flex items-center gap-1.5"
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>Solicitar Ajuste à Franqueadora</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-xs font-bold text-purple-900 dark:text-purple-200 bg-white dark:bg-white/5 border border-purple-200 dark:border-white/15 rounded-xl hover:bg-purple-100 dark:hover:bg-white/10 cursor-pointer transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSubmit}
              className="px-6 py-2 text-xs font-extrabold text-white bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 rounded-xl cursor-pointer shadow-md shadow-purple-700/20 dark:shadow-pink-600/30 transition"
            >
              {saving ? 'Guardando...' : item ? 'Guardar Alterações' : 'Criar Produto'}
            </button>
          </div>
        </div>
      </DialogContent>

      <FranchiseRequestDialog
        open={franchiseRequestOpen}
        onOpenChange={setFranchiseRequestOpen}
        tenantId={effectiveTenant || user?.tenantId || ''}
        catalog={catalog}
        initialItem={item}
        initialType="PRICE_CHANGE"
      />

      <OptionModelDialog
        open={optionModelOpen}
        onOpenChange={setOptionModelOpen}
        initialModel={editingModel}
        isSuperAdmin={isSuperAdmin}
        onSave={(savedModel) => {
          handleSaveOptionModel(savedModel)
          setDbOptionModels((prev) => {
            const idx = prev.findIndex((m) => m.id === savedModel.id || m.name === savedModel.name)
            if (idx >= 0) {
              const copy = [...prev]
              copy[idx] = savedModel
              return copy
            }
            return [...prev, savedModel]
          })
        }}
      />
      <OptionModelsManagerDialog
        open={optionModelsManagerOpen}
        onOpenChange={setOptionModelsManagerOpen}
        models={allAvailableModels}
        onSaveModels={(updatedModels) => {
          setDbOptionModels(updatedModels)
          // Se algum modelo atualmente vinculado foi editado, atualiza na lista vinculada
          setLinkedOptionGroups((prev) =>
            prev.map((grp) => {
              const matched = updatedModels.find((m) => m.id === grp.id || m.name === grp.name)
              return matched ? { ...matched, active: grp.active } : grp
            })
          )
        }}
        isSuperAdmin={isSuperAdmin}
        tenantId={effectiveTenant}
      />
    </Dialog>
  )
}
