'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Search, Edit2, Copy, Trash2, Eye, EyeOff, SlidersHorizontal, Building2 } from 'lucide-react'
import OptionModelDialog, { OptionModelData } from './OptionModelDialog'
import FranchiseRequestDialog from './FranchiseRequestDialog'
import { useAuthStore } from '@/lib/stores/authStore'
import { usePublishStore } from '@/lib/stores/publishStore'
import { FIGUEIRA_HQ_ID } from '@/lib/utils/permissions'

interface OptionModelsManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  models: OptionModelData[]
  onSaveModels: (models: OptionModelData[]) => void
  isSuperAdmin?: boolean
  tenantId?: string
}

export default function OptionModelsManagerDialog({
  open,
  onOpenChange,
  models,
  onSaveModels,
  isSuperAdmin = true,
  tenantId,
}: OptionModelsManagerDialogProps) {
  const { authFetch } = useAuthStore()
  const markDirty = usePublishStore((state) => state.markDirty)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingModel, setEditingModel] = useState<OptionModelData | null>(null)
  const [modelFormOpen, setModelFormOpen] = useState(false)
  const [franchiseRequestOpen, setFranchiseRequestOpen] = useState(false)
  const [requestTargetModel, setRequestTargetModel] = useState<OptionModelData | null>(null)
  const [internalModels, setInternalModels] = useState<OptionModelData[]>(models)

  // Sincroniza sempre que a prop 'models' mudar
  useEffect(() => {
    if (models && models.length > 0) {
      setInternalModels((prev) => {
        const combined = [...models]
        for (const p of prev) {
          if (!combined.some((c) => c.id === p.id || c.name === p.name)) {
            combined.push(p)
          }
        }
        return combined
      })
    }
  }, [models])

  // Busca modelos persistidos no PostgreSQL
  const fetchOptionModels = useCallback(async () => {
    try {
      const effectiveTenant = tenantId || FIGUEIRA_HQ_ID
      const res = await authFetch(`/api/option-models?tenantId=${encodeURIComponent(effectiveTenant)}`)
      if (res.ok) {
        const dbModels = await res.json()
        if (Array.isArray(dbModels)) {
          setInternalModels((prev) => {
            const combined = [...dbModels]
            for (const item of (models.length > 0 ? models : prev)) {
              if (!combined.some((c) => c.id === item.id || c.name === item.name)) {
                combined.push(item)
              }
            }
            onSaveModels(combined)
            return combined
          })
        }
      }
    } catch (e) {
      console.error('Erro ao buscar modelos de opções do banco:', e)
    }
  }, [authFetch, tenantId, models, onSaveModels])

  useEffect(() => {
    if (open) {
      fetchOptionModels()
    }
  }, [open, fetchOptionModels])

  // Estado para confirmação de duplicação
  const [modelToDuplicate, setModelToDuplicate] = useState<OptionModelData | null>(null)
  const [duplicateConfirmOpen, setDuplicateConfirmOpen] = useState(false)

  // Filtragem de modelos pela busca
  const filteredModels = useMemo(() => {
    if (!searchTerm.trim()) return internalModels
    const term = searchTerm.toLowerCase().trim()
    return internalModels.filter((m) => m.name.toLowerCase().includes(term))
  }, [internalModels, searchTerm])

  const handleOpenCreateModel = () => {
    setEditingModel(null)
    setModelFormOpen(true)
  }

  const handleOpenEditModel = (model: OptionModelData) => {
    setEditingModel(model)
    setModelFormOpen(true)
  }

  const handleSaveModel = async (savedModel: OptionModelData) => {
    const isNew = !savedModel.id || savedModel.id.startsWith('model-')
    const effectiveTenant = tenantId || FIGUEIRA_HQ_ID

    try {
      if (isNew) {
        const res = await authFetch(`/api/option-models?tenantId=${encodeURIComponent(effectiveTenant)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...savedModel, tenantId: effectiveTenant }),
        })
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || 'Erro ao criar modelo de opção no servidor')
        }
        const created = await res.json()
        savedModel = { ...savedModel, id: created.id }
      } else {
        const res = await authFetch(`/api/option-models/${savedModel.id}?tenantId=${encodeURIComponent(effectiveTenant)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...savedModel, tenantId: effectiveTenant }),
        })
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || 'Erro ao atualizar modelo de opção no servidor')
        }
        const updatedRes = await res.json()
        savedModel = { ...savedModel, ...updatedRes }
      }

      toast.success(isNew ? `Modelo "${savedModel.name}" criado com sucesso!` : `Modelo "${savedModel.name}" atualizado com sucesso!`)

      setInternalModels((prev) => {
        const idx = prev.findIndex((m) => m.id === savedModel.id || m.name === savedModel.name)
        let nextList: OptionModelData[]
        if (idx >= 0) {
          nextList = [...prev]
          nextList[idx] = savedModel
        } else {
          nextList = [...prev, savedModel]
        }
        onSaveModels(nextList)
        return nextList
      })

      if (tenantId) {
        markDirty(tenantId, `Modelo de opções "${savedModel.name}" alterado`, authFetch)
      }
      setModelFormOpen(false)
    } catch (e: any) {
      console.error('Erro ao sincronizar modelo no servidor:', e)
      toast.error(e.message || 'Erro ao salvar modelo')
    }
  }

  const handlePromptDuplicate = (model: OptionModelData) => {
    setModelToDuplicate(model)
    setDuplicateConfirmOpen(true)
  }

  const handleConfirmDuplicate = async () => {
    if (!modelToDuplicate) return

    const effectiveTenant = tenantId || FIGUEIRA_HQ_ID
    const newId = `model-${Date.now()}`
    let duplicated: OptionModelData = {
      ...modelToDuplicate,
      id: newId,
      name: `${modelToDuplicate.name} (Cópia)`,
      options: (modelToDuplicate.options || []).map((opt, idx) => ({
        ...opt,
        id: `opt-${Date.now()}-${idx}`,
      })),
    }

    try {
      const res = await authFetch(`/api/option-models?tenantId=${encodeURIComponent(effectiveTenant)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...duplicated, tenantId: effectiveTenant }),
      })
      if (res.ok) {
        const created = await res.json()
        duplicated = { ...duplicated, id: created.id }
      }
    } catch (e) {
      console.error('Erro ao persistir duplicação:', e)
    }

    setInternalModels((prev) => {
      const updated = [...prev, duplicated]
      onSaveModels(updated)
      return updated
    })
    if (tenantId) {
      markDirty(tenantId, `Modelo de opções "${duplicated.name}" duplicado`, authFetch)
    }
    toast.success(`Modelo duplicado como "${duplicated.name}"!`)
    setDuplicateConfirmOpen(false)
    setModelToDuplicate(null)
  }

  const handleDeleteModel = async (modelId?: string) => {
    if (!modelId) return
    const effectiveTenant = tenantId || FIGUEIRA_HQ_ID
    try {
      if (modelId.length === 36) {
        const res = await authFetch(`/api/option-models/${modelId}?tenantId=${encodeURIComponent(effectiveTenant)}`, { method: 'DELETE' })
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || 'Erro ao excluir modelo de opção')
        }
      }
      setInternalModels((prev) => {
        const updated = prev.filter((m) => m.id !== modelId)
        onSaveModels(updated)
        return updated
      })
      if (tenantId) {
        markDirty(tenantId, 'Modelo de opções excluído', authFetch)
      }
      toast.success('Modelo de opções excluído com sucesso!')
    } catch (e: any) {
      console.error('Erro ao excluir modelo:', e)
      toast.error(e.message || 'Erro ao excluir modelo')
    }
  }

  const handleToggleModelActive = async (model: OptionModelData) => {
    const isCurrentlyActive = model.active !== false
    const nextActive = !isCurrentlyActive
    const updatedModel: OptionModelData = { ...model, active: nextActive }

    // Atualização otimista
    setInternalModels((prev) => prev.map((m) => (m.id === model.id ? updatedModel : m)))
    onSaveModels(internalModels.map((m) => (m.id === model.id ? updatedModel : m)))

    if (model.id && !model.id.startsWith('model-')) {
      try {
        const effectiveTenant = tenantId || FIGUEIRA_HQ_ID
        const res = await authFetch(`/api/option-models/${model.id}?tenantId=${encodeURIComponent(effectiveTenant)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...model, active: nextActive }),
        })
        if (!res.ok) {
          toast.error('Erro ao atualizar visibilidade no servidor')
          fetchOptionModels()
        } else {
          toast.success(nextActive ? `Modelo "${model.name}" agora está visível.` : `Modelo "${model.name}" ocultado (invisível em todos os produtos vinculados).`)
          if (tenantId) {
            markDirty(tenantId, `Visibilidade do modelo "${model.name}" alterada`, authFetch)
          }
        }
      } catch (e) {
        console.error('Erro ao alternar visibilidade do modelo:', e)
        toast.error('Falha de rede ao alterar visibilidade')
        fetchOptionModels()
      }
    } else {
      toast.success(nextActive ? `Modelo "${model.name}" visível.` : `Modelo "${model.name}" ocultado.`)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] sm:w-full max-w-2xl sm:max-w-3xl p-0 bg-white dark:bg-[#160228] text-slate-900 dark:text-white rounded-3xl border border-purple-200 dark:border-white/15 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col [&>button]:hidden">
          {/* Header */}
          <div className="p-4 px-6 border-b border-purple-100 dark:border-white/10 bg-purple-50/50 dark:bg-white/5 flex items-center justify-between">
            <DialogTitle className="text-base font-black text-purple-950 dark:text-white tracking-tight">
              Modelos de Opções
            </DialogTitle>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-xs font-bold text-purple-700 dark:text-purple-300 hover:text-purple-950 dark:hover:text-white cursor-pointer px-2.5 py-1 rounded-lg hover:bg-purple-100/50 dark:hover:bg-white/10 transition"
            >
              Fechar
            </button>
          </div>

          {/* Barra de Pesquisa */}
          <div className="p-5 pb-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquise por um modelo de opções..."
                className="pl-10 h-10 text-xs rounded-xl bg-white dark:bg-white/10 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white font-medium"
              />
            </div>
          </div>

          {/* Lista de Modelos */}
          <div className="px-5 pb-5 flex-1 overflow-y-auto space-y-2">
            {filteredModels.length === 0 ? (
              <div className="text-center py-10 text-xs text-purple-400 font-medium">
                Nenhum modelo de opções encontrado.
              </div>
            ) : (
              filteredModels.map((m) => {
                const itemCount = (m.options || []).length
                const isModelActive = m.active !== false
                return (
                  <div
                    key={m.id || m.name}
                    className={`p-3 px-4 rounded-2xl border transition flex items-center justify-between gap-3 shadow-xs ${!isModelActive
                        ? 'border-amber-200/70 dark:border-amber-500/20 bg-amber-50/20 dark:bg-amber-950/10 opacity-75'
                        : 'border-purple-150 dark:border-white/10 bg-white dark:bg-white/5 hover:border-purple-300 dark:hover:border-white/20'
                      }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className={`font-bold text-xs truncate ${!isModelActive ? 'line-through text-zinc-500 dark:text-zinc-400' : 'text-purple-950 dark:text-white'}`}>
                        {m.name}
                      </div>
                      <div className="text-[10px] text-purple-600 dark:text-purple-300/70 font-mono mt-0.5">
                        {itemCount} {itemCount === 1 ? 'item cadastrado' : 'itens cadastrados'} · {m.priceType === 'Individual' ? 'Adicional Pago (€)' : 'Incluso'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isSuperAdmin ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleToggleModelActive(m)}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border transition cursor-pointer ${isModelActive
                                ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/30'
                                : 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-500/30'
                              }`}
                            title={isModelActive ? 'Modelo Ativo (Visível nos Produtos) — Clique para Ocultar' : 'Modelo Oculto (Invisível nos Produtos) — Clique para Ativar'}
                          >
                            {isModelActive ? (
                              <>
                                <Eye className="w-3 h-3" />
                                <span>Visível</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3" />
                                <span>Invisível</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditModel(m)}
                            className="p-1.5 text-purple-700 dark:text-purple-300 hover:text-purple-950 dark:hover:text-white hover:bg-purple-100/70 dark:hover:bg-white/10 rounded-lg cursor-pointer transition"
                            title="Editar Modelo"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePromptDuplicate(m)}
                            className="p-1.5 text-purple-700 dark:text-purple-300 hover:text-purple-950 dark:hover:text-white hover:bg-purple-100/70 dark:hover:bg-white/10 rounded-lg cursor-pointer transition"
                            title="Duplicar Modelo"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteModel(m.id)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg cursor-pointer transition"
                            title="Excluir Modelo"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setRequestTargetModel(m)
                            setFranchiseRequestOpen(true)
                          }}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold flex items-center gap-1 border transition cursor-pointer shadow-xs ${isModelActive
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-500/30'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-500/30'
                            }`}
                          title={isModelActive ? 'Solicitar à Franqueadora Master a desativação deste opcional na sua loja' : 'Solicitar à Franqueadora Master a reativação deste opcional na sua loja'}
                        >
                          <Building2 className="w-3 h-3" />
                          <span>{isModelActive ? 'Solicitar Desativação' : 'Solicitar Reativação'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Rodapé */}
          <div className="p-4 px-6 bg-purple-50/50 dark:bg-white/5 border-t border-purple-100 dark:border-white/10 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-xs font-bold text-purple-900 dark:text-purple-200 bg-white dark:bg-white/5 border border-purple-200 dark:border-white/15 rounded-xl hover:bg-purple-100 dark:hover:bg-white/10 cursor-pointer transition"
            >
              Fechar
            </button>

            {isSuperAdmin && (
              <button
                type="button"
                onClick={handleOpenCreateModel}
                className="px-5 py-2 text-xs font-extrabold text-white bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-800 hover:to-pink-700 rounded-xl cursor-pointer shadow-md shadow-purple-700/20 transition"
              >
                Criar Modelo
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição / Criação de Modelo */}
      {modelFormOpen && (
        <OptionModelDialog
          open={modelFormOpen}
          onOpenChange={setModelFormOpen}
          initialModel={editingModel}
          onSave={handleSaveModel}
        />
      )}

      {/* Modal de Confirmação de Duplicação */}
      <Dialog open={duplicateConfirmOpen} onOpenChange={setDuplicateConfirmOpen}>
        <DialogContent className="w-[90vw] max-w-md p-6 bg-white dark:bg-[#160228] text-slate-900 dark:text-white rounded-3xl border border-purple-200 dark:border-white/15 shadow-2xl">
          <DialogTitle className="text-base font-black text-purple-950 dark:text-white">
            Duplicar Modelo de Opções
          </DialogTitle>
          <p className="text-xs text-purple-700/80 dark:text-purple-200/80 mt-2">
            Deseja realmente duplicar o modelo de opções{' '}
            <strong className="text-purple-950 dark:text-white font-black">
              &quot;{modelToDuplicate?.name}&quot;
            </strong>?
          </p>
          <div className="mt-6 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setDuplicateConfirmOpen(false)}
              className="px-4 py-2 text-xs font-bold text-purple-900 dark:text-purple-200 bg-purple-50 dark:bg-white/5 border border-purple-200 dark:border-white/15 rounded-xl hover:bg-purple-100 dark:hover:bg-white/10 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmDuplicate}
              className="px-5 py-2 text-xs font-black text-white bg-purple-700 hover:bg-purple-800 dark:bg-pink-600 dark:hover:bg-pink-700 rounded-xl cursor-pointer shadow-md"
            >
              Duplicar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Solicitação da Franquia à Franqueadora */}
      {franchiseRequestOpen && (
        <FranchiseRequestDialog
          open={franchiseRequestOpen}
          onOpenChange={setFranchiseRequestOpen}
          tenantId={tenantId || ''}
          initialType="ITEM_AVAILABILITY"
          initialItem={{
            id: requestTargetModel?.id,
            name: requestTargetModel?.name,
          }}
        />
      )}
    </>
  )
}
