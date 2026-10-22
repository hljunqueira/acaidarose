'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import { Copy, ExternalLink, Printer, Download } from 'lucide-react'
import { useFranchiseStore, getDisplayStoreLocation } from '@/lib/stores/franchiseStore'

interface CounterQRViewProps {
  tenantId: string
}

export default function CounterQRView({ tenantId }: CounterQRViewProps) {
  const [copied, setCopied] = useState(false)
  const [detectedOrigin, setDetectedOrigin] = useState('https://acaidarose.vercel.app')
  const { currentTenant, getTenant } = useFranchiseStore()
  const qrRef = useRef<SVGSVGElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      setDetectedOrigin(isLocal ? window.location.origin : 'https://acaidarose.vercel.app')
    }
  }, [])

  const effectiveTenantId = tenantId || currentTenant?.id || '11111111-1111-1111-1111-111111111111'
  const storeInfo = getTenant(effectiveTenantId) || currentTenant
  const lojaSlug = storeInfo?.slug || 'figueira-da-foz'
  const storeTitle = getDisplayStoreLocation(storeInfo, lojaSlug)
  const balcaoUrl = `${detectedOrigin}/menu?tipo=balcao&loja=${lojaSlug}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(balcaoUrl)
      setCopied(true)
      toast.success('Link do Balcão copiado!')
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error('Não foi possível copiar o link')
    }
  }

  const handleOpenLink = () => {
    window.open(balcaoUrl, '_blank')
  }

  const handleDownloadImage = () => {
    const svgElement = qrRef.current
    if (!svgElement) return

    try {
      const svgData = new XMLSerializer().serializeToString(svgElement)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      canvas.width = 600
      canvas.height = 600

      img.onload = () => {
        if (!ctx) return
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 50, 50, 500, 500)

        const pngFile = canvas.toDataURL('image/png')
        const downloadLink = document.createElement('a')
        downloadLink.download = `QRCode_Balcao_${lojaSlug}_Acai_da_Rose.png`
        downloadLink.href = pngFile
        downloadLink.click()
        toast.success('QR Code do Balcão descarregado com sucesso!')
      }

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
    } catch {
      toast.error('Erro ao gerar download da imagem')
    }
  }

  const handlePrint = () => {
    if (!cardRef.current) {
      window.print()
      return
    }

    const printWindow = window.open('', '_blank', 'width=600,height=750')
    if (!printWindow) {
      window.print()
      return
    }

    const cardContent = cardRef.current.innerHTML

    printWindow.document.open()
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt">
      <head>
        <meta charset="utf-8" />
        <title>Placa de Balcão — Açaí da Rose</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;800;900&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
            background: #ffffff;
            color: #1b032e;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-card-single {
            border: 2.5px dashed #9333ea;
            border-radius: 24px;
            padding: 30px 24px;
            background: #ffffff;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            max-width: 320px;
            width: 100%;
          }
          .print-card-single img {
            height: 48px;
            width: auto;
            object-fit: contain;
            margin-bottom: 6px;
          }
          .print-card-single .branch {
            font-size: 11px;
            font-weight: 900;
            color: #7e22ce;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 16px;
          }
          .print-card-single .qr-box {
            background: #ffffff;
            padding: 12px;
            border-radius: 20px;
            border: 2px solid #e9d5ff;
            margin-bottom: 16px;
            display: inline-block;
          }
          .print-card-single .qr-box svg {
            display: block;
          }
          .print-card-single .table-num {
            font-size: 24px;
            font-weight: 900;
            color: #1b032e;
            letter-spacing: -0.5px;
            line-height: 1.1;
          }
          .print-card-single .instruction {
            font-size: 11px;
            font-weight: 800;
            color: #6b21a8;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 8px;
          }
        </style>
      </head>
      <body>
        <div class="print-card-single">
          ${cardContent}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="bg-white dark:bg-[#160228]/95 rounded-3xl border border-purple-150 dark:border-white/15 p-6 shadow-xs dark:shadow-xl text-slate-900 dark:text-white">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Painel Informativo da Placa de Balcão */}
        <div className="max-w-xl space-y-4">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-700 dark:text-pink-400">
              Autoatendimento Presencial
            </span>
            <h2 className="text-xl font-black text-purple-950 dark:text-white tracking-tight mt-1">
              QR Code do Balcão
            </h2>
            <p className="text-xs text-purple-800/80 dark:text-purple-200/80 mt-1 leading-relaxed">
              Disponibilize esta placa física no balcão de pedidos. O cliente aponta a câmara do telemóvel, escolhe os seus açaís e lanches, informa o seu nome e faz o pedido diretamente. O sistema acompanha a preparação e notifica o telemóvel do cliente quando a senha estiver pronta para recolha.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-white/5 border border-purple-100 dark:border-white/10 space-y-2">
            <div className="text-xs font-bold text-purple-950 dark:text-white">
              URL Oficial do Balcão ({storeTitle}):
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-black/30 border border-purple-200 dark:border-white/10 font-mono text-[11px] text-purple-900 dark:text-purple-200 break-all select-all">
              {balcaoUrl}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-wrap gap-2.5 pt-1">
            <Button
              type="button"
              onClick={handlePrint}
              className="h-10 bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 dark:hover:from-pink-500 dark:hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir Placa de Balcão</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadImage}
              className="h-10 text-xs font-bold border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-950 dark:text-white rounded-xl flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Download className="h-4 w-4" />
              <span>Descarregar Imagem PNG</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleCopyLink}
              className="h-10 text-xs font-bold border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-950 dark:text-white rounded-xl flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Copy className="h-4 w-4" />
              <span>{copied ? 'Link Copiado!' : 'Copiar Link'}</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={handleOpenLink}
              className="h-10 text-xs font-bold text-purple-800 dark:text-purple-200 hover:bg-purple-100/70 dark:hover:bg-white/10 rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Testar no Navegador ↗</span>
            </Button>
          </div>
        </div>

        {/* Pré-visualização da Placa de Balcão */}
        <div className="flex flex-col items-center justify-center">
          <div
            ref={cardRef}
            className="w-full max-w-[280px] p-6 rounded-3xl border-2 border-purple-200 dark:border-white/20 bg-gradient-to-b from-purple-50/70 via-white to-purple-50/40 dark:from-white/10 dark:via-[#160228] dark:to-white/5 flex flex-col items-center text-center shadow-lg"
          >
            <img
              src="/logo-oficial-1.png"
              alt="Açaí da Rose"
              className="h-11 w-auto object-contain mb-1 drop-shadow-xs"
            />
            <div className="text-[10px] font-black text-purple-700 dark:text-pink-400 uppercase tracking-widest mb-3">
              {storeTitle}
            </div>

            {/* QR Code SVG */}
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-purple-150 mb-3">
              <QRCodeSVG
                ref={qrRef}
                value={balcaoUrl}
                size={170}
                level="H"
                includeMargin={false}
                fgColor="#1b032e"
              />
            </div>

            <div className="text-xl font-black text-purple-950 dark:text-white tracking-tight font-mono">
              BALCÃO
            </div>
            <p className="text-[10px] text-purple-700/80 dark:text-purple-200/70 font-medium mt-1 leading-tight">
              Aponte a câmara do telemóvel para fazer o seu pedido
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
