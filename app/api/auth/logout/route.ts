import { NextRequest, NextResponse } from 'next/server'
import { getMockStore } from '@/lib/supabase/mockStore'

export async function POST(request: NextRequest) {
  const token = request.headers.get('x-auth-token')
  if (token) {
    const store = getMockStore()
    store.sessions = (store.sessions || []).filter((s: any) => s.token !== token)
  }
  return NextResponse.json({ success: true })
}
