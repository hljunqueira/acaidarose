import { NextRequest, NextResponse } from 'next/server'
import { getTenantByIdOrSlug } from '@/lib/repositories/tenantsRepository'
import { query } from '@/lib/db/postgres'
import { recordAgentHeartbeat } from '@/lib/printers/agentHeartbeatStore'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ success: false, error: 'Token da loja não informado.' }, { status: 400 })
  }

  try {
    const tenant = await getTenantByIdOrSlug(token)
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Loja não encontrada.' }, { status: 404 })
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1'
    recordAgentHeartbeat(tenant.id, tenant.name, ip)

    const sql = `
      SELECT 
        id,
        order_id as "orderId",
        order_number as "orderNumber",
        printer_name as "printerName",
        doc_name as "docName",
        payload_base64 as "payloadBase64",
        payload_text as "payloadText",
        copies,
        created_at as "createdAt"
      FROM store_print_jobs
      WHERE tenant_id = $1 AND status = 'PENDING'
      ORDER BY created_at ASC
      LIMIT 10;
    `
    const res = await query(sql, [tenant.id])

    return NextResponse.json({
      success: true,
      jobs: res.rows || [],
    })
  } catch (err: any) {
    console.error('[Printer Agent Jobs Error]:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Erro ao consultar fila.' }, { status: 500 })
  }
}

/**
 * Permite que o frontend ou outros serviços enfileirem um job de impressão
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, orderId, orderNumber, printerName, docName, payloadBase64, payloadText, copies } = body

    if (!tenantId || !printerName) {
      return NextResponse.json({ success: false, error: 'tenantId e printerName são obrigatórios.' }, { status: 400 })
    }

    const tenant = await getTenantByIdOrSlug(tenantId)
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Loja não encontrada.' }, { status: 404 })
    }

    const finalBase64 = payloadBase64 || (payloadText ? Buffer.from(payloadText, 'binary').toString('base64') : null)
    const sanitizedText = payloadText ? payloadText.replace(/\0/g, '') : null

    const sql = `
      INSERT INTO store_print_jobs (
        tenant_id, order_id, order_number, printer_name, doc_name,
        payload_base64, payload_text, copies, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING')
      RETURNING id;
    `
    const res = await query(sql, [
      tenant.id,
      orderId || null,
      orderNumber ? String(orderNumber) : null,
      printerName,
      docName || 'Açaí da Rose - Cupom',
      finalBase64 || null,
      sanitizedText || null,
      Math.max(1, Number(copies) || 1),
    ])

    return NextResponse.json({
      success: true,
      jobId: res.rows[0]?.id,
    })
  } catch (err: any) {
    console.error('[Enqueue Print Job Error]:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Erro ao enfileirar job.' }, { status: 500 })
  }
}

