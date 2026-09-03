'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast, Toaster } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/lib/stores/authStore'
import { ArrowLeft, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { user, loginWithCredentials, checkAuth } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (user) {
      router.push('/')
    }
  }, [user, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Preencha o e-mail e a palavra-passe')
      return
    }

    setLoading(true)
    try {
      await loginWithCredentials(email.trim().toLowerCase(), password)
      toast.success('Sessão iniciada com sucesso!')
      window.location.href = '/'
    } catch (err: any) {
      toast.error(err.message || 'Falha na autenticação. Verifique os seus dados.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative w-full min-h-screen bg-[#0A0612] text-white selection:bg-purple-600 selection:text-white">
      <Toaster position="top-center" richColors theme="dark" />

      <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* LADO ESQUERDO: Branding, Frases de Impacto & Aviso Institucional */}
        <div className="w-full bg-[#160F24] p-8 sm:p-12 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#2A1E3D] relative overflow-hidden min-h-[420px] lg:min-h-screen">
          {/* Ambient Glow Suave */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-900/20 rounded-full blur-[130px] pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-pink-900/15 rounded-full blur-[130px] pointer-events-none" />

          {/* Top: Voltar ao Site & Logo */}
          <div className="relative z-10 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-medium text-gray-300 hover:text-white transition px-3.5 py-2 rounded-lg bg-[#0A0612] border border-[#2A1E3D] hover:border-purple-500/50"
            >
              <ArrowLeft className="h-4 w-4 text-purple-400" />
              <span>Voltar ao Início</span>
            </Link>

            <img
              src="/logo.png"
              alt="Açaí da Rose"
              className="h-8 w-auto object-contain"
            />
          </div>

          {/* Centro: Frases de Impacto */}
          <div className="relative z-10 my-auto py-10 space-y-6 text-left max-w-lg">
            <div className="space-y-3">
              <span className="text-purple-400 text-xs font-semibold uppercase tracking-wider block">
                Portal Corporativo & PDV
              </span>
              <div className="space-y-1 font-bold leading-tight tracking-tight">
                <div className="text-2xl sm:text-4xl text-white">
                  AÇAÍ NÃO SE EXPLICA:
                </div>
                <div className="text-3xl sm:text-5xl text-purple-300">
                  SE EXPERIMENTA
                </div>
                <div className="text-3xl sm:text-5xl text-pink-400">
                  SE APAIXONA
                </div>
                <div className="text-3xl sm:text-5xl text-purple-200">
                  E REPETE.
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-purple-200/80 font-medium tracking-wide uppercase">
              O sabor autêntico do melhor açaí de Portugal.
            </p>

            <div className="p-4 rounded-xl bg-[#0A0612] border border-[#2A1E3D] text-left space-y-1">
              <div className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Ambiente Seguro & Monitorado</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Área restrita a operadores de caixa, gerentes de unidade e franqueados autorizados.
              </p>
            </div>
          </div>

          {/* Rodapé Esquerdo */}
          <div className="relative z-10 text-[11px] text-gray-400">
            Açaí da Rose · Rede de Franquias Portugal
          </div>
        </div>

        {/* LADO DIREITO: Formulário de Login Autêntico (Sem Mocks) */}
        <div className="w-full bg-[#0A0612] p-8 sm:p-12 lg:p-16 flex flex-col justify-center items-center min-h-[500px] lg:min-h-screen">
          <div className="w-full max-w-sm space-y-6 text-left">
            
            {/* Header do Formulário */}
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Iniciar Sessão
              </h2>
              <p className="text-xs text-gray-400">
                Introduza as credenciais da sua loja para aceder ao sistema
              </p>
            </div>

            {/* Formulário de Login */}
            <form onSubmit={handleLogin} className="space-y-4">
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
                    className="pl-10 h-11 bg-[#140D21] border-[#2A1E3D] text-white placeholder:text-gray-500 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-300 font-bold">Palavra-passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10 pr-10 h-11 bg-[#140D21] border-[#2A1E3D] text-white placeholder:text-gray-500 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
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

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
              >
                {loading ? 'A validar...' : 'Entrar no Painel'}
              </Button>
            </form>

            <div className="pt-6 border-t border-[#2A1E3D] text-center">
              <p className="text-[11px] text-gray-400">
                Sistema Multi-Tenant Açaí da Rose · Sede Figueira da Foz (Matriz)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
