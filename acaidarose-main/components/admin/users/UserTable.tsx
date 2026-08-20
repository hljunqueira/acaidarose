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
    if (role === 'SUPER_ADMIN') return <Badge className="bg-purple-700 text-white text-[10px]">SUPER_ADMIN</Badge>
    if (role === 'TENANT_ADMIN') return <Badge variant="secondary" className="bg-fuchsia-100 text-fuchsia-800 text-[10px]">TENANT_ADMIN</Badge>
    return <Badge variant="outline" className="text-[10px]">CASHIER</Badge>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {users.map((u) => (
        <Card key={u.id} className="p-3.5 bg-white border hover:border-purple-300 transition flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-1.5">
              <div className="font-bold text-xs leading-tight text-foreground">{u.name}</div>
              {getBadge(u.role)}
            </div>
            <div className="text-xs text-muted-foreground">{u.email}</div>
          </div>

          <div className="mt-3 pt-2 border-t flex justify-between items-center">
            <span className="text-[11px] text-emerald-600 flex items-center gap-1"><UserCheck className="h-3 w-3" /> Ativo</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => onEdit(u)} className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button>
              {u.id !== currentUserId && (
                <Button variant="ghost" size="icon" onClick={() => onDelete(u.id)} className="h-7 w-7 text-red-500 hover:text-red-700"><Trash2 className="h-3.5 w-3.5" /></Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
