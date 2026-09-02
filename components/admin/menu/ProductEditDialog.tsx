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
} from 'lucide-react'
import OptionModelDialog, { OptionModelData } from './OptionModelDialog'
import { useMenuConfigStore } from '@/lib/stores/menuConfigStore'

interface ProductEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collection: 'containers' | 'bases' | 'toppings'
  item: any
  catalog?: any
  onSave: (collection: string, item: any) => Promise<void>
}

// Monta os modelos de opções dinamicamente a partir dos itens reais do PostgreSQL (sem seeds/mocks)
export function buildDynamicOptionGroups(catalog?: any, item?: any): (OptionModelData & { active?: boolean })[] {
  const bases = catalog?.bases || []
  const toppings = catalog?.toppings || []
  const weight = item?.weightGrams || 500

  const defaultBasesMax = weight === 250 ? 1 : weight === 350 ? 2 : weight === 1000 ? 4 : 3
  const defaultFrutasMax = weight === 250 ? 2 : weight === 350 ? 3 : 999
  const defaultToppingsMax = weight === 250 ? 3 : weight === 350 ? 4 : 999

  const basesMax = item?.limiteBases !== undefined && item?.limiteBases !== null ? Number(item.limiteBases) : defaultBasesMax
  const frutasMax = item?.limiteFrutas !== undefined && item?.limiteFrutas !== null ? Number(item.limiteFrutas) : defaultFrutasMax
  const toppingsMax = item?.limiteToppings !== undefined && item?.limiteToppings !== null ? Number(item.limiteToppings) : defaultToppingsMax

  return [
    {
      id: 'model-bases',
      name: 'Escolha seu creme ou base gelada',
      priceType: 'Gratis',
      minQty: item?.minBases ?? 1,
      maxQty: basesMax,
      isRequired: (item?.minBases ?? 1) > 0,
      active: true,
      options: bases.map((b: any) => ({
        id: b.id,
        name: b.name,
        code: b.code || '',
        price: 0,
        description: b.description || '',
        active: b.active !== false && b.isAvailableInStore !== false,
      })),
    },
    {
      id: 'model-frutas',
      name: 'Frutas Frescas Selecionadas',
      priceType: 'Gratis',
      minQty: item?.minFrutas ?? 0,
      maxQty: frutasMax,
      isRequired: (item?.minFrutas ?? 0) > 0,
      active: true,
      options: toppings
        .filter((t: any) => t.category === 'Frutas')
        .map((f: any) => ({
          id: f.id,
          name: f.name,
          code: f.code || '',
          price: f.precoExtra || 0,
          description: f.description || '',
          active: f.active !== false && f.isAvailableInStore !== false,
        })),
    },
    {
      id: 'model-toppings',
      name: 'Toppings & Crocantes Tradicionais',
      priceType: 'Gratis',
      minQty: item?.minToppings ?? 0,
      maxQty: toppingsMax,
      isRequired: (item?.minToppings ?? 0) > 0,
      active: true,
      options: toppings
        .filter((t: any) => t.category === 'Toppings' || t.category === 'Cereais')
        .map((t: any) => ({
          id: t.id,
          name: t.name,
          code: t.code || '',
          price: t.precoExtra || 0,
          description: t.description || '',
          active: t.active !== false && t.isAvailableInStore !== false,
        })),
    },
    {
      id: 'model-caldas',
      name: 'Caldas Nobres & Premium',
      priceType: 'Individual',
      minQty: item?.minCaldas ?? 0,
      maxQty: item?.maxCaldas ?? 10,
      isRequired: false,
      active: true,
      options: toppings
        .filter((t: any) => t.isPremium || t.category === 'Adicionais' || t.category === 'Doces' || t.category === 'Premium')
        .map((c: any) => ({
          id: c.id,
          name: c.name,
          code: c.code || '',
          price: c.precoExtra || c.price || 1.5,
          description: c.description || '',
          active: c.active !== false && c.isAvailableInStore !== false,
        })),
    },
  ]
}

import { canManageMasterCatalog } from '@/lib/utils/permissions'

