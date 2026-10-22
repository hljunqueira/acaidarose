'use client'

import React, { useEffect, useState, use } from 'react'
import { formatCurrency, formatDateTime, formatOrderNumber } from '@/lib/i18n/formatters'
import { QRCodeSVG } from 'qrcode.react'
import { generateOrderReceiptUrl } from '@/lib/services/qrCodeService'
import { getPublicStoreName } from '@/lib/stores/franchiseStore'
import CustomerRatingModal from '@/components/menu/CustomerRatingModal'
import { Star, Printer, ChefHat, Receipt, X } from 'lucide-react'
import { formatPaymentMethodPT } from '@/lib/printers/escposBuilder'

export default function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [data, setData] = useState<any>(null)
  const [err, setErr] = useState<string | null>(null)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [activeLayout, setActiveLayout] = useState<'FULL_RECEIPT' | 'KITCHEN_SLIP'>('FULL_RECEIPT')

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error)
        setData(d)

        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search)
          const layoutParam = params.get('layout')?.toUpperCase()
          if (layoutParam === 'KITCHEN' || layoutParam === 'KITCHEN_SLIP' || layoutParam === 'COZINHA') {
            setActiveLayout('KITCHEN_SLIP')
          }

          // Apenas dispara window.print() automaticamente se o parâmetro ?print=true foi passado explicitamente
          // Evita abrir popup de impressão no telemóvel do cliente que apenas escaneou o QR code
          if (params.get('print') === 'true') {
            setTimeout(() => window.print(), 500)
          }
        }
      })
      .catch((e) => setErr(e.message))
  }, [id])

  if (err) return <div className="p-8 text-center text-red-600 font-bold">Erro: {err}</div>
  if (!data) return <div className="p-8 text-center text-muted-foreground text-sm">A carregar talão...</div>

  const { order, tenant } = data
  const receiptUrl = generateOrderReceiptUrl(order.id)
  const cleanStoreName = getPublicStoreName(tenant)
  const formattedTicket = formatOrderNumber(order.orderNumber)
  const isTakeaway = Boolean(order.isTakeaway || order.consumptionType === 'TAKEAWAY')
  const isTable = Boolean(order.tableNumber)
  const isPaid = order.paymentStatus === 'PAID'
  const bagQty = typeof order.bagQuantity === 'number' ? order.bagQuantity : (order.needBag ? 1 : 0)
  const bagTotalFee = order.bagFee ? Number(order.bagFee).toFixed(2) : (bagQty * 0.10).toFixed(2)

  const items = Array.isArray(order.items) ? order.items : []
  const foodItems = items.filter((it: any) => !it.isBagItem && it.id !== 'bag-item' && it.containerId !== 'saco-transporte')

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6 flex flex-col items-center print:bg-white print:p-0">
      {/* CSS Estrito de Impressão Térmica: Elimina Quebra de Página e Separação de QR Code */}
      <style jsx global>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          html, body {
            overflow: visible !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            width: 80mm !important;
          }
          .no-print {
            display: none !important;
          }
          .receipt-ticket {
            width: 74mm !important;
            max-width: 74mm !important;
            margin: 0 auto !important;
            padding: 2mm 1mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            border: none !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            height: auto !important;
            overflow: visible !important;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .receipt-ticket * {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .qr-code-section {
            page-break-before: avoid !important;
            break-before: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Barra de Controlo Superior (Não Sai na Impressão) */}
      <div className="no-print mb-4 w-full max-w-[80mm] flex flex-col gap-2">
        <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-purple-200 flex items-center justify-between text-xs font-bold">
          <span className="text-gray-600">Modelo:</span>
          <div className="flex gap-1 bg-gray-100 p-0.5 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveLayout('FULL_RECEIPT')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                activeLayout === 'FULL_RECEIPT'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              <Receipt className="h-3 w-3" />
              <span>Caixa (Foto 2)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveLayout('KITCHEN_SLIP')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                activeLayout === 'KITCHEN_SLIP'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              <ChefHat className="h-3 w-3" />
              <span>Cozinha (Foto 1)</span>
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Imprimir Talão</span>
          </button>
          <button
            type="button"
            onClick={() => window.close()}
            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold text-xs cursor-pointer flex items-center gap-1"
          >
            <X className="h-3.5 w-3.5" />
            <span>Fechar</span>
          </button>
        </div>
      </div>

      {/* CONTAINER DO TALÃO TÉRMICO (74mm no papel de 80mm contínuo) */}
      <div className="receipt-ticket bg-white shadow-lg print:shadow-none w-[80mm] p-4 font-mono text-[13px] leading-tight border print:border-none">
        {order.status === 'CANCELLED' && (
          <div className="text-center bg-red-100 border-2 border-red-500 rounded py-1 mb-2 font-black text-red-700">
            ★ COMANDA ANULADA ★
          </div>
        )}

        {/* ========================================================= */}
        {/* LAYOUT 1: COMANDA DE PRODUÇÃO / COZINHA (FOTO 1)           */}
        {/* ========================================================= */}
        {activeLayout === 'KITCHEN_SLIP' ? (
          <div>
            {/* Cabeçalho Compacto da Cozinha */}
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

            {/* Identificação de Comanda e Horário */}
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
                {isTakeaway
                  ? '>>> PARA LEVAR (TAKEAWAY) <<<'
                  : isTable
                  ? `>>> CONSUMO NO LOCAL (MESA ${order.tableNumber}) <<<`
                  : '>>> CONSUMO NO LOCAL (BALCÃO) <<<'}
              </div>

              {/* Saco de Transporte */}
              <div className={`border border-black py-1 px-2 text-center font-black text-[10.5px] uppercase ${bagQty > 0 ? 'bg-zinc-200' : 'bg-zinc-50'}`}>
                {bagQty > 0 ? (
                  <span>SACO DE TRANSPORTE: {bagQty}X ({bagTotalFee}€) · [✓ DISPENSAR {bagQty} UNID.]</span>
                ) : (
                  <span>SACO: NÃO DISPENSADO (0 UNID.)</span>
                )}
              </div>

              {/* Dados do Cliente e Pagamento */}
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

            {/* SEÇÃO PRINCIPAL: ITENS PARA PREPARAÇÃO (CHECKLIST) */}
            <div className="text-[10px] font-black uppercase tracking-wider pb-1 border-b border-black flex justify-between px-0.5">
              <span>ITENS PARA PREPARAÇÃO</span>
              <span>QTD: {foodItems.length}</span>
            </div>

            <div className="divide-y divide-dashed divide-zinc-400">
              {foodItems.map((it: any, idx: number) => {
                const bases = it.bases || []
                const toppings = it.toppings || []

                return (
                  <div key={it.id || idx} className="py-2 space-y-1">
                    {/* Nome do Recipiente / Copo / Taça */}
                    <div className="border-2 border-black bg-zinc-100 p-1 font-black text-[13px] uppercase text-black tracking-tight flex items-start gap-1">
                      <span className="bg-black text-white px-1 py-0.2 text-xs font-black rounded-xs">
                        {it.quantity || 1}X
                      </span>
                      <span className="leading-snug flex-1">
                        {it.containerName || it.name || 'Item'}
                      </span>
                      {((it.packagingType === 'CAIXA' || it.containerFormat === 'CAIXA') || (it.containerName || '').toLowerCase().includes('caixa')) && (
                        <span className="bg-black text-white px-1.5 py-0.5 text-[11px] font-black rounded-xs whitespace-nowrap">
                          CAIXA TAKEAWAY
                        </span>
                      )}
                    </div>

                    {/* Bases e Cremes */}
                    {bases.length > 0 && (
                      <div className="pl-1 text-[11px] leading-tight text-black">
                        <span className="font-black underline">BASES:</span>{' '}
                        <span className="font-bold uppercase">
                          {bases.map((b: any) => typeof b === 'string' ? b : (b.name || b.title)).join(' + ')}
                        </span>
                      </div>
                    )}

                    {/* Acompanhamentos em Checklist Grande e Nítido */}
                    {toppings.length > 0 && (
                      <div className="pl-1 pt-0.5 space-y-0.5 text-black">
                        <div className="font-bold underline text-[9.5px] uppercase tracking-wide">
                          ACOMPANHAMENTOS:
                        </div>
                        <div className="grid grid-cols-1 gap-1 pl-1">
                          {toppings.map((t: any, tIdx: number) => {
                            const tName = typeof t === 'string' ? t : (t.name || t.title)
                            const tQty = typeof t === 'object' && t.quantity && t.quantity > 1 ? ` (${t.quantity}x)` : ''
                            return (
                              <div key={tIdx} className="flex items-center gap-1.5 text-[11.5px] font-bold">
                                <span className="font-mono font-black text-xs leading-none">[ ]</span>
                                <span className="leading-tight">{tName}{tQty}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Modificadores / Opções do Item */}
                    {(it.selectedOptions?.length > 0 || it.options?.length > 0) && (
                      <div className="pl-1 pt-0.5 space-y-0.5 text-black">
                        <div className="font-bold underline text-[9.5px] uppercase tracking-wide">
                          OPÇÕES:
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

                    {/* Observações */}
                    {(it.observations || it.notes) && (
                      <div className="pl-1 text-[10px] font-bold text-black border border-black bg-zinc-100 p-1 mt-0.5">
                        OBS: {it.observations || it.notes}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {order.notes && (
              <div className="border border-black bg-zinc-100 p-1.5 my-2 text-[10px] font-bold text-black">
                OBS GERAIS: {order.notes}
              </div>
            )}

            <div className="border-t border-dashed border-black my-2" />

            {/* QR Code de Autenticação / Conferência na Cozinha (Sem corte!) */}
            <div className="qr-code-section flex flex-col items-center py-2 text-center">
              <div className="p-1.5 bg-white border border-black mb-1">
                <QRCodeSVG value={receiptUrl} size={85} level="M" />
              </div>
              <span className="text-[9px] text-gray-700 font-bold">Conferência Balcão / Cozinha</span>
              <div className="text-[9px] text-gray-500 mt-0.5">Comanda de Produção Interna</div>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* LAYOUT 2: TALÃO COMPLETO DE CAIXA / CONFERÊNCIA (FOTO 2)   */
          /* ========================================================= */
          <div>
            {/* Cabeçalho Fiscal da Loja / Franquia */}
            <div className="text-center">
              <img src="/logo-oficial-1.png" alt="Açaí da Rose" className="mx-auto h-20 w-auto object-contain" />
              <div className="text-xs font-bold mt-1">{cleanStoreName}</div>
              {tenant?.nif && <div className="text-[11px]">NIF: {tenant.nif}</div>}
              {tenant?.address && <div className="text-[11px]">{tenant.address}</div>}
              {tenant?.phone && <div className="text-[11px]">Tel: {tenant.phone}</div>}
            </div>

            <div className="border-t border-dashed border-black my-2" />

            <div className="flex justify-between text-[11px]">
              <span>Comanda</span>
              <span className="font-bold">#{formattedTicket}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Data</span>
              <span>{formatDateTime(order.createdAt)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Consumo</span>
              <span className="font-black uppercase">
                {isTakeaway ? 'CONSUMO NO LOCAL (TAKEAWAY)' : isTable ? `CONSUMO NO LOCAL (MESA ${order.tableNumber})` : 'CONSUMO NO LOCAL'}
              </span>
            </div>
            {((order.bagQuantity && order.bagQuantity > 0) || isTakeaway) && (
              <div className="flex justify-between text-[11px]">
                <span>Saco de Transporte</span>
                <span className="font-black">
                  {order.bagQuantity > 0 ? `${order.bagQuantity}x (+${(order.bagQuantity * 0.10).toFixed(2)} €)` : '0 un (0,00 €)'}
                </span>
              </div>
            )}
            {order.cashierName && (
              <div className="flex justify-between text-[11px]">
                <span>Operador</span>
                <span>{order.cashierName}</span>
              </div>
            )}

            {(order.customerName || order.customerPhone) && (
              <>
                <div className="border-t border-dashed border-black my-1" />
                <div className="text-[11px] font-bold">Cliente</div>
                {order.customerName && <div className="text-[11px]">{order.customerName}</div>}
                {order.customerPhone && <div className="text-[11px]">Tel: {order.customerPhone}</div>}
              </>
            )}

            <div className="border-t border-dashed border-black my-2" />

            {/* Itens do Pedido */}
            {items.map((it: any, idx: number) => {
              const isBag = it.isBagItem || it.id === 'bag-item' || it.containerId === 'saco-transporte'
              if (isBag) {
                return (
                  <div key={it.id || idx} className="mb-2">
                    <div className="flex justify-between font-bold">
                      <span>{idx + 1}. Saco de Transporte ({it.quantity || 1}x)</span>
                      <span>{formatCurrency(it.lineTotal || 0.10)}</span>
                    </div>
                  </div>
                )
              }

              const isCaixa = ((it.packagingType === 'CAIXA' || it.containerFormat === 'CAIXA') || (it.containerName || '').toLowerCase().includes('caixa'))

              return (
                <div key={it.id || idx} className="mb-2">
                  <div className="flex justify-between font-bold">
                    <span>
                      {idx + 1}. {it.containerName || it.name || 'Item'}
                      {isCaixa && <span className="ml-1 uppercase text-[10px] font-black">[Caixa]</span>}
                    </span>
                    <span>{formatCurrency(it.containerPrice ?? it.unitPrice ?? it.lineTotal ?? 0)}</span>
                  </div>
                  {it.bases?.length > 0 && (
                    <div className="text-[11px] pl-3">
                      Bases: {it.bases.map((b: any) => typeof b === 'string' ? b : (b.name || b.title)).join(', ')}
                    </div>
                  )}
                  {it.toppings?.length > 0 && (() => {
                    const grouped: { id: string; name: string; isPremium: boolean; isPaid: boolean; precoCobrado: number; count: number }[] = []
                    for (const t of it.toppings) {
                      const tName = typeof t === 'string' ? t : (t.name || t.title)
                      const existing = grouped.find((g) => g.name?.toLowerCase() === tName.toLowerCase() && g.isPaid === t.isPaid)
                      if (existing) {
                        existing.count += (t.quantity || 1)
                        existing.precoCobrado += (t.precoCobrado || 0)
                      } else {
                        grouped.push({
                          id: t.id || tName,
                          name: tName,
                          isPremium: Boolean(t.isPremium),
                          isPaid: Boolean(t.isPaid),
                          precoCobrado: t.precoCobrado || 0,
                          count: t.quantity || 1,
                        })
                      }
                    }
                    return (
                      <div className="text-[11px] pl-3">
                        {grouped.map((t, tIdx) => (
                          <div key={t.id || tIdx} className="flex justify-between">
                            <span>+ {t.name}{t.count > 1 ? ` (${t.count}x)` : ''}{t.isPremium ? ' (Prem)' : ''}</span>
                            <span>{t.isPaid && t.precoCobrado > 0 ? formatCurrency(t.precoCobrado) : 'Grátis'}</span>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                  {(it.selectedOptions?.length > 0 || it.options?.length > 0) && (
                    <div className="text-[11px] pl-3">
                      {(it.selectedOptions || it.options).map((opt: any, optIdx: number) => (
                        <div key={optIdx} className="flex justify-between">
                          <span>• {opt.groupName ? `${opt.groupName}: ` : ''}{opt.name}</span>
                          {opt.price > 0 && <span>{formatCurrency(opt.price)}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  {it.observations && (
                    <div className="text-[11px] pl-3 italic text-gray-700">Obs: {it.observations}</div>
                  )}
                  {it.notes && (
                    <div className="text-[11px] pl-3 italic text-gray-700">Obs: {it.notes}</div>
                  )}
                  <div className="flex justify-between text-[11px] mt-1">
                    <span>Subtotal item</span>
                    <span className="font-bold">{formatCurrency(it.lineTotal)}</span>
                  </div>
                </div>
              )
            })}

            <div className="border-t border-dashed border-black my-2" />

            <div className="flex justify-between text-base font-black">
              <span>TOTAL</span>
              <span>{formatCurrency(order.total)}</span>
            </div>

            <div className="flex justify-between text-[11px] mt-1">
              <span>Pagamento</span>
              <span className="font-bold">{formatPaymentMethodPT(order.paymentMethod)}</span>
            </div>

            <div className="border-t border-dashed border-black my-2" />

            {/* QR Code de Autenticação / Avaliação no Rodapé (Sem corte!) */}
            <div className="qr-code-section flex flex-col items-center py-2 text-center">
              <div className="p-1.5 bg-white border border-black mb-1">
                <QRCodeSVG value={receiptUrl} size={85} level="M" />
              </div>
              <span className="text-[9px] text-gray-600">Conferência Balcão / Caixa</span>
            </div>

            <div className="text-center text-[10px] leading-tight">
              Documento não fiscal — apenas comprovativo interno.<br />
              Obrigado pela sua visita! 💜
            </div>
          </div>
        )}

        {/* Botão de Avaliação do Cliente (Apenas Visível em Tela) */}
        <div className="no-print mt-4 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => setFeedbackOpen(true)}
            className="w-full py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md hover:opacity-90 cursor-pointer"
          >
            <Star className="h-3.5 w-3.5 fill-white" />
            <span>Avaliar Atendimento da Loja</span>
          </button>
        </div>
      </div>

      <CustomerRatingModal
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        tenantId={order.tenantId}
        orderId={order.id}
        initialTable={order.tableNumber}
        initialCustomerName={order.customerName}
        initialCustomerPhone={order.customerPhone}
      />
    </div>
  )
}
