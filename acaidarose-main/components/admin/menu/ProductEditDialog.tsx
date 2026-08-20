'use client'

import React, { useState, useEffect } from 'react'
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
  Plus,
  HelpCircle,
  Camera,
  Lock,
} from 'lucide-react'
import OptionModelDialog, { OptionModelData } from './OptionModelDialog'
import { useMenuConfigStore } from '@/lib/stores/menuConfigStore'

interface ProductEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collection: 'containers' | 'bases' | 'toppings'
  item: any
  onSave: (collection: string, item: any) => Promise<void>
}

// Modelos de Opções Globais Disponíveis para Vincular
const AVAILABLE_OPTION_MODELS: (OptionModelData & { active?: boolean })[] = [
  {
    id: 'model-bases',
    name: 'Escolha seu creme/base preferido (10 Sabores)',
    priceType: 'Gratis',
    minQty: 1,
    maxQty: 2,
    isRequired: true,
    active: true,
    options: [
      { id: 'b-1', name: 'Açaí Tradicional Especial', code: '101', price: 0.00, description: 'Batido puro na hora', active: true },
      { id: 'b-2', name: 'Creme de Morango Artesanal', code: '102', price: 0.00, description: 'Creme com morangos frescos', active: true },
      { id: 'b-3', name: 'Creme de Leite Ninho', code: '103', price: 0.00, description: 'Creme aveludado de Ninho', active: true },
    ],
  },
  {
    id: 'model-frutas',
    name: 'Deseja adicionar frutas frescas selecionadas?',
    priceType: 'Gratis',
    minQty: 0,
    maxQty: 3,
    isRequired: false,
    active: true,
    options: [
      { id: 'f-1', name: 'Morango Fresco', code: '201', price: 0.00, description: 'Fruta cortada fresca', active: true },
      { id: 'f-2', name: 'Banana Fatiada', code: '202', price: 0.00, description: 'Banana fresca', active: true },
      { id: 'f-3', name: 'Kiwi Especial', code: '203', price: 0.00, description: 'Kiwi em fatias', active: true },
      { id: 'f-4', name: 'Manga Doce', code: '204', price: 0.00, description: 'Manga madura em cubos', active: true },
    ],
  },
  {
    id: 'model-toppings',
    name: 'Quais toppings & crocantes tradicionais?',
    priceType: 'Gratis',
    minQty: 0,
    maxQty: 4,
    isRequired: false,
    active: true,
    options: [
      { id: 't-1', name: 'Granola Tradicional Crocante', code: '301', price: 0.00, description: 'Granola dourada crocante', active: true },
      { id: 't-2', name: 'Leite Ninho em Pó', code: '302', price: 0.00, description: 'Leite em pó puro', active: true },
      { id: 't-3', name: 'Paçoca de Amendoim', code: '303', price: 0.00, description: 'Paçoca esfarelada', active: true },
      { id: 't-4', name: 'Chocoball Crocante', code: '304', price: 0.00, description: 'Bolinhas crocantes de chocolate', active: true },
    ],
  },
  {
    id: 'model-caldas',
    name: 'Deseja adicionar caldas nobres?',
    priceType: 'Individual',
    minQty: 0,
    maxQty: 3,
    isRequired: false,
    active: true,
    options: [
      { id: 'c-1', name: 'Nutella Original', code: '401', price: 1.00, description: 'Creme de avelã com cacau puro', active: true },
      { id: 'c-2', name: 'Creme de Leite Ninho Nobre', code: '402', price: 1.00, description: 'Creme aveludado de Ninho', active: true },
      { id: 'c-3', name: 'Pasta de Pistache Artesanal', code: '403', price: 1.20, description: 'Pasta nobre de pistache italiano', active: true },
    ],
  },
]

