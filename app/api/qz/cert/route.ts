import { NextResponse } from 'next/server'

/**
 * Retorna o certificado público X.509 para registro no QZ Tray.
 * Se configurado em QZ_CERTIFICATE ou QZ_PUBLIC_CERT, retorna o certificado em texto puro.
 */
export async function GET() {
  const cert = process.env.QZ_CERTIFICATE || process.env.QZ_PUBLIC_CERT

  if (!cert) {
    return new NextResponse(null, { status: 404 })
  }

  // Remove aspas eventuais e formata quebras de linha
  const formattedCert = cert.replace(/\\n/g, '\n').trim()
  return new NextResponse(formattedCert, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  })
}
