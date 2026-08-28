'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Toaster, toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/stores/authStore'
import { DEFAULT_AVEIRO_TENANT, useFranchiseStore } from '@/lib/stores/franchiseStore'
import { Tenant, User } from '@/types'
import { LogOut, Globe, Menu } from 'lucide-react'

// Componentes da Landing Page Oficial
import LandingHeader from '@/components/landing/LandingHeader'
import LandingHero from '@/components/landing/LandingHero'
import LandingShowcase from '@/components/landing/LandingShowcase'
import LandingAboutAcai from '@/components/landing/LandingAboutAcai'
import LandingSpecials from '@/components/landing/LandingSpecials'
import LandingQuality from '@/components/landing/LandingQuality'
import LandingFranchise from '@/components/landing/LandingFranchise'
import LandingLocation from '@/components/landing/LandingLocation'
import LandingFooter from '@/components/landing/LandingFooter'

import ThemeToggle from '@/components/layout/ThemeToggle'
import PortugalLiveClock from '@/components/layout/PortugalLiveClock'

// Componentes do PDV & Admin
import AppSidebar, { AppViewId } from '@/components/layout/AppSidebar'
import StoreSelectRadioDialog from '@/components/auth/StoreSelectRadioDialog'
import TablesHallView from '@/components/pdv/TablesHallView'
import TablesManagementView from '@/components/admin/tables/TablesManagementView'
import StaffManagementView from '@/components/admin/staff/StaffManagementView'
import MenuHierarchyView from '@/components/admin/menu/MenuHierarchyView'
import MenuCategoriesAdmin from '@/components/admin/menu/MenuCategoriesAdmin'
import MenuSectionsAdmin from '@/components/admin/menu/MenuSectionsAdmin'
import MenuHighlightsAdmin from '@/components/admin/menu/MenuHighlightsAdmin'
import ReportsModuleView from '@/components/admin/reports/ReportsModuleView'
import QRCodeConfigView from '@/components/admin/qrcode/QRCodeConfigView'
import QRCodeOrdersAdmin from '@/components/admin/orders/QRCodeOrdersAdmin'
import FranchiseCorporateView from '@/components/admin/franchise/FranchiseCorporateView'
import FranchiseRequestsView from '@/components/admin/franchise/FranchiseRequestsView'
import StoreCompanySettingsView from '@/components/admin/company/StoreCompanySettingsView'
import UsersAdmin from '@/components/admin/users/UsersAdmin'

// Novos Módulos Especializados
import DevMasterView from '@/components/admin/dev/DevMasterView'
import PreventionCenterView from '@/components/admin/dev/PreventionCenterView'
import AuditLogsView from '@/components/admin/dev/AuditLogsView'
import SupplyHubView from '@/components/admin/supply/SupplyHubView'
import TVOrdersPanelView from '@/components/admin/tv/TVOrdersPanelView'
import InventoryManagementView from '@/components/admin/inventory/InventoryManagementView'
import StoreSupplyOrdersView from '@/components/admin/inventory/StoreSupplyOrdersView'

