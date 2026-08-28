'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

interface QRCodeConfigViewProps {
  tenantId: string
}

export default function QRCodeConfigView({ tenantId }: QRCodeConfigViewProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Config State
  const [mode, setMode] = useState<'ORDER_EMISSION' | 'VIEW_ONLY'>('ORDER_EMISSION')
  const [pickupModel, setPickupModel] = useState<'TV_CALL' | 'TABLE_SERVICE'>('TV_CALL')
  const [allowTableTransfer, setAllowTableTransfer] = useState(true)
  const [allowMbwayPayment, setAllowMbwayPayment] = useState(true)
  const [allowInternationalPhone, setAllowInternationalPhone] = useState(true)
  const [customerNameRule, setCustomerNameRule] = useState<'REQUIRED' | 'OPTIONAL'>('REQUIRED')
  const [customerPhoneRule, setCustomerPhoneRule] = useState<'REQUIRED' | 'OPTIONAL' | 'NONE'>('REQUIRED')
  const [customerNifRule, setCustomerNifRule] = useState<'OPTIONAL' | 'REQUIRED' | 'NONE'>('OPTIONAL')

  const storeSlug = tenantId?.startsWith('11111111') ? 'aveiro-1' : 'torres-novas-2'
  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/menu?loja=${storeSlug}`
    : `https://acaidarose.vercel.app/menu?loja=${storeSlug}`

  const fetchConfig = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/qrcode-config?tenantId=${encodeURIComponent(tenantId)}`)
      const data = await res.json()
      if (data.config) {
        const c = data.config
        setMode(c.mode === 'VIEW_ONLY' ? 'VIEW_ONLY' : 'ORDER_EMISSION')
        setPickupModel(c.pickupModel || 'TV_CALL')
        setAllowTableTransfer(c.allowTableTransfer ?? true)
        setAllowMbwayPayment(c.allowMbwayPayment ?? true)
        setAllowInternationalPhone(c.allowInternationalPhone ?? true)
        setCustomerNameRule(c.customerNameRule === 'OPTIONAL' ? 'OPTIONAL' : 'REQUIRED')
        setCustomerPhoneRule(c.customerPhoneRule || 'REQUIRED')
        setCustomerNifRule(c.customerNifRule || 'OPTIONAL')
      }
    } catch {
      toast.error('Erro ao carregar as configurações do QR Code')
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/qrcode-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          config: {
            mode,
            pickupModel,
            allowTableTransfer,
            allowMbwayPayment,
            allowInternationalPhone,
            customerNameRule,
            customerPhoneRule,
            customerNifRule,
          },
        }),
      })

      if (!res.ok) throw new Error('Falha ao guardar as configurações')
      toast.success('Configurações do QR Code guardadas com sucesso!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gravar')
    } finally {
      setSaving(false)
    }
  }

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(publicUrl)
      toast.success('Link copiado para a área de transferência!')
    }
  }

  return (
    <div className="w-full space-y-5 text-white">
      {/* Header Minimalista */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#2A1E3D]">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-white">
            Configurações do QR Code & Ementa Digital
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Definições de atendimento na mesa, pagamento MB WAY e regras de chamada na Smart TV
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || loading}
          className="h-9 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded-lg transition"
        >
          {saving ? 'A guardar...' : 'Guardar Alterações'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Coluna 1: Link & Modos de Atendimento (6 Colunas) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Card: Link Oficial da Ementa */}
          <div className="p-5 rounded-2xl bg-[#160F24] border border-[#2A1E3D] space-y-3">
            <h2 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Link Oficial da Ementa Digital
            </h2>

            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={publicUrl}
                  readOnly
                  className="bg-[#0A0612] border-[#2A1E3D] rounded-lg text-xs font-mono text-purple-300 h-9 select-all"
                />
                <Button
                  type="button"
                  onClick={handleCopyLink}
                  className="bg-[#2A1E3D] hover:bg-[#382852] text-white text-xs font-medium px-3.5 h-9 rounded-lg shrink-0 transition"
                >
                  Copiar
                </Button>
              </div>
              <p className="text-[11px] text-gray-400">
                Utilize este link para redes sociais, bio do Instagram e campanhas de marketing.
              </p>
            </div>
          </div>

          {/* Card: Modo de Operação & Retirada */}
          <div className="p-5 rounded-2xl bg-[#160F24] border border-[#2A1E3D] space-y-4">
            <h2 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Modo de Operação & Retirada
            </h2>

            <div className="space-y-2">
              <Label className="text-xs text-gray-300">Modo de Utilização</Label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                className="w-full h-9 px-3 rounded-lg border border-[#2A1E3D] bg-[#0A0612] text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="ORDER_EMISSION">Emissão de Pedidos (Envia diretamente para o KDS da Cozinha)</option>
                <option value="VIEW_ONLY">Apenas Consulta (Visualização de fotos e preços sem envio de comanda)</option>
              </select>
            </div>

            <div className="space-y-2 pt-3 border-t border-[#2A1E3D]">
              <Label className="text-xs text-gray-300">Modelo de Entrega</Label>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-lg bg-[#0A0612] border border-[#2A1E3D] hover:border-purple-500 transition">
                  <input
                    type="radio"
                    name="pickupModel"
                    checked={pickupModel === 'TV_CALL'}
                    onChange={() => setPickupModel('TV_CALL')}
                    className="accent-purple-600"
                  />
                  <div>
                    <div className="font-medium text-white">Chamada na Smart TV (Fast-Casual)</div>
                    <div className="text-[11px] text-gray-400">O cliente retira o açaí no balcão quando o seu número toca na TV</div>
                  </div>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-lg bg-[#0A0612] border border-[#2A1E3D] hover:border-purple-500 transition">
                  <input
                    type="radio"
                    name="pickupModel"
                    checked={pickupModel === 'TABLE_SERVICE'}
                    onChange={() => setPickupModel('TABLE_SERVICE')}
                    className="accent-purple-600"
                  />
                  <div>
                    <div className="font-medium text-white">Serviço de Mesa</div>
                    <div className="text-[11px] text-gray-400">O empregado de mesa leva o pedido diretamente à mesa numerada</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Troca Inteligente de Mesa */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0A0612] border border-[#2A1E3D] pt-3">
              <div>
                <div className="text-xs font-medium text-white">Troca Inteligente de Mesa</div>
                <div className="text-[11px] text-gray-400">Transfere o pedido automaticamente caso o cliente leia outro QR Code</div>
              </div>
              <Switch checked={allowTableTransfer} onCheckedChange={setAllowTableTransfer} />
            </div>
          </div>
        </div>

        {/* Coluna 2: Pagamento & Dados do Cliente (6 Colunas) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Card: Pagamento MB WAY */}
          <div className="p-5 rounded-2xl bg-[#160F24] border border-[#2A1E3D] space-y-4">
            <h2 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Pagamento no Telemóvel
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0A0612] border border-[#2A1E3D]">
                <div>
                  <div className="text-xs font-medium text-white">Pagamento MB WAY Instantâneo</div>
                  <div className="text-[11px] text-gray-400">O cliente paga diretamente no telemóvel antes do preparo</div>
                </div>
                <Switch checked={allowMbwayPayment} onCheckedChange={setAllowMbwayPayment} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0A0612] border border-[#2A1E3D]">
                <div>
                  <div className="text-xs font-medium text-white">Telemóveis Internacionais</div>
                  <div className="text-[11px] text-gray-400">Aceita números estrangeiros com indicativo internacional para turistas</div>
                </div>
                <Switch checked={allowInternationalPhone} onCheckedChange={setAllowInternationalPhone} />
              </div>
            </div>
          </div>

          {/* Card: Identificação Fiscal & Atendimento */}
          <div className="p-5 rounded-2xl bg-[#160F24] border border-[#2A1E3D] space-y-4">
            <h2 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Identificação nos Pedidos
            </h2>

            <div className="space-y-3">
              {/* Nome do Cliente */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-[#0A0612] border border-[#2A1E3D]">
                <div>
                  <div className="text-xs font-medium text-white">Nome do Cliente</div>
                  <div className="text-[11px] text-gray-400">Para exibição na Smart TV e chamada no balcão</div>
                </div>
                <div className="flex gap-3 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="nameRule"
                      checked={customerNameRule === 'REQUIRED'}
                      onChange={() => setCustomerNameRule('REQUIRED')}
                      className="accent-purple-600"
                    />
                    <span className="text-gray-300">Obrigatório</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="nameRule"
                      checked={customerNameRule === 'OPTIONAL'}
                      onChange={() => setCustomerNameRule('OPTIONAL')}
                      className="accent-purple-600"
                    />
                    <span className="text-gray-300">Opcional</span>
                  </label>
                </div>
              </div>

              {/* NIF na Fatura */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-[#0A0612] border border-[#2A1E3D]">
                <div>
                  <div className="text-xs font-medium text-white">NIF na Fatura</div>
                  <div className="text-[11px] text-gray-400">Para emissão de Fatura Simplificada com contribuinte</div>
                </div>
                <div className="flex gap-3 text-xs">
                  {(['OPTIONAL', 'REQUIRED', 'NONE'] as const).map((r) => (
                    <label key={r} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="nifRule"
                        checked={customerNifRule === r}
                        onChange={() => setCustomerNifRule(r)}
                        className="accent-purple-600"
                      />
                      <span className="text-gray-300">
                        {r === 'OPTIONAL' ? 'Opcional' : r === 'REQUIRED' ? 'Obrigatório' : 'Não pedir'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Telemóvel */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-[#0A0612] border border-[#2A1E3D]">
                <div>
                  <div className="text-xs font-medium text-white">Telemóvel de Contacto</div>
                  <div className="text-[11px] text-gray-400">Para envio do comprovativo digital</div>
                </div>
                <div className="flex gap-3 text-xs">
                  {(['REQUIRED', 'OPTIONAL', 'NONE'] as const).map((r) => (
                    <label key={r} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="phoneRule"
                        checked={customerPhoneRule === r}
                        onChange={() => setCustomerPhoneRule(r)}
                        className="accent-purple-600"
                      />
                      <span className="text-gray-300">
                        {r === 'REQUIRED' ? 'Obrigatório' : r === 'OPTIONAL' ? 'Opcional' : 'Não pedir'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
