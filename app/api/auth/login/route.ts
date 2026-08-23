import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { getMockStore } from '@/lib/supabase/mockStore'
import { User, UserRole } from '@/types'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email e palavra-passe são obrigatórios' }, { status: 400 })
    }

    const cleanEmail = String(email).toLowerCase().trim()

    // 1. Supabase lookup if available
    if (supabaseServer) {
      const { data, error } = await supabaseServer
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .is('deleted_at', null)
        .single()

      if (data && !error && data.active) {
        const token = data.id
        const user: User = {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role as UserRole,
          tenantId: data.tenant_id,
          active: data.active,
        }
        return NextResponse.json({ token, user })
      }
    }

    // 2. MockStore Fallback
    const store = getMockStore()
    
    // Normalização para aceitar aliases conhecidos de demonstração
    let lookupEmail = cleanEmail
    if (cleanEmail === 'super@acairose.pt') lookupEmail = 'franqueadora@acairose.pt'
    if (cleanEmail === 'admin@acairose.pt') lookupEmail = 'torresnovas@acairose.pt'
    if (cleanEmail === 'caixa@acairose.pt') lookupEmail = 'caixa1.torresnovas@acairose.pt'

    let found = store.users.find(
      (u: any) =>
        (u.email.toLowerCase() === cleanEmail || u.email.toLowerCase() === lookupEmail) &&
        !u.deletedAt &&
        u.active
    )

    // Se ainda não encontrou no mock, fallback direto para os perfis demo padrão das 3 lojas
    if (!found) {
      if (cleanEmail === 'super@acairose.pt' || cleanEmail === 'franqueadora@acairose.pt') {
        found = {
          id: 'usr-franqueadora',
          tenantId: 'tenant-torres-novas',
          name: 'Açaí da Rose (Franqueadora)',
          email: cleanEmail,
          password: '123456',
          passwordHash: '123456',
          role: 'SUPER_ADMIN' as UserRole,
          active: true,
        } as any
      } else if (cleanEmail === 'admin@acairose.pt' || cleanEmail === 'torresnovas@acairose.pt') {
        found = {
          id: 'usr-gerente-torres',
          tenantId: 'tenant-torres-novas',
          name: 'Gerente Torres Novas',
          email: cleanEmail,
          password: '123456',
          passwordHash: '123456',
          role: 'TENANT_ADMIN' as UserRole,
          active: true,
        } as any
      } else if (cleanEmail === 'santarem@acairose.pt') {
        found = {
          id: 'usr-gerente-santarem',
          tenantId: 'tenant-santarem',
          name: 'Gerente Santarém',
          email: cleanEmail,
          password: '123456',
          passwordHash: '123456',
          role: 'TENANT_ADMIN' as UserRole,
          active: true,
        } as any
      } else if (cleanEmail === 'aveiro@acairose.pt') {
        found = {
          id: 'usr-gerente-aveiro',
          tenantId: 'tenant-aveiro',
          name: 'Gerente Aveiro',
          email: cleanEmail,
          password: '123456',
          passwordHash: '123456',
          role: 'TENANT_ADMIN' as UserRole,
          active: true,
        } as any
      } else if (cleanEmail === 'caixa@acairose.pt' || cleanEmail.startsWith('caixa')) {
        found = {
          id: 'usr-caixa1-torres',
          tenantId: 'tenant-torres-novas',
          name: 'Operador de Caixa',
          email: cleanEmail,
          password: '123456',
          passwordHash: '123456',
          role: 'CASHIER' as UserRole,
          active: true,
        } as any
      }
    }

    if (!found || (found.password !== password && found.passwordHash !== password)) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
    }

    const token = 'token-' + uuidv4()
    store.sessions = store.sessions || []
    store.sessions.push({ token, userId: found.id, createdAt: new Date().toISOString() })

    const { password: _, passwordHash: __, ...safeUser } = found
    return NextResponse.json({ token, user: safeUser })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno de autenticação' }, { status: 500 })
  }
}
