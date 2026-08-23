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

  // Config State (100% QR Code Salão & Balcão - Sem Delivery)
  const [mode, setMode] = useState<'DISABLED' | 'VIEW_ONLY' | 'ORDER_EMISSION'>('ORDER_EMISSION')
  const [allowMbwayPayment, setAllowMbwayPayment] = useState(true)
  const [tableMode, setTableMode] = useState<'FIXED_QR' | 'TYPED_TABLE'>('FIXED_QR')
  const [customerNameRule, setCustomerNameRule] = useState<'NONE' | 'OPTIONAL' | 'REQUIRED'>('OPTIONAL')
  const [customerPhoneRule, setCustomerPhoneRule] = useState<'NONE' | 'OPTIONAL' | 'REQUIRED'>('REQUIRED')
  const [customerNifRule, setCustomerNifRule] = useState<'NONE' | 'OPTIONAL' | 'REQUIRED'>('OPTIONAL')
  const [allowInternationalPhone, setAllowInternationalPhone] = useState(true)

  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/menu?tenantId=${tenantId}`
    : `https://acairose.pt/menu?tenantId=${tenantId}`

  const fetchConfig = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/qrcode-config?tenantId=${encodeURIComponent(tenantId)}`)
      const data = await res.json()
      if (data.config) {
        const c = data.config
        setMode(c.mode || 'ORDER_EMISSION')
        setAllowMbwayPayment(c.allowMbwayPayment ?? true)
        setTableMode(c.tableMode || 'FIXED_QR')
        setCustomerNameRule(c.customerNameRule || 'OPTIONAL')
        setCustomerPhoneRule(c.customerPhoneRule || 'REQUIRED')
        setCustomerNifRule(c.customerNifRule || 'OPTIONAL')
        setAllowInternationalPhone(c.allowInternationalPhone ?? true)
      }
    } catch {
      toast.error('Erro ao carregar configurações de QR Code')
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
            allowMbwayPayment,
            tableMode,
            customerNameRule,
            customerPhoneRule,
            customerNifRule,
            allowInternationalPhone,
          },
        }),
      })

      if (!res.ok) throw new Error('Falha ao guardar configurações')
      toast.success('Configurações de QR Code guardadas com sucesso!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gravar')
    } finally {
      setSaving(false)
    }
  }

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(publicUrl)
      toast.success('Link do cardápio copiado para a área de transferência!')
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Header Minimalista */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-purple-100 dark:border-white/10">
        <div>
          <h1 className="text-base sm:text-lg font-black text-purple-950 dark:text-white tracking-tight">
            Configurações do QR Code & Cardápio
          </h1>
          <p className="text-[11px] text-purple-700/80 dark:text-purple-200/70">
            Regras de autoatendimento na mesa, pagamento MB WAY e identificação dos clientes
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || loading}
          className="h-9 bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 dark:hover:from-pink-500 dark:hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-700/20 dark:shadow-pink-600/30 cursor-pointer px-4"
        >
          {saving ? 'A guardar...' : 'Guardar Alterações'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Coluna 1: Link Oficial + Modos de Operação e Mesa (6 colunas) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Card: Link Oficial de Divulgação */}
          <div className="p-5 rounded-3xl border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228]/95 space-y-3 shadow-xs dark:shadow-xl text-slate-900 dark:text-white">
            <div className="text-xs font-black text-purple-700 dark:text-pink-300 uppercase tracking-wider border-b border-purple-100 dark:border-white/10 pb-2.5">
              🔗 Link Oficial do Cardápio Digital
            </div>

            <div className="space-y-1.5">
              <div className="flex gap-2">
                <Input
                  value={publicUrl}
                  readOnly
                  className="bg-purple-50/70 dark:bg-white/5 border-purple-200 dark:border-white/15 rounded-xl text-xs font-mono text-purple-950 dark:text-pink-300 font-bold h-9 select-all"
                />
                <Button
                  type="button"
                  onClick={handleCopyLink}
                  className="bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 dark:hover:from-pink-500 dark:hover:to-purple-500 text-white text-xs font-bold px-3.5 h-9 rounded-xl shadow-xs cursor-pointer shrink-0"
                >
                  Copiar Link
                </Button>
              </div>
              <p className="text-[11px] text-purple-700/80 dark:text-purple-200/70">
                Utilize este link para a bio do Instagram, redes sociais e materiais publicitários da loja.
              </p>
            </div>
          </div>

          {/* Card: Modos de Utilização & Mesas */}
          <div className="p-5 rounded-3xl border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228]/95 space-y-4 shadow-xs dark:shadow-xl text-slate-900 dark:text-white">
            <div className="text-xs font-black text-purple-700 dark:text-pink-300 uppercase tracking-wider border-b border-purple-100 dark:border-white/10 pb-2.5">
              ⚙️ Modo de Operação & Identificação da Mesa
            </div>

            {/* Dropdown Modo */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-purple-900 dark:text-purple-200">Modo de Utilização do QR Code</Label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                className="w-full h-10 px-3.5 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-xs font-bold text-purple-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-pink-500 [&>option]:bg-white dark:[&>option]:bg-[#160228] [&>option]:text-purple-950 dark:[&>option]:text-white"
              >
                <option value="ORDER_EMISSION">Emissão de Pedido (Cardápio Interativo Completo com Envio para a Cozinha)</option>
                <option value="VIEW_ONLY">Visualização (Apenas Consulta de Fotos e Preços - Sem Envio de Comanda)</option>
                <option value="DISABLED">Desativado (QR Code Temporariamente Desligado)</option>
              </select>
            </div>

            {/* Identificação de Mesa */}
            <div className="space-y-2 pt-3 border-t border-purple-100 dark:border-white/10">
              <Label className="text-xs font-bold text-purple-900 dark:text-purple-200">Identificação da Mesa no QR Code</Label>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2.5 cursor-pointer p-2 rounded-xl hover:bg-purple-50/50 dark:hover:bg-white/5 transition">
                  <input
                    type="radio"
                    name="tableMode"
                    checked={tableMode === 'FIXED_QR'}
                    onChange={() => setTableMode('FIXED_QR')}
                    className="accent-purple-700 dark:accent-pink-600"
                  />
                  <span className="font-semibold text-purple-950 dark:text-white">QR Code Fixo na Mesa (Placa física numerada na mesa)</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer p-2 rounded-xl hover:bg-purple-50/50 dark:hover:bg-white/5 transition">
                  <input
                    type="radio"
                    name="tableMode"
                    checked={tableMode === 'TYPED_TABLE'}
                    onChange={() => setTableMode('TYPED_TABLE')}
                    className="accent-purple-700 dark:accent-pink-600"
                  />
                  <span className="font-semibold text-purple-950 dark:text-white">Mesa digitada pelo próprio cliente no telemóvel</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna 2: Pagamentos + Dados Obrigatórios do Cliente (6 colunas) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Card: Opções de Pagamento */}
          <div className="p-5 rounded-3xl border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228]/95 space-y-4 shadow-xs dark:shadow-xl text-slate-900 dark:text-white">
            <div className="text-xs font-black text-purple-700 dark:text-pink-300 uppercase tracking-wider border-b border-purple-100 dark:border-white/10 pb-2.5">
              💳 Pagamento MB WAY & Opções de Atendimento
            </div>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between p-2 rounded-2xl bg-purple-50/50 dark:bg-white/5 border border-purple-100/60 dark:border-white/10">
                <div>
                  <div className="text-xs font-bold text-purple-950 dark:text-pink-300">Pagamento MB WAY Instantâneo</div>
                  <div className="text-[11px] text-purple-700/80 dark:text-purple-200/70">O cliente paga direto no telemóvel antes do preparo</div>
                </div>
                <Switch checked={allowMbwayPayment} onCheckedChange={setAllowMbwayPayment} />
              </div>

              <div className="flex items-center justify-between p-2 rounded-2xl bg-purple-50/50 dark:bg-white/5 border border-purple-100/60 dark:border-white/10">
                <div>
                  <div className="text-xs font-bold text-purple-950 dark:text-white">Telemóveis Internacionais</div>
                  <div className="text-[11px] text-purple-700/80 dark:text-purple-200/70">Aceita números estrangeiros de turistas em Portugal</div>
                </div>
                <Switch checked={allowInternationalPhone} onCheckedChange={setAllowInternationalPhone} />
              </div>
            </div>
          </div>

          {/* Card: Dados Obrigatórios do Cliente */}
          <div className="p-5 rounded-3xl border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228]/95 space-y-4 shadow-xs dark:shadow-xl text-slate-900 dark:text-white">
            <div className="text-xs font-black uppercase text-purple-700 dark:text-pink-300 tracking-wider border-b border-purple-100 dark:border-white/10 pb-2.5">
              👤 Identificação do Cliente nos Pedidos
            </div>

            <div className="space-y-3.5">
              {/* Nome */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-xl bg-purple-50/30 dark:bg-white/5">
                <span className="text-xs font-bold text-purple-950 dark:text-white">Nome do Cliente:</span>
                <div className="flex gap-3 text-xs">
                  {(['NONE', 'OPTIONAL', 'REQUIRED'] as const).map((r) => (
                    <label key={r} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="nameRule"
                        checked={customerNameRule === r}
                        onChange={() => setCustomerNameRule(r)}
                        className="accent-purple-700 dark:accent-pink-600"
                      />
                      <span className="text-purple-900 dark:text-purple-200 font-medium">
                        {r === 'NONE' ? 'Não pedir' : r === 'OPTIONAL' ? 'Opcional' : 'Obrigatório'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Telemóvel */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-xl bg-purple-50/30 dark:bg-white/5">
                <span className="text-xs font-bold text-purple-950 dark:text-white">Telemóvel do Cliente:</span>
                <div className="flex gap-3 text-xs">
                  {(['NONE', 'OPTIONAL', 'REQUIRED'] as const).map((r) => (
                    <label key={r} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="phoneRule"
                        checked={customerPhoneRule === r}
                        onChange={() => setCustomerPhoneRule(r)}
                        className="accent-purple-700 dark:accent-pink-600"
                      />
                      <span className="text-purple-900 dark:text-purple-200 font-medium">
                        {r === 'NONE' ? 'Não pedir' : r === 'OPTIONAL' ? 'Opcional' : 'Obrigatório'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* NIF */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-xl bg-purple-50/30 dark:bg-white/5">
                <span className="text-xs font-bold text-purple-950 dark:text-white">NIF na Fatura:</span>
                <div className="flex gap-3 text-xs">
                  {(['NONE', 'OPTIONAL', 'REQUIRED'] as const).map((r) => (
                    <label key={r} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="nifRule"
                        checked={customerNifRule === r}
                        onChange={() => setCustomerNifRule(r)}
                        className="accent-purple-700 dark:accent-pink-600"
                      />
                      <span className="text-purple-900 dark:text-purple-200 font-medium">
                        {r === 'NONE' ? 'Não pedir' : r === 'OPTIONAL' ? 'Opcional' : 'Obrigatório'}
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
