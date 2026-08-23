import { NextRequest, NextResponse } from 'next/server'
import { getMockStore } from '@/lib/supabase/mockStore'
import { setStoreProductPrice } from '@/lib/repositories/productsRepository'

export interface FranchisePriceRequest {
  id: string
  tenantId: string
  storeName: string
  managerName: string
  type: 'PRICE_CHANGE' | 'NEW_PRODUCT' | 'SPECIAL_PROMO'
  productId: string
  productName: string
  productImage: string
  category: string
  currentPrice: number
  suggestedPrice: number
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  resolvedAt?: string
  resolvedBy?: string
  responseNotes?: string
}

const DEFAULT_REQUESTS: FranchisePriceRequest[] = [
  {
    id: 'req-001',
    tenantId: 'tenant-aveiro',
    storeName: 'Açaí da Rose — Filial Aveiro',
    managerName: 'Gerente Rui Fernandes',
    type: 'PRICE_CHANGE',
    productId: 'cnt-500',
    productName: 'Açaí 500g',
    productImage: '/images/official/acai_copo_500g.jpg',
    category: 'Copos Master',
    currentPrice: 12.90,
    suggestedPrice: 13.50,
    reason: 'Ajuste decorrente do custo logístico de distribuição de frutas frescas diárias na região de Aveiro.',
    status: 'PENDING',
    createdAt: 'Hoje, 11:42',
  },
  {
    id: 'req-002',
    tenantId: 'tenant-lisboa',
    storeName: 'Açaí da Rose — Filial Lisboa (Parque das Nações)',
    managerName: 'Gerente Carlos Ribeiro',
    type: 'PRICE_CHANGE',
    productId: 'cnt-750',
    productName: 'Açaí 750g',
    productImage: '/images/official/acai_tigela_750g.jpg',
    category: 'Copos Master',
    currentPrice: 18.90,
    suggestedPrice: 19.50,
    reason: 'Alinhamento com a média de mercado da zona nobre do Parque das Nações.',
    status: 'APPROVED',
    createdAt: 'Ontem, 16:20',
    resolvedAt: 'Ontem, 18:00',
    resolvedBy: 'Holding Açaí da Rose',
    responseNotes: 'Aprovado pela Holding. Preço atualizado no cardápio de Lisboa.',
  },
  {
    id: 'req-003',
    tenantId: 'tenant-santarem',
    storeName: 'Açaí da Rose — Filial Santarém',
    managerName: 'Gerente Beatriz Costa',
    type: 'SPECIAL_PROMO',
    productId: 'cnt-350',
    productName: 'Açaí 350g',
    productImage: '/images/official/acai_copo_350g.jpg',
    category: 'Copos Master',
    currentPrice: 9.00,
    suggestedPrice: 8.50,
    reason: 'Campanha de incentivo de terça-feira para estudantes universitários de Santarém.',
    status: 'APPROVED',
    createdAt: '18/08/2026',
    resolvedAt: '18/08/2026',
    resolvedBy: 'Holding Açaí da Rose',
    responseNotes: 'Autorizada promoção pontual de terça-feira.',
  },
]

export async function GET() {
  try {
    const store = getMockStore() as any
    if (!store.franchiseRequests) {
      store.franchiseRequests = [...DEFAULT_REQUESTS]
    }
    return NextResponse.json({ requests: store.franchiseRequests })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao carregar solicitações' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const store = getMockStore() as any
    if (!store.franchiseRequests) {
      store.franchiseRequests = [...DEFAULT_REQUESTS]
    }

    const newReq: FranchisePriceRequest = {
      id: `req-${Date.now()}`,
      tenantId: body.tenantId || 'tenant-aveiro',
      storeName: body.storeName || 'Açaí da Rose — Filial',
      managerName: body.managerName || 'Gerente',
      type: body.type || 'PRICE_CHANGE',
      productId: body.productId || 'cnt-500',
      productName: body.productName || 'Açaí 500g',
      productImage: body.productImage || '/images/official/acai_copo_500g.jpg',
      category: body.category || 'Copos Master',
      currentPrice: Number(body.currentPrice) || 12.90,
      suggestedPrice: Number(body.suggestedPrice) || 13.50,
      reason: body.reason || 'Reajuste operacional solicitado pela loja.',
      status: 'PENDING',
      createdAt: 'Agora mesmo',
    }

    store.franchiseRequests.unshift(newReq)
    return NextResponse.json({ success: true, request: newReq })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao criar solicitação' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, action, responseNotes, resolvedBy } = body
    const store = getMockStore() as any
    if (!store.franchiseRequests) {
      store.franchiseRequests = [...DEFAULT_REQUESTS]
    }

    const target = store.franchiseRequests.find((r: FranchisePriceRequest) => r.id === id)
    if (!target) {
      return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 })
    }

    if (action === 'APPROVE') {
      target.status = 'APPROVED'
      target.resolvedAt = 'Agora'
      target.resolvedBy = resolvedBy || 'Holding Açaí da Rose'
      target.responseNotes = responseNotes || 'Aprovado pela Holding. Sincronizado com o cardápio da unidade.'

      // Sincronização Real: Atualiza o preço do produto para aquela loja específica
      if (target.tenantId) {
        if (target.productId) {
          await setStoreProductPrice(target.tenantId, target.productId, target.suggestedPrice)
        }
        // Encontra o container correspondente pelo nome/peso
        const container = store.containers.find((c: any) =>
          c.id === target.productId ||
          c.name.toLowerCase().trim() === target.productName.toLowerCase().trim() ||
          (target.productName.includes('500') && c.weightGrams === 500) ||
          (target.productName.includes('750') && c.weightGrams === 750) ||
          (target.productName.includes('700') && c.weightGrams === 750) ||
          (target.productName.includes('350') && c.weightGrams === 350) ||
          (target.productName.includes('250') && c.weightGrams === 250) ||
          (target.productName.includes('1') && c.weightGrams === 1000)
        )
        if (container) {
          await setStoreProductPrice(target.tenantId, container.id, target.suggestedPrice)
        }
      }
    } else if (action === 'REJECT') {
      target.status = 'REJECTED'
      target.resolvedAt = 'Agora'
      target.resolvedBy = resolvedBy || 'Holding Açaí da Rose'
      target.responseNotes = responseNotes || 'Solicitação recusada pela Holding.'
    }

    return NextResponse.json({ success: true, request: target })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao processar solicitação' }, { status: 500 })
  }
}
