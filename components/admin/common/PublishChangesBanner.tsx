'use client'

import React, { useState, useEffect } from 'react'
import { usePublishStore } from '@/lib/stores/publishStore'
import { useAuthStore } from '@/lib/stores/authStore'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { RefreshCw, Sparkles, ListChecks, CheckCircle2, Globe, AlertCircle } from 'lucide-react'

interface PublishChangesBannerProps {
  tenantId: string
  storeName: string
}

export default function PublishChangesBanner({ tenantId, storeName }: PublishChangesBannerProps) {
  const { authFetch, user } = useAuthStore()
  const {
    hasPendingChanges,
    pendingCount,
    pendingSummary,
    currentVersion,
    isPublishing,
    checkPending,
    publish,
  } = usePublishStore()

  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [replicateAll, setReplicateAll] = useState(false)

  const isSuperOrFranchisor = user?.role === 'SUPER_ADMIN' || user?.role === 'FRANCHISOR_ADMIN'

  // Consulta status de pendência ao trocar de loja ou montar
  useEffect(() => {
    if (tenantId) {
      checkPending(tenantId, authFetch)
      const interval = setInterval(() => {
        checkPending(tenantId, authFetch)
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [tenantId, checkPending, authFetch])

  const handlePublishNow = async (replicate = false) => {
    const res = await publish(tenantId, { replicateAll: replicate }, authFetch)
    if (res.success) {
      toast.success(res.message || 'Cardápio e configurações publicados com sucesso!')
      setDetailsModalOpen(false)
      setReplicateAll(false)
    } else {
      toast.error(res.message || 'Erro ao publicar alterações')
    }
  }

  if (!hasPendingChanges) {
    return null
  }

  return (
    <>
      {/* BANNER FLUTUANTE DE ALTO IMPACTO */}
      <div className="w-full bg-gradient-to-r from-amber-600 via-pink-600 to-purple-800 text-white px-4 py-2.5 shadow-lg border-b border-white/20 animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-7 w-7 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-amber-200 animate-pulse" />
            </div>
            <div className="text-xs sm:text-sm font-black leading-tight truncate">
              <span>Há alterações aguardando publicação em </span>
              <strong className="underline decoration-amber-300 font-extrabold">{storeName}</strong>
              <Badge className="ml-2 bg-white/20 text-white font-mono text-[10px] border-white/30">
                {pendingCount} {pendingCount === 1 ? 'modificação' : 'modificações'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {pendingSummary.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDetailsModalOpen(true)}
                className="h-8 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 border-white/30 text-white font-bold text-xs cursor-pointer shadow-xs transition"
              >
                <ListChecks className="h-3.5 w-3.5 mr-1" />
                <span>Ver Lista ({pendingCount})</span>
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              disabled={isPublishing}
              onClick={() => handlePublishNow(false)}
              className="h-8 px-3.5 rounded-xl bg-white text-purple-950 hover:bg-purple-50 font-black text-xs shadow-md cursor-pointer transition flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-pink-600 ${isPublishing ? 'animate-spin' : ''}`} />
              <span>{isPublishing ? 'Publicando...' : 'Publicar Alterações'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* MODAL COM RESUMO DETALHADO DAS ALTERAÇÕES PENDENTES */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-[#160228] text-foreground border-purple-100 dark:border-white/10 rounded-3xl p-6 shadow-2xl">
          <DialogTitle className="text-base sm:text-lg font-black text-purple-950 dark:text-white flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-pink-600" />
            <span>Alterações Pendentes de Publicação</span>
          </DialogTitle>

          <div className="space-y-3 my-3">
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
              <p className="font-bold flex items-center gap-1.5 mb-1">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Impacto Operacional</span>
              </p>
              <p>
                As alterações abaixo foram salvas no banco de dados, mas os clientes nas mesas (`/menu`) e as Smart TVs da loja só receberão as atualizações após a publicação oficial.
              </p>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {pendingSummary.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-purple-50/50 dark:bg-white/5 border border-purple-100 dark:border-white/10 text-xs flex items-start gap-2"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-pink-600 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-foreground">{item.reason}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {new Date(item.timestamp).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {isSuperOrFranchisor && (
              <label className="flex items-center gap-2 p-3 rounded-2xl bg-purple-50 dark:bg-white/5 border border-purple-200 dark:border-white/15 cursor-pointer">
                <input
                  type="checkbox"
                  checked={replicateAll}
                  onChange={(e) => setReplicateAll(e.target.checked)}
                  className="h-4 w-4 rounded accent-pink-600 cursor-pointer"
                />
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-purple-600 dark:text-pink-400" />
                  <span>Replicar e publicar para todas as lojas da rede (Franqueadora)</span>
                </span>
              </label>
            )}
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-2 border-t border-purple-100 dark:border-white/10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDetailsModalOpen(false)}
              className="rounded-xl text-xs font-bold"
            >
              Fechar
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={isPublishing}
              onClick={() => handlePublishNow(replicateAll)}
              className="rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-800 hover:to-pink-700 text-white font-bold text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isPublishing ? 'animate-spin' : ''}`} />
              <span>{isPublishing ? 'Publicando...' : replicateAll ? 'Publicar na Rede Toda' : 'Publicar Agora'}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
