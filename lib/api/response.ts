import { NextResponse } from 'next/server'

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
  return jsonResponse({ error: message, ...(detail ? { detail } : {}) }, status)
}
