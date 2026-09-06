'use client'

import React, { use } from 'react'
import TVOrdersPanelView from '@/components/admin/tv/TVOrdersPanelView'
import { resolveTenant, useFranchiseStore } from '@/lib/stores/franchiseStore'

interface TVLojaPageProps {
  params: Promise<{
    loja: string
  }>
}

export default function TVLojaPage({ params }: TVLojaPageProps) {
  const resolvedParams = use(params)
  const rawLoja = resolvedParams.loja || ''
  const { tenants } = useFranchiseStore()

  const tenant = resolveTenant(rawLoja, tenants)

  return (
    <div className="min-h-screen w-full bg-[#180424] flex flex-col justify-center">
      <TVOrdersPanelView tenantId={tenant.id} lojaSlug={rawLoja} />
    </div>
  )
}
