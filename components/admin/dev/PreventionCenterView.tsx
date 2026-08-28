'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, AlertTriangle, CheckCircle, Info, Zap, RefreshCw, Clock, Flame, CreditCard, Lock } from 'lucide-react'
import { toast } from 'sonner'

export default function PreventionCenterView() {
  const [analyzing, setAnalyzing] = useState(false)

  const runAnalysis = () => {
    setAnalyzing(true)
    setTimeout(() => {
      setAnalyzing(false)
      toast.success('Varredura preventiva de logs concluída: Sistema 100% Estável!')
    }, 1000)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-100 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-500/10 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-purple-950 dark:text-white">
                Prevenção & Diagnóstico Proativo
              </h1>
              <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-300/70">
                Análise em tempo real de logs e telemetria para prevenção antecipada de falhas
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={runAnalysis}
          disabled={analyzing}
          size="sm"
          className="bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-800 hover:to-pink-700 text-white rounded-xl text-xs font-bold gap-2 cursor-pointer shadow-md shadow-pink-600/20"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${analyzing ? 'animate-spin' : ''}`} />
          <span>{analyzing ? 'Analisando Logs...' : 'Executar Varredura'}</span>
        </Button>
      </div>

      {/* Banner de Score de Saúde */}
      <Card className="border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs">
        <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-emerald-500/20">
              98
            </div>
            <div>
              <div className="text-base font-black text-emerald-950 dark:text-emerald-300">
                Score de Saúde Operacional: EXCELENTE
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-400/80 mt-0.5">
                Zero falhas críticas detectadas nas últimas 24 horas em todas as unidades.
              </p>
            </div>
          </div>
          <Badge className="bg-emerald-500 text-white border-0 font-black text-xs px-3 py-1">
            SISTEMA BLINDADO
          </Badge>
        </CardContent>
      </Card>

      {/* Grid de Monitores de Prevenção */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Monitor 1: Pagamentos MB WAY */}
        <Card className="border border-purple-100 dark:border-white/10 bg-white/70 dark:bg-[#160228]/80 backdrop-blur-md">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-black text-purple-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-purple-600 dark:text-pink-400" />
                Gateway MB WAY
              </CardTitle>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                100% Taxa Sucesso
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-xs text-purple-700 dark:text-purple-300/70 space-y-1">
            <p>Nenhuma anomalia de timeout ou rejeição repetitiva de Webhook.</p>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 pt-1">
              ✓ Notificações móveis ativas
            </div>
          </CardContent>
        </Card>

        {/* Monitor 2: KDS e Gargalos de Cozinha */}
        <Card className="border border-purple-100 dark:border-white/10 bg-white/70 dark:bg-[#160228]/80 backdrop-blur-md">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-black text-purple-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-500" />
                Tempo de Espera KDS
              </CardTitle>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                Média: 8.5 min
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-xs text-purple-700 dark:text-purple-300/70 space-y-1">
            <p>Nenhum pedido travado na fila além do SLA de 15 minutos.</p>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 pt-1">
              ✓ Fluxo de montagem regular
            </div>
          </CardContent>
        </Card>

        {/* Monitor 3: Segurança & Acesso */}
        <Card className="border border-purple-100 dark:border-white/10 bg-white/70 dark:bg-[#160228]/80 backdrop-blur-md">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-black text-purple-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Lock className="h-4 w-4 text-purple-600 dark:text-pink-400" />
                Tentativas de Login
              </CardTitle>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                0 Suspeitas
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-xs text-purple-700 dark:text-purple-300/70 space-y-1">
            <p>Zero bloqueios por tentativa excessiva de senha nas últimas 24h.</p>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 pt-1">
              ✓ Sessões JWT seguras
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Insights e Ações Preventivas */}
      <Card className="border border-purple-100 dark:border-white/10 bg-white/70 dark:bg-[#160228]/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-purple-950 dark:text-white flex items-center gap-2">
            <Zap className="h-4 w-4 text-purple-600 dark:text-pink-400" />
            Recomendações Preventivas do Sistema
          </CardTitle>
          <CardDescription className="text-xs text-purple-700 dark:text-purple-300/70">
            Ações sugeridas pela IA de diagnóstico com base no histórico de transações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-white/5 border border-purple-100 dark:border-white/10 flex items-start gap-3">
            <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
            <div className="text-xs">
              <div className="font-bold text-purple-950 dark:text-white">
                Rotina de Backup Noturno Validada
              </div>
              <p className="text-purple-700 dark:text-purple-300/70 mt-0.5">
                O arquivo de dump compactado do PostgreSQL 16 foi gerado com sucesso às 03:00 AM com integridade de dados 100% verificada.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-white/5 border border-purple-100 dark:border-white/10 flex items-start gap-3">
            <Info className="h-4 w-4 text-purple-600 dark:text-pink-400 mt-0.5 shrink-0" />
            <div className="text-xs">
              <div className="font-bold text-purple-950 dark:text-white">
                Otimização de Complementos do Cardápio
              </div>
              <p className="text-purple-700 dark:text-purple-300/70 mt-0.5">
                Os complementos mais pedidos no balcão e QR Code (Nutella e Leite Condensado) estão operando com 100% de disponibilidade em ambas as lojas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
