'use client'

import React, { useState, useEffect } from 'react'
import { User, Tenant } from '@/types'
import { Badge } from '@/components/ui/badge'
import {
  ChevronDown,
  ChevronUp,
  Store,
  Utensils,
  Building2,
  X,
  Server,
  ShieldCheck,
  Terminal,
  Tv,
  Boxes,
  ShoppingCart,
  Truck,
  Sparkles,
} from 'lucide-react'

export type AppViewId =
  | 'dev_hub'
  | 'prevention_center'
  | 'audit_logs'
  | 'franchise'
  | 'franchise_requests'
  | 'supply_hub'
  | 'pdv'
  | 'qrcode'
  | 'tv_panel'
  | 'tables'
  | 'inventory'
  | 'supply_orders'
  | 'menu'
  | 'menu_categories'
  | 'menu_menus'
  | 'menu_highlights'
  | 'company'
  | 'qrcode_config'
  | 'users'
  | 'reports'

interface AppSidebarProps {
  currentView: AppViewId
  onSelectView: (view: AppViewId) => void
  user: User
  currentTenant: Tenant
  onOpenStoreSwitcher: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

interface NavItem {
  id: AppViewId
  label: string
  subtitle?: string
  badge?: string
  show: boolean
}

interface NavGroup {
  key: string
  title: string
  icon: any
  accentClass: string
  items: NavItem[]
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
  const isFranchisorAdmin = user.role === 'FRANCHISOR_ADMIN'
  const isTenantAdmin = user.role === 'TENANT_ADMIN'
  const isCashier = user.role === 'CASHIER'
  const canSwitchStore = isSuperAdmin || isFranchisorAdmin

  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0)

  useEffect(() => {
    const loadCount = () => {
      fetch('/api/franchise-requests')
        .then((r) => r.json())
        .then((d) => {
          if (d.requests) {
            const count = d.requests.filter((r: any) => r.status === 'PENDING').length
            setPendingRequestsCount(count)
          }
        })
        .catch(() => {})
    }

    loadCount()

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail?.count !== undefined) {
        setPendingRequestsCount(customEvent.detail.count)
      } else {
        loadCount()
      }
    }

