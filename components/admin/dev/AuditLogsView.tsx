'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Terminal, RefreshCw, Filter, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

export interface AuditLogItem {
  id: string
  timestamp: string
  level: 'INFO' | 'WARN' | 'ERROR'
  scope: string
  message: string
  tenant: string
}

export default function AuditLogsView() {
  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [loading, setLoading] = useState(false)
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR'>('ALL')

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
    // Carga silenciosa ao montar (sem disparar toast)
    fetchLogs(false)
  }, [fetchLogs])

  const filteredLogs = filterLevel === 'ALL' ? logs : logs.filter((l) => l.level === filterLevel)

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-150 dark:border-white/15">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-white/5 text-purple-700 dark:text-pink-400 border border-purple-150 dark:border-white/10 shadow-xs">
              <Terminal className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-purple-950 dark:text-white tracking-tight">
                Logs de Auditoria & Tráfego TI
              </h1>
              <p className="text-xs sm:text-sm text-purple-700/80 dark:text-purple-200/70 font-medium">
                Rastreabilidade de operações, requisições de API e integridade de dados na VPS
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filtro de Nível */}
          <div className="flex items-center gap-1 p-1 bg-purple-50/70 dark:bg-white/5 rounded-2xl border border-purple-150 dark:border-white/10">
            {(['ALL', 'INFO', 'WARN'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setFilterLevel(lvl)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterLevel === lvl
                    ? 'bg-purple-700 dark:bg-pink-600 text-white shadow-xs'
                    : 'text-purple-900 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white'
                }`}
              >
                {lvl === 'ALL' ? 'Todos' : lvl}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchLogs(true)}
            disabled={loading}
            className="h-9 rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-xs font-bold text-purple-950 dark:text-white gap-2 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar Logs</span>
          </Button>
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
              CONECTADO À VPS
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 sm:p-6 space-y-2.5 text-xs overflow-x-auto max-h-[500px]">
          {filteredLogs.length === 0 ? (
            <div className="py-6 text-center text-slate-500 text-xs">
              Nenhum evento registrado no momento.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 py-1.5 border-b border-slate-800/40 hover:bg-slate-900/50 px-2 rounded-lg transition-colors"
              >
                <span className="text-slate-500 text-[11px] shrink-0 font-mono">[{log.timestamp}]</span>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded shrink-0 ${
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
                <span className="text-slate-200 flex-1">{log.message}</span>
                <span className="text-slate-500 text-[11px] shrink-0 font-medium">({log.tenant})</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
