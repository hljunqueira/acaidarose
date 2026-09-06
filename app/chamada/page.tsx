'use client'

import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import TVOrdersPanelView from '@/components/admin/tv/TVOrdersPanelView'
import { resolveTenant, useFranchiseStore } from '@/lib/stores/franchiseStore'

function ChamadaContent() {
  const searchParams = useSearchParams()
  const { tenants } = useFranchiseStore()

  const rawLoja = searchParams.get('loja') || searchParams.get('tenantId') || searchParams.get('tenant') || '1'
  const tenant = resolveTenant(rawLoja, tenants)

  return (
    <div className="min-h-screen w-full bg-[#0e011a] flex flex-col justify-center">
      <TVOrdersPanelView tenantId={tenant.id} lojaSlug={rawLoja} />
    </div>
  )
}

export default function ChamadaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0612] flex items-center justify-center text-purple-300 font-bold">
        A carregar painel de senhas...
      </div>
    }>
      <ChamadaContent />
    </Suspense>
  )
}
