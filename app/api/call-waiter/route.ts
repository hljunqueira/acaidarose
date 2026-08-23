import { NextRequest, NextResponse } from 'next/server'

// Armazenamento em memória de chamados de mesa ativos
let tableCalls: Array<{
  id: string
  tenantId: string
  tableLabel: string
  reason: string
  status: 'PENDING' | 'RESOLVED'
  createdAt: string
}> = []

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const tenantId = url.searchParams.get('tenantId')

  const filtered = tenantId
    ? tableCalls.filter((c) => c.tenantId === tenantId && c.status === 'PENDING')
    : tableCalls.filter((c) => c.status === 'PENDING')

  return NextResponse.json({ calls: filtered })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tenantId, tableLabel, reason } = body

    const newCall = {
      id: `call-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tenantId: tenantId || 'tenant-torres-novas',
      tableLabel: tableLabel || 'Mesa',
      reason: reason || 'Atendimento de Mesa',
      status: 'PENDING' as const,
      createdAt: new Date().toISOString(),
    }

    tableCalls.unshift(newCall)

    // Manter histórico razoável
    if (tableCalls.length > 50) tableCalls = tableCalls.slice(0, 50)

    return NextResponse.json({ success: true, call: newCall }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao registar chamado' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { callId, status } = body

    tableCalls = tableCalls.map((c) => (c.id === callId ? { ...c, status } : c))

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar chamado' }, { status: 500 })
  }
}
