'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Terminal, RefreshCw, Filter, Shield, AlertCircle, CheckCircle } from 'lucide-react'

export default function AuditLogsView() {
  const [loading, setLoading] = useState(false)
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR'>('ALL')

  const logs = [
    {
      id: 'log-1',
      timestamp: '2026-08-28 03:21:47',
      level: 'INFO',
      scope: 'DATABASE_POOL',
      message: 'Health check executado com sucesso no PostgreSQL 16 (Latência: 95ms)',
      tenant: 'Sede Aveiro',
    },
    {
      id: 'log-2',
      timestamp: '2026-08-28 03:00:01',
      level: 'INFO',
      scope: 'BACKUP_CRON',
      message: 'Rotina de backup automatizado concluída com sucesso (acaidarose_prod.sql.gz)',
      tenant: 'Sistema',
    },
    {
      id: 'log-3',
      timestamp: '2026-08-28 02:58:09',
      level: 'INFO',
      scope: 'AUTH_SERVICE',
      message: 'Sessão administrativa iniciada para SUPER_ADMIN (Master TI)',
      tenant: 'Sede Aveiro',
    },
    {
      id: 'log-4',
      timestamp: '2026-08-28 02:45:12',
      level: 'INFO',
      scope: 'SCHEMA_MIGRATION',
      message: '21 tabelas relacionais e constraints multi-tenant verificadas na VPS',
      tenant: 'Sistema',
    },
  ]

  const filteredLogs = filterLevel === 'ALL' ? logs : logs.filter((l) => l.level === filterLevel)

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-100 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600/10 dark:bg-purple-500/20 text-purple-600 dark:text-pink-400">
              <Terminal className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-purple-950 dark:text-white">
                Logs de Auditoria & Telemetria TI
              </h1>
              <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-300/70">
                Histórico imutável de eventos críticos, requisições de API e operações master
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLoading(true)}
            className="rounded-xl border-purple-200 dark:border-white/10 text-xs font-bold gap-2 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar Logs</span>
          </Button>
        </div>
      </div>

      {/* Terminal View de Logs */}
      <Card className="border border-purple-100 dark:border-white/10 bg-slate-950 text-slate-100 font-mono shadow-xl rounded-2xl overflow-hidden">
        <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
            <div className="h-3 w-3 rounded-full bg-yellow-500/80"></div>
            <div className="h-3 w-3 rounded-full bg-green-500/80"></div>
            <span className="text-xs text-slate-400 font-semibold ml-2">live-stream :: /var/log/acaidarose-audit.log</span>
          </div>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
            CONECTADO
          </Badge>
        </div>

        <CardContent className="p-4 space-y-2 text-xs overflow-x-auto">
          {filteredLogs.map((log) => (
            <div key={log.id} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 py-1 border-b border-slate-800/50">
              <span className="text-slate-500 text-[11px] shrink-0">[{log.timestamp}]</span>
              <span className="text-emerald-400 font-bold shrink-0">[{log.level}]</span>
              <span className="text-pink-400 shrink-0">[{log.scope}]</span>
              <span className="text-slate-300 flex-1">{log.message}</span>
              <span className="text-purple-400 text-[11px] shrink-0 font-semibold">({log.tenant})</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
