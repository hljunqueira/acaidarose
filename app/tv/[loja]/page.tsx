'use client'

import React, { use } from 'react'
import TVOrdersPanelView from '@/components/admin/tv/TVOrdersPanelView'

interface TVLojaPageProps {
  params: Promise<{
    loja: string
  }>
}

export default function TVLojaPage({ params }: TVLojaPageProps) {
  const resolvedParams = use(params)
  const rawLoja = (resolvedParams.loja || '').toLowerCase()

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
