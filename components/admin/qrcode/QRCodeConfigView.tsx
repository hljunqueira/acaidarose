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

  // Configurações do QR Code & Ementa Digital
  const [mode, setMode] = useState<'ORDER_EMISSION' | 'VIEW_ONLY'>('ORDER_EMISSION')
  const [pickupModel, setPickupModel] = useState<'TV_CALL' | 'TABLE_SERVICE'>('TV_CALL')
  const [allowTableTransfer, setAllowTableTransfer] = useState(true)
  const [allowMbwayPayment, setAllowMbwayPayment] = useState(true)
  const [allowInternationalPhone, setAllowInternationalPhone] = useState(true)
  const [customerNameRule, setCustomerNameRule] = useState<'REQUIRED' | 'OPTIONAL'>('REQUIRED')
  const [customerPhoneRule, setCustomerPhoneRule] = useState<'REQUIRED' | 'OPTIONAL' | 'NONE'>('REQUIRED')
  const [customerNifRule, setCustomerNifRule] = useState<'OPTIONAL' | 'REQUIRED' | 'NONE'>('OPTIONAL')

  const storeSlug = tenantId?.startsWith('11111111') ? 'aveiro' : 'torres-novas'
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
    <div className="w-full space-y-5">
      {/* Header Minimalista Bimodal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-purple-100 dark:border-white/10">
        <div>
          <h1 className="text-base sm:text-lg font-black text-purple-950 dark:text-white tracking-tight">
            Configurações do QR Code & Ementa Digital
          </h1>
          <p className="text-[11px] text-purple-700/80 dark:text-purple-200/70">
            Definições de atendimento na mesa, pagamento MB WAY e regras de chamada na Smart TV
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || loading}
          className="h-9 px-4 bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition"
        >
          {saving ? 'A guardar...' : 'Guardar Alterações'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Coluna 1: Link & Modos de Atendimento (6 Colunas) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Card: Link Oficial da Ementa */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#160228] border border-purple-100 dark:border-white/10 shadow-xs space-y-3">
            <h2 className="text-xs font-black text-purple-950 dark:text-white uppercase tracking-wider">
              Link Oficial da Ementa Digital
            </h2>

            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={publicUrl}
                  readOnly
                  className="bg-purple-50/60 dark:bg-white/5 border-purple-200 dark:border-white/10 rounded-xl text-xs font-mono text-purple-900 dark:text-pink-300 h-9 select-all"
                />
                <Button
                  type="button"
                  onClick={handleCopyLink}
                  className="bg-purple-100 dark:bg-white/10 hover:bg-purple-200 dark:hover:bg-white/20 text-purple-950 dark:text-white text-xs font-bold px-3.5 h-9 rounded-xl shrink-0 cursor-pointer transition"
                >
                  Copiar
                </Button>
              </div>
              <p className="text-[11px] text-purple-700/80 dark:text-purple-200/70">
                Utilize este link para redes sociais, bio do Instagram e campanhas de marketing.
              </p>
            </div>
          </div>

          {/* Card: Modo de Operação & Retirada */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#160228] border border-purple-100 dark:border-white/10 shadow-xs space-y-4">
            <h2 className="text-xs font-black text-purple-950 dark:text-white uppercase tracking-wider">
              Modo de Operação & Retirada
            </h2>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-purple-950 dark:text-white">Modo de Utilização</Label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                className="w-full h-9 px-3 rounded-xl border border-purple-200 dark:border-white/10 bg-purple-50/50 dark:bg-white/5 text-xs text-purple-950 dark:text-white font-medium focus:outline-none focus:border-purple-500"
              >
                <option value="ORDER_EMISSION">Emissão de Pedidos (Envia diretamente para o KDS da Cozinha)</option>
                <option value="VIEW_ONLY">Apenas Consulta (Visualização de fotos e preços sem envio de comanda)</option>
              </select>
            </div>

            <div className="space-y-2 pt-3 border-t border-purple-100 dark:border-white/10">
              <Label className="text-xs font-bold text-purple-950 dark:text-white">Modelo de Entrega</Label>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-xl bg-purple-50/50 dark:bg-white/5 border border-purple-150 dark:border-white/10 hover:border-purple-300 dark:hover:border-pink-500/50 transition">
                  <input
                    type="radio"
                    name="pickupModel"
                    checked={pickupModel === 'TV_CALL'}
                    onChange={() => setPickupModel('TV_CALL')}
                    className="accent-purple-700 dark:accent-pink-500"
                  />
                  <div>
                    <div className="font-bold text-purple-950 dark:text-white">Chamada na Smart TV (Fast-Casual)</div>
                    <div className="text-[11px] text-purple-700/80 dark:text-purple-200/70">O cliente retira o açaí no balcão quando o seu número toca na TV</div>
                  </div>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-xl bg-purple-50/50 dark:bg-white/5 border border-purple-150 dark:border-white/10 hover:border-purple-300 dark:hover:border-pink-500/50 transition">
                  <input
                    type="radio"
                    name="pickupModel"
                    checked={pickupModel === 'TABLE_SERVICE'}
                    onChange={() => setPickupModel('TABLE_SERVICE')}
                    className="accent-purple-700 dark:accent-pink-500"
                  />
                  <div>
                    <div className="font-bold text-purple-950 dark:text-white">Serviço de Mesa</div>
                    <div className="text-[11px] text-purple-700/80 dark:text-purple-200/70">O empregado de mesa leva o pedido diretamente à mesa numerada</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Troca Inteligente de Mesa */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/50 dark:bg-white/5 border border-purple-150 dark:border-white/10">
              <div>
                <div className="text-xs font-bold text-purple-950 dark:text-white">Troca Inteligente de Mesa</div>
                <div className="text-[11px] text-purple-700/80 dark:text-purple-200/70">Transfere o pedido automaticamente caso o cliente leia outro QR Code</div>
              </div>
              <Switch checked={allowTableTransfer} onCheckedChange={setAllowTableTransfer} />
            </div>
          </div>
        </div>

        {/* Coluna 2: Pagamento & Dados do Cliente (6 Colunas) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Card: Pagamento MB WAY */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#160228] border border-purple-100 dark:border-white/10 shadow-xs space-y-4">
            <h2 className="text-xs font-black text-purple-950 dark:text-white uppercase tracking-wider">
              Pagamento no Telemóvel
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/50 dark:bg-white/5 border border-purple-150 dark:border-white/10">
                <div>
                  <div className="text-xs font-bold text-purple-950 dark:text-white">Pagamento MB WAY Instantâneo</div>
                  <div className="text-[11px] text-purple-700/80 dark:text-purple-200/70">O cliente paga diretamente no telemóvel antes do preparo</div>
                </div>
                <Switch checked={allowMbwayPayment} onCheckedChange={setAllowMbwayPayment} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/50 dark:bg-white/5 border border-purple-150 dark:border-white/10">
                <div>
                  <div className="text-xs font-bold text-purple-950 dark:text-white">Telemóveis Internacionais</div>
                  <div className="text-[11px] text-purple-700/80 dark:text-purple-200/70">Aceita números estrangeiros com indicativo internacional para turistas</div>
                </div>
                <Switch checked={allowInternationalPhone} onCheckedChange={setAllowInternationalPhone} />
              </div>
            </div>
          </div>

          {/* Card: Identificação Fiscal & Atendimento */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#160228] border border-purple-100 dark:border-white/10 shadow-xs space-y-4">
            <h2 className="text-xs font-black text-purple-950 dark:text-white uppercase tracking-wider">
              Identificação nos Pedidos
            </h2>

            <div className="space-y-3">
              {/* Nome do Cliente */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-purple-50/50 dark:bg-white/5 border border-purple-150 dark:border-white/10">
                <div>
                  <div className="text-xs font-bold text-purple-950 dark:text-white">Nome do Cliente</div>
                  <div className="text-[11px] text-purple-700/80 dark:text-purple-200/70">Para exibição na Smart TV e chamada no balcão</div>
                </div>
                <div className="flex gap-3 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="nameRule"
                      checked={customerNameRule === 'REQUIRED'}
                      onChange={() => setCustomerNameRule('REQUIRED')}
                      className="accent-purple-700 dark:accent-pink-500"
                    />
                    <span className="text-purple-900 dark:text-purple-200 font-medium">Obrigatório</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="nameRule"
                      checked={customerNameRule === 'OPTIONAL'}
                      onChange={() => setCustomerNameRule('OPTIONAL')}
                      className="accent-purple-700 dark:accent-pink-500"
                    />
                    <span className="text-purple-900 dark:text-purple-200 font-medium">Opcional</span>
                  </label>
                </div>
              </div>

              {/* NIF na Fatura */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-purple-50/50 dark:bg-white/5 border border-purple-150 dark:border-white/10">
                <div>
                  <div className="text-xs font-bold text-purple-950 dark:text-white">NIF na Fatura</div>
                  <div className="text-[11px] text-purple-700/80 dark:text-purple-200/70">Para emissão de Fatura Simplificada com contribuinte</div>
                </div>
                <div className="flex gap-3 text-xs">
                  {(['OPTIONAL', 'REQUIRED', 'NONE'] as const).map((r) => (
                    <label key={r} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="nifRule"
                        checked={customerNifRule === r}
                        onChange={() => setCustomerNifRule(r)}
                        className="accent-purple-700 dark:accent-pink-500"
                      />
                      <span className="text-purple-900 dark:text-purple-200 font-medium">
                        {r === 'OPTIONAL' ? 'Opcional' : r === 'REQUIRED' ? 'Obrigatório' : 'Não pedir'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Telemóvel */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-purple-50/50 dark:bg-white/5 border border-purple-150 dark:border-white/10">
                <div>
                  <div className="text-xs font-bold text-purple-950 dark:text-white">Telemóvel de Contacto</div>
                  <div className="text-[11px] text-purple-700/80 dark:text-purple-200/70">Para envio do comprovativo digital</div>
                </div>
                <div className="flex gap-3 text-xs">
                  {(['REQUIRED', 'OPTIONAL', 'NONE'] as const).map((r) => (
                    <label key={r} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="phoneRule"
                        checked={customerPhoneRule === r}
                        onChange={() => setCustomerPhoneRule(r)}
                        className="accent-purple-700 dark:accent-pink-500"
                      />
                      <span className="text-purple-900 dark:text-purple-200 font-medium">
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
