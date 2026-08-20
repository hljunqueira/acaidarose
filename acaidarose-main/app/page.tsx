'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Toaster, toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useAuthStore } from '@/lib/stores/authStore'
import { useFranchiseStore } from '@/lib/stores/franchiseStore'
import { Tenant } from '@/types'

// Layout
import AppSidebar, { AppViewId } from '@/components/layout/AppSidebar'
import AppTopHeader from '@/components/layout/AppTopHeader'
import StoreSelectRadioDialog from '@/components/auth/StoreSelectRadioDialog'

// Views
import TablesHallView from '@/components/pdv/TablesHallView'
import TablesManagementView from '@/components/admin/tables/TablesManagementView'
import StaffManagementView from '@/components/admin/staff/StaffManagementView'
import MenuHierarchyView from '@/components/admin/menu/MenuHierarchyView'
import MenuCategoriesAdmin from '@/components/admin/menu/MenuCategoriesAdmin'
import MenuSectionsAdmin from '@/components/admin/menu/MenuSectionsAdmin'
import MenuHighlightsAdmin from '@/components/admin/menu/MenuHighlightsAdmin'
import MenuOffersAdmin from '@/components/admin/menu/MenuOffersAdmin'
import ReportsModuleView from '@/components/admin/reports/ReportsModuleView'
import QRCodeConfigView from '@/components/admin/qrcode/QRCodeConfigView'
import QRCodeOrdersAdmin from '@/components/admin/orders/QRCodeOrdersAdmin'
import FranchiseCorporatePage from '@/components/admin/franchise/FranchiseCorporatePage'
import StoreCompanySettingsView from '@/components/admin/company/StoreCompanySettingsView'
import UsersAdmin from '@/components/admin/users/UsersAdmin'