export default function ProductEditDialog({
  open,
  onOpenChange,
  collection,
  item,
  onSave,
}: ProductEditDialogProps) {
  const { user } = useAuthStore()
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const { categories } = useMenuConfigStore()

  // Determina categoria automática com base no copo
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
    minQty: 1,
    maxQty: '',
    price: 12.90,
    code: '2885',
    image: '',
    blockCart: false,
    novelty: false,
    servingSize: '1 Pessoa',
  })
  const [saving, setSaving] = useState(false)
  const [optionModelOpen, setOptionModelOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<OptionModelData | null>(null)
  const [showImageInput, setShowImageInput] = useState(false)

  // Grupos de Opções Vinculados a este produto com estado de visibilidade
  const [linkedOptionGroups, setLinkedOptionGroups] = useState<(OptionModelData & { active?: boolean })[]>(AVAILABLE_OPTION_MODELS)

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name || '',
        description: item.description || (item.weightGrams ? `${item.weightGrams}g com regras de personalização.` : ''),
        category: getInitialCategory(item),
        minQty: 1,
        maxQty: '',
        price: item.precoBase || item.price || 12.90,
        code: item.code || '2885',
        image: item.image || '',
        blockCart: false,
        novelty: item.isNew || false,
        servingSize: item.weightGrams >= 1000 ? 'Família (Partilhar)' : item.weightGrams >= 500 ? '1 a 2 Pessoas' : '1 Pessoa',
      })
    }
  }, [item])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(collection, {
        ...item,
        name: form.name,
        description: form.description,
        image: form.image,
        code: form.code,
        precoBase: Number(form.price),
        category: form.category,
      })
      toast.success(`"${form.name}" salvo com sucesso!`)
      onOpenChange(false)
    } catch {
      toast.error('Erro ao salvar produto')
    } finally {
      setSaving(false)
    }
  }

  // Abre modal em BRANCO para criar novo modelo de opções
  const handleOpenNewOptionModel = () => {
    setEditingModel(null)
    setOptionModelOpen(true)
  }

  // Abre modal com dados para EDITAR um modelo de opções existente
  const handleEditOptionModel = (group: OptionModelData) => {
    setEditingModel(group)
    setOptionModelOpen(true)
  }

  // Salva o modelo criado/editado e vincula ao produto
  const handleSaveOptionModel = (savedModel: OptionModelData) => {
    setLinkedOptionGroups((prev) => {
      const exists = prev.find((g) => g.id === savedModel.id || g.name === savedModel.name)
      if (exists) {
        return prev.map((g) => (g.id === savedModel.id || g.name === savedModel.name ? { ...savedModel, active: true } : g))
      }
      return [...prev, { ...savedModel, active: true }]
    })
  }

  // Alterna ativação/pausa de um grupo de opções no produto
  const handleToggleGroupActive = (groupId?: string, groupName?: string) => {
    setLinkedOptionGroups((prev) =>
      prev.map((g) => {
        if ((groupId && g.id === groupId) || g.name === groupName) {
          const next = g.active === false ? true : false
          toast.success(next ? `Opcional "${g.name}" ativado no produto!` : `Opcional "${g.name}" pausado no produto.`)
          return { ...g, active: next }
        }
        return g
      })
    )
  }

  // Remove / Desvincula o grupo de opções deste produto
  const handleUnlinkGroup = (groupId?: string, groupName?: string) => {
    setLinkedOptionGroups((prev) => prev.filter((g) => (groupId ? g.id !== groupId : g.name !== groupName)))
    toast.success('Modelo de opção desvinculado deste produto.')
  }

  // Vincula um modelo selecionado do dropdown
  const handleSelectAndLinkModel = (modelId: string) => {
    if (!modelId) return
    const found = AVAILABLE_OPTION_MODELS.find((m) => m.id === modelId)
    if (found) {
      if (linkedOptionGroups.some((g) => g.id === found.id)) {
        toast.info('Este modelo de opções já está vinculado a este produto.')
        return
      }
      setLinkedOptionGroups((prev) => [...prev, { ...found, active: true }])
      toast.success(`"${found.name}" vinculado com sucesso!`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 bg-white rounded-md border border-zinc-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200">
          <DialogTitle className="text-base font-bold text-zinc-800">
            {item?.id ? 'Editar Item' : 'Adicionar Novo Item'}
          </DialogTitle>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-zinc-200 text-xs">
          {/* COLUNA ESQUERDA: DADOS DO AÇAÍ */}
          <div className="p-6 md:w-[48%] space-y-4">
            {/* Fotos */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between font-bold text-zinc-700">
                <div className="flex items-center gap-1">
                  <span>Fotos:</span>
                  <HelpCircle className="h-3.5 w-3.5 text-zinc-400" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowImageInput(!showImageInput)}
                  className="text-[11px] text-blue-600 hover:underline font-normal cursor-pointer"
                >
                  {showImageInput ? 'Ocultar link' : 'Alterar URL da foto'}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-20 w-20 rounded-md overflow-hidden bg-zinc-100 border border-zinc-200 flex-shrink-0 relative">
                  {form.image ? (
                    <img src={form.image} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-zinc-400">
                      <Camera className="h-6 w-6" />
                    </div>
                  )}
                </div>

                <div
                  onClick={() => setShowImageInput(true)}
                  className="h-20 w-24 border border-dashed border-zinc-300 rounded-md flex flex-col items-center justify-center gap-1 text-[10px] font-bold text-zinc-500 hover:bg-zinc-50 cursor-pointer text-center p-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>ADICIONAR FOTO</span>
                </div>
              </div>

              {showImageInput && (
                <div className="space-y-1 pt-1">
                  <Label className="text-[10px] font-bold text-zinc-600">URL da Imagem:</Label>
                  <Input
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    placeholder="https://exemplo.com/foto-acai.jpg"
                    className="h-8 text-xs border-zinc-300 rounded-sm font-mono"
                  />
                </div>
              )}
            </div>

            {/* Nome */}
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-zinc-700">Nome:</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Açaí 500g"
                className="h-9 text-xs border-zinc-300 rounded-sm font-bold"
              />
            </div>

            {/* Descrição */}
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-zinc-700">Descrição:</Label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Escolha o tamanho e acompanhamentos..."
                className="w-full p-2 text-xs border border-zinc-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[10px] text-zinc-400 italic">Produtos com uma boa descrição vendem 50% mais!</p>
            </div>

            {/* Categoria */}
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-zinc-700">Categoria:</Label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full h-9 px-2 text-xs border border-zinc-300 rounded-sm bg-white focus:outline-none font-bold text-zinc-800"
              >
                {/* Categorias Principais de Copos de Açaí */}
                <optgroup label="🍨 Copos & Tamanhos de Açaí">
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.emoji ? `${c.emoji} ` : ''}{c.name}
                    </option>
                  ))}
                </optgroup>

                {/* Categorias de Complementos e Adicionais */}
                <optgroup label="✨ Complementos & Acompanhamentos">
                  <option value="BASES & CREMES">🟣 BASES & CREMES (10 SABORES)</option>
                  <option value="FRUTAS FRESCAS">🍓 FRUTAS FRESCAS SELECIONADAS</option>
                  <option value="TOPPINGS & CROCANTES">🥣 TOPPINGS & CROCANTES (17 OPÇÕES)</option>
                  <option value="CALDAS PREMIUM">🍫 CALDAS NOBRES PREMIUM</option>
                </optgroup>
              </select>
            </div>

            {/* Qtd. mínima & Qtd. máxima */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-zinc-700">Qtd. mínima</Label>
                <Input
                  type="number"
                  value={form.minQty}
                  onChange={(e) => setForm({ ...form, minQty: e.target.value })}
                  className="h-8 text-xs border-zinc-300 rounded-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-zinc-700">Qtd. máxima:</Label>
                <Input
                  type="number"
                  value={form.maxQty}
                  onChange={(e) => setForm({ ...form, maxQty: e.target.value })}
                  className="h-8 text-xs border-zinc-300 rounded-sm"
                />
              </div>
            </div>

            {/* Checkboxes Específicos de Açaí */}
            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-700 select-none">
                <input
                  type="checkbox"
                  checked={!!form.blockCart}
                  onChange={(e) => setForm({ ...form, blockCart: e.target.checked })}
                  className="h-3.5 w-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Bloquear adicionar ao carrinho</span>
                <HelpCircle className="h-3 w-3 text-zinc-400" />
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-zinc-700 select-none">
                <input
                  type="checkbox"
                  checked={!!form.novelty}
                  onChange={(e) => setForm({ ...form, novelty: e.target.checked })}
                  className="h-3.5 w-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Novidade / Destaque de Verão</span>
              </label>
            </div>

            {/* Prato atende a */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] text-zinc-700 font-bold">Prato atende a:</Label>
                <select
                  value={form.servingSize}
                  onChange={(e) => setForm({ ...form, servingSize: e.target.value })}
                  className="h-8 px-2 text-xs border border-zinc-300 rounded-sm bg-white"
                >
                  <option value="1 Pessoa">1 Pessoa (250g - 350g)</option>
                  <option value="1 a 2 Pessoas">1 a 2 Pessoas (500g - 750g)</option>
                  <option value="Família (Partilhar)">Família / Partilhar (1 Kg)</option>
                </select>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: PRODUTOS & OPÇÕES */}
          <div className="p-6 md:w-[52%] space-y-6">
            {/* SEÇÃO PRODUTOS */}
            <div className="space-y-3">
              <h3 className="font-bold text-zinc-800 text-xs">Produtos:</h3>

              <div className="p-3 border border-zinc-200 rounded-md bg-zinc-50/40 space-y-2.5">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-3.5 w-3.5 text-zinc-400 cursor-grab" />
                  
                  {/* Foto Thumbnail Real */}
                  <div className="h-8 w-8 rounded overflow-hidden bg-zinc-200 border border-zinc-300 flex-shrink-0">
                    <img
                      src={form.image || 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&auto=format&fit=crop&q=80'}
                      alt="Thumbnail"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Campo Código ERP / SKU */}
                  <div className="flex items-center border border-zinc-300 rounded-sm bg-white overflow-hidden px-2 h-8" title="Código ERP / Identificador no PDV">
                    <span className="text-[10px] text-zinc-400 font-bold mr-1.5 select-none">Cód:</span>
                    <input
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value })}
                      placeholder="2885"
                      className="w-14 text-xs font-mono font-bold text-zinc-800 bg-transparent focus:outline-none"
                    />
                  </div>

                  {/* Preço (€): Somente a Franqueadora Altera */}
                  <div className={`flex items-center border border-zinc-300 rounded-sm overflow-hidden px-2 h-8 ${
                    isSuperAdmin ? 'bg-white' : 'bg-zinc-100'
                  }`} title={isSuperAdmin ? 'Preço Master da Franqueadora' : 'Somente a Franqueadora pode alterar o preço base'}>
                    <span className="text-[10px] text-zinc-400 font-bold mr-1 select-none">€</span>
                    <input
                      type="number"
                      step="0.01"
                      disabled={!isSuperAdmin}
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className={`w-14 text-xs font-bold font-mono bg-transparent focus:outline-none ${
                        isSuperAdmin ? 'text-zinc-900' : 'text-zinc-500 cursor-not-allowed'
                      }`}
                    />
                    {!isSuperAdmin && (
                      <Lock className="h-3 w-3 text-zinc-400 ml-1 pointer-events-none" />
                    )}
                  </div>

                  <Eye className="h-3.5 w-3.5 text-zinc-500" />
                  <Trash2 className="h-3.5 w-3.5 text-zinc-400 hover:text-red-500 cursor-pointer" />
                </div>

                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Descrição do item"
                  rows={2}
                  className="w-full p-2 text-xs border border-zinc-200 rounded-sm bg-white focus:outline-none"
                />

                <div className="flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={handleOpenNewOptionModel}
                    className="text-blue-600 hover:underline font-medium cursor-pointer"
                  >
                    + Vincular opcional
                  </button>

                  {!isSuperAdmin && (
                    <span className="text-[10px] text-amber-700 italic">
                      * Preço base gerenciado pela Franqueadora
                    </span>
                  )}
                </div>
              </div>

              {isSuperAdmin && (
                <button
                  type="button"
                  className="px-3 py-1.5 bg-[#0066ff] hover:bg-[#0052cc] text-white font-bold rounded-sm text-xs flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Adicionar Item</span>
                </button>
              )}
            </div>

            {/* SEÇÃO OPÇÕES (VINCULAÇÃO E GESTÃO DE MODELOS) */}
            <div className="space-y-3 pt-3 border-t border-zinc-200">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-zinc-800 text-xs">Opções:</h3>
                <button
                  type="button"
                  onClick={handleOpenNewOptionModel}
                  className="text-blue-600 hover:underline font-bold text-xs cursor-pointer"
                >
                  + Modelo de Opções
                </button>
              </div>

              {/* Seletor Dropdown Interativo de Modelos Disponíveis */}
              <div className="space-y-1">
                <select
                  defaultValue=""
                  onChange={(e) => {
                    handleSelectAndLinkModel(e.target.value)
                    e.target.value = ''
                  }}
                  className="w-full h-9 px-2 text-xs border border-zinc-300 rounded-sm bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="" disabled>
                    [ Clique para vincular um modelo de opção ]
                  </option>
                  {AVAILABLE_OPTION_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      + {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lista de Grupos de Opções Vinculados com Ações 100% Funcionais */}
              <div className="space-y-2 pt-1">
                {linkedOptionGroups.map((grp) => {
                  const isActive = grp.active !== false
                  return (
                    <div
                      key={grp.id || grp.name}
                      className={`py-2 px-3 border rounded-sm flex items-center justify-between transition ${
                        isActive
                          ? 'border-zinc-200 bg-white hover:bg-zinc-50'
                          : 'border-zinc-200 bg-zinc-100/70 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-medium text-zinc-800 truncate">
                        <GripVertical className="h-3.5 w-3.5 text-zinc-400 cursor-grab flex-shrink-0" />
                        <span className={`truncate ${isActive ? 'text-zinc-800' : 'line-through text-zinc-400'}`}>
                          {grp.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-zinc-400 flex-shrink-0 ml-2">
                        {/* 1. Olhinho: Ativar / Pausar Opcional */}
                        <button
                          type="button"
                          onClick={() => handleToggleGroupActive(grp.id, grp.name)}
                          className="p-0.5 hover:text-zinc-700 cursor-pointer"
                          title={isActive ? '🟢 Ativo no produto (Clique para pausar)' : '🔴 Pausado no produto (Clique para ativar)'}
                        >
                          {isActive ? (
                            <Eye className="h-3.5 w-3.5 text-emerald-600 hover:text-emerald-700" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5 text-red-500 hover:text-red-600" />
                          )}
                        </button>

                        {/* 2. Lápis: Editar dados e complementos do modelo */}
                        <button
                          type="button"
                          onClick={() => handleEditOptionModel(grp)}
                          className="p-0.5 hover:text-blue-600 cursor-pointer"
                          title="Editar Modelo de Opções"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        {/* 3. Lixeira: Desvincular deste produto */}
                        <button
                          type="button"
                          onClick={() => handleUnlinkGroup(grp.id, grp.name)}
                          className="p-0.5 hover:text-red-500 cursor-pointer"
                          title="Desvincular deste Produto"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </form>

        {/* Rodapé */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-300 rounded-sm hover:bg-zinc-100 cursor-pointer uppercase shadow-2xs"
          >
            FECHAR
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSubmit}
            className="px-6 py-2 text-xs font-bold text-white bg-[#0066ff] hover:bg-[#0052cc] rounded-sm cursor-pointer uppercase shadow-xs"
          >
            {saving ? 'SALVANDO...' : 'SALVAR'}
          </button>
        </div>
      </DialogContent>

      {/* Modal de Modelo de Opções */}
      <OptionModelDialog
        open={optionModelOpen}
        onOpenChange={setOptionModelOpen}
        initialModel={editingModel}
        onSave={handleSaveOptionModel}
      />
    </Dialog>
  )
}
