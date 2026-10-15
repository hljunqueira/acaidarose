import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * Assina digitalmente as requisições do QZ Tray usando RSA SHA-256.
 * Isso silencia os diálogos de confirmação de segurança do QZ Tray.
 */
export async function POST(request: NextRequest) {
  try {
    const requestText = await request.text()
    const privateKey = process.env.QZ_PRIVATE_KEY

    if (!privateKey) {
      // Se não houver chave privada configurada, retorna texto simples
      return new NextResponse('KEY_NOT_CONFIGURED', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      })
    }

    const formattedKey = privateKey.replace(/\\n/g, '\n').trim()
    const signer = crypto.createSign('SHA512')
    signer.update(requestText)
    signer.end()

    const signature = signer.sign(formattedKey, 'base64')
    return new NextResponse(signature, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  } catch (err: any) {
    console.error('Erro ao assinar payload do QZ Tray:', err)
    return new NextResponse(err?.message || 'Erro na assinatura', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
}

export async function GET(request: NextRequest) {
  const requestString = request.nextUrl.searchParams.get('request') || ''
  const privateKey = process.env.QZ_PRIVATE_KEY

  if (!privateKey || !requestString) {
    return new NextResponse('', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  try {
    const formattedKey = privateKey.replace(/\\n/g, '\n').trim()
    const signer = crypto.createSign('SHA512')
    signer.update(requestString)
    signer.end()

    const signature = signer.sign(formattedKey, 'base64')
    return new NextResponse(signature, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  } catch (err: any) {
    return new NextResponse(err?.message || 'Erro', { status: 500 })
  }
}
