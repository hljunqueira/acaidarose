'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CreateStoreDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: any) => Promise<void>
}

export default function CreateStoreDialog({ open, onOpenChange, onSave }: CreateStoreDialogProps) {
  const [name, setName] = useState('')
  const [nif, setNif] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [mbwayPhone, setMbwayPhone] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({ name, nif, address, phone, mbwayPhone, currency: 'EUR' })
      setName(''); setNif(''); setAddress(''); setPhone(''); setMbwayPhone('')
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Criar Nova Loja / Franquia</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="text-xs">Nome da Unidade / Loja</Label>
            <Input required placeholder="Ex: Açaí da Rose — Cascais" value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-xs mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">NIF (Fiscal PT)</Label>
              <Input placeholder="PT 500 000 000" value={nif} onChange={(e) => setNif(e.target.value)} className="h-8 text-xs mt-1" />
            </div>
            <div>
              <Label className="text-xs">Telemóvel MB Way</Label>
              <Input placeholder="+351 912 000 000" value={mbwayPhone} onChange={(e) => setMbwayPhone(e.target.value)} className="h-8 text-xs mt-1" />
            </div>
          </div>

          <div>
            <Label className="text-xs">Morada / Endereço Completo</Label>
            <Input placeholder="Avenida Principal, 45 - Cascais" value={address} onChange={(e) => setAddress(e.target.value)} className="h-8 text-xs mt-1" />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">Cancelar</Button>
            <Button type="submit" size="sm" disabled={saving} className="text-xs bg-purple-600 hover:bg-purple-700">{saving ? 'A criar...' : 'Criar Franquia'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
