import { NextResponse } from 'next/server'

export function jsonResponse<T>(data: T, status: number = 200, headers: HeadersInit = {}) {
  const response = NextResponse.json(data, { status, headers })
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

export function errorResponse(message: string, status: number = 400, detail?: any) {
  return jsonResponse({ error: message, ...(detail ? { detail } : {}) }, status)
}
