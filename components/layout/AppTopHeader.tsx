'use client'

import React, { useState } from 'react'
import { User, Tenant } from '@/types'
import { Button } from '@/components/ui/button'
import { AppViewId } from './AppSidebar'

interface AppTopHeaderProps {
  user: User
  currentTenant: Tenant
  onSelectView: (view: AppViewId) => void
  onOpenStoreSwitcher: () => void
  onLogout: () => void
  onToggleMobileMenu: () => void
}

export default function AppTopHeader({
  user,
  currentTenant,
  onSelectView,
  onOpenStoreSwitcher,
  onLogout,
  onToggleMobileMenu,
}: AppTopHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Saudação por horário
  const hour = new Date().getHours()
  const greeting = hour >= 6 && hour < 12 ? 'Bom dia' : hour >= 12 && hour < 19 ? 'Boa tarde' : 'Boa noite'

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-purple-100 px-4 md:px-6 py-3 flex items-center justify-between">
      {/* Botão Mobile & Saudação */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="p-2 rounded-xl bg-purple-50 text-purple-900 md:hidden text-xs font-black"
        >
          MENU
        </button>

        <div className="min-w-0">
          <div className="text-xs md:text-sm font-black text-foreground truncate">
            {greeting}, {currentTenant.name}!
          </div>
        </div>
      </div>

      {/* Avatar do Utilizador com Menu Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2.5 p-1.5 rounded-2xl hover:bg-purple-50 transition cursor-pointer"
        >
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-purple-700 to-fuchsia-700 text-white flex items-center justify-center text-xs font-black shadow-xs">
            {user.name.slice(0, 1)}
          </div>
          <div className="hidden sm:block text-left text-xs">
            <div className="font-bold text-foreground leading-tight">{user.name}</div>
            <div className="text-[10px] text-purple-700 font-semibold">{user.role}</div>
          </div>
        </button>

        {/* Dropdown Menu Oficial */}
        {dropdownOpen && (
          <>
            <div
              onClick={() => setDropdownOpen(false)}
              className="fixed inset-0 z-40"
            />
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-purple-100 shadow-xl z-50 p-2 text-xs space-y-1">
              {/* Header do Utilizador */}
              <div className="p-3 border-b border-purple-50 bg-purple-50/40 rounded-xl mb-1">
                <div className="font-black text-foreground">{user.name}</div>
                <div className="text-[10px] text-purple-800 font-bold uppercase">{user.role}</div>
                <div className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">{user.email}</div>
              </div>

              {/* Opções */}
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false)
                  onOpenStoreSwitcher()
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-foreground font-bold hover:bg-purple-50 hover:text-purple-950 transition cursor-pointer"
              >
                Trocar de Empresa da Franquia
              </button>

              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false)
                  onSelectView('pdv')
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-foreground font-bold hover:bg-purple-50 hover:text-purple-950 transition cursor-pointer"
              >
                PDV Balcão & Mesas
              </button>

              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false)
                  onSelectView('users')
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-foreground font-bold hover:bg-purple-50 hover:text-purple-950 transition cursor-pointer"
              >
                Perfil & Utilizadores
              </button>

              <div className="border-t border-purple-50 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false)
                    onLogout()
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-red-600 font-bold hover:bg-red-50 transition cursor-pointer"
                >
                  Sair / Terminar Sessão
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
