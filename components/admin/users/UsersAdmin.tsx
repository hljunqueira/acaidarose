'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { User } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import UserTable from './UserTable'
import UserEditDialog from './UserEditDialog'
import ConfirmActionDialog from '@/components/ui/ConfirmActionDialog'
import { Users, ShieldCheck, ShieldAlert, KeyRound, UserCheck } from 'lucide-react'

interface UsersAdminProps {
  tenantId?: string
  currentUser: User
}

const STORE_NAMES: Record<string, string> = {
  'tenant-aveiro': 'Açaí da Rose — Filial Aveiro',
  'tenant-lisboa': 'Açaí da Rose — Filial Lisboa (Parque das Nações)',
  'tenant-santarem': 'Açaí da Rose — Filial Santarém',
  'tenant-torres-novas': 'Açaí da Rose — Matriz Central',
}

export default function UsersAdmin({ tenantId = 'tenant-torres-novas', currentUser }: UsersAdminProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'EDIT' | 'PASSWORD_ONLY'>('EDIT')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const { authFetch } = useAuthStore()

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN'
  const isTenantAdmin = currentUser?.role === 'TENANT_ADMIN'

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const url = isSuperAdmin
        ? `/api/users?tenantId=${tenantId}`
        : `/api/users?tenantId=${currentUser?.tenantId || tenantId}`
      const res = await authFetch(url)
      const d = await res.json()
      if (d.users) setUsers(d.users)
    } catch {
      toast.error('Erro ao carregar utilizadores')
    } finally {
      setLoading(false)
    }
  }, [tenantId, currentUser, isSuperAdmin, authFetch])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const cashierCount = users.filter((u) => u.role === 'CASHIER' && u.active).length
  const adminCount = users.filter((u) => (u.role === 'SUPER_ADMIN' || u.role === 'TENANT_ADMIN') && u.active).length
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
    onConfirm: () => {},
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

  return (
    <div className="space-y-6">
      {/* 1. Header Clean */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-purple-100 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-black text-purple-950 dark:text-white tracking-tight">
              Utilizadores & Permissões da Loja
            </h1>
            <Badge className="bg-purple-100 dark:bg-white/10 text-purple-900 dark:text-purple-200 text-[10px] font-bold border-0">
              {STORE_NAMES[tenantId] || 'Filial'}
            </Badge>
          </div>
          <p className="text-xs text-purple-700/80 dark:text-purple-200/70 mt-0.5">
            {isSuperAdmin
              ? 'Gestão total de acessos, administradores e operadores da rede'
              : 'Gestão da equipe de operadores e credenciais da sua loja'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão Novo Utilizador (Admin) ou Novo Operador (Gerente) */}
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

      {/* 2. KPIs de Equipe da Loja */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <Card className="p-4 rounded-2xl bg-white dark:bg-[#160228]/95 border border-purple-150 dark:border-white/15 shadow-xs">
          <div className="text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 uppercase tracking-wider">
            Total na Unidade
          </div>
          <div className="text-2xl font-black mt-1 font-mono text-purple-950 dark:text-white">
            {users.length} <span className="text-xs font-normal text-purple-600 dark:text-purple-300">utilizadores</span>
          </div>
          <div className="text-[10px] text-purple-600/70 dark:text-purple-300/70 mt-1">
            Equipe cadastrada na loja
          </div>
        </Card>

        <Card className="p-4 rounded-2xl bg-white dark:bg-[#160228]/95 border border-purple-150 dark:border-white/15 shadow-xs">
          <div className="text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 uppercase tracking-wider">
            Operadores de Caixa (PDV)
          </div>
          <div className="text-2xl font-black mt-1 font-mono text-purple-950 dark:text-white flex items-baseline gap-1.5">
            {cashierCount} <span className="text-sm font-normal text-purple-500">/ {maxCashiers} máx</span>
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
            {adminCount} <span className="text-xs font-normal text-purple-600 dark:text-purple-300">gerentes</span>
          </div>
          <div className="text-[10px] text-purple-600/70 dark:text-purple-300/70 mt-1">
            Acesso completo ao painel da loja
          </div>
        </Card>
      </div>

      {/* 3. Tabela / Grid de Utilizadores */}
      {loading ? (
        <div className="py-16 text-center text-xs text-purple-600 dark:text-purple-300 font-bold">
          A carregar utilizadores da loja...
        </div>
      ) : users.length === 0 ? (
        <div className="p-12 text-center text-xs text-purple-700/70 dark:text-purple-200/60 font-bold bg-white dark:bg-[#160228]/95 rounded-2xl border border-dashed border-purple-200 dark:border-white/15">
          Nenhum utilizador encontrado para esta unidade.
        </div>
      ) : (
        <UserTable
          users={users}
          currentUser={currentUser}
          onEdit={handleOpenEdit}
          onChangePassword={handleOpenPasswordOnly}
          onDelete={handleDelete}
        />
      )}

      {/* 4. Modal de Criação / Edição & Senha */}
      <UserEditDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editingUser}
        currentUser={currentUser}
        tenantId={tenantId}
        mode={dialogMode}
        onSave={handleSave}
      />

      <ConfirmActionDialog
        open={confirmState.open}
        onOpenChange={(o) => setConfirmState((prev) => ({ ...prev, open: o }))}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel="Desativar Utilizador"
        variant="destructive"
        onConfirm={confirmState.onConfirm}
      />
    </div>
  )
}
