'use client'

import React, { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Search, Edit2, Copy, Trash2, Eye, EyeOff } from 'lucide-react'
import OptionModelDialog, { OptionModelData } from './OptionModelDialog'

interface OptionModelsManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  models: OptionModelData[]
  onSaveModels: (models: OptionModelData[]) => void
  isSuperAdmin?: boolean
}

export default function OptionModelsManagerDialog({
  open,
  onOpenChange,
  models,
  onSaveModels,
  isSuperAdmin = true,
}: OptionModelsManagerDialogProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [editingModel, setEditingModel] = useState<OptionModelData | null>(null)
  const [modelFormOpen, setModelFormOpen] = useState(false)

  // Estado para confirmação de duplicação
  const [modelToDuplicate, setModelToDuplicate] = useState<OptionModelData | null>(null)
  const [duplicateConfirmOpen, setDuplicateConfirmOpen] = useState(false)

  // Filtragem de modelos pela busca
  const filteredModels = useMemo(() => {
    if (!searchTerm.trim()) return models
    const term = searchTerm.toLowerCase().trim()
    return models.filter((m) => m.name.toLowerCase().includes(term))
  }, [models, searchTerm])

  const handleOpenCreateModel = () => {
    setEditingModel(null)
    setModelFormOpen(true)
  }

  const handleOpenEditModel = (model: OptionModelData) => {
    setEditingModel(model)
    setModelFormOpen(true)
  }

  const handleSaveModel = (savedModel: OptionModelData) => {
    const existingIndex = models.findIndex((m) => m.id === savedModel.id)
    let updated: OptionModelData[]
    if (existingIndex >= 0) {
      updated = [...models]
      updated[existingIndex] = savedModel
      toast.success(`Modelo "${savedModel.name}" atualizado com sucesso!`)
    } else {
      updated = [...models, savedModel]
      toast.success(`Modelo "${savedModel.name}" criado com sucesso!`)
    }
    onSaveModels(updated)
    setModelFormOpen(false)
  }

  const handlePromptDuplicate = (model: OptionModelData) => {
    setModelToDuplicate(model)
    setDuplicateConfirmOpen(true)
  }

  const handleConfirmDuplicate = () => {
    if (!modelToDuplicate) return

    const newId = `model-${Date.now()}`
    const duplicated: OptionModelData = {
      ...modelToDuplicate,
      id: newId,
      name: `${modelToDuplicate.name} (Cópia)`,
      options: (modelToDuplicate.options || []).map((opt, idx) => ({
        ...opt,
        id: `opt-${Date.now()}-${idx}`,
      })),
    }

    const updated = [...models, duplicated]
    onSaveModels(updated)
    toast.success(`Modelo duplicado como "${duplicated.name}"!`)
    setDuplicateConfirmOpen(false)
    setModelToDuplicate(null)
  }

  const handleDeleteModel = (modelId?: string) => {
    if (!modelId) return
    const updated = models.filter((m) => m.id !== modelId)
    onSaveModels(updated)
    toast.success('Modelo de opções excluído com sucesso!')
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
                return (
                  <div
                    key={m.id || m.name}
                    className="p-3 px-4 rounded-2xl border border-purple-150 dark:border-white/10 bg-white dark:bg-white/5 hover:border-purple-300 dark:hover:border-white/20 transition flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-purple-950 dark:text-white truncate">
                        {m.name}
                      </div>
                      <div className="text-[10px] text-purple-600 dark:text-purple-300/70 font-mono mt-0.5">
                        {itemCount} {itemCount === 1 ? 'item cadastrado' : 'itens cadastrados'} · {m.priceType === 'Individual' ? 'Adicional Pago (€)' : 'Incluso'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                        Visível
                      </span>

                      {isSuperAdmin && (
                        <>
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
    </>
  )
}
