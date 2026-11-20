'use client'

import React from 'react'
import { HelpCircle } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/authStore'

export default function AppHelpFloatingButton() {
  const { token } = useAuthStore()

  const handleOpenHelp = () => {
    // Monta a URL de destino com o token caso necessário para cross-subdomain imediato
    const baseUrl = 'https://ajuda.acaidarose.pt'
    const targetUrl = token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl
    window.open(targetUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <aside aria-label="Central de Ajuda e Manuais" className="fixed bottom-5 right-5 z-40 select-none print:hidden">
      <button
        type="button"
        onClick={handleOpenHelp}
        className="group flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-[#240b36] hover:bg-[#34114d] text-white text-xs font-bold shadow-lg hover:shadow-xl border border-purple-400/20 hover:border-purple-300/40 transition-all duration-200 cursor-pointer"
        title="Abrir Central de Manuais e Ajuda em nova aba"
      >
        <HelpCircle className="h-4 w-4 text-purple-300 group-hover:text-white transition-colors" />
        <span className="tracking-tight">Ajuda</span>
      </button>
    </aside>
  )
}
