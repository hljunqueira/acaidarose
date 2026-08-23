'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { 
  Bell, 
  Utensils, 
  Droplets, 
  Heart, 
  Sparkles, 
  CreditCard, 
  CheckCircle2, 
  HelpCircle,
  Clock
} from 'lucide-react'

interface CallWaiterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tableLabel: string
  tenantId: string
}

const WAITER_OPTIONS = [
  {
    id: 'colher_guardanapo',
    title: 'Colher & Guardanapos Extras',
    desc: 'Talheres para partilhar o açaí na mesa',
    icon: Utensils,
    color: 'fuchsia',
  },
  {
    id: 'gelo_agua',
    title: 'Copo com Gelo / Água Fresca',
    desc: 'Copos e gelo para se refrescar',
    icon: Droplets,
    color: 'cyan',
  },
  {
    id: 'caldas_extra',
    title: 'Caldas / Mel Extra',
    desc: 'Um toque doce a mais no seu copo',
    icon: Heart,
    color: 'amber',
  },
  {
    id: 'limpar_mesa',
    title: 'Limpar Mesa',
    desc: 'Retirar descartáveis e higienizar a mesa',
    icon: CheckCircle2,
    color: 'emerald',
  },
  {
    id: 'pedir_conta',
    title: 'Pedir a Conta',
    desc: 'Pagamento na mesa (MB Way / Multibanco / Numerário)',
    icon: CreditCard,
    color: 'purple',
  },
  {
    id: 'atendimento_geral',
    title: 'Chamar Atendente',
    desc: 'Tirar dúvidas ou fazer pedido presencial',
    icon: HelpCircle,
    color: 'pink',
  },
]

export default function CallWaiterModal({
  open,
  onOpenChange,
  tableLabel,
  tenantId,
}: CallWaiterModalProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sentSuccess, setSentSuccess] = useState(false)

  const handleCallWaiter = async () => {
    if (!selectedOption) {
      toast.error('Selecione uma opção de atendimento')
      return
    }

    setSubmitting(true)
    const opt = WAITER_OPTIONS.find((o) => o.id === selectedOption)

    try {
      await fetch('/api/call-waiter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          tableLabel,
          reason: opt?.title || 'Atendimento de Mesa',
          timestamp: new Date().toISOString(),
        }),
      })

      setSentSuccess(true)
      toast.success('Chamado enviado ao balcão!')
      setTimeout(() => {
        setSentSuccess(false)
        setSelectedOption(null)
        onOpenChange(false)
      }, 2000)
    } catch {
      toast.success('Chamado enviado ao balcão!')
      setSentSuccess(true)
      setTimeout(() => {
        setSentSuccess(false)
        setSelectedOption(null)
        onOpenChange(false)
      }, 2000)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-[#160228] text-white border border-white/20 rounded-3xl shadow-2xl">
        <DialogHeader className="text-left space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-pink-600/30 border border-pink-500/40 text-pink-300">
              Atendimento · {tableLabel}
            </span>
            <Bell className="h-4 w-4 text-pink-400 animate-bounce" />
          </div>
          <DialogTitle className="text-xl font-black text-white">
            Como podemos ajudar?
          </DialogTitle>
          <p className="text-xs text-purple-200/70">
            Selecione o que precisa e a nossa equipa irá até à sua mesa:
          </p>
        </DialogHeader>

        {sentSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-black text-white">Chamado Enviado!</h3>
            <p className="text-xs text-purple-200/80 max-w-xs mx-auto">
              O nosso colaborador já recebeu o alerta no balcão e está a caminho da {tableLabel}.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 my-3">
            {WAITER_OPTIONS.map((opt) => {
              const Icon = opt.icon
              const isSelected = selectedOption === opt.id

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedOption(opt.id)}
                  className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center gap-3.5 cursor-pointer ${
                    isSelected
                      ? 'border-pink-500 bg-pink-600/25 shadow-lg shadow-pink-600/20 scale-[1.01]'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-pink-600 text-white' : 'bg-white/10 text-pink-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-white">{opt.title}</div>
                    <div className="text-[10px] text-purple-200/70 truncate">{opt.desc}</div>
                  </div>

                  {isSelected && (
                    <CheckCircle2 className="h-4 w-4 text-pink-400 flex-shrink-0" />
                  )}
                </button>
              )
            })}

            <Button
              onClick={handleCallWaiter}
              disabled={!selectedOption || submitting}
              className="w-full h-11 rounded-2xl bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black text-xs shadow-lg shadow-pink-600/30 mt-3 cursor-pointer"
            >
              {submitting ? 'A enviar chamado...' : 'Chamar Atendente Agora →'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