export default function ProductEditDialog({
  open,
  onOpenChange,
  collection,
  item,
  catalog,
  onSave,
}: ProductEditDialogProps) {
  const { user } = useAuthStore()
  const isSuperAdmin = canManageMasterCatalog(user, item?.tenantId)
  const { categories } = useMenuConfigStore()

  const dynamicAvailableModels = useMemo(
    () => buildDynamicOptionGroups(catalog, item),
    [catalog, item]
  )

  const getInitialCategory = (prod: any) => {
    if (prod?.category) return prod.category
    if (prod?.weightGrams === 250 || prod?.name?.includes('250')) return 'AÇAÍ 250G'
    if (prod?.weightGrams === 350 || prod?.name?.includes('350')) return 'AÇAÍ 350G'
    if (prod?.weightGrams === 500 || prod?.name?.includes('500')) return 'AÇAÍ 500G'
    if (prod?.weightGrams === 750 || prod?.name?.includes('750')) return 'AÇAÍ 750G'
    if (prod?.weightGrams === 1000 || prod?.name?.includes('1')) return 'AÇAÍ 1 KG'
    return 'AÇAÍ 500G'
  }

  const [form, setForm] = useState<any>({
    name: '',
    description: '',
    category: 'AÇAÍ 500G',
    price: 12.9,
    code: '2885',
    image: '',
    videoUrl: '',
    availableHours: { days: [0, 1, 2, 3, 4, 5, 6], startTime: '00:00', endTime: '23:59' },
  })
  const [saving, setSaving] = useState(false)
  const [optionModelOpen, setOptionModelOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<OptionModelData | null>(null)
  const [showImageInput, setShowImageInput] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isVideo = file.type.startsWith('video/')
    const reader = new FileReader()

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      if (isVideo) {
        setForm((prev: any) => ({
          ...prev,
          videoUrl: dataUrl,
          image: prev.image || '',
        }))
        toast.success('Vídeo de apresentação vinculado com sucesso!')
      } else {
        setForm((prev: any) => ({
          ...prev,
          image: dataUrl,
        }))
        toast.success('Imagem de apresentação vinculada com sucesso!')
      }
    }

    reader.readAsDataURL(file)
  }

  // Estado para controlar quais grupos de opções estão expandidos (colapsáveis)
  // Por padrão, todos iniciam fechados (colapsados)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const [linkedOptionGroups, setLinkedOptionGroups] = useState<(OptionModelData & { active?: boolean })[]>([])

  useEffect(() => {
    // Ao abrir ou trocar de item, garante que todos os grupos iniciem fechados
    setExpandedGroups({})

    if (item) {
      if (item.optionGroups && item.optionGroups.length > 0) {
        setLinkedOptionGroups(item.optionGroups)
      } else {
        setLinkedOptionGroups(buildDynamicOptionGroups(catalog, item))
      }
      setForm({
        name: item.name || '',
        description: item.description || '',
        category: item.category || getInitialCategory(item),
        price: item.precoExtra !== undefined ? Number(item.precoExtra) : (item.precoBase || item.price || 12.9),
        isPremium: !!item.isPremium,
        code: item.code || '2885',
        image: item.image || item.imageUrl || '',
        videoUrl: item.videoUrl || '',
        availableHours: item.availableHours || { days: [0, 1, 2, 3, 4, 5, 6], startTime: '00:00', endTime: '23:59' },
      })
    } else {
      setLinkedOptionGroups(buildDynamicOptionGroups(catalog, null))
      setForm({
        name: '',
        description: '',
        category: collection === 'toppings' ? 'Frutas' : collection === 'bases' ? 'Bases' : 'AÇAÍ 500G',
        price: collection === 'toppings' ? 0.0 : collection === 'bases' ? 0.0 : 12.9,
        isPremium: false,
        code: '2885',
        image: '',
        videoUrl: '',
        availableHours: { days: [0, 1, 2, 3, 4, 5, 6], startTime: '00:00', endTime: '23:59' },
      })
    }
  }, [item, collection, catalog, open])

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
        availableHours: form.availableHours,
      }

      if (isTopping) {
        payload.category = form.category || 'Toppings'
        payload.precoExtra = Number(form.price) || 0
        payload.price = Number(form.price) || 0
        payload.isPremium = !!form.isPremium
      } else if (isBase) {
        payload.precoExtra = 0
      } else {
        payload.precoBase = Number(form.price)
        payload.price = Number(form.price)
        payload.category = form.category
        payload.optionGroups = linkedOptionGroups

        // Extrai os limites configurados nos grupos para salvar no container
        const basesGroup = linkedOptionGroups.find(
          (g) => g.id === 'model-bases' || g.name.toLowerCase().includes('base') || g.name.toLowerCase().includes('creme')
        )
        const toppingsGroup = linkedOptionGroups.find(
          (g) => g.id === 'model-toppings' || g.name.toLowerCase().includes('topping')
        )
        const frutasGroup = linkedOptionGroups.find(
          (g) => g.id === 'model-frutas' || g.name.toLowerCase().includes('fruta')
        )

        if (basesGroup && basesGroup.maxQty !== undefined) {
          payload.limiteBases = Number(basesGroup.maxQty)
        }
        if (toppingsGroup && toppingsGroup.maxQty !== undefined) {
          payload.limiteToppings = Number(toppingsGroup.maxQty)
        }
        if (frutasGroup && frutasGroup.maxQty !== undefined) {
          payload.limiteFrutas = Number(frutasGroup.maxQty)
        }
      }

      await onSave(collection, payload)
      toast.success(`"${form.name}" salvo com sucesso!`)
      onOpenChange(false)
    } catch {
      toast.error('Erro ao salvar produto')
    } finally {
      setSaving(false)
    }
  }

  const handleOpenNewOptionModel = () => {
    if (!isSuperAdmin) return
    setEditingModel(null)
    setOptionModelOpen(true)
  }

  const handleEditOptionModel = (group: OptionModelData) => {
    if (!isSuperAdmin) return
    setEditingModel(group)
    setOptionModelOpen(true)
  }

  const handleSaveOptionModel = (savedModel: OptionModelData) => {
    setLinkedOptionGroups((prev) => {
      const exists = prev.find((g) => g.id === savedModel.id || g.name === savedModel.name)
      if (exists) {
        return prev.map((g) => (g.id === savedModel.id || g.name === savedModel.name ? { ...savedModel, active: true } : g))
      }
      return [...prev, { ...savedModel, active: true }]
    })
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
    const found = dynamicAvailableModels.find((m: OptionModelData) => m.id === modelId)
    if (!found) return
    handleSaveOptionModel(found)
    toast.success(`Modelo "${found.name}" vinculado com sucesso!`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[90vh] flex flex-col p-0 bg-white dark:bg-[#160228] text-slate-900 dark:text-white border border-purple-100 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xl [&>button]:hidden">
        <div className="p-4 px-6 border-b border-purple-100 dark:border-white/10 bg-purple-50/50 dark:bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-sm font-black text-purple-950 dark:text-white tracking-tight">
              {isSuperAdmin ? 'Editar Produto — Franqueadora Master' : 'Detalhes do Produto — Filial'}
            </DialogTitle>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
              isSuperAdmin
                ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-700/50'
                : 'bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/15'
            }`}>
              {isSuperAdmin ? 'Modo Master' : 'Visualização de Filial'}
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
              <strong>Edição de Filial:</strong> Você pode personalizar a foto, descrição e visibilidade de cada opcional. Nome e preço de tabela são padronizados pela Franqueadora.
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
                  onClick={triggerFileSelect}
                  className="h-20 flex-1 border border-dashed border-purple-200 dark:border-white/20 rounded-xl flex flex-col items-center justify-center text-center p-2 transition bg-purple-50/20 dark:bg-white/5 hover:bg-purple-50/40 dark:hover:bg-white/10 cursor-pointer"
                >
                  <span className="text-[10px] font-black text-purple-950 dark:text-white uppercase tracking-wider">
                    Carregar Ficheiro
                  </span>
                  <span className="text-[8px] text-purple-700/80 dark:text-purple-300/70 mt-0.5 leading-tight">
                    Selecione um vídeo ou imagem da sua galeria
                  </span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="video/*,image/*"
                    className="hidden"
                  />
                </div>
              </div>
              <div className="pt-1">
                <input
                  type="text"
                  value={form.videoUrl || form.image || ''}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val.endsWith('.mp4') || val.endsWith('.webm') || val.includes('/videos/')) {
                      setForm({ ...form, videoUrl: val, image: form.image || '' })
                    } else {
                      setForm({ ...form, image: val })
                    }
                  }}
                  placeholder="Ou cole a URL direta de imagem ou vídeo..."
                  className="w-full h-8 px-2.5 text-[11px] border border-purple-200 dark:border-white/15 rounded-lg bg-white dark:bg-white/5 text-purple-950 dark:text-white"
                />
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
                className={`h-9 text-xs rounded-lg font-bold border-purple-200 dark:border-white/15 ${
                  isSuperAdmin
                    ? 'bg-white dark:bg-white/5 text-purple-950 dark:text-white'
                    : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 cursor-not-allowed'
                }`}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-purple-950 dark:text-white">Descrição Oficial:</Label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Descrição dos ingredientes e regras..."
                className="w-full p-2.5 text-xs border border-purple-200 dark:border-white/15 rounded-lg focus:outline-none bg-white dark:bg-white/5 text-purple-950 dark:text-white focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-purple-950 dark:text-white">Categoria:</Label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full h-9 px-2.5 text-xs border border-purple-200 dark:border-white/15 rounded-lg font-bold bg-white dark:bg-[#160228] text-purple-950 dark:text-white focus:ring-1 focus:ring-purple-500 cursor-pointer"
              >
                <optgroup label="Tamanhos de Açaí">
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Complementos">
                  <option value="BASES & CREMES">BASES & CREMES</option>
                  <option value="FRUTAS FRESCAS">FRUTAS FRESCAS</option>
                  <option value="TOPPINGS & CROCANTES">TOPPINGS & CROCANTES</option>
                  <option value="CALDAS PREMIUM">CALDAS NOBRES</option>
                </optgroup>
              </select>
            </div>



            <div className="space-y-2">
              <Label className="text-xs font-bold text-purple-950 dark:text-white">Horário de Disponibilidade:</Label>
              <div className="flex flex-wrap gap-1">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((dayName, idx) => {
                  const active = form.availableHours?.days?.includes(idx)
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const currentDays = form.availableHours?.days || []
                        const nextDays = currentDays.includes(idx)
                          ? currentDays.filter((d: number) => d !== idx)
                          : [...currentDays, idx]
                        setForm({
                          ...form,
                          availableHours: {
                            ...form.availableHours,
                            days: nextDays
                          }
                        })
                      }}
                      className={`h-7 w-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        active
                          ? 'bg-purple-600 text-white font-black'
                          : 'bg-purple-50 dark:bg-white/5 text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-white/10'
                      }`}
                    >
                      {dayName}
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 space-y-0.5">
                  <span className="text-[10px] text-purple-700 dark:text-purple-300 font-bold">Início</span>
                  <input
                    type="time"
                    value={form.availableHours?.startTime || '00:00'}
                    onChange={(e) => setForm({
                      ...form,
                      availableHours: {
                        ...form.availableHours,
                        startTime: e.target.value
                      }
                    })}
                    className="w-full h-8 px-2 text-xs border border-purple-200 dark:border-white/15 rounded-lg bg-white dark:bg-white/5 text-purple-950 dark:text-white focus:outline-none"
                  />
                </div>
                <div className="flex-1 space-y-0.5">
                  <span className="text-[10px] text-purple-700 dark:text-purple-300 font-bold">Fim</span>
                  <input
                    type="time"
                    value={form.availableHours?.endTime || '23:59'}
                    onChange={(e) => setForm({
                      ...form,
                      availableHours: {
                        ...form.availableHours,
                        endTime: e.target.value
                      }
                    })}
                    className="w-full h-8 px-2 text-xs border border-purple-200 dark:border-white/15 rounded-lg bg-white dark:bg-white/5 text-purple-950 dark:text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* LADO DIREITO: PREÇO & GRUPOS DE OPCIONAIS COLAPSÁVEIS COM CONTROLE DE VISIBILIDADE */}
          <div className="p-6 md:w-[54%] space-y-4">
            <div className="space-y-2">
              <h3 className="font-bold text-purple-950 dark:text-white text-xs">Preço de Tabela:</h3>
              <div className="p-3.5 border border-purple-100 dark:border-white/10 rounded-xl bg-purple-50/40 dark:bg-white/5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-purple-950 dark:text-white">{form.name || 'Produto'}</div>
                  <div className="text-[11px] text-purple-700 dark:text-purple-300/70">
                    {isSuperAdmin ? 'Preço Master Sugerido' : 'Preço Oficial Fixado pela Franqueadora'}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-purple-900 dark:text-purple-200">€</span>
                  <input
                    type="number"
                    step="0.01"
                    disabled={!isSuperAdmin}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className={`w-20 h-8 px-2 text-xs font-bold font-mono border rounded-lg ${
                      isSuperAdmin
                        ? 'border-purple-300 dark:border-white/20 bg-white dark:bg-white/10 text-purple-950 dark:text-white'
                        : 'border-zinc-300 dark:border-white/10 bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 cursor-not-allowed text-right'
                    }`}
                  />
                  {!isSuperAdmin && <Lock className="h-3 w-3 text-zinc-400" />}
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
                  <div>
                    <h3 className="font-bold text-purple-950 dark:text-white text-xs">Grupos de Opcionais Vinculados:</h3>
                    <p className="text-[10px] text-purple-600/80 dark:text-purple-300/70">
                      Clique no grupo para expandir e gerenciar a visibilidade de cada item na loja
                    </p>
                  </div>
                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={handleOpenNewOptionModel}
                      className="text-purple-700 dark:text-pink-400 hover:underline font-bold text-xs cursor-pointer flex-shrink-0"
                    >
                      + Novo Modelo
                    </button>
                  )}
                </div>

              {isSuperAdmin && (
                <div className="space-y-1">
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      handleSelectAndLinkModel(e.target.value)
                      e.target.value = ''
                    }}
                    className="w-full h-8 px-2 text-xs border border-purple-200 dark:border-white/15 rounded-lg bg-white dark:bg-white/5 text-purple-900 dark:text-purple-200 focus:outline-none cursor-pointer"
                  >
                    <option value="" disabled>
                      [ Selecionar modelo para vincular ]
                    </option>
                    {dynamicAvailableModels.map((m: OptionModelData) => (
                      <option key={m.id} value={m.id}>
                        + {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* LISTA DE GRUPOS COLAPSÁVEIS COM ITENS INTERNOS */}
              <div className="space-y-2.5">
                {linkedOptionGroups.map((grp) => {
                  const isGroupActive = grp.active !== false
                  const groupId = grp.id || grp.name
                  const isExpanded = expandedGroups[groupId] ?? false
                  const optionsList = grp.options || []

                  return (
                    <div
                      key={groupId}
                      className={`rounded-xl border transition-all overflow-hidden ${
                        isGroupActive
                          ? 'border-purple-150 dark:border-white/10 bg-white dark:bg-white/5'
                          : 'border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/[0.02] opacity-75'
                      }`}
                    >
                      {/* CABEÇALHO DO GRUPO (CLICÁVEL PARA EXPANDIR / COLAPSAR) */}
                      <div
                        onClick={() => toggleGroupExpanded(groupId)}
                        className="p-3 flex items-center justify-between cursor-pointer hover:bg-purple-50/50 dark:hover:bg-white/5 select-none"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span className="text-purple-600 dark:text-pink-400">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </span>
                          <span className={`font-bold text-xs truncate ${isGroupActive ? 'text-purple-950 dark:text-white' : 'line-through text-zinc-400'}`}>
                            {grp.name}
                          </span>
                          <span className="text-[10px] font-mono text-purple-500/80 dark:text-purple-300/60 flex-shrink-0">
                            ({optionsList.length} itens)
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          {/* Alternar visibilidade do grupo inteiro */}
                          <button
                            type="button"
                            onClick={() => handleToggleGroupActive(grp.id, grp.name)}
                            className="p-1 rounded-md hover:bg-purple-100/70 dark:hover:bg-white/10 transition cursor-pointer"
                            title={isGroupActive ? 'Grupo Visível (Clique para ocultar)' : 'Grupo Oculto (Clique para exibir)'}
                          >
                            {isGroupActive ? (
                              <Eye className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-red-500" />
                            )}
                          </button>

                          {isSuperAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleEditOptionModel(grp)}
                                className="p-1 text-purple-600 dark:text-purple-300 hover:text-purple-950 dark:hover:text-white rounded-md cursor-pointer"
                                title="Editar Modelo"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUnlinkGroup(grp.id, grp.name)}
                                className="p-1 text-red-500 hover:text-red-700 rounded-md cursor-pointer"
                                title="Desvincular"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}

                          {!isSuperAdmin && (
                            <span className="text-[10px] text-purple-700 dark:text-purple-300/70 font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-white/5 border border-purple-200 dark:border-white/10">
                              {isGroupActive ? 'Ativo' : 'Oculto'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* REGRAS DO MODELO DE OPÇÕES NESTE TAMANHO (OBRIGATÓRIO, MÍN E MÁX) */}
                      <div className="px-3 py-1.5 bg-purple-50/70 dark:bg-white/5 border-t border-purple-100 dark:border-white/10 flex items-center justify-between gap-3 text-[11px] flex-wrap">
                        <label className="flex items-center gap-1.5 cursor-pointer font-bold text-purple-950 dark:text-white select-none">
                          <input
                            type="checkbox"
                            checked={grp.isRequired ?? false}
                            onChange={(e) => handleUpdateGroupRules(groupId, { isRequired: e.target.checked })}
                            className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                          <span>Obrigatório</span>
                        </label>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <span className="text-purple-700 dark:text-purple-300 font-medium">Mín:</span>
                            <input
                              type="number"
                              min="0"
                              value={grp.minQty === undefined || grp.minQty === null ? '' : grp.minQty}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10)
                                handleUpdateGroupRules(groupId, { minQty: isNaN(val) ? 0 : Math.max(0, val) })
                              }}
                              className="w-12 h-6 px-1 text-center font-mono font-bold text-xs bg-white dark:bg-white/10 border border-purple-200 dark:border-white/20 rounded-md text-purple-950 dark:text-white"
                            />
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-purple-700 dark:text-purple-300 font-medium">Máx:</span>
                            <input
                              type="number"
                              min="0"
                              value={grp.maxQty === undefined || grp.maxQty === null ? '' : grp.maxQty}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10)
                                handleUpdateGroupRules(groupId, { maxQty: isNaN(val) ? 0 : Math.max(0, val) })
                              }}
                              className="w-12 h-6 px-1 text-center font-mono font-bold text-xs bg-white dark:bg-white/10 border border-purple-200 dark:border-white/20 rounded-md text-purple-950 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* CONTEÚDO EXPANDIDO: ITENS DO GRUPO COM CONTROLE DE VISIBILIDADE */}
                      {isExpanded && (
                        <div className="p-2.5 pt-0 space-y-1.5 border-t border-purple-100 dark:border-white/10 bg-purple-50/30 dark:bg-black/20">
                          {optionsList.length === 0 ? (
                            <p className="text-[11px] text-zinc-400 italic p-2">Nenhum item cadastrado neste grupo.</p>
                          ) : (
                            optionsList.map((opt) => {
                              const isOptActive = opt.active !== false
                              return (
                                <div
                                  key={opt.id || opt.name}
                                  className={`p-2 rounded-lg border flex items-center justify-between gap-2 transition ${
                                    isOptActive
                                      ? 'border-purple-100 dark:border-white/10 bg-white dark:bg-white/5'
                                      : 'border-zinc-200 dark:border-white/5 bg-zinc-100/50 dark:bg-white/[0.02] opacity-60'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className={`text-xs font-semibold truncate ${isOptActive ? 'text-purple-950 dark:text-white' : 'line-through text-zinc-400'}`}>
                                      {opt.name}
                                    </span>
                                    {opt.price !== undefined && Number(opt.price) > 0 && (
                                      <span className="text-[10px] font-mono font-bold text-purple-700 dark:text-pink-300">
                                        + € {Number(opt.price).toFixed(2).replace('.', ',')}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleOptionItemActive(groupId, opt.id)}
                                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full border transition cursor-pointer ${
                                        isOptActive
                                          ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100'
                                          : 'bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30 hover:bg-red-100'
                                      }`}
                                      title="Clique para alternar a visibilidade desta opção na loja"
                                    >
                                      {isOptActive ? 'Visível' : 'Invisível'}
                                    </button>
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          </div>
        </form>

        <div className="p-4 px-6 bg-purple-50/50 dark:bg-white/5 border-t border-purple-100 dark:border-white/10 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-xs font-bold text-purple-900 dark:text-purple-200 bg-white dark:bg-white/5 border border-purple-200 dark:border-white/15 rounded-xl hover:bg-purple-100 dark:hover:bg-white/10 cursor-pointer transition"
          >
            {isSuperAdmin ? 'Cancelar' : 'Fechar'}
          </button>
          {isSuperAdmin && (
            <button
              type="button"
              disabled={saving}
              onClick={handleSubmit}
              className="px-6 py-2 text-xs font-extrabold text-white bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 rounded-xl cursor-pointer shadow-md shadow-purple-700/20 dark:shadow-pink-600/30 transition"
            >
              {saving ? 'Guardando...' : 'Guardar Alterações'}
            </button>
          )}
        </div>
      </DialogContent>

      {isSuperAdmin && (
        <OptionModelDialog
          open={optionModelOpen}
          onOpenChange={setOptionModelOpen}
          initialModel={editingModel}
          onSave={handleSaveOptionModel}
        />
      )}
    </Dialog>
  )
}
