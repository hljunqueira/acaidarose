'use client'

import React, { useState } from 'react'
import { RestaurantTable } from '@/types/tables'
import { CartItem } from '@/types'
import { formatCurrency } from '@/lib/i18n/formatters'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import SplitBillDialog from './SplitBillDialog'
import PaymentModal from './PaymentModal'
import TableThermalReceiptDialog from './TableThermalReceiptDialog'
import { ArrowLeft, Printer, Utensils, Receipt, Split, CheckCircle2, Eye, Trash2 } from 'lucide-react'
import { broadcastTVCall } from '@/lib/utils/tvBroadcast'

interface TableCheckoutDetailProps {
  table: RestaurantTable
  allTables: RestaurantTable[]
  storePhone?: string | null
  onBack: () => void
  onSelectOtherTable: (t: RestaurantTable) => void
  onAddMoreItems: () => void
  onTableUpdated: () => void
}

export default function TableCheckoutDetail({
  table,
  allTables,
  storePhone,
  onBack,
  onSelectOtherTable,
  onAddMoreItems,
  onTableUpdated,
}: TableCheckoutDetailProps) {
  const [transferOpen, setTransferOpen] = useState(false)
  const [targetTableId, setTargetTableId] = useState('')
  const [splitBillOpen, setSplitBillOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<any | null>(null)

  // Modal de Cupom Térmico / Pré-Conta / Ficha de Produção
  const [thermalReceiptOpen, setThermalReceiptOpen] = useState(false)
  const [thermalType, setThermalType] = useState<'PRE_CONTA' | 'FICHA_PRODUCAO'>('PRE_CONTA')

  const items = table.items || []
  const total = table.total || items.reduce((acc, it) => acc + (it.lineTotal || 0), 0)
  const occupiedTables = allTables.filter((t) => t.status === 'OCCUPIED')
  const availableTargetTables = allTables.filter((t) => t.id !== table.id)

  const handleTransfer = async () => {
    if (!targetTableId) {
      toast.error('Selecione a mesa de destino')
      return
    }

    try {
      const res = await fetch('/api/tables/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromTableId: table.id,
          toTableId: targetTableId,
        }),
      })

      if (!res.ok) throw new Error('Falha ao transferir itens')
      toast.success('Itens transferidos para a nova mesa!')
      setTransferOpen(false)
      onTableUpdated()
      onBack()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao transferir')
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    const updatedItems = items.filter((it) => it.id !== itemId)
    const newTotal = updatedItems.reduce((acc, it) => acc + (it.lineTotal || 0), 0)

    try {
      if (updatedItems.length === 0) {
        await fetch(`/api/tables/${table.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'CLOSE' }),
        })
        toast.info(`Mesa ${table.number} desocupada.`)
        onTableUpdated()
        onBack()
      } else {
        await fetch(`/api/tables/${table.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: updatedItems, total: +newTotal.toFixed(2) }),
        })
        toast.success('Item removido da comanda!')
        onTableUpdated()
      }
    } catch {
      toast.error('Erro ao atualizar mesa')
    }
  }

  const handlePrintPreReceipt = () => {
    setThermalType('PRE_CONTA')
    setThermalReceiptOpen(true)
  }

  const handlePrintKitchen = () => {
    setThermalType('FICHA_PRODUCAO')
    setThermalReceiptOpen(true)
  }

  const handleFinalizePayment = async (method: any, customer: { name: string; phone: string }) => {
    setSubmitting(true)
    try {
      // 1. Gravar pedido como pago no histórico de comandas
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: table.tenantId,
          items: table.items,
          paymentMethod: method,
          customerName: customer.name || `Cliente Mesa ${table.number.toString().padStart(2, '0')}`,
          customerPhone: customer.phone,
          isTableOrder: true,
          tableNumber: `Mesa ${table.number.toString().padStart(2, '0')}`,
          status: 'PAID',
        }),
      })

      // 2. Liberar a mesa
      await fetch(`/api/tables/${table.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CLOSE' }),
      })

      // 3. Disparo automático da comanda para a impressora térmica pós-pagamento
      try {
        window.print()
      } catch {}

      toast.success(`Mesa ${table.number} recebida e comanda enviada para a impressora!`)
      setPaymentOpen(false)
      onTableUpdated()
      onBack()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao finalizar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Barra de Retorno */}
      <div className="flex items-center justify-between pb-3 border-b border-purple-100 dark:border-white/10">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="text-xs font-bold border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-950 dark:text-white gap-1.5 cursor-pointer rounded-xl h-9 shadow-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Voltar para Salão de Mesas</span>
        </Button>

        <div className="text-xs font-medium text-purple-800/80 dark:text-purple-200/80">
          Atendente Responsável: <span className="text-purple-950 dark:text-pink-300 font-black">{table.assignedStaffName || 'Geral'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Coluna Esquerda: Seletor Rápido de Mesas Ativas */}
        <div className="lg:col-span-2 space-y-2">
          <div className="text-[10px] font-black uppercase text-purple-800/80 dark:text-purple-200/90 px-1">
            Mesas Ativas ({occupiedTables.length})
          </div>
          <div className="space-y-2">
            {occupiedTables.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectOtherTable(t)}
                className={`w-full p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  t.id === table.id
                    ? 'bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 text-white border-purple-600 dark:border-pink-500 shadow-md font-black'
                    : 'bg-white dark:bg-white/5 text-purple-950 dark:text-white border-purple-200 dark:border-white/10 hover:border-purple-400 dark:hover:border-pink-500/40 font-bold hover:bg-purple-50 dark:hover:bg-white/10 shadow-xs'
                }`}
              >
                <div className="text-sm font-black">{t.number}</div>
                <div className="text-[10px] opacity-80 truncate">{t.nickname || `Mesa ${t.number}`}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Coluna Central: Comanda da Mesa */}
        <div className="lg:col-span-6 bg-white dark:bg-[#160228]/95 rounded-3xl border border-purple-150 dark:border-white/15 p-5 shadow-xs dark:shadow-xl flex flex-col justify-between text-slate-900 dark:text-white">
          <div>
            {/* Header da Mesa */}
            <div className="flex items-center justify-between pb-4 border-b border-purple-100 dark:border-white/10">
              <div>
                <h2 className="text-lg font-black text-purple-950 dark:text-white">
                  Mesa {table.number.toString().padStart(2, '0')}
                </h2>
                <span className="text-xs text-purple-700/70 dark:text-purple-200/70 font-medium">
                  Ativada às {table.activatedAt || '14:02'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const ticket = `Mesa ${table.number.toString().padStart(2, '0')}`
                    const firstCustomer = items.find((it: any) => it.customerName)?.customerName
                    broadcastTVCall({
                      ticket: `#M${table.number}`,
                      customerName: firstCustomer || ticket,
                      status: 'READY',
                    })
                    toast.success(`${ticket} chamada no Painel TV!`)
                  }}
                  className="text-xs bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-800 hover:to-pink-700 text-white font-bold cursor-pointer rounded-xl h-8.5 shadow-xs"
                >
                  <span>Chamar na TV</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTransferOpen(true)}
                  className="text-xs border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-950 dark:text-white font-bold cursor-pointer rounded-xl h-8.5 shadow-xs"
                >
                  <span>Transferir Itens</span>
                </Button>
              </div>
            </div>

            {/* Tabela de Itens Consumidos */}
            <div className="my-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-purple-100 dark:border-white/10 text-purple-800 dark:text-purple-200 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2">Qtde</th>
                    <th className="py-2">Item / Cliente</th>
                    <th className="py-2 text-right">Unit.</th>
                    <th className="py-2 text-right">Valor</th>
                    <th className="py-2 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100 dark:divide-white/10">
                  {items.map((item: any, idx) => (
                    <tr key={item.id || idx} className="hover:bg-purple-50/50 dark:hover:bg-white/5">
                      <td className="py-3 font-bold text-purple-700 dark:text-pink-300 font-mono">1x</td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-purple-950 dark:text-white">
                            {item.containerName || item.container?.name || 'Açaí Personalizado'}
                          </span>
                          {item.customerName && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded-md bg-purple-100 dark:bg-pink-950/60 border border-purple-200 dark:border-pink-500/40 text-[10px] font-bold text-purple-900 dark:text-pink-300">
                              {item.customerName}
                            </span>
                          )}
                          {item.paymentStatus === 'PAID' && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/40 text-[9px] font-extrabold text-emerald-800 dark:text-emerald-300">
                              ✓ Pago MB WAY
                            </span>
                          )}
                          {item.orderedAt && (
                            <span className="text-[10px] text-purple-700/60 dark:text-purple-300/60 font-mono">
                              {item.orderedAt}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-purple-700/80 dark:text-purple-200/70 mt-0.5">
                          {item.bases?.map((b: any) => b.name).join(', ')}
                          {item.toppings && item.toppings.length > 0 && ` + ${item.toppings.map((t: any) => t.name).join(', ')}`}
                        </div>
                      </td>
                      <td className="py-3 text-right text-purple-700/80 dark:text-purple-200/70 font-mono">
                        {formatCurrency(item.lineTotal || 0)}
                      </td>
                      <td className="py-3 text-right font-black text-purple-800 dark:text-pink-300 font-mono">
                        {formatCurrency(item.lineTotal || 0)}
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedItemForDetail(item)}
                            className="h-6 w-6 rounded-lg hover:bg-purple-100 dark:hover:bg-white/10 text-purple-700 dark:text-purple-300 inline-flex items-center justify-center cursor-pointer"
                            title="Ver detalhes dos acompanhamentos"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="h-6 w-6 rounded-full hover:bg-red-500/20 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 inline-flex items-center justify-center cursor-pointer"
                            title="Remover item da mesa"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={onAddMoreItems}
            className="w-full h-10 border-dashed border-purple-200 dark:border-white/20 bg-purple-50/50 dark:bg-white/5 hover:bg-purple-100/70 dark:hover:bg-white/10 text-purple-950 dark:text-white font-bold text-xs cursor-pointer rounded-xl shadow-xs"
          >
            + Adicionar Mais Itens / Açaís
          </Button>
        </div>

        {/* Coluna Direita: Painel de Fechamento de Conta */}
        <div className="lg:col-span-4 bg-white dark:bg-[#160228]/95 rounded-3xl border border-purple-150 dark:border-white/15 p-5 shadow-xs dark:shadow-xl flex flex-col justify-between text-slate-900 dark:text-white">
          <div className="space-y-4">
            <div className="text-sm font-black text-purple-950 dark:text-white border-b border-purple-100 dark:border-white/10 pb-3">
              Fechamento de Conta
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-purple-800/80 dark:text-purple-200/80">
                <span>Valor Consumido:</span>
                <span className="font-bold text-purple-950 dark:text-white">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-purple-800/80 dark:text-purple-200/80">
                <span>Taxa de Serviço:</span>
                <span className="font-bold text-purple-950 dark:text-white">€ 0,00</span>
              </div>
            </div>

            {/* Total em Destaque */}
            <div className="pt-3 border-t border-dashed border-purple-200 dark:border-white/15 text-center">
              <div className="text-[11px] text-purple-700/80 dark:text-purple-200/70 font-bold uppercase">Total Consumido</div>
              <div className="text-3xl font-black text-purple-950 dark:text-white mt-1 font-mono">{formatCurrency(total)}</div>
            </div>
          </div>

          {/* Botões de Ação do Fechamento */}
          <div className="space-y-2.5 pt-4 border-t border-purple-100 dark:border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSplitBillOpen(true)}
              className="w-full text-xs font-bold border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-950 dark:text-white gap-1.5 cursor-pointer rounded-xl h-9 shadow-xs"
            >
              <Split className="h-3.5 w-3.5 text-purple-700 dark:text-pink-400" />
              <span>Dividir Conta (Split Bill)</span>
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrintPreReceipt}
                className="text-xs font-bold text-purple-950 dark:text-white border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 gap-1 cursor-pointer rounded-xl h-9 shadow-xs"
              >
                <Receipt className="h-3.5 w-3.5 text-purple-700 dark:text-pink-400" />
                <span>Pré-Conta</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handlePrintKitchen}
                className="text-xs font-bold text-purple-950 dark:text-white border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 gap-1 cursor-pointer rounded-xl h-9 shadow-xs"
              >
                <Printer className="h-3.5 w-3.5 text-purple-700 dark:text-pink-400" />
                <span>Ficha Copa</span>
              </Button>
            </div>

            {items.length > 0 && items.every((it: any) => it.paymentStatus === 'PAID') ? (
              /* Se todos os itens da mesa já foram pagos online via MB WAY */
              <Button
                type="button"
                disabled={submitting}
                onClick={async () => {
                  setSubmitting(true)
                  try {
                    await fetch(`/api/tables/${table.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'CLOSE' }),
                    })
                    toast.success(`Mesa ${table.number} desocupada e liberada com sucesso!`)
                    onTableUpdated()
                    onBack()
                  } catch {
                    toast.error('Erro ao liberar mesa')
                  } finally {
                    setSubmitting(false)
                  }
                }}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Liberar Mesa (Pago Online)</span>
              </Button>
            ) : (
              /* Se houver saldo pendente (lançado manualmente no caixa) */
              <Button
                type="button"
                onClick={() => setPaymentOpen(true)}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-md cursor-pointer"
              >
                Receber e Finalizar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Transferência */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black">
              Transferir Itens da Mesa {table.number}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 my-3">
            <label className="text-xs font-bold">Selecione a Mesa de Destino:</label>
            <select
              value={targetTableId}
              onChange={(e) => setTargetTableId(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border bg-background text-xs font-bold cursor-pointer"
            >
              <option value="">Escolha a mesa...</option>
              {availableTargetTables.map((t) => (
                <option key={t.id} value={t.id}>
                  Mesa {t.number} ({t.nickname || (t.status === 'AVAILABLE' ? 'Livre' : 'Ocupada')})
                </option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setTransferOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleTransfer} className="bg-purple-700 text-white font-bold cursor-pointer">
              Confirmar Transferência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Divisão de Conta */}
      <SplitBillDialog
        open={splitBillOpen}
        onOpenChange={setSplitBillOpen}
        total={total}
        tableNumber={table.number}
        onConfirmSplit={() => {
          setPaymentOpen(true)
        }}
      />

      {/* Modal de Pagamento com Troco */}
      <PaymentModal
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        total={total}
        storePhone={storePhone}
        submitting={submitting}
        onPay={handleFinalizePayment}
      />

      {/* Modal de Detalhes do Item da Mesa (Raio-X de Ingredientes) */}
      <Dialog open={Boolean(selectedItemForDetail)} onOpenChange={(open) => !open && setSelectedItemForDetail(null)}>
        <DialogContent className="w-[95vw] sm:w-full max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-5 bg-white dark:bg-[#160228] text-slate-900 dark:text-white border border-purple-150 dark:border-white/20 rounded-3xl">
          <DialogHeader className="pb-3 border-b border-purple-100 dark:border-white/10 text-left">
            <DialogTitle className="text-base font-black text-purple-950 dark:text-white">
              {selectedItemForDetail?.containerName || selectedItemForDetail?.container?.name || 'Açaí Personalizado'}
            </DialogTitle>
            <p className="text-xs text-purple-700/80 dark:text-purple-200/70 font-semibold">
              Mesa {table.number} · Cliente: <strong>{selectedItemForDetail?.customerName || 'Mesa'}</strong>
            </p>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            {/* Bases */}
            {selectedItemForDetail?.bases && selectedItemForDetail.bases.length > 0 && (
              <div className="p-3 rounded-2xl bg-purple-50/60 dark:bg-white/5 border border-purple-100 dark:border-white/10 space-y-1">
                <div className="text-[10px] font-black uppercase text-purple-700 dark:text-pink-300 tracking-wider">
                  Bases & Cremes Selecionados
                </div>
                <div className="font-bold text-purple-950 dark:text-white">
                  {selectedItemForDetail.bases.map((b: any) => b.name).join(', ')}
                </div>
              </div>
            )}

            {/* Toppings / Frutas / Caldas */}
            {selectedItemForDetail?.toppings && selectedItemForDetail.toppings.length > 0 && (
              <div className="p-3 rounded-2xl bg-purple-50/60 dark:bg-white/5 border border-purple-100 dark:border-white/10 space-y-1">
                <div className="text-[10px] font-black uppercase text-purple-700 dark:text-pink-300 tracking-wider">
                  Acompanhamentos / Frutas / Caldas
                </div>
                <div className="font-bold text-purple-950 dark:text-white">
                  {selectedItemForDetail.toppings.map((t: any) => t.name).join(', ')}
                </div>
              </div>
            )}

            {/* Observações */}
            {selectedItemForDetail?.notes && (
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-950 dark:text-amber-200 italic">
                <b>Observação:</b> {selectedItemForDetail.notes}
              </div>
            )}

            <div className="flex items-center justify-between p-3 rounded-2xl bg-purple-100/50 dark:bg-white/5 font-black text-sm">
              <span>Valor do Item:</span>
              <span className="text-purple-950 dark:text-pink-300 font-mono">
                {formatCurrency(selectedItemForDetail?.lineTotal || 0)}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={() => setSelectedItemForDetail(null)}
              className="w-full bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-800 hover:to-pink-700 text-white font-bold text-xs rounded-xl"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Cupom Térmico Não Fiscal 80mm */}
      <TableThermalReceiptDialog
        open={thermalReceiptOpen}
        onOpenChange={setThermalReceiptOpen}
        table={table}
        type={thermalType}
        storePhone={storePhone}
      />
    </div>
  )
}
