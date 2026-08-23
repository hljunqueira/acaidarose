'use client'

import React, { useState, useEffect } from 'react'
import { RestaurantTable } from '@/types/tables'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import {
  Copy,
  ExternalLink,
  Printer,
  QrCode,
  Sparkles,
  Smartphone,
  CheckCircle2,
  Store,
} from 'lucide-react'

interface SingleTableQRDialogProps {
  table: RestaurantTable | null
  tenantId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STORE_LABELS: Record<string, string> = {
  'tenant-aveiro': 'Filial Aveiro',
  'tenant-lisboa': 'Filial Lisboa (Parque das Nações)',
  'tenant-santarem': 'Filial Santarém',
  'tenant-torres-novas': 'Matriz Central (Torres Novas)',
}

const getStoreCityLabel = (tId?: string) => {
  if (!tId) return 'Açaí da Rose'
  if (STORE_LABELS[tId]) return STORE_LABELS[tId]
  const clean = tId.replace('tenant-', '').replace(/-/g, ' ')
  return `Filial ${clean.charAt(0).toUpperCase() + clean.slice(1)}`
}

export default function SingleTableQRDialog({ table, tenantId, open, onOpenChange }: SingleTableQRDialogProps) {
  if (!table) return null

  const [detectedOrigin, setDetectedOrigin] = useState<string>('https://acaidarose.vercel.app')
  const [customOrigin, setCustomOrigin] = useState<string>('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDetectedOrigin(window.location.origin)
    }
  }, [])

  const effectiveTenantId = table.tenantId || tenantId || 'tenant-aveiro'
  const activeOrigin = (customOrigin.trim() || detectedOrigin).replace(/\/$/, '')
  const lojaSlug = effectiveTenantId.replace('tenant-', '')
  const storeTitle = getStoreCityLabel(effectiveTenantId)
  const formattedTableNumber = table.number.toString().padStart(2, '0')
  const tableUrl = `${activeOrigin}/menu?tipo=mesa&numero=${formattedTableNumber}&loja=${encodeURIComponent(lojaSlug)}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(tableUrl)
      setCopied(true)
      toast.success('Link do QR Code copiado para a área de transferência!')
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error('Não foi possível copiar o link')
    }
  }

  const handleOpenLink = () => {
    window.open(tableUrl, '_blank')
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-6 bg-white dark:bg-[#160228] text-slate-900 dark:text-white border border-purple-150 dark:border-white/20 rounded-3xl shadow-2xl">
        <DialogHeader className="pb-3 border-b border-purple-100 dark:border-white/10 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-purple-100 dark:bg-pink-950/40 text-purple-900 dark:text-pink-300">
                <QrCode className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-black text-purple-950 dark:text-white flex items-center gap-2">
                  QR Code de Autoatendimento — Mesa {formattedTableNumber}
                </DialogTitle>
                <p className="text-xs text-purple-700/80 dark:text-purple-200/70">
                  {table.nickname || 'Salão Principal'} · {STORE_LABELS[table.tenantId] || 'Açaí da Rose'}
                </p>
              </div>
            </div>

            <Badge className="bg-purple-100 dark:bg-white/10 text-purple-950 dark:text-purple-200 border-0 text-[10px] font-bold">
              Salão
            </Badge>
          </div>
        </DialogHeader>

        {/* LAYOUT EM 2 COLUNAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-2">
          {/* COLUNA 1: CONFIGURAÇÃO, LINKS & TESTE */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-3.5">
              {/* Domínio Ativo (Automático ou Customizado) */}
              <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-white/5 border border-purple-150 dark:border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-purple-950 dark:text-white flex items-center gap-1.5">
                    <Store className="h-3.5 w-3.5 text-purple-700 dark:text-pink-400" />
                    Domínio do QR Code:
                  </Label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Auto-Detectado
                  </span>
                </div>

                <Input
                  type="text"
                  value={customOrigin}
                  onChange={(e) => setCustomOrigin(e.target.value)}
                  placeholder={detectedOrigin}
                  className="h-8 text-xs bg-white dark:bg-[#160228] border-purple-200 dark:border-white/15 text-purple-950 dark:text-white font-mono rounded-xl"
                />

                <div className="text-[10px] text-purple-700/80 dark:text-purple-300/80 break-all bg-white dark:bg-white/5 p-2 rounded-xl border border-purple-100 dark:border-white/10">
                  <span className="font-bold text-purple-950 dark:text-white">URL Gerada:</span>{' '}
                  <span className="font-mono text-pink-600 dark:text-pink-300 select-all">{tableUrl}</span>
                </div>
              </div>

              {/* Botões de Ação Rápida */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="h-9 text-xs font-bold border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-950 dark:text-white rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{copied ? 'Copiado!' : 'Copiar Link'}</span>
                </Button>

                <Button
                  type="button"
                  onClick={handleOpenLink}
                  className="h-9 text-xs font-bold bg-purple-900 hover:bg-purple-950 dark:bg-pink-600 dark:hover:bg-pink-700 text-white rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Testar Cardápio ↗</span>
                </Button>
              </div>

              {/* Instruções do Fluxo de Autoatendimento */}
              <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50/40 dark:from-white/5 dark:to-pink-950/20 border border-purple-100 dark:border-white/10 space-y-1.5 text-[11px] text-purple-950 dark:text-white">
                <div className="font-bold flex items-center gap-1.5 text-purple-900 dark:text-pink-300">
                  <Smartphone className="h-3.5 w-3.5" /> Como o cliente faz o pedido:
                </div>
                <ol className="list-decimal list-inside space-y-1 text-purple-800/80 dark:text-purple-200/80 text-[10.5px]">
                  <li>Aponta a câmara do telemóvel para a placa na mesa;</li>
                  <li>Monta o açaí e escolhe frutas e complementos;</li>
                  <li>Paga por <strong>MB WAY</strong> no telemóvel ou <strong>no balcão</strong>;</li>
                  <li>O pedido gera um <strong>#Ticket</strong> e entra no KDS da cozinha na hora.</li>
                </ol>
              </div>
            </div>

            <div className="text-[10px] text-purple-600/70 dark:text-purple-300/70 italic">
              * A mesa física permanece sempre liberada para novas rodadas de consumo.
            </div>
          </div>

          {/* COLUNA 2: PREVIEW DA PLACA FÍSICA DE MESA */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-full max-w-[260px] p-5 rounded-3xl border-2 border-purple-200 dark:border-white/20 bg-gradient-to-b from-purple-50/70 via-white to-purple-50/40 dark:from-white/10 dark:via-[#160228] dark:to-white/5 flex flex-col items-center text-center shadow-lg print:border-none print:shadow-none">
              <img
                src="/logo.png"
                alt="Açaí da Rose"
                className="h-12 w-auto object-contain mb-1 drop-shadow-xs"
              />
              <div className="text-[10px] font-black text-purple-700 dark:text-pink-400 uppercase tracking-widest mb-3">
                {storeTitle}
              </div>

              {/* QR Code SVG em Alta Fidelidade */}
              <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-purple-150 mb-3">
                <QRCodeSVG
                  value={tableUrl}
                  size={160}
                  level="H"
                  includeMargin={false}
                  fgColor="#1b032e"
                />
              </div>

              <div className="text-xl font-black text-purple-950 dark:text-white tracking-tight font-mono">
                MESA {formattedTableNumber}
              </div>
              <p className="text-[10px] text-purple-700/80 dark:text-purple-200/70 font-medium mt-0.5 leading-tight">
                Aponte a câmara do telemóvel para fazer o seu pedido
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-purple-100 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto h-8 text-xs rounded-xl"
          >
            Fechar
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handlePrint}
            className="w-full sm:w-auto h-8 bg-purple-900 hover:bg-purple-950 dark:bg-pink-600 dark:hover:bg-pink-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Imprimir Placa da Mesa</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
