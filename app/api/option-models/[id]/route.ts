import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse } from '@/lib/api/response'
import { getAuthUser } from '@/lib/api/authGuard'
import { canManageMasterCatalog } from '@/lib/utils/permissions'
import { updateOptionModel, deleteOptionModel } from '@/lib/repositories/optionModelsRepository'
import { AVEIRO_HQ_ID } from '@/lib/repositories/tenantsRepository'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request)
  const isMaster = canManageMasterCatalog(user, user?.tenantId)

  const { id } = await params
  try {
    const body = await request.json()
    const tenantId = body.tenantId || user?.tenantId || AVEIRO_HQ_ID
    const applyToAll = isMaster && Boolean(body.applyToAll)

    let payloadToSave = body

    // Regra Franqueadora vs Franquias:
    // Franquias podem alterar SOMENTE a visibilidade (ativo/inativo) do modelo e das opções individuais.
    // Não podem criar itens, alterar preços, nomes, regras ou mídias.
    if (!isMaster) {
      // Se não for master, sanitizamos para aplicar APENAS visibilidade
      const existing = await import('@/lib/db/postgres').then(m => m.query('SELECT * FROM product_option_models WHERE id = $1', [id]))
      if (!existing.rows || existing.rows.length === 0) {
        return errorResponse('Modelo de opção não encontrado', 404)
      }
      const currentModel = existing.rows[0]
      const currentOptions = Array.isArray(currentModel.options) ? currentModel.options : []
      const incomingOptions = Array.isArray(body.options) ? body.options : []

      // Atualiza apenas a flag active de cada opção existente
      const sanitizedOptions = currentOptions.map((origOpt: any) => {
        const incoming = incomingOptions.find((o: any) => o.id === origOpt.id || (o.name && origOpt.name && o.name.toLowerCase().trim() === origOpt.name.toLowerCase().trim()))
        return {
          ...origOpt,
          active: incoming && incoming.active !== undefined ? Boolean(incoming.active) : origOpt.active !== false,
        }
      })

      payloadToSave = {
        name: currentModel.name,
        nameEn: currentModel.name_en,
        nameEs: currentModel.name_es,
        subtitle: currentModel.subtitle,
        subtitleEn: currentModel.subtitle_en,
        subtitleEs: currentModel.subtitle_es,
        priceType: currentModel.price_type,
        additionalPrice: Number(currentModel.additional_price || 0),
        minQty: Number(currentModel.min_qty || 0),
        maxQty: Number(currentModel.max_qty || 1),
        allowItemQuantity: !!currentModel.allow_item_quantity,
        isRequired: !!currentModel.is_required,
        showDetailed: !!currentModel.show_detailed,
        displayOrder: Number(currentModel.display_order || 0),
        active: body.active !== undefined ? Boolean(body.active) : currentModel.active !== false,
        options: sanitizedOptions,
      }
    }

    const updated = await updateOptionModel(
      id,
      tenantId,
      payloadToSave,
      {
        id: user?.id,
        name: user?.name,
        role: user?.role,
      },
      applyToAll,
      isMaster
    )
    if (!updated) return errorResponse('Modelo de opção não encontrado', 404)
    return jsonResponse(updated)
  } catch (err: any) {
    return errorResponse(err?.message || 'Erro ao atualizar modelo de opção', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request)
  if (!canManageMasterCatalog(user, user?.tenantId)) {
    return errorResponse('Apenas a Franqueadora pode excluir modelos de opções.', 403)
  }

  const { id } = await params
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId') || user?.tenantId || AVEIRO_HQ_ID
    await deleteOptionModel(id, tenantId, {
      id: user?.id,
      name: user?.name,
      role: user?.role,
    })
    return jsonResponse({ ok: true })
  } catch (err: any) {
    return errorResponse(err?.message || 'Erro ao excluir modelo de opção', 500)
  }
}
