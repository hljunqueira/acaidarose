import { NextRequest, NextResponse } from 'next/server'
import { requestMbwayPayment } from '@/lib/services/ifthenpayService'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId, amount, mobileNumber, customerName, tableLabel, tenantId } = body

    if (!mobileNumber || !amount || !orderId) {
      return NextResponse.json(
        { error: 'Telemóvel, valor e ID do pedido são obrigatórios' },
        { status: 400 }
      )
    }

    const description = `Açaí da Rose - ${tableLabel || 'QR Code'} (${customerName || 'Cliente'})`

    const response = await requestMbwayPayment({
      orderId,
      amount,
      mobileNumber,
      description,
    })

    return NextResponse.json(response)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao comunicar com o gateway Ifthenpay' },
      { status: 500 }
    )
  }
}
