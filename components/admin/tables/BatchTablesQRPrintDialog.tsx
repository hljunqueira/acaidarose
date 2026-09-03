'use client'

import React, { useRef } from 'react'
import { RestaurantTable } from '@/types/tables'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { QRCodeSVG } from 'qrcode.react'
import { Printer, Scissors } from 'lucide-react'

import { useFranchiseStore } from '@/lib/stores/franchiseStore'

interface BatchTablesQRPrintDialogProps {
  tables: RestaurantTable[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function BatchTablesQRPrintDialog({ tables, open, onOpenChange }: BatchTablesQRPrintDialogProps) {
  const { getTenant, currentTenant } = useFranchiseStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://acaidarose.vercel.app'

  const handlePrint = () => {
    if (!containerRef.current) {
      window.print()
      return
    }

    const printWindow = window.open('', '_blank', 'width=900,height=1000')
    if (!printWindow) {
      window.print()
      return
    }

    const contentHtml = containerRef.current.innerHTML

    printWindow.document.open()
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt">
      <head>
        <meta charset="utf-8" />
        <title>Placas de Mesas — Açaí da Rose</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;800;900&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
            background: #ffffff;
            color: #1b032e;
            padding: 0;
            margin: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8mm;
            width: 100%;
          }
          .print-card {
            border: 2px dashed #9333ea;
            border-radius: 20px;
            padding: 20px 14px;
            background: #ffffff;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            page-break-inside: avoid;
            break-inside: avoid;
            position: relative;
          }
          .print-card img.logo {
            height: 38px;
            width: auto;
            object-fit: contain;
            margin-bottom: 4px;
          }
          .print-card .branch {
            font-size: 9px;
            font-weight: 900;
            color: #7e22ce;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 10px;
          }
          .print-card .qr-wrapper {
            background: #ffffff;
            padding: 8px;
            border-radius: 16px;
            border: 1.5px solid #e9d5ff;
            margin-bottom: 12px;
            display: inline-block;
          }
          .print-card .qr-wrapper svg {
            display: block;
          }
          .print-card .table-num {
            font-size: 20px;
            font-weight: 900;
            color: #1b032e;
            letter-spacing: -0.5px;
            line-height: 1.1;
          }
          .print-card .table-extra {
            font-size: 10px;
            font-weight: 800;
            color: #db2777;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 2px;
          }
          .print-card .instruction {
            font-size: 9.5px;
            font-weight: 800;
            color: #6b21a8;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 6px;
          }
        </style>
      </head>
      <body>
        <div class="print-grid">
          ${contentHtml}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[85vh] overflow-y-auto p-4 sm:p-6 bg-white dark:bg-[#160228] text-slate-900 dark:text-white border border-purple-150 dark:border-white/20 rounded-3xl shadow-2xl">
        <DialogHeader className="pb-3 border-b border-purple-100 dark:border-white/10">
          <DialogTitle className="text-base font-black text-purple-950 dark:text-white flex items-center gap-2">
            <span>Folha de Impressão — Placas de Mesas ({tables.length})</span>
          </DialogTitle>
          <p className="text-xs text-purple-700/80 dark:text-purple-300/80">
            Layout em grade A4 otimizado com linhas de corte para tesoura. Cada placa contém QR Code em alta definição e identificação da mesa.
          </p>
        </DialogHeader>

        {/* Container renderizado na tela e capturado para impressão perfeita */}
        <div
          ref={containerRef}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 my-4"
        >
          {tables.map((table) => {
            const storeInfo = getTenant(table.tenantId) || currentTenant
            const lojaSlug = storeInfo?.slug || 'figueira-da-foz'
            const branchLabel = storeInfo?.name || 'Loja 1 - Figueira da Foz (Matriz)'
            const formattedNum = table.number.toString().padStart(2, '0')
            const tableUrl = `${baseUrl}/menu?tipo=mesa&numero=${formattedNum}&loja=${lojaSlug}`

            // Evita duplicar "Mesa 5" abaixo de "MESA 05"
            const isRedundantNickname =
              !table.nickname ||
              /^mesa\s*\d+$/i.test(table.nickname.trim()) ||
              table.nickname.trim().toLowerCase() === 'salão' ||
              table.nickname.trim().toLowerCase() === 'salao'

            return (
              <div
                key={table.id}
                className="print-card p-4 rounded-3xl border-2 border-dashed border-purple-300 dark:border-white/20 bg-gradient-to-b from-purple-50/60 via-white to-purple-50/30 dark:from-white/10 dark:via-[#160228] dark:to-white/5 flex flex-col items-center text-center shadow-xs"
              >
                <img
                  src="/logo.png"
                  alt="Açaí da Rose"
                  className="logo h-9 w-auto object-contain mb-1 drop-shadow-xs"
                />
                <div className="branch text-[8.5px] font-black text-purple-700 dark:text-pink-400 uppercase tracking-widest mb-2">
                  {branchLabel}
                </div>

                <div className="qr-wrapper p-2 bg-white rounded-2xl shadow-xs border border-purple-100 dark:border-white/15 mb-2.5">
                  <QRCodeSVG
                    value={tableUrl}
                    size={135}
                    level="H"
                    includeMargin={false}
                    fgColor="#1b032e"
                  />
                </div>

                <div className="table-num text-lg font-black text-purple-950 dark:text-white font-mono tracking-tight">
                  MESA {formattedNum}
                </div>

                {!isRedundantNickname && (
                  <div className="table-extra text-[10px] font-extrabold text-pink-600 dark:text-pink-400 uppercase tracking-wider mt-0.5">
                    {table.nickname?.trim()}
                  </div>
                )}

                <div className="instruction text-[9px] font-bold text-purple-700/80 dark:text-purple-300/80 uppercase tracking-wider mt-1">
                  Aponte a câmara para pedir
                </div>
              </div>
            )
          })}
        </div>

        <DialogFooter className="pt-3 border-t border-purple-100 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto h-8 text-xs rounded-xl"
          >
            Fechar
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handlePrint}
            disabled={tables.length === 0}
            className="w-full sm:w-auto h-8 bg-purple-900 hover:bg-purple-950 dark:bg-pink-600 dark:hover:bg-pink-700 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Imprimir Todas as Placas (A4)</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
