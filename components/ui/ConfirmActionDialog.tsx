'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Info, Trash2, CheckCircle2 } from 'lucide-react'

interface ConfirmActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'destructive' | 'default' | 'success'
  onConfirm: () => void | Promise<void>
  loading?: boolean
}

export default function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'destructive',
  onConfirm,
  loading = false,
}: ConfirmActionDialogProps) {
  const handleConfirm = async () => {
    await onConfirm()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-white dark:bg-[#160228] border border-purple-150 dark:border-white/15 text-purple-950 dark:text-white rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <DialogHeader className="text-left flex flex-row items-start gap-3.5 pb-2">
          <div
            className={`p-3 rounded-2xl shrink-0 ${
              variant === 'destructive'
                ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                : variant === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                : 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-pink-400 border border-purple-200 dark:border-purple-500/20'
            }`}
          >
            {variant === 'destructive' ? (
              <Trash2 className="h-5 w-5" />
            ) : variant === 'success' ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <Info className="h-5 w-5" />
            )}
          </div>

          <div className="space-y-1">
            <DialogTitle className="text-base font-black text-purple-950 dark:text-white leading-snug">
              {title}
            </DialogTitle>
            {description && (
              <p className="text-xs text-purple-700/80 dark:text-purple-200/70 font-medium leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </DialogHeader>

        <DialogFooter className="pt-4 flex items-center justify-end gap-2 border-t border-purple-150 dark:border-white/10">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="h-9 px-4 rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-xs font-bold text-purple-950 dark:text-white hover:bg-purple-50 dark:hover:bg-white/10 cursor-pointer shadow-2xs"
          >
            {cancelLabel}
          </Button>

          <Button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`h-9 px-4 rounded-xl text-xs font-black text-white cursor-pointer shadow-md transition-all ${
              variant === 'destructive'
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                : variant === 'success'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                : 'bg-purple-700 hover:bg-purple-800 shadow-purple-700/20'
            }`}
          >
            {loading ? 'Aguarde...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
