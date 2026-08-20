'use client'

import React from 'react'
import { RestaurantTable } from '@/types/tables'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { QRCodeSVG } from 'qrcode.react'

interface SingleTableQRDialogProps {
  table: RestaurantTable | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function SingleTableQRDialog({ table, open, onOpenChange }: SingleTableQRDialogProps) {
  if (!table) return null

  const defaultOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  const [customOrigin, setCustomOrigin] = React.useState<string>('')

  const activeOrigin = (customOrigin.trim() || defaultOrigin).replace(/\/$/, '')
  const lojaSlug = table.tenantId?.replace('tenant-', '') || 'torres-novas'
  const tableUrl = `${activeOrigin}/menu?tipo=mesa&numero=${table.number.toString().padStart(2, '0')}&loja=${encodeURIComponent(lojaSlug)}`

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 text-center">
        <DialogHeader>
          <DialogTitle className="text-base font-black text-foreground">
            QR Code — Mesa {table.number.toString().padStart(2, '0')}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">{table.nickname || 'Salão de Atendimento'}</p>
        </DialogHeader>

        {/* Configuração de Domínio Online */}
        <div className="text-left bg-purple-50/70 p-3 rounded-2xl border border-purple-100 space-y-1">
          <label className="text-[10px] font-bold text-purple-900 block">
            Domínio do QR Code (Para testar no telemóvel):
          </label>
          <input
            type="text"
            value={customOrigin}
            onChange={(e) => setCustomOrigin(e.target.value)}
            placeholder={defaultOrigin}
            className="w-full h-8 text-xs px-2.5 rounded-xl border border-purple-200 bg-white font-mono"
          />
          <div className="text-[9px] text-muted-foreground">
            Link: <span className="font-mono text-purple-700 select-all">{tableUrl}</span>
          </div>
        </div>

        {/* Placa Física de Mesa para Impressão */}
        <div className="my-3 p-5 rounded-3xl border-2 border-purple-200 bg-gradient-to-b from-purple-50/50 to-white flex flex-col items-center shadow-md">
          <img src="/logo.png" alt="Açaí da Rose" className="h-12 w-auto object-contain mb-1" />
          <div className="text-[10px] font-bold text-purple-700 uppercase tracking-widest mb-3">
            Açaí da Rose · Portugal
          </div>

          <div className="p-2 bg-white rounded-2xl shadow-sm border border-purple-100 mb-3">
            <QRCodeSVG
              value={tableUrl}
              size={180}
              level="H"
              includeMargin
              fgColor="#1b032e"
            />
          </div>

          <div className="text-xl font-black text-purple-950">MESA {table.number.toString().padStart(2, '0')}</div>
          <p className="text-[10px] text-muted-foreground mt-0.5">Aponte a câmara do telemóvel para fazer o seu pedido</p>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="flex-1 text-xs">
            Fechar
          </Button>
          <Button
            size="sm"
            onClick={handlePrint}
            className="flex-1 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs"
          >
            Imprimir Placa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
