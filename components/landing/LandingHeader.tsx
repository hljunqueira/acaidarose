'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LogIn, LayoutDashboard, Menu, X } from 'lucide-react'
import { User } from '@/types'

interface LandingHeaderProps {
  user: User | null
  onOpenLogin?: () => void
  onOpenPDV: () => void
}

export default function LandingHeader({ user, onOpenPDV }: LandingHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header className="sticky top-0 z-50 bg-[#140124]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 lg:px-12 py-3.5 shadow-2xl transition-all">
      <div className="max-w-[1536px] mx-auto flex items-center justify-between">
        {/* Logo da Marca */}
        <Link href="/" className="flex items-center gap-3 group">
          <img
            src="/logo-oficial.png"
            alt="Açaí da Rose"
            className="h-10 sm:h-11 w-auto object-contain drop-shadow-md group-hover:scale-105 transition-transform"
          />
          <div className="text-left">
            <div className="text-sm font-black text-white leading-tight tracking-tight uppercase">
              Açaí da Rose
            </div>
            <div className="text-[10px] font-bold text-pink-400 leading-tight">
              O sabor que abraça a alma
            </div>
          </div>
        </Link>

        {/* Navegação Desktop */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-bold text-purple-200/80">
          <button
            type="button"
            onClick={() => scrollTo('produtos')}
            className="hover:text-pink-300 transition cursor-pointer"
          >
            Nossos Açaís
          </button>
          <button
            type="button"
            onClick={() => scrollTo('sobre')}
            className="hover:text-pink-300 transition cursor-pointer"
          >
            Sobre Nós
          </button>
          <button
            type="button"
            onClick={() => scrollTo('especiais')}
            className="hover:text-pink-300 transition cursor-pointer"
          >
            Especialidades
          </button>
          <button
            type="button"
            onClick={() => scrollTo('qualidade')}
            className="hover:text-pink-300 transition cursor-pointer"
          >
            Qualidade
          </button>
          <button
            type="button"
            onClick={() => scrollTo('franquia')}
            className="hover:text-pink-300 transition cursor-pointer"
          >
            Franquia
          </button>
          <button
            type="button"
            onClick={() => scrollTo('loja')}
            className="hover:text-pink-300 transition cursor-pointer"
          >
            Nossa Loja
          </button>
        </nav>

        {/* Botão de Acesso & Botão Mobile */}
        <div className="flex items-center gap-2.5">
          {user ? (
            <Button
              onClick={onOpenPDV}
              className="h-9 sm:h-10 px-3.5 sm:px-4 rounded-xl bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/40 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
            >
              <LayoutDashboard className="h-4 w-4 text-pink-400" />
              <span className="hidden sm:inline">Aceder ao PDV</span>
              <span className="sm:hidden">PDV</span>
            </Button>
          ) : (
            <Link
              href="/login"
              className="h-9 sm:h-10 px-3.5 sm:px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/20 text-purple-100 hover:text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all hover:border-pink-500/40"
            >
              <LogIn className="h-4 w-4 text-pink-400" />
              <span>Portal da Equipa</span>
            </Link>
          )}

          {/* Toggle Menu Mobile */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/5 border border-white/15 text-purple-200 hover:text-white transition"
            aria-label="Abrir menu de navegação"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Dropdown Menu Mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 mt-3 pt-3 pb-2 space-y-1.5 text-left">
          <button
            type="button"
            onClick={() => scrollTo('produtos')}
            className="w-full px-3 py-2 rounded-lg text-xs font-bold text-purple-200 hover:text-white hover:bg-white/5 text-left transition"
          >
            Nossos Açaís
          </button>
          <button
            type="button"
            onClick={() => scrollTo('sobre')}
            className="w-full px-3 py-2 rounded-lg text-xs font-bold text-purple-200 hover:text-white hover:bg-white/5 text-left transition"
          >
            Sobre Nós
          </button>
          <button
            type="button"
            onClick={() => scrollTo('especiais')}
            className="w-full px-3 py-2 rounded-lg text-xs font-bold text-purple-200 hover:text-white hover:bg-white/5 text-left transition"
          >
            Especialidades
          </button>
          <button
            type="button"
            onClick={() => scrollTo('qualidade')}
            className="w-full px-3 py-2 rounded-lg text-xs font-bold text-purple-200 hover:text-white hover:bg-white/5 text-left transition"
          >
            Qualidade
          </button>
          <button
            type="button"
            onClick={() => scrollTo('franquia')}
            className="w-full px-3 py-2 rounded-lg text-xs font-bold text-purple-200 hover:text-white hover:bg-white/5 text-left transition"
          >
            Seja um Franchisado
          </button>
          <button
            type="button"
            onClick={() => scrollTo('loja')}
            className="w-full px-3 py-2 rounded-lg text-xs font-bold text-purple-200 hover:text-white hover:bg-white/5 text-left transition"
          >
            Nossa Loja em Torres Novas
          </button>
        </div>
      )}
    </header>
  )
}
