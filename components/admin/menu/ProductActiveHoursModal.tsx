'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Copy, Plus, Minus, Check, X } from 'lucide-react'
import { toast } from 'sonner'

interface TimeInterval {
  start: string
  end: string
}

interface ProductActiveHoursModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: any
  title?: string
  categoryType?: 'containers' | 'bases' | 'toppings'
  tenantId?: string
  onSuccess?: (updatedProduct: any) => void
  onSaveSchedule?: (hours: any) => Promise<void>
}

const DAYS = [
  { day: 0, label: 'Domingo' },
  { day: 1, label: 'Segunda' },
  { day: 2, label: 'Terça' },
  { day: 3, label: 'Quarta' },
  { day: 4, label: 'Quinta' },
  { day: 5, label: 'Sexta' },
  { day: 6, label: 'Sábado' },
]

// Gera lista de horários de 15 em 15 minutos: 00:00 até 23:45, mais 23:59
const TIME_OPTIONS: string[] = []
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    const hh = String(h).padStart(2, '0')
    const mm = String(m).padStart(2, '0')
    TIME_OPTIONS.push(`${hh}:${mm}`)
  }
}
if (!TIME_OPTIONS.includes('23:59')) {
  TIME_OPTIONS.push('23:59')
}

export default function ProductActiveHoursModal({
  open,
  onOpenChange,
  product,
  title,
  categoryType = 'containers',
  tenantId,
  onSuccess,
  onSaveSchedule,
}: ProductActiveHoursModalProps) {
  // Mapa de intervalos por dia: { 0: [{ start: '00:00', end: '00:15' }], ... }
  const [schedule, setSchedule] = useState<Record<number, TimeInterval[]>>({
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
  })

  // Modo de Replicação
  const [replicationMode, setReplicationMode] = useState<{
    sourceDay: number
    interval: TimeInterval
  } | null>(null)
  const [selectedTargetDays, setSelectedTargetDays] = useState<number[]>([])

  const [saving, setSaving] = useState(false)

  // Inicializa o estado a partir do availableHours do produto
  useEffect(() => {
    if (!open) {
      setReplicationMode(null)
      return
    }

    const initialSchedule: Record<number, TimeInterval[]> = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
    }

    if (product?.availableHours || product?.available_hours) {
      const raw = product.availableHours || product.available_hours
      try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw

        if (parsed.byDay && typeof parsed.byDay === 'object') {
          for (let d = 0; d < 7; d++) {
            if (Array.isArray(parsed.byDay[d])) {
              initialSchedule[d] = parsed.byDay[d]
            }
          }
        } else if (Array.isArray(parsed.days) && (parsed.startTime || parsed.endTime)) {
          // Formato legado
          const legacyInterval: TimeInterval = {
            start: parsed.startTime || '00:00',
            end: parsed.endTime || '23:59',
          }
          parsed.days.forEach((d: number) => {
            if (d >= 0 && d <= 6) {
              initialSchedule[d] = [legacyInterval]
            }
          })
        }
      } catch {
        // Ignora erro de parse
      }
    }

    setSchedule(initialSchedule)
    setReplicationMode(null)
  }, [open, product])

  // Adicionar intervalo a um dia
  const handleAddInterval = (day: number) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: [...(prev[day] || []), { start: '00:00', end: '00:15' }],
    }))
  }

  // Remover intervalo de um dia
  const handleRemoveInterval = (day: number, index: number) => {
    setSchedule((prev) => {
      const updated = [...(prev[day] || [])]
      updated.splice(index, 1)
      return { ...prev, [day]: updated }
    })
  }

  // Alterar horário de início ou fim de um intervalo
  const handleUpdateInterval = (day: number, index: number, field: 'start' | 'end', value: string) => {
    setSchedule((prev) => {
      const updated = [...(prev[day] || [])]
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value }
      }
      return { ...prev, [day]: updated }
    })
  }

  // Iniciar Modo de Replicação para um intervalo específico
  const handleStartReplication = (day: number, interval: TimeInterval) => {
    setReplicationMode({ sourceDay: day, interval })
    setSelectedTargetDays([day])
  }

  // Cancelar Replicação
  const handleCancelReplication = () => {
    setReplicationMode(null)
    setSelectedTargetDays([])
  }

  // Confirmar Replicação (Copia o intervalo para todos os dias selecionados)
  const handleConfirmReplication = () => {
    if (!replicationMode) return

    setSchedule((prev) => {
      const next = { ...prev }
      selectedTargetDays.forEach((targetDay) => {
        // Aplica o intervalo da replicação para o dia
        next[targetDay] = [{ ...replicationMode.interval }]
      })
      return next
    })

    toast.success('Horário replicado com sucesso para os dias selecionados!')
    handleCancelReplication()
  }

  // Alternar checkbox de um dia no modo de replicação
  const handleToggleTargetDay = (day: number) => {
    setSelectedTargetDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  // Salvar no Banco de Dados
  const handleSave = async () => {
    setSaving(true)
    try {
      // Verifica se há ao menos um dia com horários
      let hasAnyHours = false
      const activeDays: number[] = []
      for (let d = 0; d < 7; d++) {
        if (schedule[d] && schedule[d].length > 0) {
          hasAnyHours = true
          activeDays.push(d)
        }
      }

      let payloadAvailableHours: any = null
      if (hasAnyHours) {
        // Encontra o primeiro horário como fallback legado
        const firstDay = activeDays[0]
        const firstInterval = schedule[firstDay][0] || { start: '00:00', end: '23:59' }

        payloadAvailableHours = {
          days: activeDays,
          startTime: firstInterval.start,
          endTime: firstInterval.end,
          byDay: schedule,
        }
      }

      if (onSaveSchedule) {
        await onSaveSchedule(payloadAvailableHours)
      } else {
        const effectiveCategory = categoryType || (product.weightGrams !== undefined ? 'containers' : product.description !== undefined ? 'bases' : 'toppings')
        const targetUrl = `/api/products/${effectiveCategory}/${product.id}?tenantId=${encodeURIComponent(tenantId || '11111111-1111-1111-1111-111111111111')}`

        const res = await fetch(targetUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...product,
            availableHours: payloadAvailableHours,
            available_hours: payloadAvailableHours,
          }),
        })

        if (!res.ok) throw new Error('Falha ao gravar horários no servidor')
      }

      const updated = {
        ...product,
        availableHours: payloadAvailableHours,
        available_hours: payloadAvailableHours,
      }

      toast.success('Horários ativos atualizados com sucesso!')
      if (onSuccess) onSuccess(updated)
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao guardar horários do produto')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-[#18022b] text-slate-900 dark:text-white p-0 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 shadow-2xl">
        {/* 1. Header do Modal */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
          <DialogTitle className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
            {title || 'Horários ativos do produto'}
          </DialogTitle>
        </div>

        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* 2. Caixa Azul Informativa (Exatamente como nas Imagens 3 e 4) */}
          <div className="bg-[#e8f4fb] dark:bg-sky-950/40 border border-[#c6e5f6] dark:border-sky-800/40 rounded-md p-3.5 space-y-0.5">
            <p className="text-xs text-[#1e5b82] dark:text-sky-300">
              <strong className="font-bold">Sem</strong> horário definido, estará{' '}
              <strong className="font-bold">sempre</strong> ativo.
            </p>
            <p className="text-xs text-[#1e5b82] dark:text-sky-300">
              <strong className="font-bold">Com</strong> horário definido, estará ativo{' '}
              <strong className="font-bold">apenas</strong> no período.
            </p>
          </div>

          {/* 3. Tabela de Dias da Semana & Horários */}
          <div className="border-t border-slate-200 dark:border-white/10 pt-2 space-y-0">
            {/* Cabeçalho das Colunas */}
            <div className="flex items-center justify-between pb-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              <span>Dias da Semana</span>
              <span>Horários</span>
            </div>

            {/* Linhas dos 7 Dias da Semana */}
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {DAYS.map(({ day, label }) => {
                const intervals = schedule[day] || []
                const isReplicatingThisDay = replicationMode?.sourceDay === day
                const isTargetSelected = selectedTargetDays.includes(day)

                return (
                  <div key={day} className="py-2 flex items-center justify-between gap-2 min-h-[44px]">
                    {/* Coluna Esquerda: Dia da Semana (Com Checkbox se em modo replicação) */}
                    <div className="flex items-center gap-2 min-w-0">
                      {replicationMode ? (
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isTargetSelected}
                            onChange={() => handleToggleTargetDay(day)}
                            className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                          />
                          <span className="text-xs font-semibold text-slate-800 dark:text-white">
                            {label}
                          </span>
                        </label>
                      ) : (
                        <span className="text-xs font-semibold text-slate-800 dark:text-white">
                          {label}
                        </span>
                      )}

                      {/* Botões de Ação no Dia de Origem da Replicação (✕ e ✓) */}
                      {isReplicatingThisDay && (
                        <div className="flex items-center gap-1 ml-1">
                          <button
                            type="button"
                            onClick={handleCancelReplication}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded cursor-pointer transition"
                            title="Cancelar replicação"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleConfirmReplication}
                            className="p-1 text-[#059669] hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded cursor-pointer transition font-bold"
                            title="Confirmar replicação para os dias marcados"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Coluna Direita: Horários do Dia */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {intervals.length === 0 ? (
                        /* Botão Verde + quando não há horários */
                        <button
                          type="button"
                          onClick={() => handleAddInterval(day)}
                          disabled={Boolean(replicationMode)}
                          className="p-1 text-[#059669] hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded cursor-pointer transition disabled:opacity-30"
                          title="Adicionar horário para este dia"
                        >
                          <Plus className="h-4 w-4 font-bold" />
                        </button>
                      ) : (
                        /* Lista de Faixas Horárias: [ 00:00 v ] até [ 00:15 v ] [ ⧉ ] [ — ] [ + ] */
                        intervals.map((interval, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            {/* Início */}
                            <select
                              value={interval.start}
                              onChange={(e) =>
                                handleUpdateInterval(day, idx, 'start', e.target.value)
                              }
                              disabled={Boolean(replicationMode)}
                              className="h-8 px-2 text-xs rounded border border-slate-300 dark:border-white/15 bg-white dark:bg-[#18022b] text-slate-800 dark:text-white focus:outline-none"
                            >
                              {TIME_OPTIONS.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>

                            <span className="text-xs text-slate-500">até</span>

                            {/* Fim */}
                            <select
                              value={interval.end}
                              onChange={(e) =>
                                handleUpdateInterval(day, idx, 'end', e.target.value)
                              }
                              disabled={Boolean(replicationMode)}
                              className="h-8 px-2 text-xs rounded border border-slate-300 dark:border-white/15 bg-white dark:bg-[#18022b] text-slate-800 dark:text-white focus:outline-none"
                            >
                              {TIME_OPTIONS.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>

                            {/* Botão [ ⧉ ]: Replicar */}
                            <button
                              type="button"
                              onClick={() => handleStartReplication(day, interval)}
                              disabled={Boolean(replicationMode)}
                              className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded cursor-pointer transition disabled:opacity-30"
                              title="Replicar este horário para outros dias"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>

                            {/* Botão [ — ]: Remover */}
                            <button
                              type="button"
                              onClick={() => handleRemoveInterval(day, idx)}
                              disabled={Boolean(replicationMode)}
                              className="p-1 text-slate-500 hover:text-red-600 rounded cursor-pointer transition disabled:opacity-30"
                              title="Remover horário"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>

                            {/* Botão [ + ]: Adicionar outra faixa no mesmo dia */}
                            {idx === intervals.length - 1 && (
                              <button
                                type="button"
                                onClick={() => handleAddInterval(day)}
                                disabled={Boolean(replicationMode)}
                                className="p-1 text-[#059669] hover:text-emerald-700 rounded cursor-pointer transition disabled:opacity-30"
                                title="Adicionar outra faixa horária"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 4. Rodapé do Modal (FECHAR e SALVAR) */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-2.5 bg-slate-50/50 dark:bg-white/[0.02]">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-5 py-2 rounded text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 cursor-pointer uppercase transition"
          >
            Fechar
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-6 py-2 rounded text-xs font-bold text-white bg-[#1d70b8] hover:bg-[#155a96] cursor-pointer uppercase shadow-xs transition disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
