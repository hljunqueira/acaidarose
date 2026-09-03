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
  Users,
  FileText,
} from 'lucide-react'

export type AppViewId =
  | 'dev_hub'
  | 'prevention_center'
  | 'audit_logs'
  | 'franchise'
  | 'franchise_candidates'
  | 'store_requests'
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
  | 'menu_schedules'
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
  const isMatrizTenant = Boolean(currentTenant?.isHeadquarters) || currentTenant?.id === '11111111-1111-1111-1111-111111111111' || currentTenant?.slug === 'figueira-da-foz' || currentTenant?.slug === 'figueira'

  // Contagem de solicitações e candidaturas pendentes
  const [candidatesCount, setCandidatesCount] = useState<number>(0)
  const [storeRequestsCount, setStoreRequestsCount] = useState<number>(0)

  useEffect(() => {
    const loadCounts = () => {
      fetch('/api/franchise-requests')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.requests)) {
            const candPending = data.requests.filter(
              (r: any) => (r.type === 'FRANCHISE_APPLICATION' || r.type === 'CONTACT_REQUEST') && r.status === 'PENDING'
            ).length
            const storePending = data.requests.filter(
              (r: any) => r.type !== 'FRANCHISE_APPLICATION' && r.type !== 'CONTACT_REQUEST' && r.status === 'PENDING'
            ).length

            setCandidatesCount(candPending)
            setStoreRequestsCount(storePending)
          }
        })
        .catch(() => {})
    }

    loadCounts()

    const handleUpdate = () => {
      loadCounts()
    }

    window.addEventListener('franchise_requests_updated', handleUpdate)
    return () => window.removeEventListener('franchise_requests_updated', handleUpdate)
  }, [currentView])

  const getGroupForView = (v: AppViewId): string => {
    if (['dev_hub', 'prevention_center', 'audit_logs'].includes(v)) return 'devHub'
    if (['franchise', 'franchise_candidates', 'store_requests', 'franchise_requests', 'supply_hub'].includes(v)) return 'franchise'
    if (['pdv', 'qrcode', 'tables'].includes(v)) return 'salon'
    if (['menu', 'menu_categories', 'menu_menus', 'menu_highlights', 'menu_schedules'].includes(v)) return 'menu'
    if (['inventory', 'supply_orders'].includes(v)) return 'inventory'
    if (['company', 'qrcode_config', 'tv_panel', 'users', 'reports'].includes(v)) return 'storeConfig'
    return 'salon'
  }

  // Inicialização inteligente: apenas o primeiro grupo relevante (ou o ativo) inicia aberto
  const initialActiveGroup = getGroupForView(currentView) || (isSuperAdmin ? 'devHub' : isFranchisorAdmin ? 'franchise' : 'salon')

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => ({
    devHub: initialActiveGroup === 'devHub',
    franchise: initialActiveGroup === 'franchise',
    salon: initialActiveGroup === 'salon',
    menu: initialActiveGroup === 'menu',
    inventory: initialActiveGroup === 'inventory',
    storeConfig: initialActiveGroup === 'storeConfig',
  }))

  // Auto-expande o grupo correspondente sempre que a view mudar
  useEffect(() => {
    const groupKey = getGroupForView(currentView)
    if (groupKey) {
      setOpenGroups((prev) => ({ ...prev, [groupKey]: true }))
    }
  }, [currentView])

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // =========================================================================
  // DEFINIÇÃO DOS GRUPOS CONFORME O PERFIL
  // =========================================================================
  let navGroups: NavGroup[] = []

  if (isSuperAdmin) {
    // 👑 1. SUPER_ADMIN (Master TI & Franqueadora Holding)
    navGroups = [
      {
        key: 'devHub',
        title: 'CENTRAL MASTER TI & INFRAESTRUTURA',
        icon: Server,
        accentClass: 'text-indigo-600 dark:text-indigo-400',
        items: [
          { id: 'dev_hub', label: 'Status & Integridade VPS', subtitle: 'PostgreSQL 16 & Gateways', show: true },
          { id: 'audit_logs', label: 'Logs & Auditoria TI', subtitle: 'Histórico Imutável de Eventos', show: true },
        ],
      },
      {
        key: 'franchise',
        title: 'FRANQUEADORA MASTER',
        icon: Building2,
        accentClass: 'text-amber-600 dark:text-amber-400',
        items: [
          {
            id: 'franchise',
            label: 'Gestão da Rede & Lojas',
            subtitle: 'Unidades, Contratos & Royalties',
            show: true,
          },
          {
            id: 'franchise_candidates',
            label: 'Candidaturas de Franquia',
            subtitle: 'Leads do Site & Expansão',
            badge: candidatesCount > 0 ? String(candidatesCount) : undefined,
            show: true,
          },
          {
            id: 'store_requests',
            label: 'Solicitações das Lojas',
            subtitle: 'Preços, Produtos & Destaques',
            badge: storeRequestsCount > 0 ? String(storeRequestsCount) : undefined,
            show: true,
          },
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
          { id: 'tables', label: 'Gestão de Mesas', subtitle: 'Salão & Comandas', show: true },
        ],
      },
      {
        key: 'menu',
        title: 'CARDÁPIO, MÍDIAS & PREÇOS',
        icon: Utensils,
        accentClass: 'text-pink-600 dark:text-pink-400',
        items: [
          { id: 'menu', label: 'Produtos do Cardápio', subtitle: 'Taças, Frutas & Toppings', show: true },
          { id: 'menu_categories', label: 'Categorias', subtitle: 'Estruturação Visual', show: true },
          { id: 'menu_menus', label: 'Menus do Cardápio', subtitle: 'Organização de Seções', show: true },
          { id: 'menu_highlights', label: 'Destaques & Stories', subtitle: 'Carrossel & Promoções', show: true },
        ],
      },
      {
        key: 'inventory',
        title: 'GESTÃO DE ESTOQUE & SUPPLY CHAIN',
        icon: Boxes,
        accentClass: 'text-emerald-600 dark:text-emerald-400',
        items: [
          { id: 'inventory', label: 'Gestão de Estoque Local', subtitle: 'Controle Físico & Auditoria', show: true },
          {
            id: 'supply_orders',
            label: isMatrizTenant ? 'Central de Suprimentos (Matriz)' : 'Reposição com a Matriz',
            subtitle: isMatrizTenant ? 'Pedidos B2B & Distribuição' : 'Pedidos B2B & Entrada de Carga',
            show: true,
          },
        ],
      },
      {
        key: 'storeConfig',
        title: 'CONFIGURAÇÕES DA UNIDADE',
        icon: Store,
        accentClass: 'text-purple-600 dark:text-purple-400',
        items: [
          { id: 'company', label: 'Dados da Loja', subtitle: 'NIF, Morada & Horários', show: true },
          { id: 'tv_panel', label: 'Configuração Painel de Senha', subtitle: 'Vídeos & Mensagens TV', show: true },
          { id: 'qrcode_config', label: 'Configurações QR Code', subtitle: 'Mesas & Identidade Visual', show: true },
          { id: 'users', label: 'Utilizadores & Permissões', subtitle: 'Gerentes, Caixas & Acessos', show: true },
          { id: 'reports', label: 'Relatórios & Fecho de Caixa', subtitle: 'Auditoria Diária de Vendas', show: true },
        ],
      },
    ]
  } else if (isFranchisorAdmin) {
    // 🏢 2. FRANCHISOR_ADMIN (Franqueadora Master — Rose & José Valdair)
    navGroups = [
      {
        key: 'franchise',
        title: 'FRANQUEADORA MASTER',
        icon: Building2,
        accentClass: 'text-amber-600 dark:text-amber-400',
        items: [
          {
            id: 'franchise',
            label: 'Gestão da Rede & Lojas',
            subtitle: 'Unidades, Contratos & Royalties',
            show: true,
          },
          {
            id: 'franchise_candidates',
            label: 'Candidaturas de Franquia',
            subtitle: 'Leads do Site & Expansão',
            badge: candidatesCount > 0 ? String(candidatesCount) : undefined,
            show: true,
          },
          {
            id: 'store_requests',
            label: 'Solicitações das Lojas',
            subtitle: 'Preços, Produtos & Destaques',
            badge: storeRequestsCount > 0 ? String(storeRequestsCount) : undefined,
            show: true,
          },
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
          { id: 'tables', label: 'Gestão de Mesas', subtitle: 'Salão & Comandas', show: true },
        ],
      },
      {
        key: 'menu',
        title: 'CARDÁPIO, MÍDIAS & PREÇOS',
        icon: Utensils,
        accentClass: 'text-pink-600 dark:text-pink-400',
        items: [
          { id: 'menu', label: 'Produtos do Cardápio', subtitle: 'Taças, Frutas & Toppings', show: true },
          { id: 'menu_categories', label: 'Categorias', subtitle: 'Estruturação Visual', show: true },
          { id: 'menu_menus', label: 'Menus do Cardápio', subtitle: 'Organização de Seções', show: true },
          { id: 'menu_highlights', label: 'Destaques & Stories', subtitle: 'Carrossel & Promoções', show: true },
        ],
      },
      {
        key: 'inventory',
        title: 'GESTÃO DE ESTOQUE & SUPPLY CHAIN',
        icon: Boxes,
        accentClass: 'text-emerald-600 dark:text-emerald-400',
        items: [
          { id: 'inventory', label: 'Gestão de Estoque Local', subtitle: 'Controle Físico & Auditoria', show: true },
          {
            id: 'supply_orders',
            label: isMatrizTenant ? 'Central de Suprimentos (Matriz)' : 'Reposição com a Matriz',
            subtitle: isMatrizTenant ? 'Pedidos B2B & Distribuição' : 'Pedidos B2B & Entrada de Carga',
            show: true,
          },
        ],
      },
      {
        key: 'storeConfig',
        title: 'CONFIGURAÇÕES DA UNIDADE',
        icon: Store,
        accentClass: 'text-purple-600 dark:text-purple-400',
        items: [
          { id: 'company', label: 'Dados da Loja', subtitle: 'NIF, Morada & Horários', show: true },
          { id: 'tv_panel', label: 'Configuração Painel de Senha', subtitle: 'Vídeos & Mensagens TV', show: true },
          { id: 'qrcode_config', label: 'Configurações QR Code', subtitle: 'Mesas & Identidade Visual', show: true },
          { id: 'users', label: 'Utilizadores & Permissões', subtitle: 'Gerentes, Caixas & Acessos', show: true },
          { id: 'reports', label: 'Relatórios & Fecho de Caixa', subtitle: 'Auditoria Diária de Vendas', show: true },
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
          { id: 'pdv', label: 'PDV Balcão & Mesas', subtitle: 'Montagem de Taça', show: true },
          { id: 'qrcode', label: 'Pedidos & KDS Cozinha', subtitle: 'Fila em Tempo Real', show: true },
          { id: 'tables', label: 'Gestão de Mesas', subtitle: 'Salão & Comandas', show: true },
        ],
      },
      {
        key: 'menu',
        title: 'CARDÁPIO, MÍDIAS & PREÇOS',
        icon: Utensils,
        accentClass: 'text-pink-600 dark:text-pink-400',
        items: [
          { id: 'menu', label: 'Produtos do Cardápio', subtitle: 'Disponibilidade & Visibilidade', show: true },
          { id: 'menu_categories', label: 'Categorias', subtitle: 'Estruturação Visual', show: true },
          { id: 'menu_menus', label: 'Menus do Cardápio', subtitle: 'Visualização da Estrutura', show: true },
          { id: 'menu_highlights', label: 'Destaques & Stories', subtitle: 'Ativação Local na Loja', show: true },
          {
            id: 'store_requests',
            label: 'Solicitações à Franqueadora',
            subtitle: 'Preços, Produtos & Destaques',
            show: true,
          },
        ],
      },
      {
        key: 'inventory',
        title: 'GESTÃO DE ESTOQUE & SUPPLY CHAIN',
        icon: Boxes,
        accentClass: 'text-emerald-600 dark:text-emerald-400',
        items: [
          { id: 'inventory', label: 'Gestão de Estoque Local', subtitle: 'Controle Físico & Auditoria', show: true },
          { id: 'supply_orders', label: 'Reposição com a Matriz', subtitle: 'Pedidos B2B & Entrada de Carga', show: true },
        ],
      },
      {
        key: 'storeConfig',
        title: 'CONFIGURAÇÕES DA UNIDADE',
        icon: Store,
        accentClass: 'text-purple-600 dark:text-purple-400',
        items: [
          { id: 'company', label: 'Dados da Loja', subtitle: 'NIF, Morada & Horários', show: true },
          { id: 'tv_panel', label: 'Configuração Painel de Senha', subtitle: 'Vídeos & Mensagens TV', show: true },
          { id: 'qrcode_config', label: 'Configurações QR Code', subtitle: 'Mesas & Identidade Visual', show: true },
          { id: 'users', label: 'Operadores de Caixa', subtitle: 'Equipa Local', show: true },
          { id: 'reports', label: 'Relatórios & Fecho de Caixa', subtitle: 'Auditoria Diária de Vendas', show: true },
        ],
      },
    ]
  } else {
    // 👤 4. OPERATOR / CASHIER
    navGroups = [
      {
        key: 'salon',
        title: 'OPERAÇÃO DO TURNO',
        icon: Store,
        accentClass: 'text-purple-700 dark:text-pink-400',
        items: [
          { id: 'pdv', label: 'PDV Balcão & Mesas', subtitle: 'Montagem de Taça', show: true },
          { id: 'qrcode', label: 'Pedidos & KDS Cozinha', subtitle: 'Fila em Tempo Real', show: true },
          { id: 'tables', label: 'Gestão de Mesas', subtitle: 'Salão & Comandas', show: true },
          { id: 'inventory', label: 'Estoque do Turno', subtitle: 'Checklist Rápido 2 min', show: true },
        ],
      },
    ]
  }

  const isMasterSwitcherAllowed = isSuperAdmin || isFranchisorAdmin

  return (
    <>
      {/* Overlay Mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-[#120120] border-r border-purple-100 dark:border-white/10 flex flex-col transition-all duration-300 ease-in-out lg:static lg:z-auto ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Topo do Sidebar: Logo Oficial */}
        <div className="p-4 border-b border-purple-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-purple-700 to-pink-600 p-0.5 shadow-md flex items-center justify-center shrink-0">
              <img
                src="/logo.png"
                alt="Açaí da Rose"
                className="h-full w-full object-cover rounded-[14px]"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
            <div>
              <div className="font-black text-sm text-purple-950 dark:text-white leading-tight">
                Açaí da Rose
              </div>
              <div className="text-[10px] text-pink-600 dark:text-pink-400 font-bold uppercase tracking-wider">
                PDV & FRANQUEADORA
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-xl text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-white/10 lg:hidden cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Seletor de Loja Ativa */}
        <div className="p-3 border-b border-purple-100 dark:border-white/10 bg-purple-50/40 dark:bg-white/5">
          {isMasterSwitcherAllowed ? (
            <button
              type="button"
              onClick={onOpenStoreSwitcher}
              className="w-full text-left p-2.5 rounded-2xl border border-purple-200/80 dark:border-white/15 bg-white dark:bg-[#160228] hover:border-purple-400 dark:hover:border-pink-500 transition-all shadow-xs group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 pr-1">
                  <div className="text-xs font-black text-purple-950 dark:text-white truncate group-hover:text-purple-700 dark:group-hover:text-pink-300">
                    {currentTenant.name}
                  </div>
                  <div className="text-[10px] text-purple-700 dark:text-purple-300/80 font-bold mt-0.5 flex items-center gap-1">
                    <span>Trocar de Loja</span>
                    <span className="text-[9px]">▾</span>
                  </div>
                </div>
                <div className="h-6 w-6 rounded-xl bg-purple-100 dark:bg-white/10 text-purple-700 dark:text-pink-400 flex items-center justify-center font-bold text-xs shrink-0">
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
        <nav className="p-3 space-y-3 flex-1 overflow-y-auto">
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

                            {item.badge && (
                              <Badge className="bg-amber-400 text-purple-950 text-[10px] font-black py-0 px-1.5 shrink-0">
                                {item.badge}
                              </Badge>
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

        {/* Rodapé do Sidebar */}
        <div className="p-3 border-t border-purple-100 dark:border-white/10 text-center">
          <div className="text-[11px] text-purple-700/80 dark:text-purple-300/70 font-bold">
            Açaí da Rose · Portugal
          </div>
          <div className="text-[10px] text-purple-500 dark:text-purple-400 font-medium">
            Versão Corporativa 2.5
          </div>
        </div>
      </aside>
    </>
  )
}
