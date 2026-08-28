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
  requireTypedConfirmation?: string // Texto opcional para o utilizador digitar antes de confirmar (ex: 'ELIMINAR')
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
        return 'bg-red-600 hover:bg-red-700 text-white font-medium'
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white font-medium'
      default:
        return 'bg-purple-600 hover:bg-purple-700 text-white font-medium'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-[#160F24] border border-[#2A1E3D] text-white rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-2 text-left">
          <DialogTitle className="text-base font-semibold tracking-tight text-white">
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-400 leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        {requireTypedConfirmation && (
          <div className="space-y-1.5 pt-2">
            <p className="text-[11px] text-gray-300">
              Digite <span className="font-mono font-bold text-red-400">{requireTypedConfirmation}</span> para confirmar:
            </p>
            <input
              type="text"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder={requireTypedConfirmation}
              className="w-full h-8 px-3 text-xs bg-[#0A0612] border border-[#2A1E3D] rounded-lg text-white font-mono focus:outline-none focus:border-red-500"
            />
          </div>
        )}

        <div className="p-3 rounded-lg bg-[#0A0612] border border-[#2A1E3D] text-[11px] text-gray-400">
          Esta ação é registada no histórico de auditoria e segurança da rede.
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="rounded-lg border-[#2A1E3D] bg-transparent text-xs text-gray-300 hover:bg-[#2A1E3D] hover:text-white"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={isConfirmDisabled}
            className={`rounded-lg text-xs ${getConfirmButtonClasses()}`}
          >
            {loading ? 'A processar...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
