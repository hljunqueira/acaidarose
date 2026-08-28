'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/i18n/formatters'
import { SupplyOrderRow } from '@/lib/repositories/inventoryRepository'
import {
  Truck,
  Package,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Store,
} from 'lucide-react'

interface StoreSupplyRaioXDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  storeName: string
  storeNif: string
  storeCity: string
  orders: SupplyOrderRow[]
  onApproveOrder?: (id: string, orderNumber: number) => void
}

export default function StoreSupplyRaioXDialog({
  open,
  onOpenChange,
  storeName,
  storeNif,
  storeCity,
  orders,
  onApproveOrder,
}: StoreSupplyRaioXDialogProps) {
  const storeOrders = orders.filter((o) => {
    const name = o.tenantName || ''
    return (
      name.toLowerCase().includes(storeName.toLowerCase()) ||
      storeName.toLowerCase().includes(name.toLowerCase())
    )
  })

  const totalSpent = storeOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0)
  const totalSavings = storeOrders.reduce((acc, o) => acc + (o.totalSavings || 0), 0)
  const totalVolumes = storeOrders.reduce((acc, o) => acc + (o.items?.length || 0), 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-white dark:bg-[#160228] text-purple-950 dark:text-white border border-purple-150 dark:border-white/15 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <DialogHeader className="text-left pb-3 border-b border-purple-150 dark:border-white/10 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-base sm:text-lg font-black text-purple-950 dark:text-white flex items-center gap-2">
              <Truck className="h-5 w-5 text-purple-700 dark:text-pink-400" />
              <span>Raio-X de Abastecimento & Reposição</span>
            </DialogTitle>
            <p className="text-xs text-purple-700/80 dark:text-purple-200/70 font-medium mt-0.5">
              {storeName} · NIF: <span className="font-mono font-bold">{storeNif}</span> · {storeCity}
            </p>
          </div>
        </DialogHeader>

        {/* 3 Cards de Resumo da Loja */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-white/5 border border-purple-150 dark:border-white/10">
            <div className="text-[11px] font-bold text-purple-700/80 dark:text-purple-300/70 uppercase">
              Total Faturado em Insumos
            </div>
            <div className="text-xl font-black text-purple-950 dark:text-white font-mono mt-1">
              {formatCurrency(totalSpent)}
            </div>
            <div className="text-[10px] text-purple-600/70 dark:text-purple-300/60 font-medium mt-0.5">
              {storeOrders.length} encomenda(s) registrada(s)
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30">
            <div className="text-[11px] font-bold text-emerald-900/80 dark:text-emerald-300 uppercase">
              Economia Gerada p/ a Loja
            </div>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
              {formatCurrency(totalSavings)}
            </div>
            <div className="text-[10px] text-emerald-700/80 dark:text-emerald-300/60 font-medium mt-0.5">
              Preço Franqueadora vs Mercado
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-white/5 border border-purple-150 dark:border-white/10">
            <div className="text-[11px] font-bold text-purple-700/80 dark:text-purple-300/70 uppercase">
              Volumes Despachados
            </div>
            <div className="text-xl font-black text-purple-950 dark:text-white font-mono mt-1">
              {totalVolumes} un.
            </div>
            <div className="text-[10px] text-purple-600/70 dark:text-purple-300/60 font-medium mt-0.5">
              Baldes, caixas e insumos oficiais
            </div>
          </div>
        </div>

        {/* Tabela de Histórico de Encomendas */}
        <div className="space-y-3 pt-2 text-xs">
          <div className="font-bold text-purple-950 dark:text-white text-xs">
            Histórico de Encomendas & Fila de Expedição
          </div>

          <div className="overflow-x-auto rounded-2xl border border-purple-150 dark:border-white/10 bg-white dark:bg-[#160228]">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-50/70 dark:bg-white/5 border-b border-purple-150 dark:border-white/10 text-[11px] font-black uppercase text-purple-900/80 dark:text-purple-300/70">
                <tr>
                  <th className="py-2.5 px-3">Pedido</th>
                  <th className="py-2.5 px-3">Data / Hora (Portugal)</th>
                  <th className="py-2.5 px-3">Volumes</th>
                  <th className="py-2.5 px-3">Valor Total</th>
                  <th className="py-2.5 px-3">Economia</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100 dark:divide-white/5">
                {storeOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-purple-700/80 dark:text-purple-300/70 text-xs font-medium"
                    >
                      Nenhuma encomenda registrada para esta unidade até o momento.
                    </td>
                  </tr>
                ) : (
                  storeOrders.map((ord) => (
                    <tr
                      key={ord.id}
                      className="hover:bg-purple-50/50 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-3 font-mono font-black text-purple-950 dark:text-white">
                        #{ord.orderNumber}
                      </td>
                      <td className="py-3 px-3 text-purple-700/80 dark:text-purple-300/70 text-[11px]">
                        {new Date(ord.createdAt).toLocaleString('pt-PT', {
                          timeZone: 'Europe/Lisbon',
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-3 px-3 font-bold text-purple-950 dark:text-white">
                        {ord.items?.length || 0} volumes
                      </td>
                      <td className="py-3 px-3 font-mono font-black text-purple-950 dark:text-pink-300">
                        {formatCurrency(ord.totalAmount)}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(ord.totalSavings || 0)}
                      </td>
                      <td className="py-3 px-3">
                        {ord.status === 'PENDING' && (
                          <Badge className="bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                            Pendente
                          </Badge>
                        )}
                        {ord.status === 'SHIPPED' && (
                          <Badge className="bg-purple-500/20 text-purple-700 dark:text-pink-300 border border-purple-500/40 text-[10px] font-bold">
                            Em Transporte
                          </Badge>
                        )}
                        {ord.status === 'DELIVERED' && (
                          <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                            Entregue
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {ord.status === 'PENDING' && onApproveOrder && (
                          <Button
                            size="sm"
                            onClick={() => onApproveOrder(ord.id, ord.orderNumber)}
                            className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg cursor-pointer shadow-xs"
                          >
                            <span>Despachar Carga</span>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-xs font-bold text-purple-950 dark:text-white cursor-pointer"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
