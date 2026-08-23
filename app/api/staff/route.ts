import { NextRequest, NextResponse } from 'next/server'
import { getStaffByTenant, createStaffMember } from '@/lib/repositories/staffRepository'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get('tenantId') || 'tenant-torres-novas'
    const staff = await getStaffByTenant(tenantId)
    return NextResponse.json({ staff })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao carregar colaboradores' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.name || !body.code) {
      return NextResponse.json({ error: 'Nome e código são obrigatórios' }, { status: 400 })
    }
    const created = await createStaffMember(body)
    return NextResponse.json(created, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao criar colaborador' }, { status: 500 })
  }
}
