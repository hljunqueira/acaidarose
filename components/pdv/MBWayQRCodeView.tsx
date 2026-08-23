'use client'

import React from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { formatCurrency } from '@/lib/i18n/formatters'
import { Smartphone, CheckCircle } from 'lucide-react'
import { generateMBWayPayload } from '@/lib/services/qrCodeService'

interface MBWayQRCodeViewProps {
  phone: string
  amount: number
  orderNumber: number | string
  onConfirm: () => void
  submitting?: boolean
}

export default function MBWayQRCodeView({
  phone,
  amount,
  orderNumber,
  onConfirm,
  submitting,
}: MBWayQRCodeViewProps) {
  const payload = generateMBWayPayload(phone, amount, orderNumber)

  return (
    <div className="flex flex-col items-center text-center p-4 bg-purple-50/50 rounded-xl border border-purple-200">
      <div className="flex items-center gap-1.5 text-purple-800 font-bold text-sm mb-2">
        <Smartphone className="h-4 w-4" />
        <span>Pagamento via MB Way</span>
      </div>

      <div className="p-3 bg-white rounded-xl shadow-md border-2 border-purple-300 mb-3">
        <QRCodeSVG value={payload} size={150} level="M" />
      </div>

      <div className="text-xs text-muted-foreground mb-1">
        Peça ao cliente para ler o QR Code ou confirme o telemóvel:
      </div>
      <div className="font-mono font-bold text-sm text-foreground mb-3">{phone || '+351 912 345 678'}</div>

      <div className="text-lg font-black text-purple-700 mb-4">{formatCurrency(amount)}</div>

      <button
        type="button"
        onClick={onConfirm}
        disabled={submitting}
        className="w-full py-2.5 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
      >
        <CheckCircle className="h-4 w-4" />
        <span>{submitting ? 'A registar...' : 'Confirmar Pagamento Recebido'}</span>
      </button>
    </div>
  )
}
