'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Building2,
  MapPin,
  FileText,
  UserCheck,
  Percent,
  DollarSign,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

export interface CreateStoreFormData {
  // 1. Dados da Loja
  name: string
  companyName: string
  slug: string
  nif: string
  // 2. Localização & Contactos
  address: string
  postalCode: string
  city: string
  district: string
  phone: string
  mbwayPhone: string
  // 3. Contrato Franqueadora
  franchiseFee: number
  royaltyPercent: number
  marketingPercent: number
  systemFeeMonthly: number
  startDate: string
  renewalYears: number
  // 4. Gestor da Loja
  managerName: string
  managerEmail: string
  managerPassword?: string
  currency: string
}

interface CreateStoreDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: CreateStoreFormData) => Promise<void>
}

export default function CreateStoreDialog({
  open,
  onOpenChange,
  onSave,
}: CreateStoreDialogProps) {
  const [activeTab, setActiveTab] = useState<'DADOS' | 'CONTRATO' | 'GESTOR'>('DADOS')
  const [saving, setSaving] = useState(false)

  // 1. Dados da Loja
  const [name, setName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [slug, setSlug] = useState('')
  const [nif, setNif] = useState('')

  // 2. Localização & Contactos
  const [address, setAddress] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [phone, setPhone] = useState('')
  const [mbwayPhone, setMbwayPhone] = useState('')

  // 3. Contrato Franqueadora
  const [franchiseFee, setFranchiseFee] = useState<number>(25000.0)
  const [royaltyPercent, setRoyaltyPercent] = useState<number>(5.0)
  const [marketingPercent, setMarketingPercent] = useState<number>(1.0)
  const [systemFeeMonthly, setSystemFeeMonthly] = useState<number>(49.0)
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [renewalYears, setRenewalYears] = useState<number>(5)

  // 4. Gestor da Loja
  const [managerName, setManagerName] = useState('')
  const [managerEmail, setManagerEmail] = useState('')
  const [managerPassword, setManagerPassword] = useState('Rose2026!')

  const handleNameChange = (val: string) => {
    setName(val)
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]/g, '-')) {
      const generated = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      setSlug(generated)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Informe o nome da franquia')
      setActiveTab('DADOS')
      return
    }
    if (!nif.trim()) {
      toast.error('Informe o NIF fiscal da empresa')
      setActiveTab('DADOS')
      return
    }

    setSaving(true)
    try {
      await onSave({
        name,
        companyName: companyName || `${name} Lda`,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        nif,
        address,
        postalCode,
        city: city || 'Portugal',
        district: district || city,
        phone,
        mbwayPhone: mbwayPhone || phone,
        franchiseFee: Number(franchiseFee),
        royaltyPercent: Number(royaltyPercent),
        marketingPercent: Number(marketingPercent),
        systemFeeMonthly: Number(systemFeeMonthly),
        startDate,
        renewalYears: Number(renewalYears),
        managerName: managerName || `Gerente ${name}`,
        managerEmail:
          managerEmail || `gerente.${slug || 'loja'}@acaidarose.pt`,
        managerPassword,
        currency: 'EUR',
      })

      // Reset
      setName('')
      setCompanyName('')
      setSlug('')
      setNif('')
      setAddress('')
      setPostalCode('')
      setCity('')
      setDistrict('')
      setPhone('')
      setMbwayPhone('')
      setManagerName('')
      setManagerEmail('')
      onOpenChange(false)
      toast.success('Nova franquia homologada e cadastrada com sucesso!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao cadastrar franquia')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-3xl max-h-[92vh] overflow-y-auto p-5 sm:p-6 bg-white dark:bg-[#160228] text-purple-950 dark:text-white border border-purple-150 dark:border-white/15 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <DialogHeader className="text-left pb-3 border-b border-purple-150 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-white/5 text-purple-700 dark:text-pink-400 border border-purple-150 dark:border-white/10 shadow-xs">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black text-purple-950 dark:text-white tracking-tight">
                Cadastrar Nova Franquia & Filial
              </DialogTitle>
              <p className="text-xs text-purple-700/80 dark:text-purple-200/70 font-medium">
                Registo de nova unidade, dados fiscais, contrato de royalties (5%), sistema (49€) e gestor
              </p>
            </div>
          </div>

          {/* Abas de Navegação do Modal */}
          <div className="flex items-center gap-1.5 pt-3">
            <button
              type="button"
              onClick={() => setActiveTab('DADOS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'DADOS'
                  ? 'bg-purple-700 dark:bg-pink-600 text-white shadow-xs'
                  : 'bg-purple-50 dark:bg-white/5 text-purple-900 dark:text-purple-200/80 hover:bg-purple-100 dark:hover:bg-white/10'
              }`}
            >
              1. Dados & Morada
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('CONTRATO')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'CONTRATO'
                  ? 'bg-purple-700 dark:bg-pink-600 text-white shadow-xs'
                  : 'bg-purple-50 dark:bg-white/5 text-purple-900 dark:text-purple-200/80 hover:bg-purple-100 dark:hover:bg-white/10'
              }`}
            >
              2. Contrato & Royalties (5%)
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('GESTOR')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'GESTOR'
                  ? 'bg-purple-700 dark:bg-pink-600 text-white shadow-xs'
                  : 'bg-purple-50 dark:bg-white/5 text-purple-900 dark:text-purple-200/80 hover:bg-purple-100 dark:hover:bg-white/10'
              }`}
            >
              3. Gestor da Loja
            </button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          {/* ABA 1: DADOS DA LOJA & LOCALIZAÇÃO */}
          {activeTab === 'DADOS' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                    Nome Comercial da Franquia: *
                  </Label>
                  <Input
                    required
                    placeholder="Ex: Açaí da Rose — Coimbra"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-purple-50/50 dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                    Razão Social / Nome da Empresa Franqueada:
                  </Label>
                  <Input
                    placeholder="Ex: Açaí Coimbra Unipessoal Lda"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-purple-50/50 dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                    NIF / NIPC Português: *
                  </Label>
                  <Input
                    required
                    placeholder="500 123 456"
                    value={nif}
                    onChange={(e) => setNif(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-purple-50/50 dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                    Identificador / Slug do Sistema:
                  </Label>
                  <Input
                    placeholder="coimbra"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-purple-50/50 dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                  Morada / Endereço Completo:
                </Label>
                <Input
                  placeholder="Avenida Sá da Bandeira, 120"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-9 text-xs rounded-xl bg-purple-50/50 dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                    Código Postal:
                  </Label>
                  <Input
                    placeholder="3000-001"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-purple-50/50 dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                    Cidade / Concelho:
                  </Label>
                  <Input
                    placeholder="Coimbra"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-purple-50/50 dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                    Distrito:
                  </Label>
                  <Input
                    placeholder="Coimbra"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-purple-50/50 dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                    Telemóvel da Loja (Contacto):
                  </Label>
                  <Input
                    placeholder="+351 912 345 678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-purple-50/50 dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                    Chave MB WAY para Pagamentos:
                  </Label>
                  <Input
                    placeholder="+351 912 345 678"
                    value={mbwayPhone}
                    onChange={(e) => setMbwayPhone(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-purple-50/50 dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: CONTRATO & REGRAS FINANCEIRAS */}
          {activeTab === 'CONTRATO' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 text-xs">
                <div className="font-bold text-amber-950 dark:text-amber-300 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  <span>Política Padrão de Royalties da Franqueadora</span>
                </div>
                <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80 mt-1">
                  Os valores definidos abaixo serão aplicados automaticamente na apuração mensal da unidade.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                    Royalties Mensais (%):
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="20"
                      value={royaltyPercent}
                      onChange={(e) => setRoyaltyPercent(Number(e.target.value))}
                      className="h-9 text-xs rounded-xl bg-purple-50/50 dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white font-mono font-black pl-3 pr-7"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-bold text-purple-600 dark:text-pink-400 text-xs">%</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                    Fundo de Marketing (%):
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={marketingPercent}
                      onChange={(e) => setMarketingPercent(Number(e.target.value))}
                      className="h-9 text-xs rounded-xl bg-purple-50/50 dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white font-mono font-black pl-3 pr-7"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-bold text-purple-600 dark:text-pink-400 text-xs">%</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                    Licença Sistema & PDV (€):
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      value={systemFeeMonthly}
                      onChange={(e) => setSystemFeeMonthly(Number(e.target.value))}
                      className="h-9 text-xs rounded-xl bg-purple-50/50 dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white font-mono font-black pl-3 pr-7"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-bold text-purple-600 dark:text-pink-400 text-xs">€</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                    Taxa Inicial de Franquia (€):
                  </Label>
                  <Input
                    type="number"
                    step="500"
                    value={franchiseFee}
                    onChange={(e) => setFranchiseFee(Number(e.target.value))}
                    className="h-9 text-xs rounded-xl bg-purple-50/50 dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white font-mono font-black"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                    Data de Abertura / Início:
                  </Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-purple-50/50 dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                    Vigência do Contrato (Anos):
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={renewalYears}
                    onChange={(e) => setRenewalYears(Number(e.target.value))}
                    className="h-9 text-xs rounded-xl bg-purple-50/50 dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ABA 3: GESTOR MASTER DA FILIAL */}
          {activeTab === 'GESTOR' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-white/5 border border-purple-150 dark:border-white/10 text-xs">
                <div className="font-bold text-purple-950 dark:text-white flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-purple-700 dark:text-pink-400" />
                  <span>Utilizador Master do Franqueado</span>
                </div>
                <p className="text-[11px] text-purple-700/80 dark:text-purple-300/80 mt-1">
                  Este operador terá acesso de Gerente (TENANT_ADMIN) para gerir mesas, cardápio local e operadores de caixa da loja.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                    Nome Completo do Gerente:
                  </Label>
                  <Input
                    placeholder="Ex: João Miguel Santos"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-purple-50/50 dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                    E-mail Corporativo de Acesso:
                  </Label>
                  <Input
                    type="email"
                    placeholder={`gerente.${slug || 'loja'}@acaidarose.pt`}
                    value={managerEmail}
                    onChange={(e) => setManagerEmail(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-purple-50/50 dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                  Palavra-Passe Inicial:
                </Label>
                <Input
                  type="text"
                  value={managerPassword}
                  onChange={(e) => setManagerPassword(e.target.value)}
                  className="h-9 text-xs rounded-xl bg-purple-50/50 dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white font-mono font-bold"
                />
              </div>
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-purple-150 dark:border-white/10 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs font-bold rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-purple-950 dark:text-white hover:bg-purple-50 dark:hover:bg-white/10 cursor-pointer shadow-2xs"
            >
              Cancelar
            </Button>

            <div className="flex items-center gap-2">
              {activeTab !== 'GESTOR' ? (
                <Button
                  type="button"
                  onClick={() =>
                    setActiveTab(activeTab === 'DADOS' ? 'CONTRATO' : 'GESTOR')
                  }
                  className="h-9 px-4 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
                >
                  Avançar
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={saving}
                  className="h-9 px-4 bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-800 hover:to-pink-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
                >
                  {saving ? 'A Homologar...' : 'Homologar & Criar Franquia'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