export default function HomePage() {
  const { user, loginWithCredentials, logout, checkAuth, authFetch } = useAuthStore()
  const { currentTenant, setCurrentTenant } = useFranchiseStore()

  // Login form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)

  // Demo Modal
  const [demoOpen, setDemoOpen] = useState(false)

  // Mobile sidebar state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Store Switcher Modal
  const [storeSwitcherOpen, setStoreSwitcherOpen] = useState(false)
  const [tenantsList, setTenantsList] = useState<Tenant[]>([])

  // Main navigation view
  const [view, setView] = useState<AppViewId>('qrcode')

  // Check current session
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const fetchTenants = useCallback(async () => {
    try {
      const res = await authFetch('/api/tenants')
      const data = await res.json()
      if (data.tenants) {
        setTenantsList(data.tenants)
      }
    } catch {
      // Ignorar se não autenticado
    }
  }, [authFetch])

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      fetchTenants()
    }
  }, [user, fetchTenants])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Preencha o e-mail e a palavra-passe')
      return
    }
    setLoginLoading(true)
    try {
      await loginWithCredentials(email, password)
      toast.success('Bem-vindo ao Açaí da Rose!')
    } catch (err: any) {
      toast.error(err.message || 'Falha na autenticação')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleQuickLogin = async (accEmail: string, accPass: string) => {
    setEmail(accEmail)
    setPassword(accPass)
    setLoginLoading(true)
    try {
      await loginWithCredentials(accEmail, accPass)
      setDemoOpen(false)
      toast.success('Sessão iniciada com sucesso!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao autenticar')
    } finally {
      setLoginLoading(false)
    }
  }

  const openSwitcher = () => {
    fetchTenants()
    setStoreSwitcherOpen(true)
  }

  // =========================================================================
  // ECRÃ DE LOGIN CORPORATIVO — AÇAÍ DA ROSE
  // =========================================================================
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#120120] via-[#26033d] to-[#0c0017] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-fuchsia-500 selection:text-white">
        <Toaster position="top-center" richColors />

        {/* Efeitos de Iluminação de Fundo */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10 space-y-4">
          {/* Card Principal de Autenticação */}
          <div className="bg-white/[0.08] backdrop-blur-2xl border border-white/15 shadow-2xl shadow-purple-950/60 rounded-3xl p-6 sm:p-8 text-white">
            {/* Header da Marca com Logo e Slogans */}
            <div className="flex flex-col items-center mb-6 text-center space-y-2">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
                <img
                  src="/logo.png"
                  alt="Açaí da Rose"
                  className="h-16 sm:h-20 w-auto object-contain drop-shadow-md"
                />
              </div>

              <div>
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Açaí da Rose
                </h1>
                <p className="text-xs text-pink-300 font-semibold tracking-wide">
                  O sabor que abraça a alma
                </p>
                <div className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-purple-900/60 border border-purple-500/30 text-[10px] font-bold text-purple-200 uppercase tracking-wider">
                  PDV & Franqueadora Multi-Loja
                </div>
              </div>
            </div>

            {/* Formulário de Login */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-purple-200 flex items-center justify-between">
                  <span>E-mail Corporativo</span>
                  <span className="text-[10px] text-purple-300/60 font-normal">ex: franqueadora@acairose.pt</span>
                </Label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="email@acairose.pt"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/10 border-white/15 text-white placeholder:text-purple-300/40 rounded-xl h-11 text-xs sm:text-sm focus:border-fuchsia-400 focus:ring-fuchsia-400/20"
                    disabled={loginLoading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-purple-200">
                  Palavra-passe
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/10 border-white/15 text-white placeholder:text-purple-300/40 rounded-xl h-11 pr-12 text-xs sm:text-sm focus:border-fuchsia-400 focus:ring-fuchsia-400/20"
                    disabled={loginLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-purple-300/80 hover:text-white transition cursor-pointer p-1"
                  >
                    {showPassword ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loginLoading}
                className="w-full h-11.5 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-purple-950/60 mt-1 cursor-pointer transition-all hover:scale-[1.01]"
              >
                {loginLoading ? 'A autenticar...' : 'Aceder ao Sistema →'}
              </Button>
            </form>

            {/* Separador */}
            <div className="relative my-5 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <span className="relative bg-[#19022c] px-3 text-[10px] font-bold text-purple-300/70 uppercase tracking-wider rounded-full">
                ou acesso rápido demonstrativo
              </span>
            </div>

            {/* Botão de Acesso Rápido */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setDemoOpen(true)}
              className="w-full h-10 border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
            >
              👑 Selecionar Loja / Franqueadora
            </Button>
          </div>

          {/* Rodapé Institucional */}
          <div className="text-center text-xs text-purple-300/60 space-y-1">
            <p className="font-bold text-purple-200/80">Açaí da Rose · Portugal</p>
            <p className="text-[11px]">Torres Novas & Aveiro · Gestão Integrada</p>
            <p className="text-[10px] text-pink-400/80 italic pt-1">
              "Açaí não se explica: se experimenta, se apaixona e repete."
            </p>
          </div>
        </div>

        {/* Modal de Acesso Rápido Simplificado */}
        <Dialog open={demoOpen} onOpenChange={setDemoOpen}>
          <DialogContent className="max-w-md p-6 bg-[#160228] text-white border border-white/20 rounded-3xl backdrop-blur-2xl shadow-2xl">
            <DialogHeader className="text-left space-y-1">
              <DialogTitle className="text-base font-black text-white flex items-center gap-2">
                <span>👑</span>
                <span>Selecione a Unidade para Aceder</span>
              </DialogTitle>
              <p className="text-xs text-purple-200/70">
                Aceda instantaneamente com as credenciais oficiais pré-configuradas:
              </p>
            </DialogHeader>

            <div className="space-y-2.5 my-3">
              {/* Franqueadora */}
              <button
                type="button"
                onClick={() => handleQuickLogin('franqueadora@acairose.pt', '123456')}
                className="w-full p-3.5 rounded-2xl border border-fuchsia-500/50 bg-gradient-to-r from-fuchsia-950/40 to-purple-950/40 hover:from-fuchsia-900/50 hover:to-purple-900/50 transition-all flex items-center justify-between text-left cursor-pointer group"
              >
                <div>
                  <div className="font-black text-xs text-white group-hover:text-fuchsia-200 flex items-center gap-1.5">
                    <span>👑 Franqueadora Global (Master)</span>
                  </div>
                  <div className="text-[11px] text-purple-300/80 font-mono mt-0.5">
                    franqueadora@acairose.pt
                  </div>
                </div>
                <Badge className="bg-fuchsia-600 text-white text-[9px] font-black uppercase">
                  Super Admin
                </Badge>
              </button>

              {/* Matriz Torres Novas */}
              <button
                type="button"
                onClick={() => handleQuickLogin('torresnovas@acairose.pt', '123456')}
                className="w-full p-3.5 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-between text-left cursor-pointer group"
              >
                <div>
                  <div className="font-black text-xs text-white group-hover:text-purple-200 flex items-center gap-1.5">
                    <span>🏪 Matriz — Torres Novas</span>
                  </div>
                  <div className="text-[11px] text-purple-300/70 font-mono mt-0.5">
                    torresnovas@acairose.pt
                  </div>
                </div>
                <span className="text-xs text-purple-300 font-bold group-hover:text-white">Entrar →</span>
              </button>

              {/* Filial Aveiro */}
              <button
                type="button"
                onClick={() => handleQuickLogin('aveiro@acairose.pt', '123456')}
                className="w-full p-3.5 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-between text-left cursor-pointer group"
              >
                <div>
                  <div className="font-black text-xs text-white group-hover:text-purple-200 flex items-center gap-1.5">
                    <span>📍 Filial — Aveiro</span>
                  </div>
                  <div className="text-[11px] text-purple-300/70 font-mono mt-0.5">
                    aveiro@acairose.pt
                  </div>
                </div>
                <span className="text-xs text-purple-300 font-bold group-hover:text-white">Entrar →</span>
              </button>
            </div>

            <DialogFooter className="mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDemoOpen(false)}
                className="w-full text-xs text-purple-300 hover:text-white cursor-pointer"
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  const isSuperAdmin = user.role === 'SUPER_ADMIN'
  const isTenantAdmin = user.role === 'TENANT_ADMIN'
  const isAdmin = isSuperAdmin || isTenantAdmin
  const activeTenantId = isSuperAdmin ? currentTenant.id : user.tenantId || currentTenant.id

  return (
    <div className="min-h-screen bg-[#faf7fc] flex">
      <Toaster position="top-center" richColors />

      {/* Sidebar Lateral Minimalista */}
      <AppSidebar
        currentView={view}
        onSelectView={setView}
        user={user}
        currentTenant={currentTenant}
        onOpenStoreSwitcher={openSwitcher}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Área Principal de Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header com Saudação e Avatar Dropdown */}
        <AppTopHeader
          user={user}
          currentTenant={currentTenant}
          onSelectView={setView}
          onOpenStoreSwitcher={openSwitcher}
          onLogout={logout}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* Conteúdo Dinâmico das Telas */}
        <main className="flex-1 p-4 md:p-6 min-w-0 overflow-x-hidden">
          {view === 'qrcode' && <QRCodeOrdersAdmin tenantId={activeTenantId} />}
          {view === 'pdv' && (
            <TablesHallView
              tenantId={activeTenantId}
              storePhone={currentTenant.mbwayPhone || currentTenant.phone}
              currentUser={user}
            />
          )}
          {view === 'tables' && isAdmin && <TablesManagementView tenantId={activeTenantId} />}
          {view === 'staff' && isAdmin && <StaffManagementView tenantId={activeTenantId} />}
          {view === 'menu' && isAdmin && <MenuHierarchyView tenantId={activeTenantId} />}
          {view === 'menu_categories' && isAdmin && <MenuCategoriesAdmin tenantId={activeTenantId} />}
          {view === 'menu_menus' && isAdmin && <MenuSectionsAdmin tenantId={activeTenantId} />}
          {view === 'menu_highlights' && isAdmin && <MenuHighlightsAdmin tenantId={activeTenantId} />}
          {view === 'menu_offers' && isAdmin && <MenuOffersAdmin tenantId={activeTenantId} />}
          {view === 'franchise' && isSuperAdmin && <FranchiseCorporatePage />}
          {view === 'company' && isAdmin && <StoreCompanySettingsView tenantId={activeTenantId} />}
          {view === 'reports' && <ReportsModuleView tenantId={activeTenantId} currentUser={user} />}
          {view === 'qrcode_config' && isAdmin && <QRCodeConfigView tenantId={activeTenantId} />}
          {view === 'users' && isAdmin && <UsersAdmin currentUser={user} />}
        </main>
      </div>

      {/* Modal de Seleção de Empresa com Radio Buttons */}
      <StoreSelectRadioDialog
        open={storeSwitcherOpen}
        onOpenChange={setStoreSwitcherOpen}
        tenants={tenantsList.length > 0 ? tenantsList : [currentTenant]}
        selectedTenantId={currentTenant.id}
        onConfirm={(tenant) => {
          setCurrentTenant(tenant)
          toast.success(`Empresa ativa alterada para: ${tenant.name}`)
        }}
      />
    </div>
  )
}
