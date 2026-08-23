'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface UserEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: any
  onSave: (user: any) => Promise<void>
}

export default function UserEditDialog({ open, onOpenChange, user, onSave }: UserEditDialogProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('CASHIER')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
      setPassword('')
      setRole(user.role || 'CASHIER')
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({ ...user, name, email, role, ...(password ? { password } : {}) })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-white dark:bg-[#160228] border border-purple-200 dark:border-white/15 text-slate-900 dark:text-white rounded-3xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-black text-purple-950 dark:text-white">
            {user?.id ? 'Editar Utilizador' : 'Novo Utilizador'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-2">
          <div>
            <Label className="text-xs font-bold text-purple-900 dark:text-purple-200">Nome Completo</Label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-xs mt-1 bg-white dark:bg-white/10 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white rounded-xl" />
          </div>

          <div>
            <Label className="text-xs font-bold text-purple-900 dark:text-purple-200">Email</Label>
            <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-9 text-xs mt-1 bg-white dark:bg-white/10 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white rounded-xl" />
          </div>

          <div>
            <Label className="text-xs font-bold text-purple-900 dark:text-purple-200">Palavra-passe {user?.id && '(deixe em branco para manter)'}</Label>
            <Input type="password" required={!user?.id} placeholder="123456" value={password} onChange={(e) => setPassword(e.target.value)} className="h-9 text-xs mt-1 bg-white dark:bg-white/10 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white rounded-xl" />
          </div>

          <div>
            <Label className="text-xs font-bold text-purple-900 dark:text-purple-200">Nível de Acesso (Role)</Label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full h-9 text-xs mt-1 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-white/10 text-purple-950 dark:text-white px-3 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-pink-500 [&>option]:bg-white dark:[&>option]:bg-[#160228] [&>option]:text-purple-950 dark:[&>option]:text-white"
            >
              <option value="CASHIER">CASHIER (Operador de Caixa / PDV)</option>
              <option value="TENANT_ADMIN">TENANT_ADMIN (Gerente de Loja)</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN (Franqueadora Matriz)</option>
            </select>
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-950 dark:text-white rounded-xl cursor-pointer shadow-xs">Cancelar</Button>
            <Button type="submit" size="sm" disabled={saving} className="text-xs bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 dark:hover:from-pink-500 dark:hover:to-purple-500 text-white font-bold rounded-xl shadow-md cursor-pointer">{saving ? 'A guardar...' : 'Guardar Utilizador'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
