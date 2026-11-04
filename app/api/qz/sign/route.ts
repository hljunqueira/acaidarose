import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

function getPrivateKey(): string | null {
  let privateKey = process.env.QZ_PRIVATE_KEY
  if (!privateKey) {
    try {
      const keyPath = path.join(process.cwd(), 'certificates', 'qz-private-key.pem')
      if (fs.existsSync(keyPath)) {
        privateKey = fs.readFileSync(keyPath, 'utf8')
      }
    } catch (err) {
      console.warn('[QZ Sign] Falha ao carregar chave do disco:', err)
    }
  }
  return privateKey ? privateKey.replace(/\\n/g, '\n').trim() : null
}

/**
 * Assina digitalmente as requisições do QZ Tray usando RSA SHA-512.
 * Isso silencia os diálogos de confirmação de segurança do QZ Tray.
 */
export async function POST(request: NextRequest) {
  try {
    const requestText = await request.text()
    const formattedKey = getPrivateKey()

    if (!formattedKey) {
      // Se não houver chave privada configurada, retorna texto simples
      return new NextResponse('KEY_NOT_CONFIGURED', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      })
    }

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
  const formattedKey = getPrivateKey()

  if (!formattedKey || !requestString) {
    return new NextResponse('', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  try {
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
