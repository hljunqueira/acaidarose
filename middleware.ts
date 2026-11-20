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

  // Identifica se a requisição é direcionada ao subdomínio de Ajuda e Manuais (ex: ajuda.acaidarose.pt)
  const isAjudaDomain = hostname === 'ajuda.acaidarose.pt' || hostname.startsWith('ajuda.')

  if (isAjudaDomain) {
    const { pathname } = request.nextUrl

    // Endpoints de API (/api/*) passam diretamente
    if (pathname.startsWith('/api')) {
      return NextResponse.next()
    }

    // Checagem de autenticação: redireciona anónimos para o login
    const authToken =
      request.cookies.get('x-auth-token')?.value ||
      request.cookies.get('auth_token')?.value ||
      request.cookies.get('token')?.value ||
      request.nextUrl.searchParams.get('token')

    if (!authToken) {
      const loginUrl = new URL('https://app.acaidarose.pt/login')
      loginUrl.searchParams.set('redirect', `https://ajuda.acaidarose.pt${pathname === '/' ? '' : pathname}`)
      return NextResponse.redirect(loginUrl)
    }

    // Reescreve internamente para as rotas sob /ajuda
    const rewritePath = pathname === '/' ? '/ajuda' : pathname.startsWith('/ajuda') ? pathname : `/ajuda${pathname}`
    const response = NextResponse.rewrite(new URL(rewritePath, request.url))
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
    return response
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
