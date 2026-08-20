'use client'
import { useEffect, useState } from 'react'
import { use } from 'react'

const euro = (n) => `€ ${(Number(n) || 0).toFixed(2).replace('.', ',')}`
const METHODS = { NUMERARIO: 'Numerário', MULTIBANCO: 'Multibanco', MB_WAY: 'MB Way', PLATAFORMA: 'Plataforma externa' }

export default function ReceiptPage({ params }) {
  const { id } = use(params)
  const [data, setData] = useState(null)
  const [err, setErr] = useState(null)

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

  if (err) return <div className="p-8 text-center text-red-600">Erro: {err}</div>
  if (!data) return <div className="p-8 text-center text-muted-foreground">A carregar recibo...</div>

  const { order, tenant } = data

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex justify-center print:bg-white print:p-0">
      <style jsx global>{`
        @media print {
          @page { size: 80mm auto; margin: 4mm; }
          body { background: white; }
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="bg-white shadow-lg print:shadow-none w-[80mm] p-4 font-mono text-[13px] leading-tight">
        <div className="text-center">
          <img src="/logo.png" alt="Açaí da Rose" className="mx-auto h-20 w-auto" />
          <div className="text-[11px] mt-1">{tenant?.name}</div>
          {tenant?.nif && <div className="text-[11px]">NIF: {tenant.nif}</div>}
          {tenant?.address && <div className="text-[11px]">{tenant.address}</div>}
          {tenant?.phone && <div className="text-[11px]">Tel: {tenant.phone}</div>}
        </div>
        <div className="border-t border-dashed border-black my-2" />
        {order.status === 'CANCELLED' && (
          <div className="text-center bg-red-100 border-2 border-red-500 rounded py-1 my-2 font-extrabold text-red-700">
            ★ COMANDA ANULADA ★
          </div>
        )}
        <div className="flex justify-between text-[11px]">
          <span>Comanda</span><span className="font-bold">#{String(order.orderNumber).padStart(3, '0')}</span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span>Data</span><span>{new Date(order.createdAt).toLocaleString('pt-PT')}</span>
        </div>
        {order.cashierName && (
          <div className="flex justify-between text-[11px]">
            <span>Operador</span><span>{order.cashierName}</span>
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
        {order.items.map((it, idx) => (
          <div key={it.id} className="mb-2">
            <div className="flex justify-between font-bold">
              <span>{idx + 1}. {it.containerEmoji} {it.containerName}</span>
              <span>{euro(it.containerPrice)}</span>
            </div>
            <div className="text-[11px] pl-3">Bases: {it.bases.map((b) => b.name).join(', ')}</div>
            {it.toppings?.length > 0 && (
              <div className="text-[11px] pl-3">
                {it.toppings.map((t) => (
                  <div key={t.id} className="flex justify-between">
                    <span>+ {t.name}{t.isPremium ? ' (Premium)' : ''}</span>
                    <span>{t.isPaid ? euro(t.precoCobrado) : 'Grátis'}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between text-[11px] mt-1">
              <span>Subtotal item</span><span className="font-bold">{euro(it.lineTotal)}</span>
            </div>
          </div>
        ))}
        <div className="border-t border-dashed border-black my-2" />
        <div className="flex justify-between text-lg font-extrabold">
          <span>TOTAL</span><span>{euro(order.total)}</span>
        </div>
        <div className="flex justify-between text-[11px] mt-1">
          <span>Pagamento</span><span className="font-bold">{METHODS[order.paymentMethod] || order.paymentMethod}</span>
        </div>
        <div className="border-t border-dashed border-black my-2" />
        {order.status === 'CANCELLED' && (
          <div className="mb-2 text-center bg-red-50 border border-red-300 rounded p-2 text-[11px] text-red-700">
            <div className="font-extrabold">COMANDA ANULADA</div>
            {order.cancelReason && <div className="mt-0.5">Motivo: {order.cancelReason}</div>}
            {order.cancelledByName && <div>Por: {order.cancelledByName}</div>}
          </div>
        )}
        <div className="text-center text-[10px]">
          Documento não fiscal — apenas comprovativo interno.<br/>
          O pagamento foi processado no TPA físico.
        </div>
        <div className="text-center text-[11px] mt-3">Obrigado pela sua visita! 💜</div>

        <div className="no-print mt-6 flex gap-2 justify-center">
          <button onClick={() => window.print()} className="px-4 py-2 bg-purple-600 text-white rounded font-bold text-sm">Imprimir</button>
          <button onClick={() => window.close()} className="px-4 py-2 bg-gray-200 rounded font-bold text-sm">Fechar</button>
        </div>
      </div>
    </div>
  )
}
