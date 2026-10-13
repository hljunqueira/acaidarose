import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Extrai o host da requisição (compatível com proxies reversos Cloudflare / Vercel)
  const host =
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    request.nextUrl.hostname

  const hostname = (host || '').split(':')[0].toLowerCase()

  // Identifica se a requisição é direcionada ao subdomínio da API (ex: api.acaidarose.pt)
  const isApiDomain = hostname === 'api.acaidarose.pt' || hostname.startsWith('api.')

  if (isApiDomain) {
    const { pathname } = request.nextUrl

    // Endpoints de API backend (/api/*) passam diretamente para seus respectivos handlers
    if (pathname.startsWith('/api')) {
      return NextResponse.next()
    }

    // Para a raiz (/) ou qualquer rota de interface web, responde com o JSON de Gateway da API
    return NextResponse.json(
      {
        service: 'Açaí da Rose API Gateway',
        status: 'online',
        version: '1.0.0',
        docs: 'https://acaidarose.pt',
        message: 'Açaí da Rose REST API Gateway. Endpoints disponíveis em /api/*',
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Intercepta requisições exceto bundles estáticos do Next.js e favicon
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
