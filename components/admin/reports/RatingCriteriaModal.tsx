'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Trash2,
  Pencil,
  AlertTriangle,
  RefreshCw,
  GripVertical,
  Utensils,
  CupSoda,
  Home,
  UserCheck,
  Music,
  CheckCircle2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'

interface RatingCriteriaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  onUpdated?: () => void
}

export interface Criterion {
  id: string
  tenantId?: string | null
  code: string
  title: string
  displayOrder: number
  active: boolean
}

// Mapeamento de ícones sóbrios para os critérios canônicos
function getCriterionIcon(title: string) {
  const t = title.toLowerCase()
  if (t.includes('comida') || t.includes('alimento')) return Utensils
  if (t.includes('bebida') || t.includes('copo')) return CupSoda
  if (t.includes('ambiente') || t.includes('sala') || t.includes('espaço')) return Home
  if (t.includes('atendimento') || t.includes('equipa') || t.includes('serviço')) return UserCheck
  if (t.includes('música') || t.includes('musica') || t.includes('som')) return Music
  return CheckCircle2
}

export default function RatingCriteriaModal({
  open,
  onOpenChange,
  tenantId,
  onUpdated,
}: RatingCriteriaModalProps) {
  const { user } = useAuthStore()
  const isMaster = user?.role === 'SUPER_ADMIN' || user?.role === 'FRANCHISOR_ADMIN'

  const [criteria, setCriteria] = useState<Criterion[]>([])
  const [loading, setLoading] = useState(false)

  // Diálogo para Adicionar / Editar Critério (Formulário Limpo em PT-PT)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingCriterion, setEditingCriterion] = useState<Criterion | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [submittingForm, setSubmittingForm] = useState(false)

  // Modal de Segurança para Exclusão (Zero window.confirm nativo)
  const [securityModalOpen, setSecurityModalOpen] = useState(false)
  const [criterionToDelete, setCriterionToDelete] = useState<Criterion | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Alternar visibilidade em andamento
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchCriteria = async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/ratings/criteria?loja=${encodeURIComponent(tenantId)}`)
      const data = await res.json()
      if (Array.isArray(data.criteria)) {
        setCriteria(
          data.criteria.map((c: any, idx: number) => ({
            id: c.id,
            tenantId: c.tenantId,
            code: c.code || `CRIT_${idx + 1}`,
            title: c.title || c.name || '',
            displayOrder: c.displayOrder || idx + 1,
            active: c.active !== false,
          }))
        )
      }
    } catch {
      toast.error('Erro ao carregar critérios de avaliação')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchCriteria()
    }
  }, [open, tenantId])

  // Abre formulário para novo critério
  const handleOpenCreate = () => {
    setEditingCriterion(null)
    setFormTitle('')
    setFormModalOpen(true)
  }

  // Abre formulário para editar critério existente
  const handleOpenEdit = (item: Criterion) => {
    setEditingCriterion(item)
    setFormTitle(item.title)
    setFormModalOpen(true)
  }

  // Grava critério (novo ou edição) diretamente na API
  const handleSaveCriterion = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmedTitle = formTitle.trim()
    if (!trimmedTitle) {
      toast.error('Informe o nome do critério em português')
      return
    }

    setSubmittingForm(true)
    try {
      if (editingCriterion) {
        // Atualização via PUT
        const res = await fetch('/api/ratings/criteria', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingCriterion.id,
            title: trimmedTitle,
            active: editingCriterion.active,
          }),
        })

        if (!res.ok) throw new Error('Falha ao atualizar critério')

        toast.success(`Critério «${trimmedTitle}» atualizado com sucesso!`)
      } else {
        // Criação via POST unitário
        const res = await fetch('/api/ratings/criteria', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId: isMaster && !tenantId ? null : tenantId,
            title: trimmedTitle,
            active: true,
            displayOrder: criteria.length + 1,
          }),
        })

        if (!res.ok) throw new Error('Falha ao criar critério')

        toast.success(`Critério «${trimmedTitle}» adicionado à lista!`)
      }

      setFormModalOpen(false)
      setEditingCriterion(null)
      setFormTitle('')
      await fetchCriteria()
      if (onUpdated) onUpdated()
    } catch (err: any) {
      toast.error(err.message || 'Falha ao guardar critério')
    } finally {
      setSubmittingForm(false)
    }
  }

  // Alterna visibilidade (Visível / Oculto) instantaneamente
  const handleToggleActive = async (item: Criterion) => {
    setTogglingId(item.id)
    const nextState = !item.active

    // Otimista
    setCriteria((prev) =>
      prev.map((c) => (c.id === item.id ? { ...c, active: nextState } : c))
    )

    try {
      const res = await fetch('/api/ratings/criteria', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          active: nextState,
        }),
      })

      if (!res.ok) throw new Error()

      toast.success(
        nextState
          ? `Critério «${item.title}» visível na pesquisa`
          : `Critério «${item.title}» ocultado da pesquisa`
      )
      if (onUpdated) onUpdated()
    } catch {
      // Reverter
      setCriteria((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, active: item.active } : c))
      )
      toast.error('Não foi possível alterar a visibilidade do critério')
    } finally {
      setTogglingId(null)
    }
  }

  // Abre Modal de Segurança para exclusão
  const handleOpenDelete = (item: Criterion) => {
    setCriterionToDelete(item)
    setSecurityModalOpen(true)
  }

  // Confirma exclusão sem nenhum window.confirm
  const handleConfirmDelete = async () => {
    if (!criterionToDelete) return
    setDeleting(true)

    try {
      const res = await fetch(
        `/api/ratings/criteria?id=${encodeURIComponent(criterionToDelete.id)}&loja=${encodeURIComponent(tenantId)}`,
        { method: 'DELETE' }
      )

      if (!res.ok) throw new Error('Falha ao eliminar critério no servidor')

      toast.success(`Critério «${criterionToDelete.title}» eliminado com sucesso!`)
      setSecurityModalOpen(false)
      setCriterionToDelete(null)
      await fetchCriteria()
      if (onUpdated) onUpdated()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao eliminar critério')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      {/* 1. Modal Principal: Lista de critérios de avaliação (Fiel à imagem de referência) */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl w-[95vw] sm:w-full bg-white dark:bg-[#160228] text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-white/10 p-0 overflow-hidden shadow-2xl">
          {/* Cabeçalho do Modal */}
          <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-white/10">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Lista de critérios de avaliação
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Critérios de satisfação avaliados pelos clientes nas taças e pedidos da sua unidade.
            </p>
          </div>

          {/* Lista de Critérios com Drag Handle e Ações */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-2.5">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                <RefreshCw className="h-6 w-6 animate-spin text-purple-600 dark:text-pink-400" />
                <span className="text-xs font-semibold">A carregar critérios...</span>
              </div>
            ) : criteria.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                Nenhum critério configurado para esta unidade.
              </div>
            ) : (
              criteria.map((item) => {
                const IconComponent = getCriterionIcon(item.title)
                const isToggling = togglingId === item.id

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all group"
                  >
                    {/* Lado Esquerdo: Alça + Ícone + Nome */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="cursor-grab text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0">
                        <GripVertical className="h-4 w-4" />
                      </div>

                      <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
                        <IconComponent className="h-4 w-4" />
                      </div>

                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                        {item.title}
                      </span>
                    </div>

                    {/* Lado Direito: Badge Visível/Oculto + Botões de Ação */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md ${
                          item.active
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-400 dark:bg-slate-600 text-white'
                        }`}
                      >
                        {item.active ? 'Visível' : 'Oculto'}
                      </span>

                      {/* Botão Alternar Visibilidade */}
                      <button
                        type="button"
                        disabled={isToggling}
                        onClick={() => handleToggleActive(item)}
                        className="h-8 w-8 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
                        title={item.active ? 'Ocultar critério' : 'Tornar visível'}
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${isToggling ? 'animate-spin' : ''}`} />
                      </button>

                      {/* Botão Editar Nome */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="h-8 w-8 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
                        title="Editar critério"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>

                      {/* Botão Excluir */}
                      <button
                        type="button"
                        onClick={() => handleOpenDelete(item)}
                        className="h-8 w-8 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 flex items-center justify-center cursor-pointer transition-colors"
                        title="Eliminar critério"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Rodapé do Modal (Fiel à imagem de referência) */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-10 px-5 text-xs font-bold rounded-xl border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 uppercase tracking-wide cursor-pointer"
            >
              FECHAR
            </Button>

            <Button
              type="button"
              onClick={handleOpenCreate}
              className="h-10 px-5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white uppercase tracking-wide flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>CRIAR CRITÉRIO DE AVALIAÇÃO</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. Diálogo de Criação / Edição de Critério (Apenas Nome em Português PT-PT) */}
      <Dialog open={formModalOpen} onOpenChange={setFormModalOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-[#160228] text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-white/10 p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
              {editingCriterion ? 'Editar Critério de Avaliação' : 'Novo Critério de Avaliação'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveCriterion} className="space-y-4 pt-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nome do Critério (Português) <span className="text-red-500">*</span>
              </label>
              <Input
                autoFocus
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ex: Qualidade da Fruta, Temperatura, Limpeza..."
                className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/15"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Este critério será avaliado pelos clientes de 1 a 5 estrelas.
              </p>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormModalOpen(false)}
                className="h-9 px-4 text-xs font-bold rounded-xl border-slate-300 dark:border-white/15"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submittingForm || !formTitle.trim()}
                className="h-9 px-5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {submittingForm ? 'A guardar...' : editingCriterion ? 'Guardar Alterações' : 'Criar Critério'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Modal de Segurança para Exclusão (Zero window.confirm) */}
      <Dialog open={securityModalOpen} onOpenChange={setSecurityModalOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-[#160228] text-slate-900 dark:text-white rounded-2xl border border-red-200 dark:border-red-500/20 p-6 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-2">
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                  Eliminar Critério de Avaliação
                </DialogTitle>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Confirmação de segurança necessária
                </span>
              </div>
            </div>
          </DialogHeader>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-2">
            Tem certeza de que deseja eliminar o critério{' '}
            <strong className="text-slate-900 dark:text-white font-bold">
              «{criterionToDelete?.title}»
            </strong>
            ? As avaliações já registadas para este critério deixarão de exibi-lo no detalhe.
          </p>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => {
                setSecurityModalOpen(false)
                setCriterionToDelete(null)
              }}
              className="h-9 px-4 text-xs font-bold rounded-xl border-slate-300 dark:border-white/15 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={deleting}
              onClick={handleConfirmDelete}
              className="h-9 px-4 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 cursor-pointer"
            >
              {deleting ? 'A eliminar...' : 'Sim, Eliminar Critério'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
