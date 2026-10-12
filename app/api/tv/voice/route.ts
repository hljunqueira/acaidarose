import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Range, Accept',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range',
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  })
}

/**
 * Endpoint de Síntese de Voz (TTS) em Português de Portugal (pt-PT)
 * Retorna streaming de áudio nativo MP3 sem depender de vozes instaladas no Windows ou no dispositivo.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const text = searchParams.get('text') || ''
    const lang = searchParams.get('lang') || 'pt-PT'

    if (!text.trim()) {
      return NextResponse.json({ error: 'Texto não fornecido' }, { status: 400, headers: CORS_HEADERS })
    }

    // Limita o tamanho do texto para segurança
    const sanitizedText = text.slice(0, 200).trim()

    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(
      lang
    )}&client=tw-ob&q=${encodeURIComponent(sanitizedText)}`

    const response = await fetch(ttsUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'audio/mpeg, audio/*',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Falha ao sintetizar áudio no servidor' },
        { status: 502, headers: CORS_HEADERS }
      )
    }

    const audioBuffer = await response.arrayBuffer()

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(audioBuffer.byteLength),
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        ...CORS_HEADERS,
      },
    })
  } catch (err: any) {
    console.error('[API TV Voice] Erro ao sintetizar áudio:', err)
    return NextResponse.json(
      { error: err?.message || 'Erro interno de áudio' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
