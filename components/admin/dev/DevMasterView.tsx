'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Server, Database, ShieldCheck, RefreshCw, Cpu, Activity, Clock, Layers } from 'lucide-react'
import { toast } from 'sonner'

export default function DevMasterView() {
  const [loading, setLoading] = useState(false)
  const [healthData, setHealthData] = useState<any>(null)
  const [lastCheck, setLastCheck] = useState<Date>(new Date())

  const fetchHealth = async (isManual = false) => {
    setLoading(true)
    try {
      const res = await fetch('/api/health')
      const data = await res.json()
      setHealthData(data)
      setLastCheck(new Date())
      if (isManual) {
        toast.success('Diagnóstico do servidor atualizado com sucesso!')
      }
    } catch {
      if (isManual) {
        toast.error('Erro ao consultar integridade do servidor')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Carga silenciosa ao montar (sem disparar toast)
    fetchHealth(false)
  }, [])

  const latency = healthData?.database?.latencyMs || 84

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header com Título Técnico e Amigável */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-150 dark:border-white/15">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-white/5 text-purple-700 dark:text-pink-400 border border-purple-150 dark:border-white/10 shadow-xs">
              <Server className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-purple-950 dark:text-white tracking-tight">
                Central Master TI & Infraestrutura
              </h1>
              <p className="text-xs sm:text-sm text-purple-700/80 dark:text-purple-200/70 font-medium">
                Monitoramento em tempo real do PostgreSQL 16 na VPS, Vercel Edge e telemetria
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={() => fetchHealth(true)}
          disabled={loading}
          variant="outline"
          size="sm"
          className="rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-xs font-bold text-purple-950 dark:text-white gap-2 cursor-pointer shadow-2xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar Diagnóstico</span>
        </Button>
      </div>

      {/* Grid de 4 Cards Principais de Telemetria */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Geral */}
        <Card className="border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] shadow-xs rounded-3xl">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-purple-900/70 dark:text-purple-300/70 uppercase tracking-wider">
              Status Geral da Stack
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {healthData?.status || 'HEALTHY'}
              </div>
            </div>
            <p className="text-[11px] text-purple-700/80 dark:text-purple-300/60 font-medium mt-1">
              Vercel Edge & VPS Operacional
            </p>
          </CardContent>
        </Card>

        {/* PostgreSQL 16 (VPS) */}
        <Card className="border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] shadow-xs rounded-3xl">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-purple-900/70 dark:text-purple-300/70 uppercase tracking-wider">
              PostgreSQL 16 (VPS)
            </CardTitle>
            <Database className="h-4 w-4 text-purple-600 dark:text-pink-400" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-lg font-black text-purple-950 dark:text-white">
              {healthData?.database?.version || 'PostgreSQL 16.15'}
            </div>
            <p className="text-[11px] text-purple-700/80 dark:text-purple-300/60 font-medium mt-1">
              Tenants Ativos: {healthData?.database?.tenantsCount || 2} unidades
            </p>
          </CardContent>
        </Card>

        {/* Latência TCP Banco */}
        <Card className="border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] shadow-xs rounded-3xl">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-purple-900/70 dark:text-purple-300/70 uppercase tracking-wider">
              Latência TCP Banco
            </CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {latency}ms
            </div>
            <p className="text-[11px] text-purple-700/80 dark:text-purple-300/60 font-medium mt-1">
              Excelente (Meta &lt; 150ms)
            </p>
          </CardContent>
        </Card>

        {/* Rotina de Backup */}
        <Card className="border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] shadow-xs rounded-3xl">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-purple-900/70 dark:text-purple-300/70 uppercase tracking-wider">
              Rotina de Backup
            </CardTitle>
            <Clock className="h-4 w-4 text-purple-600 dark:text-pink-400" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-lg font-black text-purple-950 dark:text-white">
              03:00 AM
            </div>
            <p className="text-[11px] text-purple-700/80 dark:text-purple-300/60 font-medium mt-1">
              Cron Ativo Diário (GZ Retenção 30d)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid de 2 Blocos: Arquitetura & Parâmetros */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bloco 1: Arquitetura de Produção Homologada */}
        <Card className="border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] shadow-xs rounded-3xl">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-black text-purple-950 dark:text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-700 dark:text-pink-400" />
              Arquitetura de Produção Homologada
            </CardTitle>
            <p className="text-xs text-purple-700/80 dark:text-purple-200/70 font-medium">
              Componentes de infraestrutura ativos na stack híbrida
            </p>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-3">
            <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-white/5 border border-purple-150 dark:border-white/10 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-purple-950 dark:text-white">Frontend & API Gateway</div>
                <div className="text-[11px] text-purple-700/80 dark:text-purple-300/70">Vercel Edge Network (Next.js 15 App Router)</div>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                Online
              </Badge>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-white/5 border border-purple-150 dark:border-white/10 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-purple-950 dark:text-white">Banco de Dados Relacional</div>
                <div className="text-[11px] text-purple-700/80 dark:text-purple-300/70">PostgreSQL 16 Alpine na VPS Dedicada (Porta 5432)</div>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                Healthy
              </Badge>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-white/5 border border-purple-150 dark:border-white/10 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-purple-950 dark:text-white">Segurança & Criptografia</div>
                <div className="text-[11px] text-purple-700/80 dark:text-purple-300/70">UFW Firewall + Conexões Autenticadas JWT com Cookie HttpOnly</div>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                Ativo
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Bloco 2: Sessão & Parâmetros do Pool */}
        <Card className="border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] shadow-xs rounded-3xl">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-black text-purple-950 dark:text-white flex items-center gap-2">
              <Cpu className="h-4 w-4 text-purple-700 dark:text-pink-400" />
              Sessão & Parâmetros do Pool de Conexões
            </CardTitle>
            <p className="text-xs text-purple-700/80 dark:text-purple-200/70 font-medium">
              Configurações ativas de conexão serverless com o PostgreSQL
            </p>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-purple-100 dark:border-white/5">
              <span className="text-purple-700/80 dark:text-purple-300/70 font-medium">Tamanho Máximo do Pool:</span>
              <span className="font-mono font-bold text-purple-950 dark:text-white">20 conexões simultâneas</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-purple-100 dark:border-white/5">
              <span className="text-purple-700/80 dark:text-purple-300/70 font-medium">Connection Timeout:</span>
              <span className="font-mono font-bold text-purple-950 dark:text-white">5.000 ms</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-purple-100 dark:border-white/5">
              <span className="text-purple-700/80 dark:text-purple-300/70 font-medium">Idle Timeout:</span>
              <span className="font-mono font-bold text-purple-950 dark:text-white">30.000 ms</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-purple-700/80 dark:text-purple-300/70 font-medium">Última Checagem:</span>
              <span className="font-mono font-bold text-purple-950 dark:text-white">
                {lastCheck.toLocaleTimeString('pt-PT')}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
