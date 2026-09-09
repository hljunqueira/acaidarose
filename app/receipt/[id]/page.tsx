'use client'

import React, { useEffect, useState, use } from 'react'
import { formatCurrency, formatDateTime, formatOrderNumber } from '@/lib/i18n/formatters'
import { QRCodeSVG } from 'qrcode.react'
import { generateOrderReceiptUrl } from '@/lib/services/qrCodeService'
import { getPublicStoreName } from '@/lib/stores/franchiseStore'
import CustomerRatingModal from '@/components/menu/CustomerRatingModal'
import { Star } from 'lucide-react'

const METHODS: Record<string, string> = {
  NUMERARIO: 'Numerário',
  MULTIBANCO: 'Multibanco (TPA)',
  MB_WAY: 'MB Way',
  PLATAFORMA: 'Plataforma externa',
}

export default function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [data, setData] = useState<any>(null)
  const [err, setErr] = useState<string | null>(null)
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error)
        setData(d)
        setTimeout(() => window.print(), 400)
      })
      .catch((e) => setErr(e.message))
  }, [id])

  if (err) return <div className="p-8 text-center text-red-600 font-bold">Erro: {err}</div>
  if (!data) return <div className="p-8 text-center text-muted-foreground text-sm">A carregar talão...</div>

  const { order, tenant } = data
  const receiptUrl = generateOrderReceiptUrl(order.id)

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6 flex justify-center print:bg-white print:p-0">
      <style jsx global>{`
        @media print {
          @page { size: 80mm auto; margin: 4mm; }
          body { background: white; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="bg-white shadow-lg print:shadow-none w-[80mm] p-4 font-mono text-[13px] leading-tight border print:border-none">
        {/* Cabeçalho da Loja / Franquia */}
        <div className="text-center">
          <img src="/logo-oficial-1.png" alt="Açaí da Rose" className="mx-auto h-20 w-auto" />
          <div className="text-xs font-bold mt-1">{getPublicStoreName(tenant)}</div>
          {tenant?.nif && <div className="text-[11px]">NIF: {tenant.nif}</div>}
          {tenant?.address && <div className="text-[11px]">{tenant.address}</div>}
          {tenant?.phone && <div className="text-[11px]">Tel: {tenant.phone}</div>}
        </div>

        <div className="border-t border-dashed border-black my-2" />

        {order.status === 'CANCELLED' && (
          <div className="text-center bg-red-100 border-2 border-red-500 rounded py-1 my-2 font-black text-red-700">
            ★ COMANDA ANULADA ★
          </div>
        )}

        <div className="flex justify-between text-[11px]">
          <span>Comanda</span>
          <span className="font-bold">{formatOrderNumber(order.orderNumber)}</span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span>Data</span>
          <span>{formatDateTime(order.createdAt)}</span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span>Consumo</span>
          <span className="font-black uppercase">
            {order.isTakeaway || order.consumptionType === 'TAKEAWAY' ? 'Levar para Casa (Takeaway)' : 'Consumo no Local'}
          </span>
        </div>
        {((order.bagQuantity && order.bagQuantity > 0) || order.isTakeaway || order.consumptionType === 'TAKEAWAY') && (
          <div className="flex justify-between text-[11px]">
            <span>Saco de Transporte</span>
            <span className="font-black">
              {order.bagQuantity > 0 ? `${order.bagQuantity}x (+${(order.bagQuantity * 0.10).toFixed(2)}€)` : '0 un (0,00€)'}
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

        {/* Itens da Comanda */}
        {order.items.map((it: any, idx: number) => {
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

          return (
            <div key={it.id || idx} className="mb-2">
              <div className="flex justify-between font-bold">
                <span>
                  {idx + 1}. {it.containerName || 'Taça'}
                  {((it.packagingType === 'CAIXA' || it.containerFormat === 'CAIXA') || (it.containerName || '').toLowerCase().includes('caixa')) && (
                    <span className="ml-1 uppercase text-[10px] font-black">[Caixa Takeaway]</span>
                  )}
                </span>
                <span>{formatCurrency(it.containerPrice || it.unitPrice || 0)}</span>
              </div>
              {it.bases?.length > 0 && (
                <div className="text-[11px] pl-3">Bases: {it.bases.map((b: any) => b.name).join(', ')}</div>
              )}
              {it.toppings?.length > 0 && (() => {
                const grouped: { id: string; name: string; isPremium: boolean; isPaid: boolean; precoCobrado: number; count: number }[] = []
                for (const t of it.toppings) {
                  const existing = grouped.find((g) => g.name?.toLowerCase() === (t.name || '').toLowerCase() && g.isPaid === t.isPaid)
                  if (existing) {
                    existing.count += (t.quantity || 1)
                    existing.precoCobrado += (t.precoCobrado || 0)
                  } else {
                    grouped.push({
                      id: t.id,
                      name: t.name,
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
                        <span>+ {t.name}{t.count > 1 ? ` (${t.count}x)` : ''}{t.isPremium ? ' (Premium)' : ''}</span>
                        <span>{t.isPaid ? formatCurrency(t.precoCobrado) : 'Grátis'}</span>
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
          <span className="font-bold">{METHODS[order.paymentMethod] || order.paymentMethod}</span>
        </div>

        <div className="border-t border-dashed border-black my-2" />

        {/* QR Code de Autenticação / Conferência na Cozinha */}
        <div className="flex flex-col items-center py-2 text-center">
          <div className="p-1.5 bg-white border border-black mb-1">
            <QRCodeSVG value={receiptUrl} size={90} level="M" />
          </div>
          <span className="text-[9px] text-gray-600">Conferência Balcão / Cozinha</span>
        </div>

        <div className="text-center text-[10px] leading-tight">
          Documento não fiscal — apenas comprovativo interno.<br />
          Obrigado pela sua visita! 💜
        </div>

        <div className="no-print mt-4 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => setFeedbackOpen(true)}
            className="w-full py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded font-bold text-xs flex items-center justify-center gap-1.5 shadow-md hover:opacity-90"
          >
            <Star className="h-3.5 w-3.5 fill-white" />
            <span>Avaliar Atendimento da Loja</span>
          </button>

          <div className="flex gap-2 w-full justify-center">
            <button onClick={() => window.print()} className="flex-1 px-3 py-1.5 bg-purple-600 text-white rounded font-bold text-xs">
              Imprimir
            </button>
            <button onClick={() => window.close()} className="flex-1 px-3 py-1.5 bg-gray-200 rounded font-bold text-xs">
              Fechar
            </button>
          </div>
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
