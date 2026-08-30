import { NextRequest, NextResponse } from 'next/server'

interface TVCallRecord {
  ticket: string
  customerName?: string
  tableNumber?: string | number | null
  status?: string
  timestamp: number
  tenantId?: string
}

// Armazenamento em memória por tenant
const lastCallsByTenant: Record<string, TVCallRecord> = {}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get('tenantId') || 'default'

    const call = lastCallsByTenant[tenantId] || lastCallsByTenant['default'] || null

    return NextResponse.json({
      success: true,
      call,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { ticket, customerName, tableNumber, status, tenantId } = body

    if (!ticket) {
      return NextResponse.json({ success: false, error: 'Ticket é obrigatório' }, { status: 400 })
    }

    const record: TVCallRecord = {
      ticket,
      customerName: customerName || '',
      tableNumber: tableNumber ?? null,
      status: status || 'READY',
      timestamp: Date.now(),
      tenantId: tenantId || 'default',
    }

    if (tenantId) {
      lastCallsByTenant[tenantId] = record
    }
    lastCallsByTenant['default'] = record

    return NextResponse.json({
      success: true,
      call: record,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get('tenantId') || 'default'

    delete lastCallsByTenant[tenantId]
    delete lastCallsByTenant['default']

    return NextResponse.json({
      success: true,
      message: 'Chamada da TV limpa com sucesso',
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

