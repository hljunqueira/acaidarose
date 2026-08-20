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
import { AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react'

interface SafeConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'primary'
  onConfirm: () => void
  loading?: boolean
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
}: SafeConfirmDialogProps) {
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <ShieldAlert className="h-6 w-6 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-amber-500" />
      default:
        return <CheckCircle2 className="h-6 w-6 text-purple-600" />
    }
  }

  const getConfirmButtonClasses = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white font-black'
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white font-black'
      default:
        return 'bg-purple-700 hover:bg-purple-800 text-white font-black'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-white border border-purple-100 rounded-3xl shadow-2xl">
        <DialogHeader className="flex flex-row items-start gap-3.5 text-left space-y-0">
          <div className="p-3 rounded-2xl bg-purple-50 flex-shrink-0 flex items-center justify-center">
            {getIcon()}
          </div>
          <div className="space-y-1">
            <DialogTitle className="text-base font-black text-foreground tracking-tight">
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <span>Esta ação é registada no histórico de auditoria do sistema.</span>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="rounded-xl border-purple-200 text-xs font-bold hover:bg-purple-50"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-xl text-xs gap-1.5 shadow-sm ${getConfirmButtonClasses()}`}
          >
            {loading ? 'A processar...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
