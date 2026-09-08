import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse } from '@/lib/api/response'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return errorResponse('Nenhum ficheiro enviado', 400)
    }

    const isVideo = file.type.startsWith('video/')
    const subFolder = isVideo ? 'videos' : 'images'
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', subFolder)
    await mkdir(uploadDir, { recursive: true })

    const originalName = file.name || (isVideo ? 'video.mp4' : 'image.jpg')
    const ext = path.extname(originalName) || (isVideo ? '.mp4' : '.jpg')
    const baseName = path.basename(originalName, ext)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || (isVideo ? 'video' : 'image')

    const filename = `${Date.now()}_${baseName}${ext}`
    const filePath = path.join(uploadDir, filename)

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    const publicUrl = `/uploads/${subFolder}/${filename}`
    return jsonResponse({
      url: publicUrl,
      filename,
      size: file.size,
      type: file.type,
    }, 201)
  } catch (err: any) {
    console.error('Erro no upload de ficheiro:', err)
    return errorResponse(err?.message || 'Falha ao processar upload de mídia', 500)
  }
}
