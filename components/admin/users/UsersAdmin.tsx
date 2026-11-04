'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { User } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import { useFranchiseStore } from '@/lib/stores/franchiseStore'
import UserTable from './UserTable'
import UserEditDialog from './UserEditDialog'
import ConfirmActionDialog from '@/components/ui/ConfirmActionDialog'
import { Users, Building2, ShieldCheck, KeyRound, UserCheck } from 'lucide-react'

interface UsersAdminProps {
  tenantId?: string
  currentUser: User
}

export default function UsersAdmin({ tenantId = '', currentUser }: UsersAdminProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'EDIT' | 'PASSWORD_ONLY'>('EDIT')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const { authFetch } = useAuthStore()
  const { tenants, fetchTenants } = useFranchiseStore()

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN'
  const isTenantAdmin = currentUser?.role === 'TENANT_ADMIN'

  // Para SUPER_ADMIN, padrão é 'all' para exibir todos os utilizadores da rede
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>(
    isSuperAdmin ? 'all' : (currentUser?.tenantId || tenantId || 'all')
  )

  useEffect(() => {
    if (!tenants || tenants.length === 0) {
      fetchTenants(authFetch)
    }
  }, [tenants, fetchTenants, authFetch])

  const storeNamesMap = useMemo(() => {
    const map: Record<string, string> = {}
    ;(tenants || []).forEach((t) => {
      map[t.id] = t.name
    })
    return map
  }, [tenants])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const targetTenant = isSuperAdmin ? selectedTenantFilter : (currentUser?.tenantId || tenantId)
      const url = targetTenant && targetTenant !== 'all'
        ? `/api/users?tenantId=${targetTenant}`
        : `/api/users?tenantId=all`
      const res = await authFetch(url)
      const d = await res.json()
      if (d.users) setUsers(d.users)
    } catch {
      toast.error('Erro ao carregar utilizadores')
    } finally {
      setLoading(false)
    }
  }, [selectedTenantFilter, tenantId, currentUser, isSuperAdmin, authFetch])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const cashierCount = users.filter((u) => u.role === 'CASHIER' && u.active).length
  const adminCount = users.filter((u) => (u.role === 'SUPER_ADMIN' || u.role === 'FRANCHISOR_ADMIN' || u.role === 'TENANT_ADMIN') && u.active).length
  const maxCashiers = 3
  const isLimitReached = !isSuperAdmin && cashierCount >= maxCashiers

  const handleSave = async (payload: any) => {
    try {
      const res = payload.id
        ? await authFetch(`/api/users/${payload.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await authFetch('/api/users', { method: 'POST', body: JSON.stringify(payload) })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao guardar utilizador')
      }

      toast.success('Utilizador e credenciais guardadas com sucesso!')
      loadUsers()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar utilizador')
    }
  }

  const [confirmState, setConfirmState] = useState<{
    open: boolean
    title: string
    description?: string
    onConfirm: () => Promise<void> | void
  }>({
    open: false,
    title: '',
    onConfirm: () => { },
  })

  const handleDelete = (id: string) => {
    setConfirmState({
      open: true,
      title: 'Desativar Utilizador da Loja',
      description: 'Deseja realmente desativar este operador? O acesso ao sistema será revogado.',
      onConfirm: async () => {
        try {
          const res = await authFetch(`/api/users/${id}`, { method: 'DELETE' })
          if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error || 'Erro ao desativar utilizador')
          }
          toast.success('Utilizador desativado com sucesso!')
          setConfirmState((prev) => ({ ...prev, open: false }))
          loadUsers()
        } catch (e: any) {
          toast.error(e.message || 'Erro ao remover utilizador')
        }
      },
    })
  }

  const handleOpenNew = () => {
    setEditingUser(null)
    setDialogMode('EDIT')
    setDialogOpen(true)
  }

  const handleOpenEdit = (user: User) => {
    setEditingUser(user)
    setDialogMode('EDIT')
    setDialogOpen(true)
  }

  const handleOpenPasswordOnly = (user: User) => {
    setEditingUser(user)
    setDialogMode('PASSWORD_ONLY')
    setDialogOpen(true)
  }

  const currentStoreLabel = useMemo(() => {
    if (selectedTenantFilter === 'all') return 'Rede Global (Todas as Lojas)'
    return storeNamesMap[selectedTenantFilter] || 'Unidade'
  }, [selectedTenantFilter, storeNamesMap])

  return (
    <div className="space-y-6">
      {/* 1. Header Clean */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-purple-100 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-black text-purple-950 dark:text-white tracking-tight">
              Utilizadores & Permissões
            </h1>
            <Badge className="bg-purple-900 dark:bg-pink-600 text-white text-[10px] font-bold border-0">
              {currentStoreLabel}
            </Badge>
          </div>
          <p className="text-xs text-purple-700/80 dark:text-purple-200/70 mt-0.5">
            {isSuperAdmin
              ? 'Gestão total de acessos, credenciais e palavras-passe de toda a rede'
              : 'Gestão da equipa de operadores e acessos da sua loja'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(!isLimitReached || isSuperAdmin) ? (
            <Button
              size="sm"
              onClick={handleOpenNew}
              className="h-9 text-xs font-bold bg-purple-900 hover:bg-purple-950 dark:bg-pink-600 dark:hover:bg-pink-700 text-white rounded-xl shadow-xs cursor-pointer px-3.5"
            >
              <span>{isSuperAdmin ? 'Novo Utilizador' : 'Novo Operador de Caixa'}</span>
            </Button>
          ) : (
            <Badge className="bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-300 text-xs py-1.5 px-3 rounded-xl font-bold">
              Limite de 3 Operadores Atingido
            </Badge>
          )}
        </div>
      </div>

      {/* 2. Filtro de Lojas Dinâmico (Exclusivo Super Admin) */}
      {isSuperAdmin && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedTenantFilter('all')}
            className={`h-8 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              selectedTenantFilter === 'all'
                ? 'bg-purple-900 text-white dark:bg-pink-600 shadow-xs'
                : 'bg-white dark:bg-white/5 border border-purple-200 dark:border-white/10 text-purple-950 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-white/10'
            }`}
          >
            <span>Todas as Lojas (Rede Global)</span>
          </button>
          {(tenants || []).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTenantFilter(t.id)}
              className={`h-8 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                selectedTenantFilter === t.id
                  ? 'bg-purple-900 text-white dark:bg-pink-600 shadow-xs'
                  : 'bg-white dark:bg-white/5 border border-purple-200 dark:border-white/10 text-purple-950 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-white/10'
              }`}
            >
              <span>{t.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* 3. KPIs de Equipe */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <Card className="p-4 rounded-2xl bg-white dark:bg-[#160228]/95 border border-purple-150 dark:border-white/15 shadow-xs">
          <div className="text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 uppercase tracking-wider">
            {selectedTenantFilter === 'all' ? 'Total na Rede' : 'Total na Unidade'}
          </div>
          <div className="text-2xl font-black mt-1 font-mono text-purple-950 dark:text-white">
            {users.length} <span className="text-xs font-normal text-purple-600 dark:text-purple-300">utilizadores</span>
          </div>
          <div className="text-[10px] text-purple-600/70 dark:text-purple-300/70 mt-1">
            {selectedTenantFilter === 'all' ? 'Utilizadores ativos de todas as lojas' : 'Equipe cadastrada na loja'}
          </div>
        </Card>

        <Card className="p-4 rounded-2xl bg-white dark:bg-[#160228]/95 border border-purple-150 dark:border-white/15 shadow-xs">
          <div className="text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 uppercase tracking-wider">
            Operadores de Caixa (PDV)
          </div>
          <div className="text-2xl font-black mt-1 font-mono text-purple-950 dark:text-white flex items-baseline gap-1.5">
            {cashierCount}
            {selectedTenantFilter !== 'all' && (
              <span className="text-sm font-normal text-purple-500">/ {maxCashiers} máx</span>
            )}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
            Acesso ao Atendimento & Salão
          </div>
        </Card>

        <Card className="p-4 rounded-2xl bg-white dark:bg-[#160228]/95 border border-purple-150 dark:border-white/15 shadow-xs">
          <div className="text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 uppercase tracking-wider">
            Gestão & Administração
          </div>
          <div className="text-2xl font-black mt-1 font-mono text-purple-950 dark:text-white">
            {adminCount} <span className="text-xs font-normal text-purple-600 dark:text-purple-300">gestores</span>
          </div>
          <div className="text-[10px] text-purple-600/70 dark:text-purple-300/70 mt-1">
            Acesso administrativo e gerencial
          </div>
        </Card>
      </div>

      {/* 4. Tabela / Grid de Utilizadores */}
      {loading ? (
        <div className="py-16 text-center text-xs text-purple-600 dark:text-purple-300 font-bold">
          A carregar utilizadores...
        </div>
      ) : users.length === 0 ? (
        <div className="p-12 text-center text-xs text-purple-700/70 dark:text-purple-200/60 font-bold bg-white dark:bg-[#160228]/95 rounded-2xl border border-dashed border-purple-200 dark:border-white/15">
          Nenhum utilizador encontrado para este filtro.
        </div>
      ) : (
        <UserTable
          users={users}
          currentUser={currentUser}
          storeNamesMap={storeNamesMap}
          onEdit={handleOpenEdit}
          onChangePassword={handleOpenPasswordOnly}
          onDelete={handleDelete}
        />
      )}

      {/* 5. Modal de Criação / Edição & Senha */}
      <UserEditDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editingUser}
        currentUser={currentUser}
        tenantId={selectedTenantFilter !== 'all' ? selectedTenantFilter : (currentUser?.tenantId || tenantId)}
        tenants={tenants}
        mode={dialogMode}
        onSave={handleSave}
      />

      <ConfirmActionDialog
        open={confirmState.open}
        onOpenChange={(open) => setConfirmState((prev) => ({ ...prev, open }))}
        title={confirmState.title}
        description={confirmState.description}
        onConfirm={confirmState.onConfirm}
      />
    </div>
  )
}
