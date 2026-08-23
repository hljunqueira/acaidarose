'use client'

import React from 'react'
import { User } from '@/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Shield, UserCheck } from 'lucide-react'

interface UserTableProps {
  users: User[]
  currentUserId?: string
  onEdit: (user: User) => void
  onDelete: (id: string) => void
}

export default function UserTable({ users, currentUserId, onEdit, onDelete }: UserTableProps) {
  const getBadge = (role: string) => {
    if (role === 'SUPER_ADMIN') return <Badge className="bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 text-white text-[10px] font-bold border-0">SUPER_ADMIN</Badge>
    if (role === 'TENANT_ADMIN') return <Badge variant="secondary" className="bg-purple-100 dark:bg-fuchsia-950/60 text-purple-900 dark:text-fuchsia-300 border border-purple-200 dark:border-fuchsia-800 text-[10px] font-bold">TENANT_ADMIN</Badge>
    return <Badge variant="outline" className="text-[10px] text-purple-700 dark:text-purple-300 border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 font-bold">CASHIER</Badge>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {users.map((u) => (
        <Card key={u.id} className="p-4 bg-white dark:bg-[#160228]/95 border border-purple-150 dark:border-white/15 hover:border-purple-400 dark:hover:border-pink-500/40 rounded-3xl transition flex flex-col justify-between shadow-xs dark:shadow-xl text-slate-900 dark:text-white">
          <div>
            <div className="flex justify-between items-start mb-1.5">
              <div className="font-bold text-xs leading-tight text-purple-950 dark:text-white">{u.name}</div>
              {getBadge(u.role)}
            </div>
            <div className="text-xs text-purple-700/80 dark:text-purple-200/70 font-mono">{u.email}</div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-purple-100 dark:border-white/10 flex justify-between items-center">
            <span className="text-[11px] text-emerald-600 dark:text-emerald-300 font-bold flex items-center gap-1"><UserCheck className="h-3.5 w-3.5" /> Ativo</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => onEdit(u)} className="h-7 w-7 text-purple-700 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white hover:bg-purple-100/70 dark:hover:bg-white/10 rounded-lg cursor-pointer"><Pencil className="h-3.5 w-3.5" /></Button>
              {u.id !== currentUserId && (
                <Button variant="ghost" size="icon" onClick={() => onDelete(u.id)} className="h-7 w-7 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
