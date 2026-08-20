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
    const found = store.users.find(
      (u: any) => u.email.toLowerCase() === cleanEmail && !u.deletedAt && u.active
    )

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
