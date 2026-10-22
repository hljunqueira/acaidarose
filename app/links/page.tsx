'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { QRCodeSVG } from 'qrcode.react'
import {
  Phone,
  PhoneCall,
  Globe,
  Instagram,
  Facebook,
  UserPlus,
  Download,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  X
} from 'lucide-react'
import { toast } from 'sonner'

export default function LinksPage() {
  const [showQrModal, setShowQrModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [targetUrl, setTargetUrl] = useState('https://acaidarose.pt/links')
  const qrRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      setTargetUrl(isLocal ? `${window.location.origin}/links` : 'https://acaidarose.pt/links')
    }
  }, [])

  // Gerador de vCard
  const handleDownloadVCard = () => {
    const vCardData = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'FN:Açaí da Rose',
      'ORG:Açaí da Rose',
      'TITLE:O Autêntico Açaí Brasileiro',
      'TEL;TYPE=WORK,VOICE:+351249825131',
      'TEL;TYPE=CELL,VOICE,WHATSAPP:+351911050264',
      'URL:https://acaidarose.pt',
      'X-SOCIALPROFILE;type=instagram:https://www.instagram.com/acaidarose_pt',
      'X-SOCIALPROFILE;type=facebook:https://www.facebook.com/profile.php?id=61550988842732&sk=directory_personal_details',
      'NOTE:Açaí da Rose - O Autêntico Açaí Brasileiro em Portugal.\\nFixo: 249 825 131\\nWhatsApp: 911 050 264\\nSite: https://acaidarose.pt\\nInstagram: @acaidarose_pt\\nFacebook: Açaí da Rose',
      'END:VCARD'
    ].join('\r\n')

    const blob = new Blob([vCardData], { type: 'text/vcard;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'Acai_da_Rose_Contactos.vcf')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Ficheiro de contacto descarregado!')
  }

  // Copiar link do Hub
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl)
      setCopied(true)
      toast.success('Link copiado!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Não foi possível copiar o link')
    }
  }

  // Descarregar imagem PNG do QR Code
  const handleDownloadQrPng = () => {
    const svgElement = qrRef.current
    if (!svgElement) return

    try {
      const svgData = new XMLSerializer().serializeToString(svgElement)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new window.Image()

      canvas.width = 1000
      canvas.height = 1000

      img.onload = () => {
        if (!ctx) return
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 50, 50, 900, 900)

        const pngFile = canvas.toDataURL('image/png')
        const downloadLink = document.createElement('a')
        downloadLink.download = 'QRCode_Acai_da_Rose_Oficial.png'
        downloadLink.href = pngFile
        downloadLink.click()
        toast.success('QR Code descarregado em alta resolução!')
      }

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
    } catch {
      toast.error('Erro ao gerar download da imagem')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#180126] via-[#240338] to-[#11001c] text-white flex flex-col items-center justify-start p-4 sm:p-6 antialiased selection:bg-pink-600 selection:text-white">
      <main className="w-full max-w-md flex flex-col items-center text-center space-y-6 pb-12 pt-4">
        {/* Logo Oficial */}
        <div className="relative group pt-2">
          <div className="absolute -inset-2 bg-gradient-to-r from-pink-600 to-purple-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-60 transition duration-500" />
          <div className="relative bg-white/10 p-4 rounded-3xl border border-white/20 shadow-2xl backdrop-blur-xl">
            <Image
              src="/logo-oficial-1.png"
              alt="Açaí da Rose Oficial"
              width={160}
              height={75}
              priority
              className="h-16 w-auto object-contain drop-shadow-md"
            />
          </div>
        </div>

        {/* Identificação Institucional */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
            <span>Açaí da Rose</span>
            <span className="text-xs text-pink-400 font-bold -mt-3">®</span>
          </h1>
          <p className="text-xs sm:text-sm text-purple-200/80 font-medium">
            O Autêntico Açaí Brasileiro · Contactos Oficiais
          </p>
        </div>

        {/* Bloco de Botões de Redirecionamento Direto */}
        <div className="w-full space-y-3 pt-2">
          {/* 1. WHATSAPP */}
          <a
            href="https://wa.me/351911050264?text=Ol%C3%A1!%20Gostaria%20de%20informa%C3%A7%C3%B5es%20do%20A%C3%A7a%C3%AD%20da%20Rose."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full group p-4 rounded-2xl bg-gradient-to-r from-emerald-600/90 to-emerald-500/90 hover:from-emerald-500 hover:to-emerald-400 border border-emerald-400/30 text-white flex items-center justify-between shadow-lg shadow-emerald-950/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-white flex-shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-black text-white">Conversar no WhatsApp</div>
                <div className="text-xs text-emerald-100 font-mono font-bold">911 050 264</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-emerald-100 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </a>

          {/* 2. TELEFONE FIXO */}
          <a
            href="tel:+351249825131"
            className="w-full group p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 hover:border-pink-500/40 text-white flex items-center justify-between shadow-lg shadow-purple-950/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 backdrop-blur-md"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-purple-500/20 text-pink-300 flex items-center justify-center flex-shrink-0 border border-purple-400/20">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-black text-white">Ligar para o Fixo</div>
                <div className="text-xs text-purple-200 font-mono font-bold">249 825 131</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-purple-300 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </a>

          {/* 3. SITE OFICIAL & EMENTA */}
          <a
            href="https://acaidarose.pt"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full group p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 hover:border-pink-500/40 text-white flex items-center justify-between shadow-lg shadow-purple-950/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 backdrop-blur-md"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-purple-500/20 text-purple-200 flex items-center justify-center flex-shrink-0 border border-purple-400/20">
                <Globe className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-black text-white">Site & Ementa Digital</div>
                <div className="text-xs text-purple-200 font-medium">acaidarose.pt</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-purple-300 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </a>

          {/* 4. INSTAGRAM */}
          <a
            href="https://www.instagram.com/acaidarose_pt"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full group p-4 rounded-2xl bg-gradient-to-r from-purple-600/70 via-pink-600/70 to-amber-600/70 hover:from-purple-500 hover:via-pink-500 hover:to-amber-500 border border-white/20 text-white flex items-center justify-between shadow-lg shadow-pink-950/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-white flex-shrink-0">
                <Instagram className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-black text-white">Instagram Oficial</div>
                <div className="text-xs text-pink-100 font-medium">@acaidarose_pt</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-pink-100 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </a>

          {/* 5. FACEBOOK */}
          <a
            href="https://www.facebook.com/profile.php?id=61550988842732&sk=directory_personal_details"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full group p-4 rounded-2xl bg-gradient-to-r from-blue-600/90 to-blue-700/90 hover:from-blue-500 hover:to-blue-600 border border-white/20 text-white flex items-center justify-between shadow-lg shadow-blue-950/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-white flex-shrink-0">
                <Facebook className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-black text-white">Facebook Oficial</div>
                <div className="text-xs text-blue-100 font-medium">Açaí da Rose</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-blue-100 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </a>

          {/* 6. BOTÃO DE AÇÃO: GUARDAR NA AGENDA DO TELEMÓVEL */}
          <button
            onClick={handleDownloadVCard}
            className="w-full group p-4 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 border border-pink-400/40 text-white flex items-center justify-between shadow-xl shadow-pink-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white/25 flex items-center justify-center text-white flex-shrink-0 shadow-inner">
                <UserPlus className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-black text-white">Guardar na Agenda</div>
                <div className="text-xs text-pink-100 font-medium">Salvar contacto com todos os números</div>
              </div>
            </div>
            <Download className="w-4 h-4 text-white opacity-80 group-hover:opacity-100 group-hover:translate-y-0.5 transition-all" />
          </button>
        </div>

        {/* Rodapé Limpo */}
        <div className="w-full pt-4 border-t border-white/10 flex items-center justify-between text-xs text-purple-200/70">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 hover:text-white transition py-2 px-3 rounded-lg hover:bg-white/5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar Link'}</span>
          </button>

          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-1.5 text-pink-400 hover:text-pink-300 font-bold transition py-2 px-3 rounded-lg hover:bg-white/5"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Ver QR Code</span>
          </button>
        </div>
      </main>

      {/* MODAL: SOMENTE O QR CODE */}
      {showQrModal && (
        <div
          className="fixed inset-0 bg-[#0a0012]/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="bg-[#1b022b] border border-white/20 rounded-3xl p-6 max-w-xs w-full flex flex-col items-center text-center shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-base font-bold text-white mb-4">QR Code dos Contactos</div>

            <div className="bg-white p-3.5 rounded-2xl shadow-xl mb-4 flex items-center justify-center">
              <QRCodeSVG
                ref={qrRef}
                value={targetUrl}
                size={230}
                level="H"
                includeMargin={false}
                imageSettings={{
                  src: '/logo-oficial-1.png',
                  x: undefined,
                  y: undefined,
                  height: 48,
                  width: 48,
                  excavate: true,
                }}
              />
            </div>

            <button
              onClick={handleDownloadQrPng}
              className="w-full py-3 px-4 rounded-xl text-xs font-black bg-pink-600 hover:bg-pink-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-pink-600/30 transition hover:scale-105"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Imagem (PNG)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