    window.addEventListener('franchise_requests_updated', handleUpdate)
    return () => window.removeEventListener('franchise_requests_updated', handleUpdate)
  }, [currentView])

  // Controle de colapso dos grupos
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    devHub: true,
    franchise: true,
    salon: true,
    menu: true,
    inventory: true,
    storeConfig: true,
  })

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // =========================================================================
  // DEFINIÇÃO DOS GRUPOS CONFORME O PERFIL
  // =========================================================================
  let navGroups: NavGroup[] = []

  if (isSuperAdmin) {
    // 👑 1. SUPER_ADMIN (Master TI)
    navGroups = [
      {
        key: 'devHub',
        title: 'CENTRAL MASTER TI & INFRA',
        icon: Server,
        accentClass: 'text-indigo-600 dark:text-indigo-400',
        items: [
          { id: 'dev_hub', label: 'Central TI & Status VPS', show: true },
          { id: 'prevention_center', label: 'Prevenção & Diagnóstico', show: true },
          { id: 'audit_logs', label: 'Logs & Auditoria TI', show: true },
        ],
      },
      {
        key: 'franchise',
        title: 'FRANQUEADORA MASTER',
        icon: Building2,
        accentClass: 'text-amber-600 dark:text-amber-400',
        items: [
          { id: 'franchise', label: 'Franqueadora Master', show: true },
          {
            id: 'franchise_requests',
            label: 'Candidaturas & Solicitações',
            badge: pendingRequestsCount > 0 ? String(pendingRequestsCount) : undefined,
            show: true,
          },
          { id: 'supply_hub', label: 'Central de Abastecimento B2B', show: true },
        ],
      },
      {
        key: 'salon',
        title: 'OPERAÇÃO & ATENDIMENTO',
        icon: Store,
        accentClass: 'text-purple-700 dark:text-pink-400',
        items: [
          { id: 'pdv', label: 'PDV Balcão & Mesas', subtitle: 'Montagem de Taça', show: true },
          { id: 'qrcode', label: 'Pedidos & KDS Cozinha', subtitle: 'Fila em Tempo Real', show: true },
          { id: 'tv_panel', label: 'Painel TV de Senhas', subtitle: 'Chamada Balcão', show: true },
          { id: 'tables', label: 'Gestão de Mesas', show: true },
        ],
      },
      {
        key: 'menu',
        title: 'CARDÁPIO, MÍDIAS & PREÇOS',
        icon: Utensils,
        accentClass: 'text-pink-600 dark:text-pink-400',
        items: [
          { id: 'menu', label: 'Produtos do Cardápio', show: true },
          { id: 'menu_categories', label: 'Categorias', show: true },
          { id: 'menu_menus', label: 'Menus', show: true },
          { id: 'menu_highlights', label: 'Destaques & Stories', show: true },
        ],
      },
      {
        key: 'inventory',
        title: 'GESTÃO DE ESTOQUE & SUPPLY CHAIN',
        icon: Boxes,
        accentClass: 'text-emerald-600 dark:text-emerald-400',
        items: [
          { id: 'inventory', label: 'Gestão de Estoque Local', show: true },
          { id: 'supply_orders', label: 'Reposição com a Matriz', show: true },
        ],
      },
      {
        key: 'storeConfig',
        title: 'CONFIGURAÇÕES DA UNIDADE',
        icon: Store,
        accentClass: 'text-purple-600 dark:text-purple-400',
        items: [
          { id: 'company', label: 'Dados da Loja', show: true },
          { id: 'qrcode_config', label: 'Configurações QR Code', show: true },
          { id: 'users', label: 'Utilizadores & Permissões', show: true },
          { id: 'reports', label: 'Relatórios & Fecho de Caixa', show: true },
        ],
      },
    ]
  } else if (isFranchisorAdmin) {
    // 🏢 2. FRANCHISOR_ADMIN (Sede Franqueadora Aveiro)
    navGroups = [
      {
        key: 'franchise',
        title: 'FRANQUEADORA MASTER',
        icon: Building2,
        accentClass: 'text-amber-600 dark:text-amber-400',
        items: [
          { id: 'franchise', label: 'Franqueadora Master', show: true },
          {
            id: 'franchise_requests',
            label: 'Candidaturas & Solicitações',
            badge: pendingRequestsCount > 0 ? String(pendingRequestsCount) : undefined,
            show: true,
          },
          { id: 'supply_hub', label: 'Central de Abastecimento B2B', show: true },
          { id: 'menu_highlights', label: 'Destaques & Stories Nacionais', show: true },
        ],
      },
      {
        key: 'salon',
        title: 'OPERAÇÃO LOJA AVEIRO',
        icon: Store,
        accentClass: 'text-purple-700 dark:text-pink-400',
        items: [
          { id: 'pdv', label: 'PDV Balcão & Montagem de Taça', show: true },
          { id: 'qrcode', label: 'Pedidos & KDS Cozinha', show: true },
          { id: 'tv_panel', label: 'Painel TV de Senhas', show: true },
          { id: 'tables', label: 'Gestão de Mesas', show: true },
        ],
      },
      {
        key: 'inventory',
        title: 'ESTOQUE MATRIZ AVEIRO',
        icon: Boxes,
        accentClass: 'text-emerald-600 dark:text-emerald-400',
        items: [{ id: 'inventory', label: 'Gestão de Estoque Matriz', show: true }],
      },
      {
        key: 'storeConfig',
        title: 'GESTÃO DA LOJA MATRIZ AVEIRO',
        icon: Utensils,
        accentClass: 'text-purple-600 dark:text-purple-400',
        items: [
          { id: 'menu', label: 'Produtos do Cardápio Aveiro', show: true },
          { id: 'menu_categories', label: 'Categorias & Menus', show: true },
          { id: 'company', label: 'Dados da Loja Aveiro', show: true },
          { id: 'qrcode_config', label: 'Configurações QR Code Aveiro', show: true },
          { id: 'users', label: 'Utilizadores Loja Aveiro', show: true },
          { id: 'reports', label: 'Relatórios & Fecho de Caixa', show: true },
        ],
      },
    ]
  } else if (isTenantAdmin) {
    // 🏬 3. TENANT_ADMIN (Gerente Loja Franqueada — ex: Torres Novas)
    navGroups = [
      {
        key: 'salon',
        title: 'OPERAÇÃO & ATENDIMENTO',
        icon: Store,
        accentClass: 'text-purple-700 dark:text-pink-400',
        items: [
          { id: 'pdv', label: 'PDV Balcão & Mesas', show: true },
          { id: 'qrcode', label: 'Pedidos & KDS Cozinha', show: true },
          { id: 'tv_panel', label: 'Painel TV de Senhas', show: true },
          { id: 'tables', label: 'Gestão de Mesas', show: true },
        ],
      },
      {
        key: 'menu',
        title: 'CARDÁPIO LOCAL',
        icon: Utensils,
        accentClass: 'text-pink-600 dark:text-pink-400',
        items: [
          { id: 'menu', label: 'Produtos & Preços da Loja', show: true },
          { id: 'menu_categories', label: 'Categorias & Menus', show: true },
          { id: 'menu_highlights', label: 'Destaques da Loja', show: true },
          {
            id: 'franchise_requests',
            label: 'Solicitações à Franqueadora',
            badge: pendingRequestsCount > 0 ? String(pendingRequestsCount) : undefined,
            show: true,
          },
        ],
      },
      {
        key: 'inventory',
        title: 'ESTOQUE & ABASTECIMENTO',
        icon: Boxes,
        accentClass: 'text-emerald-600 dark:text-emerald-400',
        items: [
          { id: 'inventory', label: 'Gestão de Estoque Local', show: true },
          { id: 'supply_orders', label: 'Reposição com a Matriz', show: true },
        ],
      },
      {
        key: 'storeConfig',
        title: 'GESTÃO & CONFIGURAÇÕES DA UNIDADE',
        icon: Store,
        accentClass: 'text-purple-600 dark:text-purple-400',
        items: [
          { id: 'company', label: 'Dados da Loja', show: true },
          { id: 'qrcode_config', label: 'Configurações QR Code', show: true },
          { id: 'users', label: 'Caixas & Operadores da Loja', show: true },
          { id: 'reports', label: 'Fecho de Caixa & Relatórios do Dia', show: true },
        ],
      },
    ]
  } else {
    // 💻 4. CASHIER (Operador de Caixa / Atendente)
    navGroups = [
      {
        key: 'salon',
        title: 'OPERAÇÃO & ATENDIMENTO',
        icon: Store,
        accentClass: 'text-purple-700 dark:text-pink-400',
        items: [
          { id: 'pdv', label: 'PDV Balcão & Mesas', subtitle: 'Montagem de Taça', show: true },
          { id: 'qrcode', label: 'Pedidos & KDS Cozinha', subtitle: 'Status de Preparo', show: true },
          { id: 'tv_panel', label: 'Painel TV de Senhas', show: true },
          { id: 'inventory', label: 'Checklist Rápido de Estoque', show: true },
          { id: 'reports', label: 'Fecho de Turno do Caixa', show: true },
        ],
      },
    ]
  }

  const renderContent = () => (
    <div className="flex flex-col h-full justify-between">
      <div className="p-4 md:p-5 flex flex-col flex-1 overflow-y-auto">
        {/* Logo Oficial do Açaí da Rose & Botão Fechar Mobile */}
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

          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-xl text-purple-900 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-white/10 cursor-pointer"
            aria-label="Fechar Menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Card da Loja Ativa com Seletor */}
        <div className="my-3.5">
          {canSwitchStore ? (
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
                {currentTenant.city || 'Portugal'} · Loja Fixada
              </div>
            </div>
          )}
        </div>

        {/* Grupos Colapsáveis Dinâmicos */}
        <nav className="space-y-3 flex-1">
          {navGroups.map((group) => {
            const GroupIcon = group.icon
            const isGroupActive = group.items.some((it) => it.id === currentView)
            const isOpen = openGroups[group.key] ?? true

            return (
              <div key={group.key} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.key)}
                  className={`w-full px-3 py-2 rounded-2xl text-xs font-black flex items-center justify-between transition-all cursor-pointer ${
                    isGroupActive
                      ? 'bg-purple-100 dark:bg-white/10 text-purple-950 dark:text-white border border-purple-200 dark:border-pink-500/30'
                      : 'text-purple-900 dark:text-purple-200/80 hover:bg-purple-50 dark:hover:bg-white/5 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GroupIcon className={`h-4 w-4 ${group.accentClass}`} />
                    <span className="text-xs uppercase tracking-tight">{group.title}</span>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="h-3.5 w-3.5 text-purple-500" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-purple-400" />
                  )}
                </button>

                {isOpen && (
                  <div className="pl-3.5 pr-1 py-1 space-y-1 border-l border-purple-200 dark:border-white/10 ml-3 animate-in fade-in duration-150">
                    {group.items
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
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-between ${
                              active
                                ? 'bg-gradient-to-r from-purple-700 via-purple-800 to-pink-600 dark:from-pink-600 dark:via-fuchsia-600 dark:to-purple-600 text-white font-bold shadow-md shadow-purple-700/20'
                                : 'text-purple-900 dark:text-purple-200/70 font-semibold hover:text-purple-950 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-white/5'
                            }`}
                          >
                            <div className="flex flex-col min-w-0 pr-2">
                              <span className="font-bold text-xs leading-tight truncate">{item.label}</span>
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
                            {item.badge && (
                              <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-pink-600 text-white text-[10px] font-black flex items-center justify-center shadow-xs shrink-0">
                                {item.badge}
                              </span>
                            )}
                          </button>
                        )
                      })}
                  </div>
                )}
              </div>
            )
          })}
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
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:flex-shrink-0 lg:sticky lg:top-0 lg:h-screen bg-white dark:bg-[#150226] border-r border-purple-100 dark:border-white/10 z-30 shadow-xs transition-colors duration-150">
        {renderContent()}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-purple-950/40 dark:bg-black/70 backdrop-blur-xs transition-opacity"
          />
          <div className="relative w-72 max-w-[85vw] bg-white dark:bg-[#150226] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200 border-r border-purple-100 dark:border-white/10">
            {renderContent()}
          </div>
        </div>
      )}
    </>
  )
}
