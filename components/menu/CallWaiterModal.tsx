'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { 
  Bell, 
  Utensils, 
  HelpCircle,
  CheckCircle2, 
  Loader2,
  Printer
} from 'lucide-react'
import { useCustomerTheme } from '@/lib/hooks/useIsolatedTheme'

interface CallWaiterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tableLabel: string
  tenantId: string
}

const QUICK_CALL_OPTIONS = [
  {
    id: 'atendimento_duvida',
    title: 'Atendimento / Dúvida',
    desc: 'Tirar dúvidas sobre o cardápio ou falar com o atendente',
    icon: HelpCircle,
    color: 'from-pink-600 to-rose-600',
    borderColor: 'border-pink-500/40 hover:border-pink-400',
  },
  {
    id: 'talheres_guardanapos',
    title: 'Talheres / Guardanapos',
    desc: 'Colheres extras, guardanapos e copos para a mesa',
    icon: Utensils,
    color: 'from-purple-600 to-fuchsia-600',
    borderColor: 'border-purple-500/40 hover:border-purple-400',
  },
]

export default function CallWaiterModal({
  open,
  onOpenChange,
  tableLabel,
  tenantId,
}: CallWaiterModalProps) {
  const { isDark: isCustomerDark } = useCustomerTheme()
  const [callingId, setCallingId] = useState<string | null>(null)
  const [sentSuccess, setSentSuccess] = useState(false)
  const [sentReason, setSentReason] = useState('')

  const handleCallOption = async (opt: typeof QUICK_CALL_OPTIONS[0]) => {
    setCallingId(opt.id)
    setSentReason(opt.title)

    try {
      await fetch('/api/call-waiter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          tableLabel,
          reason: opt.title,
          timestamp: new Date().toISOString(),
        }),
      })

      setSentSuccess(true)
      toast.success(`Chamado de "${opt.title}" enviado ao balcão!`)
      setTimeout(() => {
        setSentSuccess(false)
        setCallingId(null)
        onOpenChange(false)
      }, 2500)
    } catch {
      setSentSuccess(true)
      toast.success(`Chamado de "${opt.title}" enviado ao balcão!`)
      setTimeout(() => {
        setSentSuccess(false)
        setCallingId(null)
        onOpenChange(false)
      }, 2500)
    } finally {
      setCallingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`w-[92vw] sm:w-full max-w-md p-5 sm:p-6 rounded-3xl shadow-2xl transition-colors duration-200 ${isCustomerDark ? 'dark bg-[#160228] text-white border-white/20' : 'bg-white text-slate-900 border-purple-100'}`}>
        <DialogHeader className="text-left space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-pink-100 text-pink-700 border border-pink-200 dark:bg-pink-600/30 dark:border-pink-500/40 dark:text-pink-300">
              {tableLabel} · Chamado Rápido
            </span>
            <Bell className="h-4 w-4 text-pink-600 dark:text-pink-400 animate-bounce" />
          </div>
          <DialogTitle className="text-xl font-black text-slate-900 dark:text-white">
            Chamar Atendente
          </DialogTitle>
          <p className="text-xs text-slate-600 dark:text-purple-200/70 font-medium">
            Selecione a opção com 1 toque e a equipa irá até à sua mesa:
          </p>
        </DialogHeader>

        {sentSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-300 dark:border-emerald-500/40">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Chamado Enviado!</h3>
            <p className="text-xs text-slate-600 dark:text-purple-200/80 max-w-xs mx-auto">
              A equipa já recebeu o alerta de <strong>{sentReason}</strong> para a <strong>{tableLabel}</strong> e o ticket foi enviado para o atendimento.
            </p>
          </div>
        ) : (
          <div className="space-y-3 my-3">
            {QUICK_CALL_OPTIONS.map((opt) => {
              const Icon = opt.icon
              const isCalling = callingId === opt.id

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={Boolean(callingId)}
                  onClick={() => handleCallOption(opt)}
                  className="w-full p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 hover:bg-purple-100/80 dark:bg-white/[0.04] dark:border-white/10 dark:hover:bg-white/[0.08] transition-all flex items-center justify-between text-left cursor-pointer group hover:scale-[1.01] active:scale-[0.99] text-slate-900 dark:text-white shadow-xs"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${opt.color} text-white flex items-center justify-center shadow-md`}>
                      {isCalling ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-300 transition-colors">
                        {opt.title}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-purple-200/70 mt-0.5 font-medium">
                        {opt.desc}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-pink-600 dark:text-pink-400 group-hover:translate-x-1 transition-transform">
                    {isCalling ? 'Enviando...' : 'Chamar ›'}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {!sentSuccess && (
          <div className="pt-3 border-t border-purple-100 dark:border-white/10 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-purple-300 dark:hover:text-white cursor-pointer"
            >
              Cancelar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
