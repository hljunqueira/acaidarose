'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import { Clock, Calendar, Check, Lock, Send, Sparkles, Building2 } from 'lucide-react'
import FranchiseRequestDialog from './FranchiseRequestDialog'

interface MenuSchedulesAdminProps {
  tenantId: string
}

const DAYS_OF_WEEK = [
  { id: 1, label: 'Seg', name: 'Segunda-feira' },
  { id: 2, label: 'Ter', name: 'Terça-feira' },
  { id: 3, label: 'Qua', name: 'Quarta-feira' },
  { id: 4, label: 'Qui', name: 'Quinta-feira' },
  { id: 5, label: 'Sex', name: 'Sexta-feira' },
  { id: 6, label: 'Sáb', name: 'Sábado' },
  { id: 0, label: 'Dom', name: 'Domingo' },
]

export default function MenuSchedulesAdmin({ tenantId }: MenuSchedulesAdminProps) {
  const { user } = useAuthStore()
  const isFranchisor = user?.role === 'SUPER_ADMIN' || user?.role === 'FRANCHISOR_ADMIN' || tenantId?.startsWith('11111111') || tenantId === 'aveiro'

  const [requestOpen, setRequestOpen] = useState(false)
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])
  const [startTime, setStartTime] = useState('11:00')
  const [endTime, setEndTime] = useState('23:00')
  const [alwaysOpen, setAlwaysOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const toggleDay = (dayId: number) => {
    if (!isFranchisor) return
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId].sort()
    )
  }

  const handleApplyPreset = (preset: 'all_day' | 'commercial' | 'weekend') => {
    if (!isFranchisor) return
    if (preset === 'all_day') {
      setSelectedDays([0, 1, 2, 3, 4, 5, 6])
      setStartTime('00:00')
      setEndTime('23:59')
      setAlwaysOpen(true)
      toast.success('Turno Contínuo 24h aplicado')
    } else if (preset === 'commercial') {
      setSelectedDays([1, 2, 3, 4, 5])
      setStartTime('11:00')
      setEndTime('22:00')
      setAlwaysOpen(false)
      toast.success('Horário Comercial Padrão aplicado')
    } else if (preset === 'weekend') {
      setSelectedDays([5, 6, 0])
      setStartTime('12:00')
      setEndTime('23:30')
      setAlwaysOpen(false)
      toast.success('Horário de Fim de Semana aplicado')
    }
  }

  const handleSave = async () => {
    if (!isFranchisor) return
    setSaving(true)
    try {
      const schedule = {
        days: alwaysOpen ? [0, 1, 2, 3, 4, 5, 6] : selectedDays,
        startTime: alwaysOpen ? '00:00' : startTime,
        endTime: alwaysOpen ? '23:59' : endTime,
        alwaysOpen,
      }

      // Atualiza os containers para usarem a janela operacional
      const res = await fetch(`/api/products?tenantId=${encodeURIComponent(tenantId)}`)
      const catalog = await res.json()

      if (catalog?.containers) {
        for (const c of catalog.containers) {
          await fetch(`/api/products/containers/${c.id}?tenantId=${encodeURIComponent(tenantId)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ availableHours: schedule }),
          })
        }
      }

      toast.success('Horários operacionais atualizados com sucesso no cardápio!')
    } catch {
      toast.error('Erro ao salvar horários')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Limpo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#18022b]/95 p-5 rounded-3xl border border-purple-150 dark:border-white/10 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-purple-950 dark:text-white tracking-tight">
              Horários & Disponibilidade
            </h1>
            <Badge className={`text-[10px] font-bold ${isFranchisor ? 'bg-purple-100 text-purple-900 dark:bg-purple-900/40 dark:text-purple-200' : 'bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-300'}`}>
              {isFranchisor ? 'Gestão Franqueadora' : 'Visualização Filial'}
            </Badge>
          </div>
          <p className="text-xs text-purple-700/80 dark:text-purple-300/70 font-semibold mt-0.5">
            Defina os dias da semana e intervalos de atendimento em que os pedidos ficam habilitados no Menu Digital.
          </p>
        </div>

        {!isFranchisor && (
          <Button
            onClick={() => setRequestOpen(true)}
            className="h-10 px-4 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-pink-600/20 shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Solicitar Ajuste de Horário</span>
          </Button>
        )}
      </div>

      {!isFranchisor && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
          <Lock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>Controle Centralizado:</strong> Os horários oficiais de funcionamento são padronizados pela Franqueadora. Para solicitar abertura em horários especiais ou feriados locais, clique em <strong>"Solicitar Ajuste de Horário"</strong>.
          </span>
        </div>
      )}

      {/* Card de Configuração Operacional */}
      <Card className="rounded-3xl border-purple-150 dark:border-white/10 bg-white dark:bg-[#18022b]/95 overflow-hidden shadow-xs">
        <CardContent className="p-6 space-y-6">
          {/* Presets Rápidos (Apenas Franqueadora) */}
          {isFranchisor && (
            <div className="space-y-2">
              <Label className="text-xs font-bold text-purple-950 dark:text-white">Turnos Pré-definidos:</Label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('all_day')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 dark:bg-white/5 border border-purple-200 dark:border-white/10 text-purple-900 dark:text-purple-200 hover:bg-purple-100 transition cursor-pointer"
                >
                  24 Horas (Sempre Aberto)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('commercial')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 dark:bg-white/5 border border-purple-200 dark:border-white/10 text-purple-900 dark:text-purple-200 hover:bg-purple-100 transition cursor-pointer"
                >
                  Comercial (11h às 22h, Seg-Sex)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('weekend')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 dark:bg-white/5 border border-purple-200 dark:border-white/10 text-purple-900 dark:text-purple-200 hover:bg-purple-100 transition cursor-pointer"
                >
                  Fim de Semana (12h às 23h30)
                </button>
              </div>
            </div>
          )}

          {/* Seletor de Dias da Semana */}
          <div className="space-y-2.5">
            <Label className="text-xs font-bold text-purple-950 dark:text-white">Dias de Funcionamento:</Label>
            <div className="grid grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = selectedDays.includes(day.id)
                return (
                  <button
                    key={day.id}
                    type="button"
                    disabled={!isFranchisor}
                    onClick={() => toggleDay(day.id)}
                    className={`py-3 px-2 rounded-2xl border text-center font-bold text-xs transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-purple-700 to-pink-600 text-white border-transparent shadow-xs'
                        : 'bg-zinc-50 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/10'
                    } ${isFranchisor ? 'cursor-pointer hover:scale-102 active:scale-98' : 'cursor-not-allowed opacity-80'}`}
                  >
                    <div className="text-[10px] opacity-80">{day.label}</div>
                    <div className="text-xs mt-0.5">{isSelected ? '✓' : '—'}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Horários de Início e Término */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-purple-950 dark:text-white flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-pink-600" />
                <span>Horário de Abertura:</span>
              </Label>
              <Input
                type="time"
                disabled={!isFranchisor || alwaysOpen}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-10 text-xs font-mono font-bold rounded-xl border-purple-200 dark:border-white/15"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-purple-950 dark:text-white flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-purple-600" />
                <span>Horário de Encerramento:</span>
              </Label>
              <Input
                type="time"
                disabled={!isFranchisor || alwaysOpen}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-10 text-xs font-mono font-bold rounded-xl border-purple-200 dark:border-white/15"
              />
            </div>
          </div>

          {/* Botão de Salvar (Apenas Franqueadora) */}
          {isFranchisor && (
            <div className="pt-4 flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="h-10 px-6 rounded-2xl bg-gradient-to-r from-purple-700 via-fuchsia-600 to-pink-600 hover:from-purple-800 hover:to-pink-700 text-white font-bold text-xs shadow-md shadow-purple-700/20 cursor-pointer"
              >
                {saving ? 'Gravando...' : 'Salvar Horários da Rede'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Solicitação de Ajuste de Horário */}
      <FranchiseRequestDialog
        open={requestOpen}
        onOpenChange={setRequestOpen}
        tenantId={tenantId}
        initialType="PRICE_CHANGE"
      />
    </div>
  )
}
