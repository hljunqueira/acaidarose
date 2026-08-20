'use client'

import React, { useState, useEffect } from 'react'
import { User } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import UserTable from './UserTable'
import UserEditDialog from './UserEditDialog'
import { Users, Plus, ShieldAlert, ShieldCheck } from 'lucide-react'

interface UsersAdminProps {
  currentUser: User
}

export default function UsersAdmin({ currentUser }: UsersAdminProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const { authFetch } = useAuthStore()

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN'

  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await authFetch('/api/users')
      const d = await res.json()
      if (d.users) setUsers(d.users)
    } catch {
      toast.error('Erro ao carregar utilizadores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [])

  const cashierCount = users.filter((u) => u.role === 'CASHIER' && u.active).length
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

      toast.success('Utilizador guardado com sucesso!')
      loadUsers()
    } catch (e: any) {
      toast.error(e.message || 'Erro')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja desativar este utilizador?')) return
    try {
      const res = await authFetch(`/api/users/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao desativar')
      toast.success('Utilizador desativado!')
      loadUsers()
    } catch (e: any) {
      toast.error(e.message || 'Erro')
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header Minimalista */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-purple-100">
        <div>
          <h1 className="text-base sm:text-lg font-black text-foreground tracking-tight">
            Utilizadores do Sistema
          </h1>
          <p className="text-[11px] text-muted-foreground">
            Controlo de acessos, administradores e operadores de caixa
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => { setEditingUser(null); setDialogOpen(true) }}
            className="h-8.5 text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white gap-1.5 shadow-xs rounded-xl"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Novo Utilizador</span>
          </Button>
        </div>
      </div>

      {isLimitReached && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-xs text-amber-800 font-medium">
          <ShieldAlert className="h-4 w-4 flex-shrink-0 text-amber-600" />
          <span>Esta unidade atingiu a cota máxima de <b>3 operadores de caixa ativos</b>. Para adicionar outro, desative um operador existente ou solicite autorização à Franqueadora.</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">A carregar utilizadores...</div>
      ) : (
        <UserTable
          users={users}
          currentUserId={currentUser.id}
          onEdit={(u) => { setEditingUser(u); setDialogOpen(true) }}
          onDelete={handleDelete}
        />
      )}

      <UserEditDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editingUser}
        onSave={handleSave}
      />
    </div>
  )
}
