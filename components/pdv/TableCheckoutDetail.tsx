'use client'

import React, { useState } from 'react'
import { RestaurantTable } from '@/types/tables'
import { CatalogData } from '@/types'
import { formatCurrency } from '@/lib/i18n/formatters'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import PaymentModal from './PaymentModal'
import TableThermalReceiptDialog from './TableThermalReceiptDialog'
import { ArrowLeft, Printer, Receipt, Trash2, Edit3, CheckCircle2 } from 'lucide-react'
import { broadcastTVCall } from '@/lib/utils/tvBroadcast'

interface TableCheckoutDetailProps {
  table: RestaurantTable
  allTables: RestaurantTable[]
  orders?: any[]
  catalog?: CatalogData
  storePhone?: string | null
  onBack: () => void
  onSelectOtherTable: (t: RestaurantTable) => void
  onAddMoreItems: () => void
  onTableUpdated: () => void
}

export default function TableCheckoutDetail({
  table,
  allTables,
  orders = [],
  catalog,
  storePhone,
  onBack,
  onSelectOtherTable,
  onAddMoreItems,
  onTableUpdated,
}: TableCheckoutDetailProps) {
  const [transferOpen, setTransferOpen] = useState(false)
  const [targetTableId, setTargetTableId] = useState('')
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Modal de Edição de Pedido em Preparo
  const [editingOrder, setEditingOrder] = useState<any | null>(null)
  const [editToppingsText, setEditToppingsText] = useState('')
  const [editNotes, setEditNotes] = useState('')

  // Modal de Cupom Térmico / Pré-Conta / Ficha de Produção
  const [thermalReceiptOpen, setThermalReceiptOpen] = useState(false)
  const [thermalType, setThermalType] = useState<'PRE_CONTA' | 'FICHA_PRODUCAO'>('PRE_CONTA')

  // Filtrar todos os pedidos ativos vinculados a esta mesa
  const tableOrders = orders.filter((o) => {
    const oTable = o.tableNumber ? String(o.tableNumber).replace(/^Mesa\s*/i, '').trim() : ''
    const isMatch = oTable === String(table.number)
    const isActive = o.status !== 'CANCELLED' && o.status !== 'REFUNDED'
    return isMatch && isActive
  })

  const isOrderPaid = (o: any) => {
    return (
      o.paymentStatus === 'PAID' ||
      o.payment_status === 'PAID' ||
      o.status === 'PAID' ||
      o.status === 'COMPLETED'
    )
  }

  // Se houver pedidos da tabela orders, calcula a partir deles; senão usa table.items
  const hasOrdersList = tableOrders.length > 0
  const ordersTotal = tableOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
  const tableItemsTotal = (table.items || []).reduce((acc, it) => acc + (it.lineTotal || 0), 0)
  const total = hasOrdersList ? ordersTotal : (table.total || tableItemsTotal)

  const isAllPaid = hasOrdersList
    ? tableOrders.every(isOrderPaid)
    : false

  const availableTargetTables = allTables.filter((t) => t.id !== table.id)

  const [blockModalOpen, setBlockModalOpen] = useState(false)
  const [blockReason, setBlockReason] = useState('Limpeza / Higienização')

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

  // Helper para obter o ticket oficial de um pedido
  const getOrderOfficialTicket = (order: any, idx?: number) => {
    if (order.ticketNumber) return order.ticketNumber
    if (order.orderNumber) return `#${String(order.orderNumber).padStart(3, '0')}`
    if (order.ticket_number) return order.ticket_number
    if (order.id) return `#${order.id.slice(-4).toUpperCase()}`
    return `#00${(idx || 0) + 1}`
  }

  // Chamar Pedido Específico na Smart TV com seu Ticket Oficial e Mesa
  const handleCallOrderOnTV = async (order: any, idx?: number) => {
    const officialTicket = getOrderOfficialTicket(order, idx)
    const customerName = order.customerName || `Mesa ${table.number}`

    broadcastTVCall({
      ticket: officialTicket,
      customerName: customerName,
      tableNumber: String(table.number),
      isQRCode: Boolean(order.isQRCode || order.channel === 'QR_CODE'),
      status: 'READY',
    })

    // Sincroniza também via endpoint backend API para Smart TVs externas
    fetch('/api/tv/call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticket: officialTicket,
        customerName: customerName,
        tableNumber: String(table.number),
        status: 'READY',
      }),
    }).catch(() => {})

    toast.success(`${customerName} (${officialTicket} - Mesa ${table.number}) chamado na Smart TV!`)
  }

  // Chamar Mesa Inteira na TV (usa o ticket do 1º pedido ativo)
  const handleCallTableOnTV = () => {
    const firstOrder = tableOrders[0]
    if (firstOrder) {
      handleCallOrderOnTV(firstOrder, 0)
    } else {
      const ticket = `#M${String(table.number).padStart(2, '0')}`
      broadcastTVCall({
        ticket,
        customerName: `Mesa ${table.number}`,
        tableNumber: String(table.number),
        status: 'READY',
      })
      toast.success(`Mesa ${table.number} chamada no Painel TV!`)
    }
  }

  // Bloquear Mesa por Motivo (Limpeza, Reserva, etc.)
  const handleBlockTable = async () => {
    setSubmitting(true)
    try {
      await fetch(`/api/tables/${table.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE',
          status: 'OCCUPIED',
          nickname: `🔒 ${blockReason}`,
        }),
      })
      toast.success(`Mesa ${table.number} bloqueada (${blockReason})`)
      setBlockModalOpen(false)
      onTableUpdated()
    } catch {
      toast.error('Erro ao bloquear mesa')
    } finally {
      setSubmitting(false)
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

  // Abrir Modal de Edição de Pedido em Preparação
  const handleOpenEditOrder = (order: any) => {
    setEditingOrder(order)
    const firstItem = order.items?.[0]
    const currentToppings = firstItem?.toppings?.map((t: any) => t.name || t).join(', ') || ''
    setEditToppingsText(currentToppings)
    setEditNotes(order.notes || firstItem?.notes || '')
  }

  // Salvar Edição do Pedido
  const handleSaveOrderEdit = async () => {
    if (!editingOrder) return
    setSubmitting(true)
    try {
      const updatedItems = Array.isArray(editingOrder.items) ? [...editingOrder.items] : []
      if (updatedItems.length > 0) {
        const toppingsArray = editToppingsText
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
          .map((name) => ({ name, price: 0 }))

        updatedItems[0] = {
          ...updatedItems[0],
          toppings: toppingsArray,
          notes: editNotes,
        }
      }

      const res = await fetch(`/api/orders/${editingOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: updatedItems,
          notes: editNotes,
        }),
      })

      if (!res.ok) throw new Error('Falha ao atualizar pedido')
      toast.success('Pedido atualizado na cozinha!')
      setEditingOrder(null)
      onTableUpdated()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar alterações')
    } finally {
      setSubmitting(false)
    }
  }

  // Cancelar / Excluir Pedido da Mesa
  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Deseja realmente cancelar este pedido?')) return
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })
      if (!res.ok) throw new Error('Falha ao cancelar pedido')
      toast.success('Pedido cancelado com sucesso!')
      onTableUpdated()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao cancelar')
    }
  }

  // Liberar / Concluir Mesa (quando já quitada)
  const handleClosePaidTable = async () => {
    setSubmitting(true)
    try {
      await fetch(`/api/tables/${table.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CLOSE' }),
      })
      toast.success(`Mesa ${table.number} liberada com sucesso!`)
      onTableUpdated()
      onBack()
    } catch {
      toast.error('Erro ao liberar mesa')
    } finally {
      setSubmitting(false)
    }
  }

  // Finalizar Pagamento no Caixa
  const handleFinalizePayment = async (method: any, customer: { name: string; phone: string }) => {
    setSubmitting(true)
    try {
      // 1. Gravar pedido como pago no histórico de comandas se necessário
      if (!hasOrdersList) {
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
            tableNumber: String(table.number),
            status: 'PAID',
          }),
        })
      } else {
        // Atualizar os pedidos pendentes da mesa para PAID
        for (const ord of tableOrders) {
          if (!isOrderPaid(ord)) {
            await fetch(`/api/orders/${ord.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'PAID', paymentMethod: method }),
            }).catch(() => {})
          }
        }
      }

      // 2. Liberar a mesa
      await fetch(`/api/tables/${table.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CLOSE' }),
      })

      toast.success(`Conta da Mesa ${table.number} recebida e finalizada!`)
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
      {/* Barra de Navegação Superior */}
      <div className="flex items-center justify-between pb-3 border-b border-purple-100 dark:border-white/10">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="text-xs font-bold border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-950 dark:text-white cursor-pointer rounded-xl h-9 shadow-xs"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          <span>Voltar para Salão de Mesas</span>
        </Button>

        <div className="text-xs font-semibold text-purple-900/70 dark:text-purple-300">
          Mesa <strong className="text-purple-950 dark:text-white">#{table.number}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Coluna Central: Pedidos da Mesa (QR Code e Balcão) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#160228]/95 rounded-3xl border border-purple-150 dark:border-white/15 p-5 shadow-xs dark:shadow-xl flex flex-col justify-between text-slate-900 dark:text-white">
          <div className="space-y-4">
            {/* Header da Mesa */}
            <div className="flex items-center justify-between pb-3 border-b border-purple-100 dark:border-white/10">
              <div>
                <h2 className="text-base sm:text-lg font-black text-purple-950 dark:text-white">
                  Pedidos da Mesa (QR Code e Balcão)
                </h2>
                <span className="text-xs text-purple-700/70 dark:text-purple-200/70 font-medium">
                  Mesa {table.number.toString().padStart(2, '0')} • {hasOrdersList ? `${tableOrders.length} pedido(s) registrado(s)` : 'Em atendimento'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCallTableOnTV}
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
                  <span>Transferir</span>
                </Button>
              </div>
            </div>

            {/* Lista de Pedidos da Mesa */}
            {hasOrdersList ? (
              <div className="space-y-3.5">
                {tableOrders.map((order: any, idx: number) => {
                  const paid = isOrderPaid(order)
                  const isPreparing = order.status === 'NEW' || order.status === 'PREPARING'
                  const isReady = order.status === 'READY'
                  const ticketNumber = getOrderOfficialTicket(order, idx)
                  const isQr = order.isQRCode || order.channel === 'QR_CODE'

                  return (
                    <div
                      key={order.id || idx}
                      className="p-4 rounded-2xl border border-purple-100 dark:border-white/10 bg-purple-50/30 dark:bg-white/[0.03] space-y-3 shadow-xs"
                    >
                      {/* Topo do Pedido: Cliente + Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-purple-100 dark:border-white/10">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black text-purple-950 dark:text-white">
                            {order.customerName || `Cliente ${idx + 1}`}
                          </span>
                          <span className="text-xs font-mono font-bold text-purple-700/80 dark:text-purple-300">
                            {ticketNumber}
                          </span>
                          <span className="text-[10px] text-purple-600 dark:text-purple-300/80 font-medium">
                            • {isQr ? 'Autoatendimento QR Code' : 'Lançado no Balcão'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {paid ? (
                            <Badge className="bg-emerald-600 text-white font-extrabold text-[9px] py-0.5 px-2 rounded-full border-0">
                              ✓ Pago MB WAY
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500 text-white font-extrabold text-[9px] py-0.5 px-2 rounded-full border-0">
                              A Pagar no Caixa
                            </Badge>
                          )}

                          {isPreparing && (
                            <Badge variant="outline" className="text-[9px] font-bold border-amber-300 text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40">
                              Em Preparação
                            </Badge>
                          )}
                          {isReady && (
                            <Badge className="bg-purple-700 text-white font-extrabold text-[9px]">
                              Pronto
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Lista de Itens do Pedido */}
                      <div className="space-y-2">
                        {Array.isArray(order.items) &&
                          order.items.map((item: any, itemIdx: number) => {
                            const containerName = item.containerName || item.container?.name || item.name || 'Taça de Açaí'
                            const basesStr = item.bases?.map((b: any) => b.name || b).join(', ')
                            const toppingsStr = item.toppings?.map((t: any) => t.name || t).join(', ')

                            return (
                              <div key={itemIdx} className="flex justify-between items-start text-xs">
                                <div>
                                  <div className="font-bold text-purple-950 dark:text-white">
                                    1x {containerName}
                                  </div>
                                  {basesStr && (
                                    <div className="text-[11px] text-purple-800/80 dark:text-purple-200/80">
                                      Base: {basesStr}
                                    </div>
                                  )}
                                  {toppingsStr && (
                                    <div className="text-[11px] text-purple-700/70 dark:text-purple-300/70">
                                      Acompanhamentos: {toppingsStr}
                                    </div>
                                  )}
                                  {item.notes && (
                                    <div className="text-[10px] text-amber-700 dark:text-amber-300 italic">
                                      Obs: {item.notes}
                                    </div>
                                  )}
                                </div>

                                <div className="font-mono font-black text-purple-900 dark:text-pink-300 text-right">
                                  {formatCurrency(Number(item.price || item.lineTotal || order.total) || 0)}
                                </div>
                              </div>
                            )
                          })}
                      </div>

                      {/* Ações do Pedido (Chamar na TV com Ticket Oficial, Editar se em preparo ou Cancelar) */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-purple-100 dark:border-white/10 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Botão de Chamada Específica deste Pedido com sua Senha Oficial */}
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleCallOrderOnTV(order, idx)}
                            className="h-7 px-2.5 text-[11px] font-bold bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-800 hover:to-pink-700 text-white rounded-lg cursor-pointer"
                          >
                            <span>Chamar {ticketNumber} na TV</span>
                          </Button>

                          {isPreparing && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenEditOrder(order)}
                              className="h-7 px-2.5 text-[11px] font-bold border-purple-200 dark:border-white/15 text-purple-900 dark:text-purple-200 hover:bg-purple-100/60 dark:hover:bg-white/10 rounded-lg cursor-pointer"
                            >
                              <Edit3 className="h-3 w-3 mr-1" />
                              <span>Editar Pedido (Em Preparo)</span>
                            </Button>
                          )}

                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCancelOrder(order.id)}
                            className="h-7 px-2 text-[11px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            <span>Cancelar</span>
                          </Button>
                        </div>

                        <div className="font-mono font-black text-sm text-purple-950 dark:text-white">
                          Total: {formatCurrency(Number(order.total) || 0)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-purple-700/70 dark:text-purple-300/70 font-semibold">
                Nenhum pedido ativo no momento para esta mesa.
              </div>
            )}
          </div>

          <Button
            variant="outline"
            onClick={onAddMoreItems}
            className="w-full h-10 mt-4 border-dashed border-purple-200 dark:border-white/20 bg-purple-50/50 dark:bg-white/5 hover:bg-purple-100/70 dark:hover:bg-white/10 text-purple-950 dark:text-white font-bold text-xs cursor-pointer rounded-xl shadow-xs"
          >
            + Adicionar Novo Pedido no Balcão para Mesa {table.number}
          </Button>
        </div>

        {/* Coluna Direita: Painel de Gestão & Fechamento da Mesa */}
        <div className="lg:col-span-4 bg-white dark:bg-[#160228]/95 rounded-3xl border border-purple-150 dark:border-white/15 p-5 shadow-xs dark:shadow-xl flex flex-col justify-between text-slate-900 dark:text-white space-y-4">
          <div className="space-y-4">
            <div className="text-sm font-black text-purple-950 dark:text-white border-b border-purple-100 dark:border-white/10 pb-3">
              Resumo da Mesa {table.number}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-purple-800/80 dark:text-purple-200/80">
                <span>Valor Consumido:</span>
                <span className="font-bold text-purple-950 dark:text-white">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-purple-800/80 dark:text-purple-200/80">
                <span>Status de Pagamento:</span>
                <span className={`font-black ${isAllPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                  {isAllPaid ? 'Quitado (MB WAY)' : 'Pendente no Caixa'}
                </span>
              </div>
            </div>

            {/* Total em Destaque */}
            <div className="pt-3 border-t border-dashed border-purple-200 dark:border-white/15 text-center">
              <div className="text-[11px] text-purple-700/80 dark:text-purple-200/70 font-bold uppercase">Total da Mesa</div>
              <div className="text-3xl font-black text-purple-950 dark:text-white mt-1 font-mono">{formatCurrency(total)}</div>
            </div>
          </div>

          {/* Botões de Gestão da Mesa */}
          <div className="space-y-2.5 pt-4 border-t border-purple-100 dark:border-white/10">
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

            {/* Bloqueio de Mesa com Motivo */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setBlockModalOpen(true)}
              className="w-full text-xs font-bold border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100/60 rounded-xl h-9 cursor-pointer"
            >
              <span>🔒 Bloquear Mesa por Motivo</span>
            </Button>

            {/* Ação Principal: Receber Pagamento ou Desocupar Mesa */}
            {!isAllPaid ? (
              <Button
                type="button"
                onClick={() => setPaymentOpen(true)}
                disabled={submitting}
                className="w-full h-11 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-md cursor-pointer"
              >
                <span>Receber no Caixa</span>
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleClosePaidTable}
                disabled={submitting}
                className="w-full h-11 rounded-2xl bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-800 hover:to-pink-700 text-white font-black text-sm shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Desocupar / Liberar Mesa</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Bloquear Mesa por Motivo */}
      <Dialog open={blockModalOpen} onOpenChange={setBlockModalOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-[#1a022d] text-slate-900 dark:text-white border border-purple-200 dark:border-white/15 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-purple-950 dark:text-white">
              Bloquear Mesa {table.number.toString().padStart(2, '0')}
            </DialogTitle>
          </DialogHeader>

          <div className="py-3 text-xs space-y-3">
            <span className="text-purple-800/80 dark:text-purple-200/80 font-medium">
              Selecione o motivo do bloqueio da mesa:
            </span>
            <div className="grid grid-cols-1 gap-2">
              {[
                'Limpeza / Higienização',
                'Mesa Reservada',
                'Manutenção / Interditada',
                'Aguardando Atendimento Especial',
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setBlockReason(reason)}
                  className={`p-3 rounded-xl text-left font-bold text-xs border transition cursor-pointer ${
                    blockReason === reason
                      ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                      : 'bg-purple-50/50 dark:bg-white/5 border-purple-200 dark:border-white/10 text-purple-950 dark:text-white hover:bg-purple-100/60'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setBlockModalOpen(false)} className="text-xs font-bold rounded-xl">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleBlockTable} disabled={submitting} className="text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-xl">
              Confirmar Bloqueio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Pedido em Preparo */}
      {editingOrder && (
        <Dialog open={Boolean(editingOrder)} onOpenChange={(open) => !open && setEditingOrder(null)}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-[#1a022d] text-slate-900 dark:text-white border border-purple-200 dark:border-white/15 rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-black text-purple-950 dark:text-white">
                Editar Pedido em Preparação ({editingOrder.customerName || `Mesa ${table.number}`})
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div>
                <label className="block text-xs font-bold text-purple-900 dark:text-purple-200 mb-1">
                  Acompanhamentos (separados por vírgula):
                </label>
                <input
                  type="text"
                  value={editToppingsText}
                  onChange={(e) => setEditToppingsText(e.target.value)}
                  placeholder="Ex: Leite Ninho, Morango, Granola"
                  className="w-full h-9 px-3 rounded-xl border border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-xs font-semibold text-purple-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-900 dark:text-purple-200 mb-1">
                  Observações da Cozinha:
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  placeholder="Ex: Sem calda, caprichar no ninho"
                  className="w-full p-2.5 rounded-xl border border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-xs font-semibold text-purple-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingOrder(null)}
                className="text-xs font-bold rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSaveOrderEdit}
                disabled={submitting}
                className="text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-xl"
              >
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de Transferência de Mesa */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-[#1a022d] text-slate-900 dark:text-white border border-purple-200 dark:border-white/15 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-purple-950 dark:text-white">
              Transferir Mesa {table.number.toString().padStart(2, '0')}
            </DialogTitle>
          </DialogHeader>

          <div className="py-3 text-xs space-y-2">
            <span className="text-purple-800/80 dark:text-purple-200/80 font-medium">
              Selecione a nova mesa de destino:
            </span>
            <select
              value={targetTableId}
              onChange={(e) => setTargetTableId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-xs font-bold text-purple-950 dark:text-white cursor-pointer"
            >
              <option value="">Selecione uma mesa...</option>
              {availableTargetTables.map((t) => (
                <option key={t.id} value={t.id}>
                  Mesa {t.number.toString().padStart(2, '0')} ({t.status === 'AVAILABLE' ? 'Livre' : 'Ocupada'})
                </option>
              ))}
            </select>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setTransferOpen(false)} className="text-xs font-bold rounded-xl">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleTransfer} className="text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-xl">
              Confirmar Transferência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Pagamento no Caixa */}
      <PaymentModal
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        total={total}
        storePhone={storePhone}
        submitting={submitting}
        onPay={handleFinalizePayment}
      />

      {/* Modal de Impressão Térmica */}
      <TableThermalReceiptDialog
        open={thermalReceiptOpen}
        onOpenChange={setThermalReceiptOpen}
        table={{
          ...table,
          items: hasOrdersList ? tableOrders.flatMap((o) => o.items || []) : (table.items || []),
          total,
        }}
        storePhone={storePhone}
        type={thermalType}
      />
    </div>
  )
}
