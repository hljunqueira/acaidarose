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

export interface SafeConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'primary'
  onConfirm: () => void | Promise<void>
  loading?: boolean
  requireTypedConfirmation?: string
}

export default function SafeConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirmar Ação',
  cancelText = 'Cancelar',
  variant = 'danger',
  onConfirm,
  loading = false,
  requireTypedConfirmation,
}: SafeConfirmDialogProps) {
  const [typedInput, setTypedInput] = React.useState('')

  React.useEffect(() => {
    if (!open) {
      setTypedInput('')
    }
  }, [open])

  const isConfirmDisabled = loading || (requireTypedConfirmation ? typedInput !== requireTypedConfirmation : false)

  const getConfirmButtonClasses = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white font-bold'
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white font-bold'
      default:
        return 'bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 text-white font-bold'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-white dark:bg-[#160228] border border-purple-150 dark:border-white/15 text-purple-950 dark:text-white rounded-3xl shadow-2xl">
        <DialogHeader className="space-y-2 text-left">
          <DialogTitle className="text-base font-black tracking-tight text-purple-950 dark:text-white">
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs text-purple-700/80 dark:text-purple-200/70 leading-relaxed font-medium">
            {description}
          </DialogDescription>
        </DialogHeader>

        {requireTypedConfirmation && (
          <div className="space-y-1.5 pt-2">
            <p className="text-[11px] text-purple-900 dark:text-purple-200 font-medium">
              Digite <span className="font-mono font-bold text-red-600 dark:text-red-400">{requireTypedConfirmation}</span> para confirmar:
            </p>
            <input
              type="text"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder={requireTypedConfirmation}
              className="w-full h-9 px-3 text-xs bg-purple-50/50 dark:bg-white/5 border border-purple-200 dark:border-white/15 rounded-xl text-purple-950 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>
        )}

        <div className="p-3 rounded-2xl bg-purple-50/50 dark:bg-white/5 border border-purple-150 dark:border-white/10 text-[11px] text-purple-700/80 dark:text-purple-200/70 font-medium">
          Esta ação é registada no histórico de auditoria e segurança da rede.
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-xs text-purple-950 dark:text-white hover:bg-purple-50 dark:hover:bg-white/10 font-bold cursor-pointer"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={isConfirmDisabled}
            className={`rounded-xl text-xs h-9 shadow-xs cursor-pointer ${getConfirmButtonClasses()}`}
          >
            {loading ? 'A processar...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
