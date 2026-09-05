'use client'

import React, { useEffect, useState, use } from 'react'
import { formatCurrency, formatDateTime, formatOrderNumber } from '@/lib/i18n/formatters'
import { QRCodeSVG } from 'qrcode.react'
import { generateOrderReceiptUrl } from '@/lib/services/qrCodeService'

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
          <img src="/logo-oficial.png" alt="Açaí da Rose" className="mx-auto h-20 w-auto" />
          <div className="text-xs font-bold mt-1">{tenant?.name || 'Açaí da Rose'}</div>
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
        {order.items.map((it: any, idx: number) => (
          <div key={it.id} className="mb-2">
            <div className="flex justify-between font-bold">
              <span>{idx + 1}. {it.containerEmoji} {it.containerName}</span>
              <span>{formatCurrency(it.containerPrice)}</span>
            </div>
            <div className="text-[11px] pl-3">Bases: {it.bases.map((b: any) => b.name).join(', ')}</div>
            {it.toppings?.length > 0 && (
              <div className="text-[11px] pl-3">
                {it.toppings.map((t: any) => (
                  <div key={t.id} className="flex justify-between">
                    <span>+ {t.name}{t.isPremium ? ' (Premium)' : ''}</span>
                    <span>{t.isPaid ? formatCurrency(t.precoCobrado) : 'Grátis'}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between text-[11px] mt-1">
              <span>Subtotal item</span>
              <span className="font-bold">{formatCurrency(it.lineTotal)}</span>
            </div>
          </div>
        ))}

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

        <div className="no-print mt-4 flex gap-2 justify-center">
          <button onClick={() => window.print()} className="px-3 py-1.5 bg-purple-600 text-white rounded font-bold text-xs">
            Imprimir
          </button>
          <button onClick={() => window.close()} className="px-3 py-1.5 bg-gray-200 rounded font-bold text-xs">
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
