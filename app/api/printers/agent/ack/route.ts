import { NextRequest, NextResponse } from 'next/server'
import { getTenantByIdOrSlug } from '@/lib/repositories/tenantsRepository'
import { query } from '@/lib/db/postgres'
import { recordAuditLog } from '@/lib/repositories/auditRepository'

export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ success: false, error: 'Token não informado.' }, { status: 400 })
  }

  try {
    const tenant = await getTenantByIdOrSlug(token)
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Loja não encontrada.' }, { status: 404 })
    }

    const body = await request.json()
    const { jobId, status, error } = body

    if (!jobId) {
      return NextResponse.json({ success: false, error: 'jobId é obrigatório.' }, { status: 400 })
    }

    const finalStatus = status === 'PRINTED' ? 'PRINTED' : 'FAILED'

    const sql = `
      UPDATE store_print_jobs
      SET 
        status = $1,
        error_message = $2,
        printed_at = CASE WHEN $1::text = 'PRINTED' THEN NOW() ELSE NULL END
      WHERE id = $3 AND tenant_id = $4
      RETURNING *;
    `
    const res = await query(sql, [finalStatus, error || null, jobId, tenant.id])
    const updatedJob = res.rows[0]

    // Registra no Audit Log para acompanhamento
    if (updatedJob) {
      recordAuditLog({
        tenantId: tenant.id,
        action: finalStatus === 'PRINTED' ? 'ORDER_PRINTED_VIA_AGENT' : 'ORDER_PRINT_FAILED_VIA_AGENT',
        entity: 'PRINT_AGENT_WINDOWS',
        entityId: updatedJob.order_id || updatedJob.id,
        message:
          finalStatus === 'PRINTED'
            ? `Comanda #${updatedJob.order_number || '000'} impressa com sucesso pelo Agente Windows em "${updatedJob.printer_name}".`
            : `Falha ao imprimir comanda #${updatedJob.order_number || '000'} via Agente Windows em "${updatedJob.printer_name}": ${error || 'Erro desconhecido'}`,
        level: finalStatus === 'PRINTED' ? 'INFO' : 'ERROR',
        metadata: {
          jobId: updatedJob.id,
          orderId: updatedJob.order_id,
          orderNumber: updatedJob.order_number,
          printerName: updatedJob.printer_name,
        },
      }).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      jobId,
      status: finalStatus,
    })
  } catch (err: any) {
    console.error('[Printer Agent Ack Error]:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Erro ao confirmar impressão.' }, { status: 500 })
  }
}

