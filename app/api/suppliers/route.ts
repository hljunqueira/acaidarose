import { NextRequest, NextResponse } from 'next/server'
import { getSuppliers, createSupplier } from '@/lib/repositories/inventoryRepository'

export async function GET() {
  try {
    const suppliers = await getSuppliers()
    return NextResponse.json({ suppliers })
  } catch (err: any) {
    console.error('Erro na rota GET /api/suppliers:', err)
    return NextResponse.json({ error: err.message || 'Erro ao consultar fornecedores' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, nif, email, phone, category, leadTimeDays } = body

    if (!name) {
      return NextResponse.json({ error: 'Nome do fornecedor é obrigatório' }, { status: 400 })
    }

    const supplier = await createSupplier({
      name,
      nif,
      email,
      phone,
      category,
      leadTimeDays: leadTimeDays ? Number(leadTimeDays) : 3,
    })

    return NextResponse.json({ supplier }, { status: 201 })
  } catch (err: any) {
    console.error('Erro na rota POST /api/suppliers:', err)
    return NextResponse.json({ error: err.message || 'Erro ao criar fornecedor' }, { status: 500 })
  }
}
