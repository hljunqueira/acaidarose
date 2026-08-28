'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { User, DayReportSummary, Order } from '@/types'
import { formatCurrency } from '@/lib/i18n/formatters'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface ReportsModuleViewProps {
  tenantId: string
  currentUser: User
}

export default function ReportsModuleView({ tenantId, currentUser }: ReportsModuleViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'invisible' | 'audit' | 'orders'>('overview')
  const [report, setReport] = useState<DayReportSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN'

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/day?tenantId=${encodeURIComponent(tenantId)}`)
      const data = await res.json()
      setReport(data)
    } catch {
      toast.error('Erro ao carregar relatórios')
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const auditLogs = (report as any)?.auditLogs || []
  const orders = report?.orders || []
  const invisibleProducts: any[] = []

  return (
    <div className="w-full space-y-4">
      {/* Header Minimalista Padrão */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-purple-100 dark:border-white/10">
        <div>
          <h1 className="text-base sm:text-lg font-black text-purple-950 dark:text-white tracking-tight">
            Relatórios & Fecho de Caixa
          </h1>
          <p className="text-[11px] text-purple-700/80 dark:text-purple-200/70">
            Desempenho diário, vendas por método de pagamento e auditoria
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              window.print()
              toast.success('A gerar relatório para impressão...')
            }}
            className="h-9 px-3 text-xs font-bold rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-950 dark:text-white cursor-pointer shadow-xs"
          >
            Imprimir Relatório de Fecho
          </Button>
        </div>
      </div>

      {/* Sub-Abas dos Relatórios Oficiais */}
      <div className="flex items-center gap-1.5 max-w-full overflow-x-auto no-scrollbar bg-purple-50/70 dark:bg-white/5 p-1 rounded-2xl border border-purple-150 dark:border-white/10 w-fit">
        {[
          { id: 'overview', label: 'Visão Geral' },
          { id: 'sales', label: 'Relatório de Vendas' },
          { id: 'invisible', label: `Produtos Ocultos (${invisibleProducts.length})` },
          { id: 'audit', label: 'Histórico de Alterações', isHqOnly: true },
          { id: 'orders', label: 'Histórico de Pedidos' },
        ].map((tab) => {
          const isTabActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isTabActive
                  ? 'bg-purple-700 dark:bg-pink-600 text-white shadow-xs'
                  : 'text-purple-900 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              {tab.isHqOnly && <span className="ml-1 text-[9px] font-black opacity-80">[HQ]</span>}
            </button>
          )
        })}
      </div>

      {/* ========================================================= */}
      {/* 1. VISÃO GERAL                                            */}
      {/* ========================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-[#160228]/95 border border-purple-150 dark:border-white/15 shadow-xs dark:shadow-xl text-slate-900 dark:text-white">
              <div className="text-[11px] font-bold text-purple-700/80 dark:text-purple-200/70 uppercase">Faturamento do Dia</div>
              <div className="text-2xl font-black text-purple-950 dark:text-pink-300 font-mono mt-1">
                {formatCurrency(report?.total || 0)}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-300 font-semibold mt-1">
                {report?.count || 0} comandas pagas
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-[#160228]/95 border border-purple-150 dark:border-white/15 shadow-xs dark:shadow-xl text-slate-900 dark:text-white">
              <div className="text-[11px] font-bold text-purple-700/80 dark:text-purple-200/70 uppercase">Ticket Médio</div>
              <div className="text-2xl font-black text-purple-950 dark:text-white font-mono mt-1">
                {formatCurrency(report && report.count > 0 ? report.total / report.count : 0)}
              </div>
              <div className="text-[11px] text-purple-600/70 dark:text-purple-200/60 mt-1">Por atendimento</div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-[#160228]/95 border border-purple-150 dark:border-white/15 shadow-xs dark:shadow-xl text-slate-900 dark:text-white">
              <div className="text-[11px] font-bold text-purple-700/80 dark:text-purple-200/70 uppercase">Cancelamentos / Anulações</div>
              <div className="text-2xl font-black text-red-500 dark:text-red-400 font-mono mt-1">
                {formatCurrency(report?.cancelledTotal || 0)}
              </div>
              <div className="text-[11px] text-red-600 dark:text-red-300 font-semibold mt-1">
                {report?.cancelledCount || 0} pedidos cancelados
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-[#160228]/95 border border-purple-150 dark:border-white/15 shadow-xs dark:shadow-xl text-slate-900 dark:text-white">
              <div className="text-[11px] font-bold text-purple-700/80 dark:text-purple-200/70 uppercase">Itens Pausados / Ocultos</div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
                {invisibleProducts.length}
              </div>
              <div className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold mt-1">
                Itens fora do cardápio
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. RELATÓRIO DE VENDAS & MÉTODOS DE PAGAMENTO             */}
      {/* ========================================================= */}
      {activeTab === 'sales' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#160228]/95 rounded-3xl border border-purple-150 dark:border-white/15 p-6 shadow-xs dark:shadow-xl text-slate-900 dark:text-white">
            <h2 className="text-sm font-black text-purple-950 dark:text-white uppercase tracking-wider mb-4">
              Vendas por Método de Pagamento
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {['MBWAY', 'NUMERARIO', 'CARTAO'].map((method) => {
                const data = (report?.byMethod || {})[method] || { count: 0, total: 0 }
                const label = method === 'MBWAY' ? 'MB Way' : method === 'NUMERARIO' ? 'Numerário (Dinheiro)' : 'Multibanco / Cartão'
                return (
                  <div key={method} className="p-4 rounded-2xl bg-purple-50/60 dark:bg-white/5 border border-purple-100 dark:border-white/10">
                    <div className="text-xs font-bold text-purple-700 dark:text-pink-300">{label}</div>
                    <div className="text-xl font-black text-purple-950 dark:text-white font-mono mt-1">{formatCurrency(data.total)}</div>
                    <div className="text-[11px] text-purple-600/80 dark:text-purple-200/60 mt-0.5">{data.count} pagamentos registados</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. RELATÓRIO DE PRODUTOS INVISÍVEIS                       */}
      {/* ========================================================= */}
      {activeTab === 'invisible' && (
        <div className="bg-white dark:bg-[#160228]/95 rounded-3xl border border-purple-150 dark:border-white/15 shadow-xs dark:shadow-xl overflow-hidden text-slate-900 dark:text-white">
          <div className="p-4 border-b border-purple-100 dark:border-white/10 bg-purple-50/50 dark:bg-white/5">
            <h2 className="text-xs font-black uppercase text-purple-950 dark:text-white">
              Produtos Atualmente Ocultos ou Pausados no Cardápio
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-50 dark:bg-white/5 border-b border-purple-100 dark:border-white/10 text-purple-900 dark:text-purple-200 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Situação</th>
                  <th className="py-3 px-4">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100 dark:divide-white/10">
                {invisibleProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-purple-600/70 dark:text-purple-200/60 font-bold">
                      Todos os produtos estão ativos e visíveis no cardápio desta loja.
                    </td>
                  </tr>
                ) : (
                  invisibleProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-purple-50/50 dark:hover:bg-white/5">
                      <td className="py-3 px-4 font-bold text-purple-950 dark:text-white">{p.name}</td>
                      <td className="py-3 px-4 text-purple-700/80 dark:text-purple-200/70">{p.type}</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/30 text-[10px]">
                          Pausado / Esgotado
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-purple-600/70 dark:text-purple-200/60">Ruptura temporária de estoque na unidade</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. HISTÓRICO DE ALTERAÇÕES (EXCLUSIVO FRANQUEADORA)       */}
      {/* ========================================================= */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {!isSuperAdmin ? (
            <div className="p-8 text-center bg-white dark:bg-[#160228]/95 rounded-3xl border border-red-300 dark:border-red-500/40 text-slate-900 dark:text-white shadow-xs dark:shadow-xl">
              <div className="text-sm font-black text-red-600 dark:text-red-400">Acesso Restrito à Franqueadora</div>
              <p className="text-xs text-purple-700/80 dark:text-purple-200/70 mt-1">
                O log de auditoria corporativo e histórico de alterações master é de acesso exclusivo para SUPER_ADMIN.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#160228]/95 rounded-3xl border border-purple-150 dark:border-white/15 shadow-xs dark:shadow-xl overflow-hidden text-slate-900 dark:text-white">
              <div className="p-4 border-b border-purple-100 dark:border-white/10 bg-purple-50/50 dark:bg-white/5 flex justify-between items-center">
                <h2 className="text-xs font-black uppercase text-purple-950 dark:text-white">
                  Histórico Corporativo de Alterações & Sincronizações (Audit Log)
                </h2>
                <Badge className="bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 text-white text-[9px] font-black uppercase border-0">
                  Exclusivo Franqueadora
                </Badge>
              </div>

              <div className="divide-y divide-purple-100 dark:divide-white/10 text-xs">
                {auditLogs.map((log: any) => (
                  <div key={log.id} className="p-4 hover:bg-purple-50/50 dark:hover:bg-white/5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-purple-950 dark:text-white">{log.details}</div>
                      <div className="text-[11px] text-purple-700/80 dark:text-purple-200/70 mt-0.5">
                        Executado por: <span className="font-mono text-purple-700 dark:text-pink-300 font-semibold">{log.user}</span>
                      </div>
                    </div>
                    <div className="text-[11px] font-mono text-purple-600/80 dark:text-purple-200/80 flex-shrink-0">
                      {new Date(log.timestamp).toLocaleString('pt-PT')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. HISTÓRICO DE PEDIDOS                                   */}
      {/* ========================================================= */}
      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-[#160228]/95 rounded-3xl border border-purple-150 dark:border-white/15 shadow-xs dark:shadow-xl overflow-hidden text-slate-900 dark:text-white">
          <div className="p-4 border-b border-purple-100 dark:border-white/10 bg-purple-50/50 dark:bg-white/5">
            <h2 className="text-xs font-black uppercase text-purple-950 dark:text-white">
              Comandas e Pedidos Realizados no Turno
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-50 dark:bg-white/5 border-b border-purple-100 dark:border-white/10 text-purple-900 dark:text-purple-200 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Comanda</th>
                  <th className="py-3 px-4">Mesa / Balcão</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Hora</th>
                  <th className="py-3 px-4">Método</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100 dark:divide-white/10">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-purple-600/70 dark:text-purple-200/60 font-bold">
                      Nenhum pedido registado no turno atual.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id} className="hover:bg-purple-50/50 dark:hover:bg-white/5">
                      <td className="py-3 px-4 font-mono font-bold text-purple-700 dark:text-pink-300">#{o.orderNumber || o.id.slice(-4)}</td>
                      <td className="py-3 px-4 font-semibold text-purple-950 dark:text-white">{o.tableNumber || (o.isTableOrder ? 'Mesa' : 'Balcão')}</td>
                      <td className="py-3 px-4 text-purple-700/80 dark:text-purple-200/70">{o.customerName || 'Cliente Balcão'}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-purple-600/80 dark:text-purple-200/80">{new Date(o.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="py-3 px-4 font-semibold text-purple-950 dark:text-white">{o.paymentMethod || 'Numerário'}</td>
                      <td className="py-3 px-4 font-mono font-bold text-purple-950 dark:text-pink-300">{formatCurrency(o.total || o.totalAmount || 0)}</td>
                      <td className="py-3 px-4">
                        <Badge
                          className={`text-[10px] py-0 px-2 font-bold ${
                            o.status === 'CANCELLED'
                              ? 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-500/30'
                              : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                          }`}
                        >
                          {o.status === 'CANCELLED' ? 'Cancelado' : 'Pago'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
