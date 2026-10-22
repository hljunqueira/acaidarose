import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse } from '@/lib/api/response'
import { getAuthUser } from '@/lib/api/authGuard'
import { getPrintersByTenantId, createPrinter } from '@/lib/repositories/printersRepository'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tenantId } = await params
  if (!tenantId) return errorResponse('ID da loja é obrigatório', 400)

  try {
    const printers = await getPrintersByTenantId(tenantId)
    return jsonResponse({ printers })
  } catch (err: any) {
    console.error('Erro ao listar impressoras:', err)
    return errorResponse(err?.message || 'Erro ao carregar impressoras', 500)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request)
  const { id: tenantId } = await params

  if (!user) return errorResponse('Não autenticado', 401)
  if (user.role !== 'SUPER_ADMIN' && user.tenantId !== tenantId) {
    return errorResponse('Sem permissão para configurar impressoras nesta loja', 403)
  }

  try {
    const body = await request.json()
    if (!body.name?.trim() || !body.driverName?.trim()) {
      return errorResponse('Nome de identificação e driver são obrigatórios', 400)
    }

    const created = await createPrinter(tenantId, {
      name: body.name,
      driverName: body.driverName,
      printerType: body.printerType || 'EPSON_ESC_POS',
      connectionType: body.connectionType || 'QZ_TRAY',
      printLayout: body.printLayout || 'FULL_RECEIPT',
      highlightCustomer: body.highlightCustomer !== false,
      printLogo: body.printLogo !== false,
      printQrCode: body.printQrCode !== false,
      categories: Array.isArray(body.categories) ? body.categories : [],
      products: Array.isArray(body.products) ? body.products : [],
      copies: Number(body.copies) || 1,
      isActive: body.isActive !== false,
      isBackup: Boolean(body.isBackup),
    })

    return jsonResponse({ printer: created }, 201)
  } catch (err: any) {
    console.error('Erro ao criar impressora:', err)
    return errorResponse(err?.message || 'Erro ao salvar impressora', 500)
  }
}
