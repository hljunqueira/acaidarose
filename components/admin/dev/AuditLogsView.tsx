'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Terminal,
  RefreshCw,
  Search,
  User,
  Store,
  Layers,
  Info,
  SlidersHorizontal,
} from 'lucide-react'
import { toast } from 'sonner'

export interface AuditLogItem {
  id: string
  timestamp: string
  level: 'INFO' | 'WARN' | 'ERROR'
  scope: string
  action?: string
  message: string
  author?: string
  role?: string
  tenant: string
  tenantId?: string
  entityId?: string
  metadata?: Record<string, any>
}

export default function AuditLogsView() {
  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [loading, setLoading] = useState(false)
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR'>('ALL')
  const [filterScope, setFilterScope] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null)

  const fetchLogs = useCallback(async (isManual = false) => {
    setLoading(true)
    try {
      const res = await fetch('/api/dev/audit-logs')
      const data = await res.json()
      if (Array.isArray(data.logs)) {
        setLogs(data.logs)
        if (isManual) {
          toast.success('Logs de auditoria sincronizados com a VPS')
        }
      }
    } catch {
      if (isManual) {
        toast.error('Erro ao consultar logs de auditoria')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs(false)
  }, [fetchLogs])

  const filteredLogs = logs.filter((l) => {
    if (filterLevel !== 'ALL' && l.level !== filterLevel) return false
    if (filterScope !== 'ALL') {
      const matchScope =
        l.scope?.toUpperCase().includes(filterScope) ||
        l.action?.toUpperCase().includes(filterScope)
      if (!matchScope) return false
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchText =
        l.message?.toLowerCase().includes(q) ||
        l.author?.toLowerCase().includes(q) ||
        l.scope?.toLowerCase().includes(q) ||
        l.tenant?.toLowerCase().includes(q)
      if (!matchText) return false
    }
    return true
  })

  return (
    <div className="space-y-5 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-purple-100 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-white/5 text-purple-700 dark:text-pink-400 border border-purple-100 dark:border-white/10 shadow-xs">
            <Terminal className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-purple-950 dark:text-white tracking-tight">
              Logs de Auditoria & Rastreabilidade
            </h1>
            <p className="text-xs sm:text-sm text-purple-700/80 dark:text-purple-200/70 font-medium">
              Histórico imutável de alterações realizadas por administradores, operadores e sistema
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => fetchLogs(true)}
          disabled={loading}
          className="h-9 rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-xs font-bold text-purple-950 dark:text-white gap-2 cursor-pointer shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar Logs</span>
        </Button>
      </div>

      {/* Barra de Filtros & Pesquisa */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-purple-50/50 dark:bg-white/5 p-3 rounded-2xl border border-purple-100 dark:border-white/10">
        {/* Campo de Busca */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por autor, mensagem ou comanda..."
            className="pl-9 h-9 text-xs rounded-xl bg-white dark:bg-white/5 border-purple-200 dark:border-white/15"
          />
        </div>

        {/* Filtros de Escopo */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'MESAS_QR_SECURITY', label: 'Hashes das Mesas' },
            { id: 'QRCODE', label: 'Config QR Code' },
            { id: 'ORDER', label: 'Pedidos' },
            { id: 'SMART_TV', label: 'Smart TV' },
            { id: 'FRANCHISE', label: 'Franquias' },
          ].map((scope) => (
            <button
              key={scope.id}
              type="button"
              onClick={() => setFilterScope(scope.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                filterScope === scope.id
                  ? 'bg-purple-700 dark:bg-pink-600 text-white shadow-xs'
                  : 'bg-white dark:bg-white/5 text-purple-900 dark:text-purple-200 border border-purple-150 dark:border-white/10 hover:bg-purple-50'
              }`}
            >
              {scope.label}
            </button>
          ))}
        </div>

        {/* Filtro de Nível */}
        <div className="flex items-center gap-1 p-0.5 bg-white dark:bg-white/5 rounded-xl border border-purple-150 dark:border-white/10 shrink-0">
          {(['ALL', 'INFO', 'WARN'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setFilterLevel(lvl)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterLevel === lvl
                  ? 'bg-purple-900 dark:bg-purple-700 text-white'
                  : 'text-purple-900 dark:text-purple-200 hover:text-purple-950'
              }`}
            >
              {lvl === 'ALL' ? 'Nível: Todos' : lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal View de Logs em Alta Resolução */}
      <Card className="border border-purple-150 dark:border-white/15 bg-slate-950 text-slate-100 font-mono shadow-xl rounded-3xl overflow-hidden">
        <div className="bg-slate-900 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
            <div className="h-3 w-3 rounded-full bg-yellow-500/80"></div>
            <div className="h-3 w-3 rounded-full bg-green-500/80"></div>
            <span className="text-xs text-slate-400 font-semibold ml-2">stream :: /var/log/acaidarose-audit.log</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
              CONECTADO À VPS ({filteredLogs.length} eventos)
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 sm:p-6 space-y-2 text-xs overflow-x-auto max-h-[600px]">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Nenhum evento registrado com os filtros selecionados.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className="flex flex-col lg:flex-row lg:items-center gap-1.5 lg:gap-3 py-2 border-b border-slate-800/50 hover:bg-slate-900/70 px-2.5 rounded-xl transition-colors cursor-pointer"
                title="Clique para ver os detalhes da alteração"
              >
                <span className="text-slate-500 text-[11px] shrink-0 font-mono">[{log.timestamp}]</span>
                
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded shrink-0 self-start lg:self-auto ${
                    log.level === 'WARN'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : log.level === 'ERROR'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {log.level}
                </span>

                <span className="text-purple-400 text-xs font-bold shrink-0">[{log.scope}]</span>

                {/* Autor da Ação */}
                {log.author && (
                  <span className="text-pink-300 text-[11px] font-bold shrink-0 flex items-center gap-1 bg-pink-950/40 px-2 py-0.5 rounded-md border border-pink-500/20">
                    <User className="h-3 w-3" />
                    <span>{log.author}</span>
                  </span>
                )}

                <span className="text-slate-200 flex-1 break-words">{log.message}</span>

                <span className="text-slate-400 text-[11px] shrink-0 font-medium flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                  <Store className="h-3 w-3 text-purple-400" />
                  <span>{log.tenant}</span>
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes da Alteração */}
      {selectedLog && (
        <Dialog open={Boolean(selectedLog)} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-lg rounded-3xl bg-white dark:bg-[#180424] border border-purple-150 dark:border-white/10 p-6 space-y-4 text-slate-900 dark:text-white">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-purple-950 dark:text-white flex items-center gap-2">
                <Info className="h-5 w-5 text-pink-500" />
                <span>Detalhes da Auditoria</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-purple-50 dark:bg-white/5 border border-purple-100 dark:border-white/10 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-purple-300 font-bold">Data / Hora:</span>
                  <span className="font-mono text-slate-900 dark:text-white font-bold">{selectedLog.timestamp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-purple-300 font-bold">Autor da Alteração:</span>
                  <span className="font-bold text-pink-600 dark:text-pink-400">{selectedLog.author || 'Sistema'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-purple-300 font-bold">Unidade / Loja:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedLog.tenant}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-purple-300 font-bold">Escopo:</span>
                  <span className="font-mono font-bold text-purple-600 dark:text-purple-400">[{selectedLog.scope}]</span>
                </div>
              </div>

              {/* Destaque para Hash do QR Code se existir */}
              {selectedLog.metadata?.qrHash && (
                <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-white/5 border border-purple-150 dark:border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-950 dark:text-white">Hash do QR Code da Mesa:</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(selectedLog.metadata?.qrHash)
                          toast.success(`Hash ${selectedLog.metadata?.qrHash} copiada!`)
                        } catch {
                          toast.error('Erro ao copiar hash')
                        }
                      }}
                      className="h-7 text-[11px] font-bold rounded-lg cursor-pointer gap-1"
                    >
                      Copiar Hash
                    </Button>
                  </div>
                  <div className="font-mono font-bold text-sm text-pink-600 dark:text-pink-300 bg-white dark:bg-black/30 p-2 rounded-xl border border-purple-100 dark:border-white/10">
                    {selectedLog.metadata.qrHash}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-white">Descrição do Evento:</label>
                <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs mt-1 border border-slate-800 break-words">
                  {selectedLog.message}
                </div>
              </div>

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-900 dark:text-white">Metadados Técnicos (JSON):</label>
                  <pre className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] mt-1 border border-slate-800 overflow-x-auto max-h-48">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                onClick={() => setSelectedLog(null)}
                className="w-full bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold h-10 cursor-pointer"
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

