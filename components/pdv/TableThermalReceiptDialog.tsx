'use client'

import React from 'react'
import { RestaurantTable } from '@/types/tables'
import { formatCurrency, formatDateTime } from '@/lib/i18n/formatters'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, X } from 'lucide-react'

interface TableThermalReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: RestaurantTable
  type?: 'PRE_CONTA' | 'FICHA_PRODUCAO'
  storeName?: string
  storePhone?: string | null
}

export default function TableThermalReceiptDialog({
  open,
  onOpenChange,
  table,
  type = 'PRE_CONTA',
  storeName = 'Açaí da Rose',
  storePhone = '+351 911 050 264',
}: TableThermalReceiptDialogProps) {
  const items = table.items || []
  const total = table.total || items.reduce((acc, it) => acc + (it.lineTotal || 0), 0)
  const isKitchen = type === 'FICHA_PRODUCAO'

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-zinc-100">
        <DialogHeader className="sr-only">
          <DialogTitle>
            {isKitchen ? 'Ficha de Produção e Copa' : 'Prévia de Comanda Térmica'}
          </DialogTitle>
        </DialogHeader>

        {/* CSS Específico para Impressão Térmica de 80mm */}
        <style jsx global>{`
          @media print {
            @page {
              size: 80mm auto;
              margin: 2mm;
            }
            body * {
              visibility: hidden !important;
            }
            #thermal-receipt-print,
            #thermal-receipt-print * {
              visibility: visible !important;
            }
            #thermal-receipt-print {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 80mm !important;
              margin: 0 !important;
              padding: 4mm !important;
            }
          }
        `}</style>

        <div className="p-4 bg-zinc-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold">
            <Printer className="h-4 w-4 text-pink-400" />
            <span>Visualização de Impressão Térmica (80mm)</span>
          </div>
          <Button
            size="sm"
            onClick={handlePrint}
            className="bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold h-8 px-3 rounded-xl cursor-pointer"
          >
            Imprimir Agora
          </Button>
        </div>

        <div className="p-4 flex justify-center overflow-y-auto max-h-[70vh]">
          {/* CUPOM TÉRMICO FORMATAÇÃO 80MM */}
          <div
            id="thermal-receipt-print"
            className="bg-white shadow-md w-[80mm] p-4 font-mono text-[12px] leading-tight text-black border border-zinc-200"
          >
            {/* Cabeçalho */}
            <div className="text-center space-y-1">
              <img src="/logo-oficial.png" alt="Açaí da Rose" className="mx-auto h-16 w-auto object-contain" />
              <div className="font-black text-sm">{storeName}</div>
              <div className="text-[10px]">Açaí Artesanal Brasileiro</div>
              <div className="text-[10px]">Portugal</div>
              {storePhone && <div className="text-[10px]">Tel: {storePhone}</div>}
            </div>

            <div className="border-t border-dashed border-black my-2" />

            {/* Título do Documento */}
            <div className="text-center font-black text-xs uppercase my-1">
              {isKitchen ? 'FICHA DE PRODUÇÃO - COPA' : 'PRÉ-CONTA / CONSULTA'}
            </div>
            {!isKitchen && (
              <div className="text-center text-[10px] text-zinc-600 font-bold mb-2">
                DOCUMENTO INFORMATIVO NÃO FISCAL
              </div>
            )}

            {/* Metadados da Mesa */}
            <div className="space-y-0.5 text-[11px] my-2">
              <div className="flex justify-between">
                <span>LOCAL:</span>
                <span className="font-black">
                  MESA {table.number.toString().padStart(2, '0')} {table.nickname ? `(${table.nickname})` : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span>EMISSÃO:</span>
                <span>{new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })} - {new Date().toLocaleDateString('pt-PT')}</span>
              </div>
              {table.assignedStaffName && (
                <div className="flex justify-between">
                  <span>ATENDENTE:</span>
                  <span>{table.assignedStaffName}</span>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-black my-2" />

            {/* Cabeçalho da Tabela */}
            <div className="flex justify-between font-bold text-[10px] uppercase pb-1 border-b border-black">
              <span>QTD ITEM</span>
              {!isKitchen && <span>VALOR</span>}
            </div>

            {/* Lista de Itens */}
            <div className="py-2 space-y-2">
              {items.map((it, idx) => (
                <div key={it.id || idx} className="space-y-0.5">
                  <div className="flex justify-between font-bold">
                    <span>1x {it.container?.name || 'Açaí Personalizado'}</span>
                    {!isKitchen && <span>{formatCurrency(it.lineTotal || 0)}</span>}
                  </div>
                  {it.bases && it.bases.length > 0 && (
                    <div className="text-[10px] pl-2 text-zinc-700">
                      • Base: {it.bases.map((b: any) => b.name).join(', ')}
                    </div>
                  )}
                  {it.toppings && it.toppings.length > 0 && (
                    <div className="text-[10px] pl-2 text-zinc-700">
                      • Acomp: {it.toppings.map((t: any) => t.name).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-black my-2" />

            {/* Totais (apenas pré-conta) */}
            {!isKitchen && (
              <div className="space-y-1 my-2 text-right">
                <div className="flex justify-between text-[11px]">
                  <span>SUBTOTAL:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>TAXA DE SERVIÇO:</span>
                  <span>€ 0,00</span>
                </div>
                <div className="flex justify-between font-black text-sm pt-1 border-t border-black">
                  <span>TOTAL A PAGAR:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            )}

            <div className="border-t border-dashed border-black my-2" />

            {/* Rodapé */}
            <div className="text-center text-[10px] space-y-0.5 mt-2">
              <div>Obrigado pela preferência!</div>
              <div className="font-bold">Açaí da Rose · Portugal</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
