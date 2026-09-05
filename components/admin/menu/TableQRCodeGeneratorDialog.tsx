'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { QRCodeSVG } from 'qrcode.react'
import { Printer, QrCode, Store, Smartphone } from 'lucide-react'

interface TableQRCodeGeneratorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  storeName: string
}

export default function TableQRCodeGeneratorDialog({
  open,
  onOpenChange,
  tenantId,
  storeName,
}: TableQRCodeGeneratorDialogProps) {
  const [tableCount, setTableCount] = useState<number>(10)
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'

  const tables = Array.from({ length: Math.min(Math.max(tableCount, 1), 30) }, (_, i) => i + 1)

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <div className="print:hidden">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-purple-600" />
                <span>Gerador de Placas de QR Code para Mesas</span>
              </div>
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                {storeName}
              </Badge>
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gere os QR codes individuais para colocar nas mesas da sua loja. Os clientes leem com o telemóvel e o pedido chega com o número da mesa já preenchido.
            </p>
          </DialogHeader>

          {/* Configuração de Mesas */}
          <div className="my-4 flex items-center gap-4 p-4 rounded-2xl bg-purple-50/70 border border-purple-100">
            <div>
              <Label className="text-xs font-bold text-foreground">Quantidade de Mesas na Loja:</Label>
              <Input
                type="number"
                min={1}
                max={30}
                value={tableCount}
                onChange={(e) => setTableCount(Number(e.target.value) || 1)}
                className="w-28 h-9 text-xs mt-1 bg-white font-bold"
              />
            </div>

            <div className="flex-1 text-xs text-muted-foreground">
              Total de <b>{tables.length}</b> placas geradas prontas para imprimir.
            </div>

            <Button
              onClick={handlePrint}
              className="bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs h-9 rounded-xl shadow-xs gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimir Placas</span>
            </Button>
          </div>
        </div>

        {/* Grade de Placas Imprimíveis */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 my-2 print:grid-cols-2 print:gap-6">
          {tables.map((num) => {
            const tableNumStr = String(num).padStart(2, '0')
            const url = `${origin}/menu?tenantId=${tenantId}&tipo=mesa&numero=${tableNumStr}`

            return (
              <div
                key={num}
                className="p-5 rounded-3xl border-2 border-purple-200 bg-white text-center flex flex-col items-center justify-between shadow-xs print:border-purple-600 print:shadow-none"
              >
                {/* Logo & Marca */}
                <div className="flex items-center gap-2 mb-2">
                  <img src="/logo-oficial.png" alt="Açaí da Rose" className="h-9 w-auto" />
                  <div className="text-left leading-tight">
                    <div className="font-black text-xs text-foreground">Açaí da Rose</div>
                    <div className="text-[9px] text-muted-foreground font-semibold">{storeName}</div>
                  </div>
                </div>

                {/* Número da Mesa em Destaque */}
                <div className="my-2 bg-gradient-to-r from-purple-700 to-fuchsia-700 text-white px-4 py-1 rounded-xl font-black text-sm shadow-xs">
                  MESA {tableNumStr}
                </div>

                {/* QR Code SVG */}
                <div className="p-3 bg-purple-50/80 rounded-2xl border border-purple-100 my-2">
                  <QRCodeSVG value={url} size={130} level="H" includeMargin={false} />
                </div>

                {/* Instruções ao Cliente */}
                <div className="text-[11px] font-extrabold text-purple-950 mt-1 flex items-center justify-center gap-1">
                  <Smartphone className="h-3.5 w-3.5 text-purple-600" />
                  <span>Aponte a câmara e faça o pedido</span>
                </div>
                <div className="text-[9px] text-muted-foreground mt-0.5">
                  Cardápio Digital Oficial · Pedido Direto
                </div>
              </div>
            )
          })}
        </div>

        <DialogFooter className="print:hidden mt-4">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs font-bold">
            Fechar
          </Button>
          <Button onClick={handlePrint} className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold gap-1.5">
            <Printer className="h-3.5 w-3.5" />
            <span>Imprimir</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
