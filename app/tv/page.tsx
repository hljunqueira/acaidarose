'use client'

import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import TVOrdersPanelView from '@/components/admin/tv/TVOrdersPanelView'

function TVContent() {
  const searchParams = useSearchParams()

  const rawLoja = (searchParams.get('loja') || searchParams.get('tenantId') || searchParams.get('tenant') || '1').toLowerCase()

  const tenantId =
    rawLoja.includes('torres') || rawLoja === '2' || rawLoja.includes('2222')
      ? '22222222-2222-2222-2222-222222222222'
      : '11111111-1111-1111-1111-111111111111'

  return (
    <div className="min-h-screen w-full bg-[#180424] flex flex-col justify-center">
      <TVOrdersPanelView tenantId={tenantId} />
    </div>
  )
}

export default function TVPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#180424] flex items-center justify-center text-purple-300 font-bold">
          A carregar painel de senhas...
        </div>
      }
    >
      <TVContent />
    </Suspense>
  )
}
