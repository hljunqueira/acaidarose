'use client'

import React, { useState } from 'react'
import { User, Tenant } from '@/types'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronUp, Store, Utensils, Building2 } from 'lucide-react'

export type AppViewId =
  | 'qrcode'
  | 'pdv'
  | 'tables'
  | 'staff'
  | 'menu'
  | 'menu_categories'
  | 'menu_menus'
  | 'menu_highlights'
  | 'menu_offers'
  | 'franchise'
  | 'reports'
  | 'qrcode_config'
  | 'company'
  | 'users'

interface AppSidebarProps {
  currentView: AppViewId
  onSelectView: (view: AppViewId) => void
  user: User
  currentTenant: Tenant
  onOpenStoreSwitcher: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

export default function AppSidebar({
  currentView,
  onSelectView,
  user,
  currentTenant,
  onOpenStoreSwitcher,
  mobileOpen,
  onCloseMobile,
}: AppSidebarProps) {
  const isSuperAdmin = user.role === 'SUPER_ADMIN'
  const isTenantAdmin = user.role === 'TENANT_ADMIN'
  const isAdmin = isSuperAdmin || isTenantAdmin

  // Controle de colapso de cada grupo
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    franchise: true,
    salon: true,
    menu: true,
    storeConfig: true,
  })

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // 1. GRUPO EXCLUSIVO: PAINEL DA FRANQUEADORA (Apenas SUPER_ADMIN)
  const franchisorItems = [
    {
      id: 'franchise' as AppViewId,
      label: 'Franqueadora Master',
      subtitle: 'Holding Global & Contratos',
      show: isSuperAdmin,
    },
    {
      id: 'users' as AppViewId,
      label: 'Gestão de Utilizadores',
      subtitle: 'Acessos Globais',
      show: isSuperAdmin,
    },
  ]

  // 2. GRUPO LOJA: ATENDIMENTO & SALÃO
  const salonItems = [
    {
      id: 'qrcode' as AppViewId,
      label: 'Pedidos',
      subtitle: 'Mesa / Balcão',
      show: true,
    },
    {
      id: 'pdv' as AppViewId,
      label: 'PDV & Salão de Mesas',
      show: true,
    },
    {
      id: 'tables' as AppViewId,
      label: 'Gestão de Mesas',
      show: isAdmin,
    },
    {
      id: 'staff' as AppViewId,
      label: 'Garçons & Atendentes',
      show: isAdmin,
    },
  ]

  // 3. GRUPO LOJA: CARDÁPIO & PREÇOS
  const menuItems = [
    { id: 'menu' as AppViewId, label: 'Produtos do Cardápio', show: isAdmin },
    { id: 'menu_categories' as AppViewId, label: 'Categorias', show: isAdmin },
    { id: 'menu_menus' as AppViewId, label: 'Menus', show: isAdmin },
    { id: 'menu_highlights' as AppViewId, label: 'Destaques', show: isAdmin },
    { id: 'menu_offers' as AppViewId, label: 'Ofertas', show: isAdmin },
  ]

  // 4. GRUPO LOJA: CONFIGURAÇÕES DA LOJA
  const storeConfigItems = [
    { id: 'company' as AppViewId, label: 'Dados da Loja', show: isAdmin },
    { id: 'qrcode_config' as AppViewId, label: 'Configurações QR Code', show: isAdmin },
    { id: 'reports' as AppViewId, label: 'Relatórios & Fecho de Caixa', show: true },
  ]

  const isFranchisorActive = franchisorItems.some((i) => i.id === currentView)
  const isSalonActive = salonItems.some((i) => i.id === currentView)
  const isMenuActive = menuItems.some((i) => i.id === currentView)
  const isStoreConfigActive = storeConfigItems.some((i) => i.id === currentView)

  const renderContent = () => (
    <div className="flex flex-col h-full justify-between">
      <div className="p-4 md:p-5 flex flex-col flex-1 overflow-y-auto">
        {/* Logo Oficial do Açaí da Rose */}
        <div className="flex items-center justify-between pb-4 border-b border-purple-100 dark:border-white/10">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Açaí da Rose" className="h-10 w-auto object-contain" />
            <div>
              <div className="font-black text-sm text-purple-950 dark:text-white leading-tight">Açaí da Rose</div>
              <div className="text-[10px] text-purple-700 dark:text-pink-400 font-black uppercase tracking-wider">
                PDV & Franqueadora
              </div>
            </div>
          </div>
        </div>

        {/* Card da Loja Ativa com Seletor */}
        <div className="my-3.5">
          {isSuperAdmin ? (
            <button
              type="button"
              onClick={onOpenStoreSwitcher}
              className="w-full text-left p-3 rounded-2xl border border-purple-200/80 dark:border-white/15 bg-purple-50/70 dark:bg-white/5 hover:bg-purple-100 dark:hover:bg-white/10 transition-all flex items-center justify-between cursor-pointer group shadow-xs"
              title="Clique para alternar entre as lojas franqueadas"
            >
              <div className="min-w-0">
                <div className="text-xs font-black text-purple-950 dark:text-white truncate group-hover:text-purple-700 dark:group-hover:text-pink-300 transition">
                  {currentTenant.name}
                </div>
                <div className="text-[10px] text-pink-600 dark:text-pink-400 font-bold flex items-center gap-1 mt-0.5">
                  <span>Trocar de Loja</span>
                  <span className="text-xs">▾</span>
                </div>
              </div>
            </button>
          ) : (
            <div className="p-3 rounded-2xl border border-purple-100 dark:border-white/10 bg-purple-50/50 dark:bg-white/5">
              <div className="text-xs font-bold text-purple-950 dark:text-white truncate">
                {currentTenant.name}
              </div>
              <div className="text-[10px] text-purple-700 dark:text-purple-200/60 font-semibold mt-0.5">
                {currentTenant.city || 'Portugal'} · Loja Ativa
              </div>
            </div>
          )}
        </div>

        {/* Grupos Colapsáveis de Navegação */}
        <nav className="space-y-3 flex-1">
          {/* ========================================================= */}
          {/* 0. GRUPO EXCLUSIVO: PAINEL DA FRANQUEADORA (SUPER_ADMIN)  */}
          {/* ========================================================= */}
          {isSuperAdmin && (
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup('franchise')}
                className={`w-full px-3 py-2 rounded-2xl text-xs font-black flex items-center justify-between transition-all cursor-pointer ${
                  isFranchisorActive
                    ? 'bg-amber-500/20 dark:bg-amber-500/20 text-amber-950 dark:text-amber-300 border border-amber-500/40 shadow-xs'
                    : 'text-amber-800 dark:text-amber-300/80 hover:bg-amber-50 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-amber-500" />
                  <span className="text-xs uppercase tracking-tight">Painel Franqueadora</span>
                </div>
                {openGroups.franchise ? (
                  <ChevronUp className="h-3.5 w-3.5 text-amber-500" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-amber-500/60" />
                )}
              </button>

              {openGroups.franchise && (
                <div className="pl-3.5 pr-1 py-1 space-y-1 border-l border-amber-400/40 dark:border-amber-500/30 ml-3 animate-in fade-in duration-150">
                  {franchisorItems
                    .filter((it) => it.show)
                    .map((item) => {
                      const active = currentView === item.id
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            onSelectView(item.id)
                            onCloseMobile()
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                            active
                              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold shadow-md shadow-amber-600/20'
                              : 'text-amber-950 dark:text-amber-200/80 font-semibold hover:text-amber-900 dark:hover:text-white hover:bg-amber-500/10'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-xs leading-tight">{item.label}</span>
                            {item.subtitle && (
                              <span
                                className={`text-[10px] font-semibold leading-tight mt-0.5 ${
                                  active ? 'text-amber-100' : 'text-amber-700 dark:text-amber-300/70'
                                }`}
                              >
                                {item.subtitle}
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* 1. GRUPO: ATENDIMENTO & SALÃO                             */}
          {/* ========================================================= */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => toggleGroup('salon')}
              className={`w-full px-3 py-2 rounded-2xl text-xs font-black flex items-center justify-between transition-all cursor-pointer ${
                isSalonActive
                  ? 'bg-purple-100 dark:bg-white/10 text-purple-950 dark:text-white border border-purple-200 dark:border-pink-500/30'
                  : 'text-purple-900 dark:text-purple-200/80 hover:bg-purple-50 dark:hover:bg-white/5 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-purple-700 dark:text-pink-400" />
                <span className="text-xs uppercase tracking-tight">Atendimento & Salão</span>
              </div>
              {openGroups.salon ? (
                <ChevronUp className="h-3.5 w-3.5 text-purple-700 dark:text-pink-400" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-purple-400 dark:text-purple-300/60" />
              )}
            </button>

            {openGroups.salon && (
              <div className="pl-3.5 pr-1 py-1 space-y-1 border-l border-purple-200 dark:border-white/10 ml-3 animate-in fade-in duration-150">
                {salonItems
                  .filter((it) => it.show)
                  .map((item) => {
                    const active = currentView === item.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelectView(item.id)
                          onCloseMobile()
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                          active
                            ? 'bg-gradient-to-r from-purple-700 via-purple-800 to-pink-600 dark:from-pink-600 dark:via-fuchsia-600 dark:to-purple-600 text-white font-bold shadow-md shadow-purple-700/20 dark:shadow-pink-600/20'
                            : 'text-purple-900 dark:text-purple-200/70 font-semibold hover:text-purple-950 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-xs leading-tight">{item.label}</span>
                          {item.subtitle && (
                            <span
                              className={`text-[10px] font-semibold leading-tight mt-0.5 ${
                                active ? 'text-purple-100 dark:text-pink-100' : 'text-purple-600 dark:text-purple-300/80'
                              }`}
                            >
                              {item.subtitle}
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* 2. GRUPO: CARDÁPIO & PREÇOS                               */}
          {/* ========================================================= */}
          {isAdmin && (
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup('menu')}
                className={`w-full px-3 py-2 rounded-2xl text-xs font-black flex items-center justify-between transition-all cursor-pointer ${
                  isMenuActive
                    ? 'bg-amber-50 dark:bg-white/10 text-amber-950 dark:text-white border border-amber-200 dark:border-amber-500/30'
                    : 'text-purple-900 dark:text-purple-200/80 hover:bg-purple-50 dark:hover:bg-white/5 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs uppercase tracking-tight">Cardápio & Preços</span>
                </div>
                {openGroups.menu ? (
                  <ChevronUp className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-purple-400 dark:text-purple-300/60" />
                )}
              </button>

              {openGroups.menu && (
                <div className="pl-3.5 pr-1 py-1 space-y-1 border-l border-purple-200 dark:border-white/10 ml-3 animate-in fade-in duration-150">
                  {menuItems
                    .filter((sub) => sub.show)
                    .map((sub) => {
                      const active = currentView === sub.id
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => {
                            onSelectView(sub.id)
                            onCloseMobile()
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                            active
                              ? 'bg-gradient-to-r from-purple-700 to-pink-600 dark:from-amber-600 dark:to-pink-600 text-white font-bold shadow-md'
                              : 'text-purple-900 dark:text-purple-200/70 font-semibold hover:text-purple-950 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-white/5'
                          }`}
                        >
                          <span className="font-bold text-xs leading-tight">{sub.label}</span>
                        </button>
                      )
                    })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. GRUPO: CONFIGURAÇÕES DA LOJA                           */}
          {/* ========================================================= */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => toggleGroup('storeConfig')}
              className={`w-full px-3 py-2 rounded-2xl text-xs font-black flex items-center justify-between transition-all cursor-pointer ${
                isStoreConfigActive
                  ? 'bg-purple-100 dark:bg-white/10 text-purple-950 dark:text-white border border-purple-200 dark:border-purple-500/30'
                  : 'text-purple-900 dark:text-purple-200/80 hover:bg-purple-50 dark:hover:bg-white/5 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-purple-700 dark:text-purple-400" />
                <span className="text-xs uppercase tracking-tight">Configurações da Loja</span>
              </div>
              {openGroups.storeConfig ? (
                <ChevronUp className="h-3.5 w-3.5 text-purple-700 dark:text-purple-400" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-purple-400 dark:text-purple-300/60" />
              )}
            </button>

            {openGroups.storeConfig && (
              <div className="pl-3.5 pr-1 py-1 space-y-1 border-l border-purple-200 dark:border-white/10 ml-3 animate-in fade-in duration-150">
                {storeConfigItems
                  .filter((it) => it.show)
                  .map((item) => {
                    const active = currentView === item.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelectView(item.id)
                          onCloseMobile()
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                          active
                            ? 'bg-gradient-to-r from-purple-700 to-pink-600 dark:from-purple-600 dark:to-pink-600 text-white font-bold shadow-md'
                            : 'text-purple-900 dark:text-purple-200/70 font-semibold hover:text-purple-950 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <span className="font-bold text-xs leading-tight">{item.label}</span>
                      </button>
                    )
                  })}
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Rodapé da Sidebar */}
      <div className="p-4 border-t border-purple-100 dark:border-white/10 bg-purple-50/40 dark:bg-black/20">
        <div className="text-center text-[10px] text-purple-600 dark:text-purple-200/50 font-bold">
          Açaí da Rose · Portugal
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* 1. Sidebar Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:flex-shrink-0 md:sticky md:top-0 md:h-screen bg-white dark:bg-[#150226] border-r border-purple-100 dark:border-white/10 z-30 shadow-xs transition-colors duration-150">
        {renderContent()}
      </aside>

      {/* 2. Drawer Mobile com Backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-purple-950/40 dark:bg-black/70 backdrop-blur-xs transition-opacity"
          />
          <div className="relative w-64 max-w-[85vw] bg-white dark:bg-[#150226] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200 border-r border-purple-100 dark:border-white/10">
            {renderContent()}
          </div>
        </div>
      )}
    </>
  )
}
