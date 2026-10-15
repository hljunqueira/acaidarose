import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse } from '@/lib/api/response'
import { getAuthUser } from '@/lib/api/authGuard'
import { getPrinterById, updatePrinter, deletePrinter } from '@/lib/repositories/printersRepository'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; printerId: string }> }
) {
  const user = await getAuthUser(request)
  const { id: tenantId, printerId } = await params

  if (!user) return errorResponse('Não autenticado', 401)
  if (user.role !== 'SUPER_ADMIN' && user.tenantId !== tenantId) {
    return errorResponse('Sem permissão para alterar impressoras nesta loja', 403)
  }

  const existing = await getPrinterById(printerId)
  if (!existing || existing.tenantId !== tenantId) {
    return errorResponse('Impressora não encontrada nesta unidade', 404)
  }

  try {
    const body = await request.json()
    const updated = await updatePrinter(printerId, {
      name: body.name,
      driverName: body.driverName,
      printerType: body.printerType,
      connectionType: body.connectionType,
      categories: body.categories,
      products: body.products,
      copies: body.copies,
      isActive: body.isActive,
      isBackup: body.isBackup,
    })

    return jsonResponse({ printer: updated })
  } catch (err: any) {
    console.error('Erro ao atualizar impressora:', err)
    return errorResponse(err?.message || 'Erro ao atualizar impressora', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; printerId: string }> }
) {
  const user = await getAuthUser(request)
  const { id: tenantId, printerId } = await params

  if (!user) return errorResponse('Não autenticado', 401)
  if (user.role !== 'SUPER_ADMIN' && user.tenantId !== tenantId) {
    return errorResponse('Sem permissão para remover impressoras nesta loja', 403)
  }

  const existing = await getPrinterById(printerId)
  if (!existing || existing.tenantId !== tenantId) {
    return errorResponse('Impressora não encontrada nesta unidade', 404)
  }

  try {
    const success = await deletePrinter(printerId)
    return jsonResponse({ success })
  } catch (err: any) {
    console.error('Erro ao excluir impressora:', err)
    return errorResponse(err?.message || 'Erro ao excluir impressora', 500)
  }
}
