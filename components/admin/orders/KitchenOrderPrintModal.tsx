'use client'

import React from 'react'
import { Order } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, X, ChefHat } from 'lucide-react'
import { formatDateTime } from '@/lib/i18n/formatters'

interface KitchenOrderPrintModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
  storeName?: string
}

export default function KitchenOrderPrintModal({
  open,
  onOpenChange,
  order,
  storeName = 'Açaí da Rose',
}: KitchenOrderPrintModalProps) {
  if (!order) return null

  const isTable = order.isTableOrder !== false && !!order.tableNumber
  const isPaid = order.paymentStatus === 'PAID'
  const items = Array.isArray(order.items) ? order.items : []
  const formattedTicket = String(order.orderNumber || 1).padStart(3, '0')

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-zinc-100 dark:bg-[#160228] border border-purple-200 dark:border-white/20 rounded-2xl shadow-2xl z-[70]">
        <DialogHeader className="sr-only">
          <DialogTitle>Comanda de Produção — Cozinha</DialogTitle>
        </DialogHeader>

        {/* CSS Isolado e Estrito para Impressão Térmica de 80mm */}
        <style jsx global>{`
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body * {
              visibility: hidden !important;
            }
            #kitchen-order-print,
            #kitchen-order-print * {
              visibility: visible !important;
            }
            #kitchen-order-print {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 80mm !important;
              margin: 0 !important;
              padding: 3mm 4mm !important;
              background: white !important;
              color: black !important;
              box-shadow: none !important;
              border: none !important;
            }
          }
        `}</style>

        {/* Barra Superior da Visualização */}
        <div className="p-3.5 bg-purple-950 text-white flex items-center justify-between border-b border-purple-900">
          <div className="flex items-center gap-2 text-xs font-bold">
            <ChefHat className="h-4 w-4 text-pink-400" />
            <span>Comanda de Cozinha (Térmica 80mm)</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handlePrint}
              className="bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold h-8 px-3 rounded-xl cursor-pointer gap-1.5 shadow-sm"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimir Agora</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0 text-purple-200 hover:text-white hover:bg-purple-900/50 rounded-xl cursor-pointer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Visualização da Comanda Térmica de 80mm */}
        <div className="p-4 flex justify-center overflow-y-auto max-h-[75vh] bg-zinc-200/70 dark:bg-black/40">
          <div
            id="kitchen-order-print"
            className="bg-white shadow-md w-[80mm] p-3 font-mono text-[11px] leading-tight text-black border border-zinc-300"
          >
            {/* Cabeçalho com Logo Oficial */}
            <div className="text-center space-y-1">
              <img
                src="/logo-oficial.png"
                alt="Açaí da Rose"
                className="mx-auto h-14 w-auto object-contain filter contrast-125"
              />
              <div className="font-black text-xs uppercase tracking-tight">{storeName}</div>
              <div className="text-[9px] uppercase tracking-wider text-zinc-600 font-bold">
                Portugal 🇵🇹
              </div>
            </div>

            <div className="border-t border-dashed border-black my-1.5" />

            {/* Título Operacional */}
            <div className="text-center font-black text-xs uppercase tracking-wider bg-zinc-100 py-1 border border-zinc-300">
              *** COMANDA DE COZINHA ***
            </div>

            <div className="flex justify-between text-[10px] my-1 text-zinc-700">
              <span>EMISSÃO:</span>
              <span className="font-bold">{formatDateTime(order.createdAt)}</span>
            </div>

            <div className="border-t-2 border-black my-1" />

            {/* Destaque Operacional: Ticket, Mesa e Cliente */}
            <div className="my-1.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold">SENHA:</span>
                <span className="text-xl font-black tracking-tight">#{formattedTicket}</span>
              </div>

              {/* Box de Destino (Mesa ou Balcão) em Destaque Forte */}
              <div className="border-2 border-black p-1 text-center font-black text-sm uppercase bg-zinc-50">
                {isTable ? `>>> MESA ${order.tableNumber} <<<` : '>>> BALCÃO / TAKE-AWAY <<<'}
              </div>

              <div className="pt-0.5 space-y-0.5 text-[10.5px]">
                <div className="flex justify-between">
                  <span className="font-bold">CLIENTE:</span>
                  <span className="font-black uppercase">
                    {order.customerName || (isTable ? `Mesa ${order.tableNumber}` : 'Balcão')}
                  </span>
                </div>

                {order.customerPhone && (
                  <div className="flex justify-between text-[10px]">
                    <span>CONTACTO:</span>
                    <span className="font-bold">{order.customerPhone}</span>
                  </div>
                )}

                <div className="flex justify-between text-[10px] pt-0.5">
                  <span>PAGAMENTO:</span>
                  <span className="font-black">
                    {isPaid
                      ? order.paymentMethod === 'MBWAY'
                        ? '[✓ PAGO VIA MB WAY]'
                        : '[✓ PAGO]'
                      : '[⏳ A PAGAR NO BALCÃO]'}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t-2 border-black my-1.5" />

            {/* Seção de Itens da Comanda */}
            <div className="text-[10px] font-black uppercase tracking-wider pb-1 border-b border-black flex justify-between">
              <span>ITENS PARA PREPARAÇÃO</span>
              <span>QTD: {items.length}</span>
            </div>

            <div className="py-1 space-y-2.5">
              {items.length > 0 ? (
                items.map((it: any, idx: number) => {
                  const bases = it.bases || []
                  const toppings = it.toppings || []

                  return (
                    <div key={it.id || idx} className="space-y-1">
                      {/* Nome do Recipiente / Taça com Quantidade */}
                      <div className="font-black text-xs uppercase bg-zinc-100 p-0.5 border-l-2 border-black">
                        [ {it.quantity || 1}x ] {it.containerName || it.container?.name || 'Taça de Açaí'}
                      </div>

                      {/* Bases e Cremes */}
                      {bases.length > 0 && (
                        <div className="pl-1.5 text-[10.5px] leading-tight">
                          <span className="font-bold underline">BASES:</span>{' '}
                          <span className="font-semibold">{bases.map((b: any) => b.name).join(', ')}</span>
                        </div>
                      )}

                      {/* Acompanhamentos em Formato Checklist */}
                      {toppings.length > 0 && (
                        <div className="pl-1.5 text-[10px] leading-tight space-y-0.5">
                          <div className="font-bold underline">ACOMPANHAMENTOS:</div>
                          <div className="grid grid-cols-1 gap-0.5 pl-1 font-semibold">
                            {toppings.map((t: any, tIdx: number) => (
                              <div key={t.id || tIdx} className="flex items-center gap-1">
                                <span className="font-mono font-bold">[ ]</span>
                                <span>{t.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Observações do Item */}
                      {it.notes && (
                        <div className="mx-1 p-1 border border-dashed border-black bg-zinc-50 text-[10px] font-bold">
                          &gt;&gt; OBS: {it.notes}
                        </div>
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="py-2 text-center text-[10px] italic">
                  Nenhum item discriminado na comanda.
                </div>
              )}
            </div>

            {/* Observações Gerais do Pedido */}
            {order.notes && (
              <>
                <div className="border-t border-dashed border-black my-1.5" />
                <div className="p-1.5 border-2 border-black bg-zinc-50 text-[10px] font-black space-y-0.5">
                  <div className="underline uppercase tracking-wider text-[9px]">
                    *** OBSERVAÇÃO GERAL DO PEDIDO ***
                  </div>
                  <div>{order.notes}</div>
                </div>
              </>
            )}

            <div className="border-t border-dashed border-black my-2" />

            {/* Rodapé da Comanda */}
            <div className="text-center text-[9px] uppercase tracking-wider text-zinc-700 font-bold space-y-0.5">
              <div>--- FIM DO PEDIDO #{formattedTicket} ---</div>
              <div className="text-[8px] font-normal">Açaí da Rose · Sistema de Produção</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
