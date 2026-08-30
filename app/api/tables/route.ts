import { NextRequest, NextResponse } from 'next/server'
import { getTablesByTenant, createTable, createBatchTables, deleteAllTablesByTenant } from '@/lib/repositories/tablesRepository'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get('tenantId') || 'tenant-torres-novas'
    const tables = await getTablesByTenant(tenantId)
    return NextResponse.json({ tables })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao carregar mesas' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Lote de mesas
    if (body.isBatch && body.startNumber && body.endNumber) {
      const created = await createBatchTables(
        body.tenantId || 'tenant-torres-novas',
        Number(body.startNumber),
        Number(body.endNumber),
        body.assignedStaffId,
        body.assignedStaffName
      )
      return NextResponse.json({ tables: created }, { status: 201 })
    }

    if (!body.number) {
      return NextResponse.json({ error: 'Número da mesa é obrigatório' }, { status: 400 })
    }

    const created = await createTable(body)
    return NextResponse.json(created, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao criar mesa' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get('tenantId') || '11111111-1111-1111-1111-111111111111'
    await deleteAllTablesByTenant(tenantId)
    return NextResponse.json({ success: true, message: 'Todas as mesas foram excluídas' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao excluir todas as mesas' }, { status: 500 })
  }
}
