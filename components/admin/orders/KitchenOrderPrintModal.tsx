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
  const foodItems = items.filter((it: any) => !it.isBagItem && it.id !== 'bag-item' && it.containerId !== 'saco-transporte')
  const formattedTicket = String(order.orderNumber || 1).padStart(3, '0')
  const cleanStoreName = getPublicStoreName(null, storeName)
  const isTakeawayOrder = order.isTakeaway || order.consumptionType === 'TAKEAWAY'
  const bagQty = typeof order.bagQuantity === 'number' ? order.bagQuantity : (order.needBag ? 1 : 0)
  const bagTotalFee = order.bagFee ? Number(order.bagFee).toFixed(2) : (bagQty * 0.10).toFixed(2)

  // Impressão Térmica Direta via Mount no Body:
  // Ao clonar o conteúdo diretamente para um elemento filho direto de <body> (#kitchen-print-mount),
  // eliminamos qualquer interferência de modais, portais Radix, overflow-y ou transforms.
  const handlePrint = () => {
    const printEl = document.getElementById('kitchen-order-print')
    if (!printEl) {
      window.print()
      return
    }

    // Limpa qualquer iframe residual antigo
    const oldIframe = document.getElementById('thermal-print-frame')
    if (oldIframe) oldIframe.remove()

    let mount = document.getElementById('kitchen-print-mount')
    if (!mount) {
      mount = document.createElement('div')
      mount.id = 'kitchen-print-mount'
      document.body.appendChild(mount)
    }

    mount.innerHTML = printEl.innerHTML

    // Dispara a impressão nativa
    window.print()
  }

  // Sincroniza o mount sempre que o modal estiver aberto
  React.useEffect(() => {
    if (!open) {
      const mount = document.getElementById('kitchen-print-mount')
      if (mount) mount.remove()
      return
    }

    const timer = setTimeout(() => {
      const printEl = document.getElementById('kitchen-order-print')
      if (printEl) {
        let mount = document.getElementById('kitchen-print-mount')
        if (!mount) {
          mount = document.createElement('div')
          mount.id = 'kitchen-print-mount'
          document.body.appendChild(mount)
        }
        mount.innerHTML = printEl.innerHTML
      }
    }, 100)

    return () => {
      clearTimeout(timer)
      const mount = document.getElementById('kitchen-print-mount')
      if (mount) mount.remove()
    }
  }, [open, order])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-zinc-100 dark:bg-[#160228] border border-purple-200 dark:border-white/20 rounded-2xl shadow-2xl z-[70]">
        <DialogHeader className="sr-only">
          <DialogTitle>Comanda de Produção — Cozinha</DialogTitle>
        </DialogHeader>

        {/* CSS Estrito para Impressão Térmica de 80mm */}
        <style jsx global>{`
          /* Em tela normal: o mount fica invisível */
          #kitchen-print-mount {
            display: none;
          }

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
              background: #ffffff !important;
              color: #000000 !important;
              width: 80mm !important;
            }
            /* Oculta tudo que é filho do body, exceto o nosso mount direto */
            body > *:not(#kitchen-print-mount) {
              display: none !important;
            }
            /* Exibe estritamente o mount de 80mm no topo da bobina */
            #kitchen-print-mount {
              display: block !important;
              width: 74mm !important;
              margin: 0 auto !important;
              padding: 2mm 1mm !important;
              background: #ffffff !important;
              color: #000000 !important;
              position: static !important;
              overflow: visible !important;
              height: auto !important;
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #kitchen-print-mount * {
              visibility: visible !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
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

              {/* Box de Destino (Mesa ou Balcão / Takeaway) */}
              <div className="border-2 border-black py-1.5 px-2 text-center font-black text-sm uppercase bg-zinc-100 tracking-wide">
                {isTakeawayOrder
                  ? '>>> PARA LEVAR (TAKEAWAY) <<<'
                  : isTable
                  ? `>>> CONSUMO NO LOCAL (MESA ${order.tableNumber}) <<<`
                  : '>>> CONSUMO NO LOCAL (BALCÃO) <<<'}
              </div>

              {/* Informação Obrigatória do Saco de Transporte */}
              <div className={`border border-black py-1 px-2 text-center font-black text-[10.5px] uppercase ${bagQty > 0 ? 'bg-zinc-200' : 'bg-zinc-50'}`}>
                {bagQty > 0 ? (
                  <span>SACO DE TRANSPORTE: {bagQty}X ({bagTotalFee}€) · [✓ DISPENSAR {bagQty} UNID.]</span>
                ) : (
                  <span>SACO: NÃO DISPENSADO (0 UNID.)</span>
                )}
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
              <span>QTD: {foodItems.length}</span>
            </div>

            <div className="py-1 space-y-3">
              {foodItems.length > 0 ? (
                foodItems.map((it: any, idx: number) => {
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

                      {/* Modificadores / Opções do Item (Leite, Textura, etc.) */}
                      {(it.selectedOptions?.length > 0 || it.options?.length > 0) && (
                        <div className="pl-1 pt-0.5 space-y-0.5 text-black">
                          <div className="font-bold underline text-[9.5px] uppercase tracking-wide">
                            MODIFICADORES / OPÇÕES:
                          </div>
                          <div className="grid grid-cols-1 gap-1 pl-1">
                            {(it.selectedOptions || it.options).map((opt: any, optIdx: number) => {
                              const label = typeof opt === 'string' ? opt : opt.groupName ? `${opt.groupName}: ${opt.name}` : opt.name
                              return (
                                <div key={optIdx} className="flex items-center gap-1.5 text-[11.5px] font-bold">
                                  <span className="font-mono font-black text-xs leading-none">[ ]</span>
                                  <span className="leading-tight">{label}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Observações do Item em Caixa de Alto Contraste */}
                      {(it.notes || it.observations) && (
                        <div className="mx-1 mt-1 p-1 border border-black bg-zinc-50 text-[10px] font-black">
                          &gt;&gt; OBS: {it.notes || it.observations}
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
