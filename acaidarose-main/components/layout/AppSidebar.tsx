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
    salon: true,
    menu: true,
    corporate: true,
  })

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Definição dos Grupos com suporte a Subtítulo abaixo do título
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

  const menuItems = [
    { id: 'menu' as AppViewId, label: 'Produtos do Cardápio', show: isAdmin },
    { id: 'menu_categories' as AppViewId, label: 'Categorias', show: isAdmin },
    { id: 'menu_menus' as AppViewId, label: 'Menus', show: isAdmin },
    { id: 'menu_highlights' as AppViewId, label: 'Destaques', show: isAdmin },
    { id: 'menu_offers' as AppViewId, label: 'Ofertas', show: isAdmin },
  ]

  const corporateItems = [
    {
      id: 'franchise' as AppViewId,
      label: 'Franqueadora Master',
      subtitle: 'Holding Global',
      show: isSuperAdmin,
    },
    { id: 'company' as AppViewId, label: 'Dados da Empresa', show: isAdmin },
    { id: 'reports' as AppViewId, label: 'Relatórios & Fecho', show: true },
    { id: 'qrcode_config' as AppViewId, label: 'Configurações QR Code', show: isAdmin },
    { id: 'users' as AppViewId, label: 'Utilizadores do Sistema', show: isAdmin },
  ]

  const isSalonActive = salonItems.some((i) => i.id === currentView)
  const isMenuActive = menuItems.some((i) => i.id === currentView)
  const isCorporateActive = corporateItems.some((i) => i.id === currentView)

  const renderContent = () => (
    <div className="flex flex-col h-full justify-between">
      <div className="p-4 md:p-5 flex flex-col flex-1 overflow-y-auto">
        {/* Logo Oficial do Açaí da Rose */}
        <div className="flex items-center justify-between pb-4 border-b border-purple-50">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Açaí da Rose" className="h-10 w-auto object-contain" />
            <div>
              <div className="font-black text-sm text-foreground leading-tight">Açaí da Rose</div>
              <div className="text-[10px] text-purple-700 font-bold uppercase tracking-wider">
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
              className="w-full text-left p-3 rounded-2xl border-2 border-purple-200 bg-purple-50/70 hover:bg-purple-100 transition-all flex items-center justify-between cursor-pointer group"
              title="Clique para alternar entre as lojas franqueadas"
            >
              <div className="min-w-0">
                <div className="text-xs font-black text-purple-950 truncate">
                  {currentTenant.name}
                </div>
                <div className="text-[10px] text-purple-700 font-extrabold flex items-center gap-1 mt-0.5">
                  <span>Trocar de Empresa</span>
                  <span className="text-xs">▾</span>
                </div>
              </div>
            </button>
          ) : (
            <div className="p-3 rounded-2xl border border-purple-100 bg-purple-50/40">
              <div className="text-xs font-bold text-purple-950 truncate">
                {currentTenant.name}
              </div>
              <div className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                {currentTenant.city || 'Portugal'} · Loja Ativa
              </div>
            </div>
          )}
        </div>

        {/* Grupos Colapsáveis de Navegação */}
        <nav className="space-y-3 flex-1">
          {/* ========================================================= */}
          {/* 1. GRUPO: ATENDIMENTO & SALÃO (Colapsável)               */}
          {/* ========================================================= */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => toggleGroup('salon')}
              className={`w-full px-3 py-2 rounded-2xl text-xs font-black flex items-center justify-between transition-all cursor-pointer ${
                isSalonActive
                  ? 'bg-purple-50/90 text-purple-950 border border-purple-200/80'
                  : 'text-foreground/80 hover:bg-purple-50/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-purple-700" />
                <span className="text-xs uppercase tracking-tight">Atendimento & Salão</span>
              </div>
              {openGroups.salon ? (
                <ChevronUp className="h-3.5 w-3.5 text-purple-700" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>

            {openGroups.salon && (
              <div className="pl-3.5 pr-1 py-1 space-y-1 border-l-2 border-purple-100 ml-3 animate-in fade-in duration-150">
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
                            ? 'bg-purple-700 text-white font-bold shadow-xs'
                            : 'text-muted-foreground hover:text-purple-950 hover:bg-purple-50/60'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-xs leading-tight">{item.label}</span>
                          {item.subtitle && (
                            <span
                              className={`text-[10px] font-semibold leading-tight mt-0.5 ${
                                active ? 'text-purple-100' : 'text-purple-700'
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
          {/* 2. GRUPO: CARDÁPIO (Colapsável com Sub-Itens)            */}
          {/* ========================================================= */}
          {isAdmin && (
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup('menu')}
                className={`w-full px-3 py-2 rounded-2xl text-xs font-black flex items-center justify-between transition-all cursor-pointer ${
                  isMenuActive
                    ? 'bg-purple-50/90 text-purple-950 border border-purple-200/80'
                    : 'text-foreground/80 hover:bg-purple-50/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🛎️</span>
                  <span className="text-xs uppercase tracking-tight">Cardápio</span>
                </div>
                {openGroups.menu ? (
                  <ChevronUp className="h-3.5 w-3.5 text-purple-700" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>

              {openGroups.menu && (
                <div className="pl-3.5 pr-1 py-1 space-y-1 border-l-2 border-purple-100 ml-3 animate-in fade-in duration-150">
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
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            active
                              ? 'bg-purple-700 text-white font-bold shadow-xs'
                              : 'text-muted-foreground hover:text-purple-950 hover:bg-purple-50/60'
                          }`}
                        >
                          {sub.label}
                        </button>
                      )
                    })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. GRUPO: CORPORATIVO & GESTÃO (Colapsável)               */}
          {/* ========================================================= */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => toggleGroup('corporate')}
              className={`w-full px-3 py-2 rounded-2xl text-xs font-black flex items-center justify-between transition-all cursor-pointer ${
                isCorporateActive
                  ? 'bg-purple-50/90 text-purple-950 border border-purple-200/80'
                  : 'text-foreground/80 hover:bg-purple-50/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-purple-700" />
                <span className="text-xs uppercase tracking-tight">Corporativo & Gestão</span>
              </div>
              {openGroups.corporate ? (
                <ChevronUp className="h-3.5 w-3.5 text-purple-700" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>

            {openGroups.corporate && (
              <div className="pl-3.5 pr-1 py-1 space-y-1 border-l-2 border-purple-100 ml-3 animate-in fade-in duration-150">
                {corporateItems
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
                            ? 'bg-purple-700 text-white font-bold shadow-xs'
                            : 'text-muted-foreground hover:text-purple-950 hover:bg-purple-50/60'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-xs leading-tight">{item.label}</span>
                          {item.subtitle && (
                            <span
                              className={`text-[10px] font-semibold leading-tight mt-0.5 ${
                                active ? 'text-purple-100' : 'text-purple-700'
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
        </nav>
      </div>

      {/* Rodapé da Sidebar */}
      <div className="p-4 border-t border-purple-50 bg-purple-50/25">
        <div className="text-center text-[10px] text-muted-foreground font-semibold">
          Açaí da Rose · Portugal
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* 1. Sidebar Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:flex-shrink-0 md:sticky md:top-0 md:h-screen bg-white border-r border-purple-100 z-30">
        {renderContent()}
      </aside>

      {/* 2. Drawer Mobile com Backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          />
          <div className="relative w-64 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {renderContent()}
          </div>
        </div>
      )}
    </>
  )
}
