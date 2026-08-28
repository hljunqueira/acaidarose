'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Truck, Package, CheckCircle2, Clock, Eye, FileText, Check, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export default function SupplyHubView() {
  const [orders, setOrders] = useState([
    {
      id: 'SUP-2026-001',
      tenantName: 'Filial Torres Novas',
      date: '2026-08-28 07:30',
      itemsCount: 8,
      totalAmount: 184.00,
      savings: 22.50,
      status: 'PENDING',
    },
    {
      id: 'SUP-2026-002',
      tenantName: 'Filial Torres Novas',
      date: '2026-08-21 14:10',
      itemsCount: 12,
      totalAmount: 312.00,
      savings: 41.00,
      status: 'DELIVERED',
    },
  ])

  const handleApprove = (id: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: 'SHIPPED' } : o))
    )
    toast.success(`Pedido ${id} despachado e Guia de Transporte gerada!`)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-100 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600/10 dark:bg-purple-500/20 text-purple-600 dark:text-pink-400">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-purple-950 dark:text-white">
                Central de Abastecimento B2B & Expedição
              </h1>
              <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-300/70">
                Gestão e expedição de pedidos de insumos oficiais para a rede de franquias
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Pedidos B2B */}
      <Card className="border border-purple-100 dark:border-white/10 bg-white/70 dark:bg-[#160228]/80 backdrop-blur-md rounded-2xl overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-purple-100 dark:border-white/10">
          <CardTitle className="text-sm font-black text-purple-950 dark:text-white">
            Pedidos de Reposição Recebidos das Franquias
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-50/60 dark:bg-white/5 border-b border-purple-100 dark:border-white/10 text-[11px] font-black uppercase text-purple-900/70 dark:text-purple-300/70">
                <tr>
                  <th className="py-3 px-4">Nº Pedido</th>
                  <th className="py-3 px-4">Franquia Solicitante</th>
                  <th className="py-3 px-4">Data/Hora</th>
                  <th className="py-3 px-4">Volumes</th>
                  <th className="py-3 px-4">Valor Total</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100/60 dark:divide-white/5">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-purple-50/40 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-black text-purple-950 dark:text-white">{order.id}</td>
                    <td className="py-3.5 px-4 font-bold text-purple-900 dark:text-purple-200">{order.tenantName}</td>
                    <td className="py-3.5 px-4 text-slate-500">{order.date}</td>
                    <td className="py-3.5 px-4 font-semibold">{order.itemsCount} volumes</td>
                    <td className="py-3.5 px-4 font-black text-purple-950 dark:text-white">€ {order.totalAmount.toFixed(2)}</td>
                    <td className="py-3.5 px-4">
                      {order.status === 'PENDING' && (
                        <Badge className="bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40 font-bold text-[10px]">
                          Pendente
                        </Badge>
                      )}
                      {order.status === 'SHIPPED' && (
                        <Badge className="bg-purple-500/20 text-purple-700 dark:text-pink-300 border-purple-500/40 font-bold text-[10px]">
                          Em Trânsito
                        </Badge>
                      )}
                      {order.status === 'DELIVERED' && (
                        <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 font-bold text-[10px]">
                          Entregue
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {order.status === 'PENDING' ? (
                        <Button
                          onClick={() => handleApprove(order.id)}
                          size="sm"
                          className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Despachar</span>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-xl border-purple-200 dark:border-white/10 text-xs font-bold gap-1.5 cursor-pointer"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>Guia</span>
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
