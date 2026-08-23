import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse } from '@/lib/api/response'
import { getAuthUser } from '@/lib/api/authGuard'

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) return errorResponse('Não autenticado', 401)
  return jsonResponse({ user })
}
