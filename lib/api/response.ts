import { NextResponse } from 'next/server'
import { formatFriendlyErrorMessage } from '@/lib/utils/friendlyError'

export { formatFriendlyErrorMessage }

export function jsonResponse<T>(data: T, status: number = 200, headers: HeadersInit = {}) {
  const mergedHeaders = new Headers(headers)
  mergedHeaders.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  mergedHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  mergedHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token')
  mergedHeaders.set('Access-Control-Allow-Credentials', 'true')

  return NextResponse.json(data, {
    status,
    headers: mergedHeaders,
  })
}

export function errorResponse(message: string, status: number = 400, detail?: any) {
  const friendlyMessage = formatFriendlyErrorMessage(message)
  return jsonResponse({ error: friendlyMessage, ...(detail ? { detail } : {}) }, status)
}
