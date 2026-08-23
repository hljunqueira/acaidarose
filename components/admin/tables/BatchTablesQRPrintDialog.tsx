'use client'

import React from 'react'
import { RestaurantTable } from '@/types/tables'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { QRCodeSVG } from 'qrcode.react'

interface BatchTablesQRPrintDialogProps {
  tables: RestaurantTable[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STORE_LABELS: Record<string, string> = {
  'tenant-aveiro': 'Filial Aveiro',
  'tenant-lisboa': 'Filial Lisboa',
  'tenant-santarem': 'Filial Santarém',
  'tenant-torres-novas': 'Matriz Torres Novas',
}

export default function BatchTablesQRPrintDialog({ tables, open, onOpenChange }: BatchTablesQRPrintDialogProps) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://acaidarose.vercel.app'

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-black text-foreground">
            Folha de Impressão — Todas as Placas de Mesas ({tables.length})
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Pronto para impressão em folha A4 com corte. As placas incluem a logo oficial do Açaí da Rose e a filial correspondente.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 my-4">
          {tables.map((table) => {
            const lojaSlug = table.tenantId?.replace('tenant-', '') || 'torres-novas'
            const tableUrl = `${baseUrl}/menu?tipo=mesa&numero=${table.number.toString().padStart(2, '0')}&loja=${encodeURIComponent(lojaSlug)}`
            const branchLabel = STORE_LABELS[table.tenantId] || 'Açaí da Rose'

            return (
              <div
                key={table.id}
                className="p-4 rounded-3xl border-2 border-purple-200 bg-white flex flex-col items-center text-center shadow-xs page-break-inside-avoid"
              >
                <img src="/logo.png" alt="Açaí da Rose" className="h-9 w-auto object-contain mb-1" />
                <div className="text-[8px] font-black text-purple-700 uppercase tracking-widest mb-2">
                  {branchLabel}
                </div>

                <div className="p-1 bg-white rounded-xl shadow-xs border border-purple-100 mb-2">
                  <QRCodeSVG
                    value={tableUrl}
                    size={140}
                    level="H"
                    includeMargin
                    fgColor="#1b032e"
                  />
                </div>

                <div className="text-base font-black text-purple-950">MESA {table.number.toString().padStart(2, '0')}</div>
                <div className="text-[9px] text-muted-foreground font-semibold truncate max-w-[140px]">
                  {table.nickname || 'Salão'}
                </div>
              </div>
            )
          })}
        </div>

        <DialogFooter className="flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Fechar
          </Button>
          <Button
            size="sm"
            onClick={handlePrint}
            disabled={tables.length === 0}
            className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs"
          >
            Imprimir Todas as Placas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
