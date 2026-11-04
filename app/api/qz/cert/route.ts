import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

/**
 * Retorna o certificado público X.509 para registro no QZ Tray.
 * Se configurado em QZ_CERTIFICATE ou QZ_PUBLIC_CERT (ou no arquivo certificates/), retorna em texto puro.
 */
export async function GET() {
  let cert = process.env.QZ_CERTIFICATE || process.env.QZ_PUBLIC_CERT

  // Fallback seguro: carregar diretamente do arquivo certificates/
  if (!cert) {
    try {
      const certPath = path.join(process.cwd(), 'certificates', 'acaidarose-qz-cert.crt')
      if (fs.existsSync(certPath)) {
        cert = fs.readFileSync(certPath, 'utf8')
      }
    } catch (err) {
      console.warn('[QZ Cert] Falha ao carregar certificado do disco:', err)
    }
  }

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
