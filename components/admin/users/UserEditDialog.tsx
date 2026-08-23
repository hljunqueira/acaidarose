'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User } from '@/types'
import { KeyRound, User as UserIcon, Shield } from 'lucide-react'

interface UserEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: any
  currentUser?: User
  tenantId?: string
  mode?: 'EDIT' | 'PASSWORD_ONLY'
  onSave: (user: any) => Promise<void>
}

export default function UserEditDialog({
  open,
  onOpenChange,
  user,
  currentUser,
  tenantId = 'tenant-torres-novas',
  mode = 'EDIT',
  onSave,
}: UserEditDialogProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('CASHIER')
  const [saving, setSaving] = useState(false)

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN'
  const isPasswordOnly = mode === 'PASSWORD_ONLY'

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
      setPassword('')
      setConfirmPassword('')
      setRole(user.role || 'CASHIER')
    } else {
      setName('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setRole('CASHIER')
    }
  }, [user, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password && confirmPassword && password !== confirmPassword) {
      alert('As palavras-passe não coincidem!')
      return
    }

    setSaving(true)
    try {
      if (isPasswordOnly) {
        await onSave({ ...user, password })
      } else {
        await onSave({
          ...user,
          name,
          email,
          role: isSuperAdmin ? role : (user ? user.role : 'CASHIER'),
          tenantId: user?.tenantId || tenantId,
          ...(password ? { password } : {}),
        })
      }
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-white dark:bg-[#160228] border border-purple-150 dark:border-white/20 text-slate-900 dark:text-white rounded-3xl shadow-2xl">
        <DialogHeader className="pb-2 border-b border-purple-100 dark:border-white/10 text-left">
          <DialogTitle className="text-base font-black text-purple-950 dark:text-white flex items-center gap-2">
            {isPasswordOnly ? (
              <>
                <KeyRound className="h-4 w-4 text-pink-600" />
                Alterar Palavra-passe de {user?.name}
              </>
            ) : user?.id ? (
              <>
                <UserIcon className="h-4 w-4 text-purple-700 dark:text-pink-400" />
                Editar Utilizador
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 text-emerald-600" />
                Novo Utilizador da Loja
              </>
            )}
          </DialogTitle>
          <p className="text-xs text-purple-700/80 dark:text-purple-200/70">
            {isPasswordOnly
              ? 'Defina a nova credencial de acesso para este utilizador'
              : 'Gerencie as permissões e dados de acesso da unidade'}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-2 text-xs">
          {!isPasswordOnly ? (
            <>
              <div>
                <Label className="text-xs font-bold text-purple-950 dark:text-white">Nome Completo:</Label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: João Silva"
                  className="h-9 text-xs mt-1 bg-purple-50/50 dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white rounded-xl"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-purple-950 dark:text-white">Email de Acesso:</Label>
                <Input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: joao@acairose.pt"
                  className="h-9 text-xs mt-1 bg-purple-50/50 dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white rounded-xl"
                />
              </div>

              {isSuperAdmin && (
                <div>
                  <Label className="text-xs font-bold text-purple-950 dark:text-white">Perfil de Acesso (Cargo):</Label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full h-9 text-xs mt-1 rounded-xl border border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-purple-950 dark:text-white px-3 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-pink-500 [&>option]:bg-white dark:[&>option]:bg-[#160228]"
                  >
                    <option value="CASHIER">CASHIER (Operador de Caixa / Salão)</option>
                    <option value="TENANT_ADMIN">TENANT_ADMIN (Gerente de Loja)</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN (Franqueadora Matriz)</option>
                  </select>
                </div>
              )}

              <div>
                <Label className="text-xs font-bold text-purple-950 dark:text-white">
                  Palavra-passe {user?.id && '(deixe em branco para manter)'}:
                </Label>
                <Input
                  type="password"
                  required={!user?.id}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-9 text-xs mt-1 bg-purple-50/50 dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white rounded-xl"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <Label className="text-xs font-bold text-purple-950 dark:text-white">Nova Palavra-passe:</Label>
                <Input
                  type="password"
                  required
                  placeholder="Digite a nova senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-9 text-xs mt-1 bg-purple-50/50 dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white rounded-xl"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-purple-950 dark:text-white">Confirmar Palavra-passe:</Label>
                <Input
                  type="password"
                  required
                  placeholder="Confirme a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-9 text-xs mt-1 bg-purple-50/50 dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white rounded-xl"
                />
              </div>
            </>
          )}

          <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2 border-t border-purple-100 dark:border-white/10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="text-xs bg-purple-900 hover:bg-purple-950 dark:bg-pink-600 dark:hover:bg-pink-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
            >
              {saving ? 'A guardar...' : isPasswordOnly ? 'Atualizar Senha' : 'Salvar Utilizador'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
