'use client'

import React from 'react'
import { Order } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, X, ChefHat } from 'lucide-react'
import { formatDateTime } from '@/lib/i18n/formatters'
import { getPublicStoreName } from '@/lib/stores/franchiseStore'

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
  const cleanStoreName = getPublicStoreName(null, storeName)

  // Impressão Térmica Isolada via Iframe Oculto:
  // Evita cortes de conteúdo causados por modais com overflow-y, fixed ou max-height no Chrome/Edge.
  const handlePrint = () => {
    const printEl = document.getElementById('kitchen-order-print')
    if (!printEl) {
      window.print()
      return
    }

    let iframe = document.getElementById('thermal-print-frame') as HTMLIFrameElement
    if (!iframe) {
      iframe = document.createElement('iframe')
      iframe.id = 'thermal-print-frame'
      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = '0'
      document.body.appendChild(iframe)
    }

    const doc = iframe.contentWindow?.document
    if (!doc) {
      window.print()
      return
    }

    // Coleta todas as folhas de estilos do documento pai para garantir Tailwind nativo
    const styleTags = Array.from(
      document.querySelectorAll('link[rel="stylesheet"], style')
    )
      .map((tag) => tag.outerHTML)
      .join('\n')

    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Comanda #${formattedTicket} - Cozinha</title>
          ${styleTags}
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            *, *::before, *::after {
              box-sizing: border-box;
            }
            body {
              margin: 0 !important;
              padding: 2mm 3mm !important;
              width: 80mm !important;
              background: #ffffff !important;
              color: #000000 !important;
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>
        <body>
          <div style="width: 74mm; margin: 0 auto; color: #000000; font-family: monospace;">
            ${printEl.innerHTML}
          </div>
        </body>
      </html>
    `)
    doc.close()

    // Aguarda o carregamento das mídias antes de invocar a impressão
    setTimeout(() => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    }, 250)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-zinc-100 dark:bg-[#160228] border border-purple-200 dark:border-white/20 rounded-2xl shadow-2xl z-[70]">
        <DialogHeader className="sr-only">
          <DialogTitle>Comanda de Produção — Cozinha</DialogTitle>
        </DialogHeader>

        {/* Reset Global de Segurança para Caso o Operador Use Ctrl+P */}
        <style jsx global>{`
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            html, body {
              overflow: visible !important;
              height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            body * {
              visibility: hidden !important;
            }
            div[role="dialog"],
            div[data-state="open"],
            div[data-radix-portal] {
              position: static !important;
              transform: none !important;
              max-height: none !important;
              overflow: visible !important;
              width: 100% !important;
              height: auto !important;
              padding: 0 !important;
              margin: 0 !important;
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
              padding: 2mm 3mm !important;
              background: white !important;
              color: black !important;
              box-shadow: none !important;
              border: none !important;
              overflow: visible !important;
              height: auto !important;
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
            className="bg-white shadow-md w-[80mm] p-2.5 font-mono text-black border border-zinc-300 leading-tight"
          >
            {/* Cabeçalho Compacto: Logo menor e dados de loja em linha única */}
            <div className="text-center space-y-0.5">
              <img
                src="/logo-oficial-1.png"
                alt="Açaí da Rose"
                className="mx-auto h-9 w-auto object-contain filter contrast-125"
              />
              <div className="font-black text-[9.5px] uppercase tracking-tight text-zinc-900">
                {cleanStoreName} · PORTUGAL 🇵🇹
              </div>
            </div>

            <div className="border-t border-dashed border-zinc-400 my-1" />

            {/* Identificação de Comanda e Horário Compacto */}
            <div className="flex justify-between items-center text-[8.5px] text-zinc-700 font-bold px-0.5">
              <span>*** COMANDA DE COZINHA ***</span>
              <span>{formatDateTime(order.createdAt)}</span>
            </div>

            <div className="border-t-2 border-black my-1" />

            {/* Destaque Operacional: Ticket e Destino em Alto Contraste */}
            <div className="my-1 space-y-1">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[10px] font-bold">SENHA:</span>
                <span className="text-2xl font-black tracking-tight">#{formattedTicket}</span>
              </div>

              {/* Box de Destino (Mesa ou Balcão) */}
              <div className="border-2 border-black py-1 px-2 text-center font-black text-sm uppercase bg-zinc-100 tracking-wide">
                {isTable ? `>>> MESA ${order.tableNumber} <<<` : '>>> BALCÃO / TAKE-AWAY <<<'}
              </div>

              {/* Dados do Cliente e Pagamento em Formato Menor e Compacto */}
              <div className="pt-0.5 space-y-0.5 text-[9px] text-zinc-800 px-0.5">
                <div className="flex justify-between">
                  <span className="font-bold text-zinc-600">CLIENTE:</span>
                  <span className="font-black uppercase text-black">
                    {order.customerName || (isTable ? `Mesa ${order.tableNumber}` : 'Balcão')}
                  </span>
                </div>

                {order.customerPhone && (
                  <div className="flex justify-between">
                    <span className="font-bold text-zinc-600">CONTACTO:</span>
                    <span className="font-bold text-black">{order.customerPhone}</span>
                  </div>
                )}

                <div className="flex justify-between pt-0.5">
                  <span className="font-bold text-zinc-600">PAGAMENTO:</span>
                  <span className="font-black text-black">
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

            {/* SEÇÃO PRINCIPAL: ITENS PARA PREPARAÇÃO (DESTAQUE MÁXIMO PARA BANCADA) */}
            <div className="text-[10px] font-black uppercase tracking-wider pb-1 border-b border-black flex justify-between px-0.5">
              <span>ITENS PARA PREPARAÇÃO</span>
              <span>QTD: {items.length}</span>
            </div>

            <div className="py-1 space-y-3">
              {items.length > 0 ? (
                items.map((it: any, idx: number) => {
                  const bases = it.bases || []
                  const toppings = it.toppings || []

                  return (
                    <div key={it.id || idx} className="space-y-1">
                      {/* Nome do Recipiente / Taça em Destaque Forte */}
                      <div className="border-2 border-black bg-zinc-100 p-1 font-black text-[13px] uppercase text-black tracking-tight flex items-start gap-1">
                        <span className="bg-black text-white px-1 py-0.2 text-xs font-black rounded-xs">
                          {it.quantity || 1}X
                        </span>
                        <span className="leading-snug">
                          {it.containerName || it.container?.name || 'Taça de Açaí'}
                        </span>
                      </div>

                      {/* Bases e Cremes (Destaque Operacional) */}
                      {bases.length > 0 && (
                        <div className="pl-1 text-[11px] leading-tight text-black">
                          <span className="font-black underline">BASES:</span>{' '}
                          <span className="font-bold uppercase">
                            {bases.map((b: any) => b.name).join(', ')}
                          </span>
                        </div>
                      )}

                      {/* Acompanhamentos em Formato Checklist Grande e Nítido */}
                      {toppings.length > 0 && (
                        <div className="pl-1 pt-0.5 space-y-0.5 text-black">
                          <div className="font-bold underline text-[9.5px] uppercase tracking-wide">
                            ACOMPANHAMENTOS:
                          </div>
                          <div className="grid grid-cols-1 gap-1 pl-1">
                            {toppings.map((t: any, tIdx: number) => (
                              <div
                                key={t.id || tIdx}
                                className="flex items-center gap-1.5 text-[11.5px] font-bold"
                              >
                                <span className="font-mono font-black text-xs leading-none">[ ]</span>
                                <span className="leading-tight">{t.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Observações do Item em Caixa de Alto Contraste */}
                      {it.notes && (
                        <div className="mx-1 mt-1 p-1 border border-black bg-zinc-50 text-[10px] font-black">
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
                <div className="p-1.5 border-2 border-black bg-zinc-50 text-[10.5px] font-black space-y-0.5">
                  <div className="underline uppercase tracking-wider text-[9px]">
                    *** OBSERVAÇÃO GERAL DO PEDIDO ***
                  </div>
                  <div>{order.notes}</div>
                </div>
              </>
            )}

            <div className="border-t border-dashed border-black my-2" />

            {/* Rodapé da Comanda */}
            <div className="text-center text-[8.5px] uppercase tracking-wider text-zinc-700 font-bold space-y-0.5">
              <div>--- FIM DO PEDIDO #{formattedTicket} ---</div>
              <div className="text-[7.5px] font-normal text-zinc-500">
                Açaí da Rose · Sistema de Produção
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
