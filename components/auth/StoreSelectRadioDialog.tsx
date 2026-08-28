'use client'

import React, { useState } from 'react'
import { Tenant } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface StoreSelectRadioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenants: Tenant[]
  selectedTenantId: string
  onConfirm: (tenant: Tenant) => void
}

export default function StoreSelectRadioDialog({
  open,
  onOpenChange,
  tenants,
  selectedTenantId,
  onConfirm,
}: StoreSelectRadioDialogProps) {
  const [currentSelected, setCurrentSelected] = useState(selectedTenantId)

  React.useEffect(() => {
    if (open) {
      setCurrentSelected(selectedTenantId)
    }
  }, [open, selectedTenantId])

  const handleEnter = () => {
    const target = tenants.find((t) => t.id === currentSelected) || tenants[0]
    if (target) {
      onConfirm(target)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-7 rounded-3xl bg-white dark:bg-[#160228] text-slate-900 dark:text-white shadow-2xl border border-purple-100 dark:border-white/15">
        <DialogHeader className="text-center pb-3 border-b border-purple-50">
          <img src="/logo.png" alt="Açaí da Rose" className="h-14 w-auto mx-auto object-contain mb-1" />
          <DialogTitle className="text-base font-black text-foreground">
            Selecione uma empresa da franquia
          </DialogTitle>
        </DialogHeader>

        {/* Lista com Radio Buttons */}
        <div className="space-y-3 my-4">
          {tenants.map((t) => {
            const isChecked = currentSelected === t.id
            return (
              <label
                key={t.id}
                onClick={() => setCurrentSelected(t.id)}
                className={`p-3.5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                  isChecked
                    ? 'border-purple-600 bg-purple-50/80 text-purple-950 shadow-xs'
                    : 'border-border/70 hover:border-purple-200 hover:bg-purple-50/30 text-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="storeChoice"
                    checked={isChecked}
                    onChange={() => setCurrentSelected(t.id)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-600"
                  />
                  <div>
                    <div className="font-bold text-xs">{t.name}</div>
                    <div className="text-[10px] text-muted-foreground">{t.address || t.slug}</div>
                  </div>
                </div>

                {t.isHeadquarters && (
                  <span className="text-[9px] font-black uppercase text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md">
                    Matriz / Global
                  </span>
                )}
              </label>
            )
          })}
        </div>

        <DialogFooter className="pt-2">
          <Button
            onClick={handleEnter}
            className="w-full h-11 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
          >
            Entrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
