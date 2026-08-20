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
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">
            {user?.id ? 'Editar Utilizador' : 'Novo Utilizador'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="text-xs">Nome Completo</Label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-xs mt-1" />
          </div>

          <div>
            <Label className="text-xs">Email</Label>
            <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-8 text-xs mt-1" />
          </div>

          <div>
            <Label className="text-xs">Palavra-passe {user?.id && '(deixe em branco para manter)'}</Label>
            <Input type="password" required={!user?.id} placeholder="123456" value={password} onChange={(e) => setPassword(e.target.value)} className="h-8 text-xs mt-1" />
          </div>

          <div>
            <Label className="text-xs">Nível de Acesso (Role)</Label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full h-8 text-xs mt-1 rounded-md border border-input bg-background px-2"
            >
              <option value="CASHIER">CASHIER (Operador de Caixa / PDV)</option>
              <option value="TENANT_ADMIN">TENANT_ADMIN (Gerente de Loja)</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN (Franqueadora Matriz)</option>
            </select>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">Cancelar</Button>
            <Button type="submit" size="sm" disabled={saving} className="text-xs bg-purple-600 hover:bg-purple-700">{saving ? 'A guardar...' : 'Guardar Utilizador'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
