'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Clock, Check, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import { useFranchiseStore } from '@/lib/stores/franchiseStore'

interface StoreQuickHoursModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  storeName?: string
}

const DAYS = [
  { key: 'seg', label: 'Segunda-feira' },
  { key: 'ter', label: 'Terça-feira' },
  { key: 'qua', label: 'Quarta-feira' },
  { key: 'qui', label: 'Quinta-feira' },
  { key: 'sex', label: 'Sexta-feira' },
  { key: 'sab', label: 'Sábado' },
  { key: 'dom', label: 'Domingo' },
]

export default function StoreQuickHoursModal({
  open,
  onOpenChange,
  tenantId,
  storeName = 'Loja',
}: StoreQuickHoursModalProps) {
  const { authFetch } = useAuthStore()
  const { setCurrentTenant } = useFranchiseStore()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [openingHours, setOpeningHours] = useState<Record<string, { open: string; close: string; closed?: boolean }>>({
    seg: { open: '12:00', close: '22:00', closed: false },
    ter: { open: '12:00', close: '22:00', closed: false },
    qua: { open: '12:00', close: '22:00', closed: false },
    qui: { open: '12:00', close: '22:00', closed: false },
    sex: { open: '12:00', close: '23:00', closed: false },
    sab: { open: '12:00', close: '23:00', closed: false },
    dom: { open: '13:00', close: '22:00', closed: false },
  })

  // Carrega horários atuais da unidade
  useEffect(() => {
    if (!open) return
    setLoading(true)
    authFetch(`/api/tenants/${tenantId}/settings`)
      .then((res) => res.json())
      .then((data) => {
        if (data.tenant?.openingHours) {
          setOpeningHours((prev) => ({
            ...prev,
            ...data.tenant.openingHours,
          }))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open, tenantId, authFetch])

  const handleUpdateDay = (key: string, field: 'open' | 'close' | 'closed', val: any) => {
    setOpeningHours((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: val,
      },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await authFetch(`/api/tenants/${tenantId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openingHours }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar horários')

      if (data.tenant) {
        setCurrentTenant(data.tenant)
      }
      toast.success('Horário de funcionamento da unidade salvo com sucesso!')
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gravar horários')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white dark:bg-[#18022b] text-slate-900 dark:text-white p-0 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
          <DialogTitle className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#059669]" />
            <span>Horários de Atendimento da Loja</span>
          </DialogTitle>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Defina os turnos semanais de atendimento para <strong>{storeName}</strong>. Fora destes períodos, o cardápio digital informa aos clientes que a loja está fechada.
          </p>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Carregando horários...</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/5 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-white/[0.02]">
              {DAYS.map(({ key, label }) => {
                const dayConfig = openingHours[key] || { open: '12:00', close: '22:00', closed: false }
                const isClosed = Boolean(dayConfig.closed)

                return (
                  <div key={key} className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-slate-800 dark:text-white w-28">
                      {label}
                    </span>

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-500 select-none mr-2">
                        <input
                          type="checkbox"
                          checked={isClosed}
                          onChange={(e) => handleUpdateDay(key, 'closed', e.target.checked)}
                          className="h-3.5 w-3.5 rounded text-red-600 focus:ring-red-500 border-slate-300 cursor-pointer"
                        />
                        <span className={isClosed ? 'text-red-600 font-bold' : ''}>Fechado</span>
                      </label>

                      {!isClosed && (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="time"
                            value={dayConfig.open}
                            onChange={(e) => handleUpdateDay(key, 'open', e.target.value)}
                            className="h-8 px-2 rounded border border-slate-300 dark:border-white/15 bg-white dark:bg-[#18022b] text-slate-800 dark:text-white font-mono"
                          />
                          <span className="text-slate-400">às</span>
                          <input
                            type="time"
                            value={dayConfig.close}
                            onChange={(e) => handleUpdateDay(key, 'close', e.target.value)}
                            className="h-8 px-2 rounded border border-slate-300 dark:border-white/15 bg-white dark:bg-[#18022b] text-slate-800 dark:text-white font-mono"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

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
            disabled={saving || loading}
            onClick={handleSave}
            className="px-6 py-2 rounded text-xs font-bold text-white bg-[#059669] hover:bg-[#047857] cursor-pointer uppercase shadow-xs transition disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar Horários'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