export default function HomePage() {
  const { user, logout, checkAuth, authFetch } = useAuthStore()
  const { currentTenant, setCurrentTenant } = useFranchiseStore()

  // Modo de visualização: 'LANDING' (site público) ou 'PDV' (área interna)
  const [appMode, setAppMode] = useState<'LANDING' | 'PDV'>('LANDING')

  // Estados do PDV
  const [view, setView] = useState<AppViewId>('qrcode')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [storeSwitcherOpen, setStoreSwitcherOpen] = useState(false)
  const [tenantsList, setTenantsList] = useState<Tenant[]>([])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (user) {
      setAppMode('PDV')
      // Se não for Super Admin, força a loja ativa a ser a loja do usuário
      if (user.role !== 'SUPER_ADMIN' && user.tenantId) {
        authFetch('/api/tenants')
          .then((res) => res.json())
          .then((data) => {
            if (data.tenants) {
              setTenantsList(data.tenants)
              const matched = data.tenants.find((t: Tenant) => t.id === user.tenantId)
              if (matched) setCurrentTenant(matched)
            }
          })
          .catch(() => {})
      }
    }
  }, [user, authFetch, setCurrentTenant])

  const fetchTenants = useCallback(async () => {
    try {
      const res = await authFetch('/api/tenants')
      const data = await res.json()
      if (data.tenants) setTenantsList(data.tenants)
    } catch {
      // Ignora erro se não autenticado
    }
  }, [authFetch])

  const openSwitcher = () => {
    fetchTenants()
    setStoreSwitcherOpen(true)
  }

  // =========================================================================
  // MODO 1: LANDING PAGE INSTITUCIONAL OFICIAL (RAIZ /)
  // =========================================================================
  if (appMode === 'LANDING' || !user) {
    return (
      <div className="min-h-screen bg-[#11011c] text-white flex flex-col selection:bg-pink-500 selection:text-white">
        <Toaster position="top-center" richColors />

        {/* 1. Header Oficial */}
        <LandingHeader
          user={user}
          onOpenPDV={() => setAppMode('PDV')}
        />

        {/* 2. Conteúdo da Landing Page Oficial */}
        <main className="flex-1">
          <LandingHero />
          <LandingShowcase />
          <LandingAboutAcai />
          <LandingSpecials />
          <LandingQuality />
          <LandingFranchise />
          <LandingLocation />
        </main>

        {/* 3. Rodapé Oficial */}
        <LandingFooter />
      </div>
    )
  }

  // =========================================================================
  // MODO 2: PAINEL INTERNO DE PDV & GESTÃO (USUÁRIO AUTENTICADO)
  // =========================================================================
  const loggedUser: User = user
  const isSuperAdmin = loggedUser.role === 'SUPER_ADMIN'
  const isFranchisorAdmin = loggedUser.role === 'FRANCHISOR_ADMIN'
  const isTenantAdmin = loggedUser.role === 'TENANT_ADMIN'
  const isAdmin = isSuperAdmin || isFranchisorAdmin || isTenantAdmin

  // Determinar a loja ativa efetiva (sempre a da filial para gerentes/caixas)
  const effectiveTenant: Tenant = (isSuperAdmin || isFranchisorAdmin)
    ? currentTenant || DEFAULT_AVEIRO_TENANT
    : (tenantsList.find((t) => t.id === loggedUser.tenantId) || (currentTenant?.id === loggedUser.tenantId ? currentTenant : DEFAULT_AVEIRO_TENANT))

  const activeTenantId = effectiveTenant.id

  return (
    <div className="flex h-screen bg-[#f8f6fc] dark:bg-[#0e0117] text-slate-900 dark:text-white overflow-hidden selection:bg-purple-500 selection:text-white transition-colors duration-150">
      <Toaster position="top-center" richColors />

      {/* Sidebar de Navegação */}
      <AppSidebar
        currentView={view}
        onSelectView={(v) => {
          setView(v)
          setMobileMenuOpen(false)
        }}
        user={loggedUser}
        currentTenant={effectiveTenant}
        onOpenStoreSwitcher={openSwitcher}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Área de Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bimodal (Light + Dark) */}
        <div className="bg-white dark:bg-[#160228] border-b border-purple-100 dark:border-white/10 px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between shadow-xs transition-colors duration-150">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Botão de Menu Hambúrguer (Mobile & Tablets) */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden h-8 px-2.5 rounded-xl border-purple-200 dark:border-white/15 bg-purple-50/80 dark:bg-white/10 hover:bg-purple-100 dark:hover:bg-white/20 text-purple-950 dark:text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
              aria-label="Abrir Menu"
            >
              <Menu className="h-4 w-4 text-purple-700 dark:text-pink-400" />
              <span>Menu</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setAppMode('LANDING')}
              className="h-8 px-2.5 sm:px-3 rounded-xl border-purple-200 dark:border-white/15 bg-purple-50/60 dark:bg-white/5 hover:bg-purple-100 dark:hover:bg-white/10 text-purple-900 dark:text-pink-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Globe className="h-3.5 w-3.5 text-purple-600 dark:text-pink-400" />
              <span className="hidden xs:inline sm:inline">Ver Site Oficial</span>
              <span className="xs:hidden sm:hidden">Site</span>
            </Button>

            <span className="text-xs text-purple-900/80 dark:text-purple-200/80 hidden sm:inline-block truncate">
              Unidade Ativa: <strong className="text-purple-950 dark:text-white font-black">{effectiveTenant.name}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <PortugalLiveClock />
            <ThemeToggle />

            <span className="text-[11px] text-purple-950 dark:text-white font-bold hidden md:inline-block">
              {loggedUser.name ? loggedUser.name.replace(/\s*\(.*?\)\s*/g, '').trim() : ''}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                logout()
                setAppMode('LANDING')
              }}
              className="h-8 px-2 sm:px-2.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 text-xs rounded-xl font-bold cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 mr-1" />
              <span>Sair</span>
            </Button>
          </div>
        </div>

        {/* Conteúdo Dinâmico das Views do PDV / Admin */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-[#f8f6fc] dark:bg-[#0e0117] transition-colors duration-150">
          {/* 1. CENTRAL MASTER TI */}
          {view === 'dev_hub' && isSuperAdmin && <DevMasterView />}
          {view === 'prevention_center' && isSuperAdmin && <PreventionCenterView />}
          {view === 'audit_logs' && isSuperAdmin && <AuditLogsView />}

          {/* 2. FRANQUEADORA MASTER */}
          {view === 'franchise' && (isSuperAdmin || isFranchisorAdmin) && <FranchiseCorporateView />}
          {view === 'franchise_requests' && isAdmin && (
            <FranchiseRequestsView
              tenantId={activeTenantId}
              currentUser={loggedUser}
              onNavigateToMenu={() => setView('menu')}
            />
          )}
          {view === 'supply_hub' && (isSuperAdmin || isFranchisorAdmin) && <SupplyHubView />}

          {/* 3. OPERAÇÃO & ATENDIMENTO */}
          {view === 'pdv' && (
            <TablesHallView
              tenantId={activeTenantId}
              storePhone={effectiveTenant.mbwayPhone || effectiveTenant.phone || ''}
              currentUser={loggedUser}
            />
          )}
          {view === 'qrcode' && <QRCodeOrdersAdmin tenantId={activeTenantId} />}
          {view === 'tv_panel' && <TVOrdersPanelView tenantId={activeTenantId} />}
          {view === 'tables' && isAdmin && <TablesManagementView tenantId={activeTenantId} />}

          {/* 4. GESTÃO DE ESTOQUE & SUPPLY CHAIN */}
          {view === 'inventory' && <InventoryManagementView tenantId={activeTenantId} />}
          {view === 'supply_orders' && isAdmin && <StoreSupplyOrdersView tenantId={activeTenantId} />}

          {/* 5. CARDÁPIO, MÍDIAS & PREÇOS */}
          {view === 'menu' && isAdmin && <MenuHierarchyView tenantId={activeTenantId} />}
          {view === 'menu_categories' && isAdmin && <MenuCategoriesAdmin tenantId={activeTenantId} />}
          {view === 'menu_menus' && isAdmin && <MenuSectionsAdmin tenantId={activeTenantId} />}
          {view === 'menu_highlights' && isAdmin && <MenuHighlightsAdmin tenantId={activeTenantId} />}

          {/* 6. CONFIGURAÇÕES DA UNIDADE */}
          {view === 'company' && isAdmin && <StoreCompanySettingsView tenantId={activeTenantId} />}
          {view === 'qrcode_config' && isAdmin && <QRCodeConfigView tenantId={activeTenantId} />}
          {view === 'users' && isAdmin && <UsersAdmin tenantId={activeTenantId} currentUser={loggedUser} />}
          {view === 'reports' && <ReportsModuleView tenantId={activeTenantId} currentUser={loggedUser} />}
        </main>
      </div>

      {/* Modal Seletor de Filial (para SUPER_ADMIN e FRANCHISOR_ADMIN) */}
      <StoreSelectRadioDialog
        open={storeSwitcherOpen}
        onOpenChange={setStoreSwitcherOpen}
        tenants={tenantsList.length > 0 ? tenantsList : [currentTenant]}
        selectedTenantId={currentTenant.id}
        onConfirm={(t) => {
          setCurrentTenant(t)
          toast.success(`Loja alterada para: ${t.name}`)
        }}
      />
    </div>
  )
}
