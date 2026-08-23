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
  const [mode, setMode] = useState<'DISABLED' | 'VIEW_ONLY' | 'ORDER_EMISSION'>('ORDER_EMISSION')
  const [useDelivery, setUseDelivery] = useState(true)
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
        setUseDelivery(c.useDelivery ?? true)
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
            useDelivery,
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
      toast.success('Configurações de QR Code guardadas!')
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
    <div className="space-y-4 max-w-4xl">
      {/* Header Minimalista */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-purple-100 dark:border-white/10">
        <div>
          <h1 className="text-base sm:text-lg font-black text-purple-950 dark:text-white tracking-tight">
            Configurações QR Code
          </h1>
          <p className="text-[11px] text-purple-700/80 dark:text-purple-200/70">
            Modos de utilização do cardápio digital e regras de atendimento
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || loading}
          className="h-9 bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 dark:hover:from-pink-500 dark:hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-700/20 dark:shadow-pink-600/30 cursor-pointer"
        >
          {saving ? 'A gravar...' : 'Guardar Alterações'}
        </Button>
      </div>

      <div className="bg-white dark:bg-[#160228]/95 rounded-3xl border border-purple-150 dark:border-white/15 p-6 shadow-xs dark:shadow-xl space-y-6 text-slate-900 dark:text-white">
        {/* Link de Divulgação */}
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-purple-900 dark:text-purple-200">Link de Divulgação Oficial do Cardápio</Label>
          <div className="flex gap-2">
            <Input
              value={publicUrl}
              readOnly
              className="bg-purple-50/70 dark:bg-white/10 border-purple-200 dark:border-white/15 rounded-xl text-xs font-mono text-purple-950 dark:text-pink-300 font-bold h-10 select-all"
            />
            <Button
              type="button"
              onClick={handleCopyLink}
              className="bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 dark:hover:from-pink-500 dark:hover:to-purple-500 text-white text-xs font-bold px-4 h-10 rounded-xl shadow-xs cursor-pointer"
            >
              Copiar Link
            </Button>
          </div>
          <p className="text-[11px] text-purple-700/80 dark:text-purple-200/70">
            Link público para redes sociais, bio do Instagram e material impresso
          </p>
        </div>

        {/* Modo de Utilização do QR Code (Dropdown Oficial) */}
        <div className="space-y-1.5 pt-4 border-t border-purple-100 dark:border-white/10">
          <Label className="text-xs font-bold text-purple-900 dark:text-purple-200">Modo de Utilização do QR Code</Label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
            className="w-full h-11 px-3.5 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-white/10 text-xs font-bold text-purple-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-pink-500 [&>option]:bg-white dark:[&>option]:bg-[#160228] [&>option]:text-purple-950 dark:[&>option]:text-white"
          >
            <option value="ORDER_EMISSION">Emissão de Pedido (Cardápio Interativo Completo com Envio para a Cozinha)</option>
            <option value="VIEW_ONLY">Visualização (Apenas Consulta de Fotos e Preços - Sem Envio de Comanda)</option>
            <option value="DISABLED">Desativado (QR Code Temporariamente Desligado)</option>
          </select>
          <p className="text-[11px] text-purple-700/80 dark:text-purple-200/70">
            No modo <b>Visualização</b>, os clientes veem fotos e preços mas não emitem pedidos (ideal para atendimento manual).
          </p>
        </div>

        {/* Identificação de Mesa */}
        <div className="space-y-2 pt-4 border-t border-purple-100 dark:border-white/10">
          <Label className="text-xs font-bold text-purple-900 dark:text-purple-200">Identificação da Mesa no QR Code</Label>
          <div className="space-y-2 text-xs">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="tableMode"
                checked={tableMode === 'FIXED_QR'}
                onChange={() => setTableMode('FIXED_QR')}
                className="accent-purple-700 dark:accent-pink-600"
              />
              <span className="font-semibold text-purple-950 dark:text-white">Leitura de QR Code de Mesa Fixo (Placa numerada na mesa)</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="tableMode"
                checked={tableMode === 'TYPED_TABLE'}
                onChange={() => setTableMode('TYPED_TABLE')}
                className="accent-purple-700 dark:accent-pink-600"
              />
              <span className="font-semibold text-purple-950 dark:text-white">Mesa digitada pelo cliente no telemóvel</span>
            </label>
          </div>
        </div>

        {/* Switches de Operação */}
        <div className="pt-4 border-t border-purple-100 dark:border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-purple-950 dark:text-white">Utiliza Delivery</div>
              <div className="text-[11px] text-purple-700/80 dark:text-purple-200/70">Permite pedidos para entrega com endereço</div>
            </div>
            <Switch checked={useDelivery} onCheckedChange={setUseDelivery} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-purple-950 dark:text-white">Ativa Pagamento com MB Way no QR Code</div>
              <div className="text-[11px] text-purple-700/80 dark:text-purple-200/70">O cliente pode pagar direto pelo telemóvel ao fechar a comanda</div>
            </div>
            <Switch checked={allowMbwayPayment} onCheckedChange={setAllowMbwayPayment} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-purple-950 dark:text-white">Habilitar Telefone Internacional</div>
              <div className="text-[11px] text-purple-700/80 dark:text-purple-200/70">Permite números de telemóvel estrangeiros para turistas em Portugal</div>
            </div>
            <Switch checked={allowInternationalPhone} onCheckedChange={setAllowInternationalPhone} />
          </div>
        </div>

        {/* Regras de Dados do Cliente */}
        <div className="pt-4 border-t border-purple-100 dark:border-white/10 space-y-4">
          <div className="text-xs font-black uppercase text-purple-700 dark:text-pink-300 tracking-wider">
            Identificação do Cliente no Envio
          </div>

          {/* Nome */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-purple-950 dark:text-white">Nome do Cliente:</span>
            <div className="flex gap-4 text-xs">
              {(['NONE', 'OPTIONAL', 'REQUIRED'] as const).map((r) => (
                <label key={r} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="nameRule"
                    checked={customerNameRule === r}
                    onChange={() => setCustomerNameRule(r)}
                    className="accent-purple-700 dark:accent-pink-600"
                  />
                  <span className="text-purple-900 dark:text-purple-200">{r === 'NONE' ? 'Não pedir' : r === 'OPTIONAL' ? 'Opcional' : 'Obrigatório'}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Telemóvel */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-purple-950 dark:text-white">Telemóvel do Cliente:</span>
            <div className="flex gap-4 text-xs">
              {(['NONE', 'OPTIONAL', 'REQUIRED'] as const).map((r) => (
                <label key={r} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="phoneRule"
                    checked={customerPhoneRule === r}
                    onChange={() => setCustomerPhoneRule(r)}
                    className="accent-purple-700 dark:accent-pink-600"
                  />
                  <span className="text-purple-900 dark:text-purple-200">{r === 'NONE' ? 'Não pedir' : r === 'OPTIONAL' ? 'Opcional' : 'Obrigatório'}</span>
                </label>
              ))}
            </div>
          </div>

          {/* NIF */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-purple-950 dark:text-white">NIF / Contribuinte do Cliente:</span>
            <div className="flex gap-4 text-xs">
              {(['NONE', 'OPTIONAL', 'REQUIRED'] as const).map((r) => (
                <label key={r} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="nifRule"
                    checked={customerNifRule === r}
                    onChange={() => setCustomerNifRule(r)}
                    className="accent-purple-700 dark:accent-pink-600"
                  />
                  <span className="text-purple-900 dark:text-purple-200">{r === 'NONE' ? 'Não pedir' : r === 'OPTIONAL' ? 'Opcional' : 'Obrigatório'}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
