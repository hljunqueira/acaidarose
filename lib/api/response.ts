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

export function errorResponse(
  errorOrMessage: any,
  fallbackOrStatus: string | number = 400,
  maybeStatus: number = 500
) {
  let rawMessage = ''
  let status = 400

  if (typeof errorOrMessage === 'string') {
    rawMessage = errorOrMessage
    if (typeof fallbackOrStatus === 'number') {
      status = fallbackOrStatus
    }
  } else if (errorOrMessage && typeof errorOrMessage === 'object' && errorOrMessage.message) {
    rawMessage = typeof fallbackOrStatus === 'string' ? errorOrMessage.message : errorOrMessage.message
    status = typeof fallbackOrStatus === 'number' ? fallbackOrStatus : maybeStatus
  } else {
    rawMessage = typeof fallbackOrStatus === 'string' ? fallbackOrStatus : 'Ocorreu um erro inesperado'
    status = typeof fallbackOrStatus === 'number' ? fallbackOrStatus : 500
  }

  const friendlyMessage = formatFriendlyErrorMessage(rawMessage)
  return jsonResponse({ error: friendlyMessage }, status)
}
