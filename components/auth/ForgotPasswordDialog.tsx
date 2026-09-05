'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Mail,
  KeyRound,
  Lock,
  ArrowLeft,
  CheckCircle2,
  PhoneCall,
  Clock,
  Eye,
  EyeOff,
  ShieldAlert,
} from 'lucide-react'

interface ForgotPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialEmail?: string
}

type Step = 'REQUEST' | 'VERIFY' | 'CONTINGENCY'

export default function ForgotPasswordDialog({
  open,
  onOpenChange,
  initialEmail = '',
}: ForgotPasswordDialogProps) {
  const [step, setStep] = useState<Step>('REQUEST')
  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // Campos de contingência
  const [storeName, setStoreName] = useState('')
  const [whatsappPhone, setWhatsappPhone] = useState('')
  const [contingencyReason, setContingencyReason] = useState('')

  // Cooldown de reenvio
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail)
    }
  }, [initialEmail])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (step === 'VERIFY' && countdown > 0) {
      timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000)
    } else if (countdown === 0) {
      setCanResend(true)
    }
    return () => clearTimeout(timer)
  }, [step, countdown])

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      toast.error('Introduza um e-mail válido.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'EMAIL', email: email.trim().toLowerCase() }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Erro ao enviar código de verificação.')
        return
      }

      toast.success(data.message || 'Código de verificação enviado!')
      setStep('VERIFY')
      setCountdown(60)
      setCanResend(false)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao conectar ao servidor.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!code || code.trim().length !== 6) {
      toast.error('Introduza o código de 6 dígitos recebido por e-mail.')
      return
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error('A nova palavra-passe deve ter pelo menos 6 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('As palavras-passe não coincidem.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.trim(),
          newPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Erro ao redefinir a palavra-passe.')
        return
      }

      toast.success('Palavra-passe alterada com sucesso! Inicie sessão.')
      onOpenChange(false)
      setStep('REQUEST')
      setCode('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao conectar ao servidor.')
    } finally {
      setLoading(false)
    }
  }

  const handleManualSupport = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !whatsappPhone) {
      toast.error('Preencha o e-mail e o número de WhatsApp.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'MANUAL',
          email: email.trim().toLowerCase(),
          storeName: storeName || 'Loja Açaí da Rose',
          whatsappPhone: whatsappPhone.trim(),
          reason: contingencyReason || 'Sem acesso ao e-mail corporativo',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Erro ao enviar pedido.')
        return
      }

      toast.success(data.message || 'Pedido encaminhado à Franqueadora e ao TI.')
      
      // Abre link do WhatsApp para agilizar o contato
      const msg = encodeURIComponent(
        `Olá! Sou da loja "${storeName || 'Açaí da Rose'}" (E-mail: ${email}) e solicitei apoio de redefinição de palavra-passe no Portal da Equipa.`
      )
      window.open(`https://wa.me/351911050264?text=${msg}`, '_blank')

      onOpenChange(false)
      setStep('REQUEST')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao registrar solicitação.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md p-6 sm:p-8 rounded-3xl bg-[#160F24] border border-[#2A1E3D] text-white shadow-2xl overflow-hidden">
        <DialogHeader className="text-left space-y-2 pb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-500/30 text-purple-400">
              <KeyRound className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-black text-white tracking-tight font-['Outfit']">
              {step === 'REQUEST' && 'Recuperar Palavra-passe'}
              {step === 'VERIFY' && 'Inserir Código de Verificação'}
              {step === 'CONTINGENCY' && 'Suporte Franqueadora & TI'}
            </DialogTitle>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            {step === 'REQUEST' &&
              'Introduza o seu e-mail corporativo para receber um código temporário de 6 dígitos.'}
            {step === 'VERIFY' &&
              `Enviámos um código para ${email}. Introduza o código e defina a sua nova palavra-passe.`}
            {step === 'CONTINGENCY' &&
              'Caso não tenha acesso à caixa de e-mail da loja, envie os dados abaixo para atendimento imediato.'}
          </p>
        </DialogHeader>

        {/* PASSO 1: Solicitar Código por E-mail */}
        {step === 'REQUEST' && (
          <form onSubmit={handleSendEmail} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-300 font-bold">E-mail Corporativo</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  type="email"
                  placeholder="utilizador@acairose.pt"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="pl-10 h-11 bg-[#0A0612] border-[#2A1E3D] text-white placeholder:text-gray-500 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
            >
              {loading ? 'A enviar código...' : 'Enviar Código por E-mail'}
            </Button>

            <div className="pt-3 border-t border-[#2A1E3D] text-center">
              <button
                type="button"
                onClick={() => setStep('CONTINGENCY')}
                className="text-xs text-gray-400 hover:text-pink-300 transition hover:underline font-medium inline-flex items-center gap-1.5 cursor-pointer"
              >
                <PhoneCall className="h-3.5 w-3.5 text-pink-400" />
                <span>Sem acesso ao e-mail? Contactar Franqueadora / TI</span>
              </button>
            </div>
          </form>
        )}

        {/* PASSO 2: Inserir Código & Nova Senha */}
        {step === 'VERIFY' && (
          <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-300 font-bold">Código de 6 Dígitos</Label>
                <span className="text-[11px] text-pink-400 font-mono flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Expira em 15 min</span>
                </span>
              </div>
              <Input
                type="text"
                placeholder="123456"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
                disabled={loading}
                className="h-12 bg-[#0A0612] border-[#2A1E3D] text-center text-2xl font-mono tracking-[0.3em] font-bold text-pink-400 rounded-xl focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-300 font-bold">Nova Palavra-passe</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pl-10 pr-10 h-11 bg-[#0A0612] border-[#2A1E3D] text-white placeholder:text-gray-500 rounded-xl focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-300 font-bold">Confirmar Nova Palavra-passe</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repita a palavra-passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pl-10 h-11 bg-[#0A0612] border-[#2A1E3D] text-white placeholder:text-gray-500 rounded-xl focus:border-purple-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer"
            >
              {loading ? 'A redefinir...' : 'Redefinir Palavra-passe'}
            </Button>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={() => setStep('REQUEST')}
                className="text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Mudar e-mail</span>
              </button>

              <button
                type="button"
                disabled={!canResend || loading}
                onClick={handleSendEmail}
                className={`font-semibold cursor-pointer ${
                  canResend
                    ? 'text-pink-400 hover:underline'
                    : 'text-gray-500 cursor-not-allowed'
                }`}
              >
                {canResend ? 'Reenviar código' : `Reenviar em ${countdown}s`}
              </button>
            </div>
          </form>
        )}

        {/* PASSO 3: Contingência Manual (Franqueadora / TI via WhatsApp) */}
        {step === 'CONTINGENCY' && (
          <form onSubmit={handleManualSupport} className="space-y-3.5 pt-2">
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-start gap-2 text-amber-200 text-xs">
              <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Canal emergencial para lojas que não conseguem aceder ao e-mail. A equipa da Matriz efetuará o contato.
              </span>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-300 font-bold">Nome da Loja / Unidade</Label>
              <Input
                type="text"
                placeholder="Ex: Torres Novas, Aveiro..."
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
                className="h-10 bg-[#0A0612] border-[#2A1E3D] text-white text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-300 font-bold">Número de Telemóvel / WhatsApp</Label>
              <Input
                type="tel"
                placeholder="+351 912 345 678"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                required
                className="h-10 bg-[#0A0612] border-[#2A1E3D] text-white text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-300 font-bold">Motivo do Bloqueio (Opcional)</Label>
              <Input
                type="text"
                placeholder="Ex: Esqueci a palavra-passe e o e-mail da loja está inacessível"
                value={contingencyReason}
                onChange={(e) => setContingencyReason(e.target.value)}
                className="h-10 bg-[#0A0612] border-[#2A1E3D] text-white text-xs rounded-xl"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <PhoneCall className="h-4 w-4" />
              <span>{loading ? 'A enviar...' : 'Solicitar Socorro no WhatsApp'}</span>
            </Button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setStep('REQUEST')}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1 mx-auto cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Voltar ao envio por e-mail</span>
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
