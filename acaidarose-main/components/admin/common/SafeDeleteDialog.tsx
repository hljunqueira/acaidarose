'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react'

interface SafeDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  itemName?: string
  warningText?: string
  loading?: boolean
  onConfirm: () => void | Promise<void>
}

export default function SafeDeleteDialog({
  open,
  onOpenChange,
  title = 'Confirmar Exclusão',
  description = 'Esta ação não poderá ser revertida.',
  itemName,
  warningText,
  loading = false,
  onConfirm,
}: SafeDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-white border border-red-100 rounded-3xl shadow-2xl">
        <DialogHeader className="flex flex-col items-center text-center space-y-3">
          <div className="p-3.5 rounded-2xl bg-red-50 text-red-600 border border-red-100">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div>
            <DialogTitle className="text-base font-black text-zinc-900">
              {title}
            </DialogTitle>
            {itemName && (
              <div className="mt-1 text-sm font-bold text-red-600 px-3 py-1 bg-red-50 rounded-xl inline-block">
                {itemName}
              </div>
            )}
            <DialogDescription className="text-xs text-zinc-500 mt-2">
              {description}
            </DialogDescription>
          </div>
        </DialogHeader>

        {warningText && (
          <div className="my-2 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold text-center">
            ⚠️ {warningText}
          </div>
        )}

        <DialogFooter className="flex items-center justify-end gap-2.5 pt-3">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => onOpenChange(false)}
            className="h-10 px-4 rounded-xl text-xs font-bold border-zinc-200 text-zinc-700 hover:bg-zinc-100 cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="h-10 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 flex items-center gap-1.5 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Excluindo...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                <span>Sim, Excluir</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
