'use client'

import React, { useState, useEffect } from 'react'
import { Tenant } from '@/types'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import { useFranchiseStore } from '@/lib/stores/franchiseStore'

interface StoreCompanySettingsViewProps {
  tenantId: string
}

export default function StoreCompanySettingsView({ tenantId }: StoreCompanySettingsViewProps) {
  const { authFetch } = useAuthStore()
  const { setCurrentTenant } = useFranchiseStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<Partial<Tenant>>({
    name: '',
    companyName: '',
    nif: '',
    address: '',
    postalCode: '',
    city: '',
    phone: '',
    mbwayPhone: '',
    wifiNetwork: '',
    wifiPassword: '',
    aboutText: '',
    instagramUrl: '',
    openingHours: {
      seg: { open: '12:00', close: '22:00' },
      ter: { open: '12:00', close: '22:00' },
      qua: { open: '12:00', close: '22:00' },
      qui: { open: '12:00', close: '22:00' },
      sex: { open: '12:00', close: '23:00' },
      sab: { open: '12:00', close: '23:00' },
      dom: { open: '13:00', close: '22:00' },
    },
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await authFetch(`/api/tenants/${tenantId}/settings`)
      const data = await res.json()
      if (data.tenant) {
        setForm(data.tenant)
      }
    } catch {
      toast.error('Erro ao carregar dados da empresa')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [tenantId])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await authFetch(`/api/tenants/${tenantId}/settings`, {
        method: 'PUT',
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao guardar')

      if (data.tenant) {
        setCurrentTenant(data.tenant)
      }
      toast.success('Dados da empresa e horários atualizados com sucesso!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao guardar dados')
    } finally {
      setSaving(false)
    }
  }

  const daysList = [
    { key: 'seg', label: 'Segunda-feira' },
    { key: 'ter', label: 'Terça-feira' },
    { key: 'qua', label: 'Quarta-feira' },
    { key: 'qui', label: 'Quinta-feira' },
    { key: 'sex', label: 'Sexta-feira' },
    { key: 'sab', label: 'Sábado' },
    { key: 'dom', label: 'Domingo' },
  ]

  if (loading) {
    return (
      <div className="py-24 text-center text-xs font-bold text-purple-700 dark:text-purple-300/60">
        A carregar dados da loja...
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      {/* Header Minimalista Padrão */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-purple-100 dark:border-white/10">
        <div>
          <h1 className="text-base sm:text-lg font-black text-purple-950 dark:text-white tracking-tight">
            Dados da Loja & Perfil
          </h1>
          <p className="text-[11px] text-purple-700/80 dark:text-purple-200/70">
            Informações fiscais, contactos exibidos no cardápio QR Code, Wi-Fi e horários de atendimento
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="h-9 bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 dark:hover:from-pink-500 dark:hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-700/20 dark:shadow-pink-600/30 cursor-pointer px-4"
        >
          {saving ? 'A guardar...' : 'Guardar Alterações'}
        </Button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Coluna Principal: Identificação + Contactos & Wi-Fi (7 colunas) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card 1: Identificação & Fiscal */}
          <Card className="p-5 rounded-3xl border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228]/95 space-y-4 shadow-xs dark:shadow-xl text-slate-900 dark:text-white">
            <div className="text-xs font-black text-purple-700 dark:text-pink-300 uppercase tracking-wider border-b border-purple-100 dark:border-white/10 pb-2.5">
              🏢 Identificação Cadastral & Fiscal
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-bold text-purple-900 dark:text-purple-200">Nome Comercial da Loja:</Label>
                <Input
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="h-9 text-xs rounded-xl font-bold bg-white dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-purple-900 dark:text-purple-200">NIF (Portugal):</Label>
                <Input
                  value={form.nif || ''}
                  onChange={(e) => setForm({ ...form, nif: e.target.value })}
                  placeholder="509123456"
                  className="h-9 text-xs rounded-xl font-mono bg-white dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white"
                />
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className="text-xs font-bold text-purple-900 dark:text-purple-200">Razão Social / Entidade Jurídica:</Label>
                <Input
                  value={form.companyName || ''}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  placeholder="ex: Rose & Vavá Portugal Lda"
                  className="h-9 text-xs rounded-xl bg-white dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-bold text-purple-900 dark:text-purple-200">Morada Completa:</Label>
                <Input
                  value={form.address || ''}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Praça 5 de Outubro 12"
                  className="h-9 text-xs rounded-xl bg-white dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-purple-900 dark:text-purple-200">Código Postal & Cidade:</Label>
                <Input
                  value={form.postalCode || ''}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                  placeholder="2350-754 Torres Novas"
                  className="h-9 text-xs rounded-xl bg-white dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white"
                />
              </div>
            </div>
          </Card>

          {/* Card 2: Contactos, MB WAY & Wi-Fi */}
          <Card className="p-5 rounded-3xl border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228]/95 space-y-4 shadow-xs dark:shadow-xl text-slate-900 dark:text-white">
            <div className="text-xs font-black text-purple-700 dark:text-pink-300 uppercase tracking-wider border-b border-purple-100 dark:border-white/10 pb-2.5">
              📱 Contactos, Wi-Fi & Redes (Exibidos no Cardápio)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-purple-900 dark:text-purple-200">Telemóvel Geral:</Label>
                <Input
                  value={form.phone || ''}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+351 911 050 264"
                  className="h-9 text-xs rounded-xl font-mono bg-white dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-purple-900 dark:text-pink-300">Telemóvel MB WAY:</Label>
                <Input
                  value={form.mbwayPhone || ''}
                  onChange={(e) => setForm({ ...form, mbwayPhone: e.target.value })}
                  placeholder="+351 911 050 264"
                  className="h-9 text-xs rounded-xl font-mono font-bold border-purple-300 dark:border-pink-500/40 bg-purple-50/70 dark:bg-pink-950/20 text-purple-950 dark:text-pink-300"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-purple-900 dark:text-purple-200">Instagram Oficial:</Label>
                <Input
                  value={form.instagramUrl || ''}
                  onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
                  placeholder="https://instagram.com/acaidarose.pt"
                  className="h-9 text-xs rounded-xl bg-white dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white"
                />
              </div>

              <div className="space-y-1.5 md:col-span-1">
                <Label className="text-xs font-bold text-purple-900 dark:text-purple-200">Rede Wi-Fi (SSID):</Label>
                <Input
                  value={form.wifiNetwork || ''}
                  onChange={(e) => setForm({ ...form, wifiNetwork: e.target.value })}
                  placeholder="ex: AcaiDaRose_Clientes"
                  className="h-9 text-xs rounded-xl bg-white dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-bold text-purple-900 dark:text-purple-200">Palavra-passe do Wi-Fi:</Label>
                <Input
                  value={form.wifiPassword || ''}
                  onChange={(e) => setForm({ ...form, wifiPassword: e.target.value })}
                  placeholder="ex: acaiportugal2026"
                  className="h-9 text-xs rounded-xl font-mono bg-white dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white"
                />
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label className="text-xs font-bold text-purple-900 dark:text-purple-200">
                  História da Unidade (Aba "Sobre Nós" no telemóvel do cliente):
                </Label>
                <textarea
                  value={form.aboutText || ''}
                  onChange={(e) => setForm({ ...form, aboutText: e.target.value })}
                  rows={2}
                  placeholder="Conte o diferencial da sua loja para encantar os clientes..."
                  className="w-full p-3 rounded-2xl border border-purple-200 dark:border-white/15 text-xs bg-white dark:bg-white/5 text-purple-950 dark:text-white placeholder:text-purple-400 dark:placeholder:text-purple-300/40 focus:ring-2 focus:ring-purple-600 dark:focus:ring-pink-500"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Coluna Lateral: Horários de Funcionamento (5 colunas) */}
        <div className="lg:col-span-5">
          <Card className="p-5 rounded-3xl border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228]/95 space-y-3.5 shadow-xs dark:shadow-xl text-slate-900 dark:text-white">
            <div className="text-xs font-black text-purple-700 dark:text-pink-300 uppercase tracking-wider border-b border-purple-100 dark:border-white/10 pb-2.5">
              🕒 Horário de Funcionamento Semanal
            </div>

            <div className="divide-y divide-purple-100 dark:divide-white/10">
              {daysList.map((day) => {
                const currentDay = form.openingHours?.[day.key] || { open: '12:00', close: '22:00' }

                return (
                  <div key={day.key} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <span className="font-bold text-purple-950 dark:text-white">{day.label}</span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Input
                        type="time"
                        value={currentDay.open}
                        onChange={(e) => {
                          setForm({
                            ...form,
                            openingHours: {
                              ...form.openingHours,
                              [day.key]: { ...currentDay, open: e.target.value },
                            },
                          })
                        }}
                        className="h-8 w-20 text-xs font-mono text-center bg-white dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white rounded-xl p-1"
                      />
                      <span className="text-purple-700/80 dark:text-purple-200/70 text-[10px]">às</span>
                      <Input
                        type="time"
                        value={currentDay.close}
                        onChange={(e) => {
                          setForm({
                            ...form,
                            openingHours: {
                              ...form.openingHours,
                              [day.key]: { ...currentDay, close: e.target.value },
                            },
                          })
                        }}
                        className="h-8 w-20 text-xs font-mono text-center bg-white dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white rounded-xl p-1"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </form>
    </div>
  )
}
