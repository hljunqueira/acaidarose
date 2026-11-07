import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

export const dynamic = 'force-dynamic'

const VERSION_FILE_PATH = path.resolve(process.cwd(), 'public/downloads/version.json')

interface AgentVersionData {
  version: string
  minVersion: string
  downloadUrl: string
  zipUrl: string
  releaseDate: string
  releaseNotes: string
}

const DEFAULT_VERSION_DATA: AgentVersionData = {
  version: '1.0.1',
  minVersion: '1.0.0',
  downloadUrl: '/downloads/acaidarose-print-agent.exe',
  zipUrl: '/downloads/acaidarose-servidor-impressao.zip',
  releaseDate: '2026-11-07',
  releaseNotes: 'Atualização automática e silenciosa, proteção contra loops de impressão e suporte ESC/POS Base64.',
}

export async function GET() {
  try {
    if (fs.existsSync(VERSION_FILE_PATH)) {
      const content = fs.readFileSync(VERSION_FILE_PATH, 'utf8')
      const data = JSON.parse(content) as AgentVersionData
      return NextResponse.json({
        success: true,
        ...data,
      })
    }
  } catch (err) {
    console.warn('[Version API] Erro ao ler version.json local:', err)
  }

  return NextResponse.json({
    success: true,
    ...DEFAULT_VERSION_DATA,
  })
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const version = (formData.get('version') as string | null)?.trim()
    const releaseNotes = (formData.get('releaseNotes') as string | null)?.trim() || 'Melhorias de desempenho e estabilidade de impressão'

    if (!file || !version) {
      return NextResponse.json(
        { success: false, error: 'Arquivo executável (.exe) e versão são obrigatórios.' },
        { status: 400 }
      )
    }

    if (!/^\d+\.\d+\.\d+/.test(version)) {
      return NextResponse.json(
        { success: false, error: 'A versão deve seguir o formato semântico (ex: 1.0.2).' },
        { status: 400 }
      )
    }

    // Leitura dos bytes do arquivo
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Validação de binário Windows PE (deve começar com 'MZ' = 0x4D, 0x5A)
    if (buffer.length < 50000 || buffer[0] !== 0x4d || buffer[1] !== 0x5a) {
      return NextResponse.json(
        { success: false, error: 'O arquivo enviado não é um executável Windows válido (.exe).' },
        { status: 400 }
      )
    }

    // Garante existência das pastas de destino
    const publicDownloadsDir = path.resolve(process.cwd(), 'public/downloads')
    if (!fs.existsSync(publicDownloadsDir)) {
      fs.mkdirSync(publicDownloadsDir, { recursive: true })
    }

    const distPrintAgentDir = path.resolve(process.cwd(), 'dist/print-agent')
    if (!fs.existsSync(distPrintAgentDir)) {
      fs.mkdirSync(distPrintAgentDir, { recursive: true })
    }

    // Grava o novo executável em ambos os locais
    const targetExePublic = path.join(publicDownloadsDir, 'acaidarose-print-agent.exe')
    const targetExeDist = path.join(distPrintAgentDir, 'acaidarose-print-agent.exe')
    fs.writeFileSync(targetExePublic, buffer)
    fs.writeFileSync(targetExeDist, buffer)

    // Atualiza o arquivo version.json
    const newVersionData: AgentVersionData = {
      version,
      minVersion: '1.0.0',
      downloadUrl: '/downloads/acaidarose-print-agent.exe',
      zipUrl: '/downloads/acaidarose-servidor-impressao.zip',
      releaseDate: new Date().toISOString().split('T')[0],
      releaseNotes,
    }
    fs.writeFileSync(VERSION_FILE_PATH, JSON.stringify(newVersionData, null, 2), 'utf8')

    // Dispara a recompactação automática do pacote .zip com o novo executável
    try {
      execSync('node scripts/package_agent.js', { stdio: 'ignore' })
    } catch (zipErr) {
      console.warn('[Version API] Aviso ao reempacotar ZIP:', zipErr)
    }

    return NextResponse.json({
      success: true,
      message: `Versão ${version} publicada com sucesso! Os servidores de impressão nas lojas atualizarão automaticamente em segundo plano.`,
      ...newVersionData,
    })
  } catch (err: any) {
    console.error('[Version API] Erro ao processar upload de versão:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Erro interno ao salvar nova versão.' },
      { status: 500 }
    )
  }
}
