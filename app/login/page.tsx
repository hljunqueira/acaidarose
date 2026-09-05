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
import ForgotPasswordDialog from '@/components/auth/ForgotPasswordDialog'

export default function LoginPage() {
  const router = useRouter()
  const { user, loginWithCredentials, checkAuth } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)

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

          {/* Camada de Fundo: Logo em Marca d'Água Transparente */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
            <img
              src="/logo-oficial.png"
              alt=""
              aria-hidden="true"
              className="w-[420px] sm:w-[500px] lg:w-[580px] h-auto object-contain opacity-[0.08] transform -rotate-6 scale-110 pointer-events-none"
            />
          </div>

          {/* Top: Voltar ao Site */}
          <div className="relative z-10 flex items-center justify-start">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-medium text-gray-300 hover:text-white transition px-3.5 py-2 rounded-xl bg-[#0A0612]/80 border border-[#2A1E3D] hover:border-purple-500/50 cursor-pointer backdrop-blur-xs"
            >
              <ArrowLeft className="h-4 w-4 text-purple-400" />
              <span>Voltar ao Site</span>
            </Link>
          </div>

          {/* Centro: Identificação Corporativa Clean - Portal da Equipa */}
          <div className="relative z-10 my-auto py-10 space-y-8 text-left max-w-lg">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight font-['Outfit'] drop-shadow-sm">
                Portal da Equipa
              </h1>
              <p className="text-sm sm:text-base text-gray-300/90 leading-relaxed font-normal">
                Ambiente operacional e administrativo para operadores de caixa, gerentes de unidade e franqueados autorizados.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0A0612]/90 border border-[#2A1E3D] text-left space-y-2.5 backdrop-blur-sm shadow-xl">
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Ambiente Seguro & Monitorado</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Área restrita a colaboradores autorizados. Todos os acessos e operações no PDV e retaguarda são auditados.
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
              <div className="lg:hidden inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Portal da Equipa
              </div>
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

              {/* Link para Esqueceu a Palavra-passe */}
              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-xs text-purple-400 hover:text-pink-300 font-medium transition cursor-pointer hover:underline"
                >
                  Esqueceu a palavra-passe?
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
              >
                {loading ? 'A validar...' : 'Entrar no Painel'}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Modal de Recuperação de Palavra-passe (Resend API + Franqueadora/TI) */}
      <ForgotPasswordDialog
        open={forgotOpen}
        onOpenChange={setForgotOpen}
        initialEmail={email}
      />
    </div>
  )
}
