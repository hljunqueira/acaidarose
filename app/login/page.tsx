'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast, Toaster } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/lib/stores/authStore'
import { ArrowLeft, Eye, EyeOff, ShieldCheck, Store, UserCheck, Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { user, loginWithCredentials, checkAuth } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [demoOpen, setDemoOpen] = useState(true)

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
      await loginWithCredentials(email, password)
      toast.success('Sessão iniciada com sucesso!')
      window.location.href = '/'
    } catch (err: any) {
      toast.error(err.message || 'Falha na autenticação. Verifique os seus dados.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = async (accEmail: string, accPass: string) => {
    setEmail(accEmail)
    setPassword(accPass)
    setLoading(true)
    try {
      await loginWithCredentials(accEmail, accPass)
      toast.success('Sessão iniciada com sucesso!')
      window.location.href = '/'
    } catch (err: any) {
      toast.error(err.message || 'Erro ao autenticar perfil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative w-full min-h-screen bg-[#0e0117] text-white selection:bg-pink-500 selection:text-white">
      <Toaster position="top-center" richColors />

      <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* LADO ESQUERDO: Branding, Frases de Impacto & Aviso de Acesso Restrito */}
        <div className="w-full bg-gradient-to-br from-[#26043d] via-[#1a022d] to-[#0e0117] p-8 sm:p-12 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10 relative overflow-hidden min-h-[420px] lg:min-h-screen">
        {/* Glow suave */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-pink-600/15 rounded-full blur-[130px] pointer-events-none" />

        {/* Top: Voltar ao Site & Logo */}
        <div className="relative z-10 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-purple-200/80 hover:text-white transition px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-pink-500/30 backdrop-blur-md"
          >
            <ArrowLeft className="h-4 w-4 text-pink-400" />
            <span>Voltar ao Site</span>
          </Link>

          <div className="text-xs text-pink-300 font-bold tracking-wider uppercase">
            Açaí da Rose
          </div>
        </div>

        {/* Centro: Frases de Impacto */}
        <div className="relative z-10 my-auto py-10 space-y-6 text-left max-w-lg">
          <div className="space-y-3">
            <span className="text-pink-400 text-xs font-black uppercase tracking-widest block font-['Outfit']">
              Portal Corporativo
            </span>
            <div className="space-y-1.5 font-black leading-[1.08] tracking-tight font-['Outfit']">
              <div className="text-2xl sm:text-4xl text-white drop-shadow-md">
                AÇAÍ NÃO SE EXPLICA:
              </div>
              <div className="text-3xl sm:text-5xl bg-gradient-to-r from-pink-400 via-rose-300 to-pink-300 bg-clip-text text-transparent drop-shadow-md">
                SE EXPERIMENTA
              </div>
              <div className="text-3xl sm:text-5xl bg-gradient-to-r from-pink-400 via-fuchsia-400 to-purple-300 bg-clip-text text-transparent drop-shadow-md">
                SE APAIXONA
              </div>
              <div className="text-3xl sm:text-5xl bg-gradient-to-r from-fuchsia-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent drop-shadow-md">
                E REPETE.
              </div>
            </div>
          </div>

          <p className="text-sm sm:text-base text-pink-200/85 font-black tracking-wide font-['Outfit'] uppercase">
            O SABOR QUE ABRAÇA A ALMA.
          </p>

          <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 text-left space-y-1">
            <div className="text-sm font-bold text-white uppercase tracking-wider">
              Acesso Restrito
            </div>
            <p className="text-xs text-purple-200/70 leading-relaxed">
              Área exclusiva para colaboradores, gerentes de unidade e franqueados autorizados do Açaí da Rose.
            </p>
          </div>
        </div>

        {/* Rodapé Esquerdo */}
        <div className="relative z-10 text-xs text-purple-300/50 font-semibold tracking-wider uppercase">
          Torres Novas · Portugal
        </div>
      </div>

      {/* LADO DIREITO: Formulário de Login & Perfis Rápidos */}
      <div className="w-full bg-[#11011d] p-8 sm:p-12 lg:p-16 flex flex-col justify-center items-center min-h-[500px] lg:min-h-screen">
        <div className="w-full max-w-md space-y-6 text-left">
          
          {/* Header do Formulário */}
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Iniciar Sessão
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/70">
              Introduza o seu e-mail e palavra-passe para aceder ao sistema.
            </p>
          </div>

          {/* Formulário de Login */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-pink-400" />
                <span>E-mail Corporativo</span>
              </Label>
              <Input
                type="email"
                placeholder="utilizador@acairose.pt"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/15 text-white placeholder:text-purple-300/40 rounded-xl h-12 text-sm focus:border-pink-500 transition"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-pink-400" />
                  <span>Palavra-passe</span>
                </Label>
                <button
                  type="button"
                  onClick={() =>
                    toast.info(
                      'Para recuperação de acesso, contacte o suporte ou o administrador da sua franquia.'
                    )
                  }
                  className="text-[11px] text-pink-300 hover:text-pink-200 hover:underline cursor-pointer transition font-medium"
                >
                  Esqueceu-se da palavra-passe?
                </button>
              </div>

              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/10 border-white/15 text-white placeholder:text-purple-300/40 rounded-xl h-12 text-sm pr-12 focus:border-pink-500 transition"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-purple-300 hover:text-white cursor-pointer transition"
                  aria-label={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black text-sm shadow-xl shadow-pink-600/30 cursor-pointer transition hover:scale-[1.02] active:scale-[0.98] mt-2"
            >
              {loading ? 'A autenticar...' : 'Entrar no Sistema →'}
            </Button>
          </form>

          {/* Perfis Rápidos de Demonstração */}
          <div className="pt-4 border-t border-white/10 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-purple-200/80 font-bold">
              <span>Perfis Rápidos de Demonstração</span>
              <button
                type="button"
                onClick={() => setDemoOpen(!demoOpen)}
                className="text-[11px] text-pink-300 hover:underline cursor-pointer"
              >
                {demoOpen ? 'Ocultar' : 'Expandir'}
              </button>
            </div>

            {demoOpen && (
              <div className="grid grid-cols-1 gap-2 pt-1">
                {/* Franqueadora */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('super@acairose.pt', '123456')}
                  className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-amber-500/40 text-left flex items-center justify-between transition cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-amber-300 transition">
                        Painel Franqueadora
                      </div>
                      <div className="text-[10px] text-amber-200/70 font-mono">super@acairose.pt · Todas as Lojas</div>
                    </div>
                  </div>
                  <span className="text-xs text-amber-400 font-black">Entrar ›</span>
                </button>

                {/* Loja 1: Lisboa */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('lisboa@acairose.pt', '123456')}
                  className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-purple-500/40 text-left flex items-center justify-between transition cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center flex-shrink-0">
                      <Store className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-purple-300 transition">
                        Loja 1 — Lisboa (Parque das Nações)
                      </div>
                      <div className="text-[10px] text-purple-200/60 font-mono">lisboa@acairose.pt</div>
                    </div>
                  </div>
                  <span className="text-xs text-purple-400 font-black">Entrar ›</span>
                </button>

                {/* Loja 2: Santarém */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('santarem@acairose.pt', '123456')}
                  className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-emerald-500/40 text-left flex items-center justify-between transition cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center flex-shrink-0">
                      <Store className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition">
                        Loja 2 — Santarém
                      </div>
                      <div className="text-[10px] text-emerald-200/60 font-mono">santarem@acairose.pt</div>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400 font-black">Entrar ›</span>
                </button>

                {/* Loja 3: Aveiro */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('aveiro@acairose.pt', '123456')}
                  className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-500/40 text-left flex items-center justify-between transition cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center flex-shrink-0">
                      <Store className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition">
                        Loja 3 — Aveiro
                      </div>
                      <div className="text-[10px] text-cyan-200/60 font-mono">aveiro@acairose.pt</div>
                    </div>
                  </div>
                  <span className="text-xs text-cyan-400 font-black">Entrar ›</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}
