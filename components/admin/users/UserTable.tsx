'use client'

import React from 'react'
import { User } from '@/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, KeyRound, UserCheck, ShieldCheck, Shield } from 'lucide-react'

interface UserTableProps {
  users: User[]
  currentUser: User
  onEdit: (user: User) => void
  onChangePassword: (user: User) => void
  onDelete: (id: string) => void
}

export default function UserTable({
  users,
  currentUser,
  onEdit,
  onChangePassword,
  onDelete,
}: UserTableProps) {
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN'

  const getBadge = (role: string) => {
    if (role === 'SUPER_ADMIN') {
      return (
        <Badge className="bg-purple-900 dark:bg-pink-600 text-white text-[10px] font-bold border-0">
          SUPER_ADMIN (Holding)
        </Badge>
      )
    }
    if (role === 'TENANT_ADMIN') {
      return (
        <Badge variant="secondary" className="bg-purple-100 dark:bg-fuchsia-950/60 text-purple-900 dark:text-fuchsia-300 border border-purple-200 dark:border-fuchsia-800 text-[10px] font-bold">
          GERENTE DE LOJA
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-[10px] text-purple-700 dark:text-purple-300 border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 font-bold">
        OPERADOR DE CAIXA
      </Badge>
    )
  }

  const getPermissionsText = (role: string) => {
    if (role === 'SUPER_ADMIN') {
      return 'Acesso total: Franquias, Deliberações, Preços Globais, Configurações e Finanças.'
    }
    if (role === 'TENANT_ADMIN') {
      return 'Acesso à Loja: Atendimento & Salão, Cardápio & Preços, Configurações e Relatórios da Unidade.'
    }
    return 'Acesso Operacional: Exclusivamente Atendimento & Salão (Pedidos & KDS, Gestão de Mesas).'
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {users.map((u) => {
        const isSelf = u.id === currentUser?.id
        const isTargetAdmin = u.role === 'SUPER_ADMIN' || u.role === 'TENANT_ADMIN'
        const canDelete = isSuperAdmin && !isSelf
        const canEditFull = isSuperAdmin || (!isTargetAdmin && currentUser?.role === 'TENANT_ADMIN')

        return (
          <Card
            key={u.id}
            className="p-4 bg-white dark:bg-[#160228]/95 border border-purple-150 dark:border-white/15 hover:border-purple-300 dark:hover:border-white/25 rounded-2xl transition flex flex-col justify-between shadow-xs text-slate-900 dark:text-white group"
          >
            <div className="space-y-2.5">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="font-extrabold text-sm text-purple-950 dark:text-white flex items-center gap-1.5">
                    {u.name}
                    {isSelf && (
                      <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 px-1.5 py-0.2 rounded-md">
                        Você
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-purple-700/80 dark:text-purple-200/70 font-mono mt-0.5">
                    {u.email}
                  </div>
                </div>
                {getBadge(u.role)}
              </div>

              {/* Descrição dos Acessos */}
              <div className="p-2.5 rounded-xl bg-purple-50/50 dark:bg-white/5 border border-purple-100 dark:border-white/10 text-[11px] text-purple-900/80 dark:text-purple-200/80">
                {getPermissionsText(u.role)}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-purple-100 dark:border-white/10 flex justify-between items-center gap-2">
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5" /> Ativo
              </span>

              <div className="flex items-center gap-1.5">
                {/* Alterar Senha (Permitido para todos os perfis autorizados) */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onChangePassword(u)}
                  className="h-7 px-2 text-[10px] font-bold border-purple-200 dark:border-white/15 text-purple-950 dark:text-white hover:bg-purple-50 dark:hover:bg-white/10 rounded-lg cursor-pointer flex items-center gap-1"
                >
                  <KeyRound className="h-3 w-3 text-pink-600" />
                  <span>Senha</span>
                </Button>

                {/* Editar Dados / Cargo */}
                {canEditFull && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(u)}
                    className="h-7 px-2 text-[10px] font-bold border-purple-200 dark:border-white/15 text-purple-950 dark:text-white hover:bg-purple-50 dark:hover:bg-white/10 rounded-lg cursor-pointer flex items-center gap-1"
                  >
                    <Pencil className="h-3 w-3 text-purple-700 dark:text-pink-300" />
                    <span>Editar</span>
                  </Button>
                )}

                {/* Excluir (Apenas Admin) */}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(u.id)}
                    className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
