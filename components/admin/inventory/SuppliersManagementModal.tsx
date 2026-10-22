'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Building2, Plus, Edit2, Trash2, Check, X, Search, Clock, Phone, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import { SupplierRow } from '@/lib/repositories/inventoryRepository'

interface SuppliersManagementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuppliersUpdated?: () => void
}

export default function SuppliersManagementModal({
  open,
  onOpenChange,
  onSuppliersUpdated,
}: SuppliersManagementModalProps) {
  const { authFetch } = useAuthStore()
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  // Formulário de Criação / Edição
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('BASE')
  const [nif, setNif] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [leadTimeDays, setLeadTimeDays] = useState(3)
  const [saving, setSaving] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  const loadSuppliers = async () => {
    setLoading(true)
    try {
      const res = await authFetch('/api/suppliers')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.suppliers)) {
          setSuppliers(data.suppliers)
        }
      }
    } catch {
      toast.error('Erro ao carregar lista de fornecedores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadSuppliers()
      resetForm()
    }
  }, [open])

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setCategory('BASE')
    setNif('')
    setEmail('')
    setPhone('')
    setLeadTimeDays(3)
    setShowAddForm(false)
  }

  const handleStartEdit = (s: SupplierRow) => {
    setEditingId(s.id)
    setName(s.name)
    setCategory(s.category || 'BASE')
    setNif(s.nif || '')
    setEmail(s.email || '')
    setPhone(s.phone || '')
    setLeadTimeDays(s.leadTimeDays || 3)
    setShowAddForm(true)
  }

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Nome do fornecedor é obrigatório')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        category: category.trim(),
        nif: nif.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        leadTimeDays: Number(leadTimeDays) || 3,
      }

      const url = editingId ? `/api/suppliers/${editingId}` : '/api/suppliers'
      const method = editingId ? 'PUT' : 'POST'

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Falha ao salvar fornecedor')
      }

      toast.success(editingId ? 'Fornecedor atualizado com sucesso!' : 'Novo fornecedor homologado com sucesso!')
      resetForm()
      await loadSuppliers()
      onSuppliersUpdated?.()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar fornecedor')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, supplierName: string) => {
    if (!confirm(`Deseja desativar o fornecedor "${supplierName}"?`)) return

    try {
      const res = await authFetch(`/api/suppliers/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Falha ao desativar fornecedor')
      toast.success('Fornecedor removido/desativado com sucesso!')
      await loadSuppliers()
      onSuppliersUpdated?.()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover fornecedor')
    }
  }

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.category && s.category.toLowerCase().includes(search.toLowerCase())) ||
      (s.email && s.email.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-6 bg-white dark:bg-[#160228] border border-purple-150 dark:border-white/15 text-purple-950 dark:text-white rounded-3xl shadow-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="text-left pb-2 border-b border-purple-100 dark:border-white/10 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-2xl bg-purple-100 dark:bg-white/10 flex items-center justify-center text-purple-800 dark:text-pink-300">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-black text-purple-950 dark:text-white">
                  Fornecedores Homologados da Franqueadora
                </DialogTitle>
                <p className="text-xs text-purple-700/80 dark:text-purple-200/70 font-medium">
                  Gestão corporativa de parceiros, indústrias, embalagens e distribuidores oficiais
                </p>
              </div>
            </div>

            {!showAddForm && (
              <Button
                onClick={() => {
                  resetForm()
                  setShowAddForm(true)
                }}
                className="h-9 px-3 text-xs font-bold rounded-xl bg-purple-700 hover:bg-purple-800 text-white cursor-pointer shadow-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Novo Fornecedor</span>
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* FORMULÁRIO DE ADIÇÃO OU EDIÇÃO */}
        {showAddForm && (
          <form onSubmit={handleSaveSupplier} className="p-4 rounded-2xl bg-purple-50/50 dark:bg-white/5 border border-purple-150 dark:border-white/10 space-y-3 shrink-0 mt-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-purple-900 dark:text-white tracking-wider">
                {editingId ? 'Editar Fornecedor' : 'Cadastrar Novo Fornecedor'}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="text-purple-500 hover:text-purple-700 dark:text-purple-300 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-purple-900 dark:text-purple-200">Razão Social / Nome Fantasia *</Label>
                <Input
                  required
                  placeholder="Ex: Açaí Amazon Berry S.L."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 text-xs rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-[#1a0230]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-purple-900 dark:text-purple-200">Categoria Principal</Label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-9 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#1a0230] px-3 text-xs font-bold text-purple-950 dark:text-white"
                >
                  <option value="BASE">Bases & Cremes</option>
                  <option value="CALDA">Caldas Nobres</option>
                  <option value="TOPPING">Acompanhamentos & Crocantes</option>
                  <option value="EMBALAGEM">Copos & Embalagens</option>
                  <option value="DESCARTAVEL">Descartáveis</option>
                  <option value="LIMPEZA">Higiene & Limpeza</option>
                  <option value="GRAFICOS">Produtos Gráficos & Merchandising</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-purple-900 dark:text-purple-200">NIF / CIF (Fiscal)</Label>
                <Input
                  placeholder="Ex: PT509123456"
                  value={nif}
                  onChange={(e) => setNif(e.target.value)}
                  className="h-9 text-xs rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-[#1a0230]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-purple-900 dark:text-purple-200">Prazo de Entrega (Lead Time em dias)</Label>
                <Input
                  type="number"
                  min="1"
                  max="60"
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(parseInt(e.target.value) || 3)}
                  className="h-9 text-xs rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-[#1a0230]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-purple-900 dark:text-purple-200">E-mail Comercial / Pedidos</Label>
                <Input
                  type="email"
                  placeholder="vendas@fornecedor.pt"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 text-xs rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-[#1a0230]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-purple-900 dark:text-purple-200">Telefone / WhatsApp</Label>
                <Input
                  placeholder="+351 912 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-9 text-xs rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-[#1a0230]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetForm}
                className="h-8 text-xs rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="h-8 text-xs font-bold rounded-xl bg-purple-700 hover:bg-purple-800 text-white"
              >
                {saving ? 'Gravando...' : editingId ? 'Salvar Fornecedor' : 'Cadastrar Fornecedor'}
              </Button>
            </div>
          </form>
        )}

        {/* BUSCA DE FORNECEDORES */}
        <div className="relative my-3 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-purple-400" />
          <Input
            placeholder="Pesquisar fornecedor por nome, categoria ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl border-purple-150 dark:border-white/10 bg-purple-50/30 dark:bg-white/5"
          />
        </div>

        {/* LISTAGEM DE FORNECEDORES */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="py-8 text-center text-xs text-purple-600 font-bold">Carregando fornecedores...</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-purple-600">Nenhum fornecedor encontrado.</div>
          ) : (
            filtered.map((s) => (
              <div
                key={s.id}
                className="p-3 rounded-2xl border border-purple-100 dark:border-white/10 bg-purple-50/20 dark:bg-white/5 hover:border-purple-300 dark:hover:border-white/20 transition-all flex items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-purple-950 dark:text-white truncate">
                      {s.name}
                    </span>
                    {s.category && (
                      <Badge className="text-[9px] bg-purple-100 text-purple-900 dark:bg-white/10 dark:text-purple-200 border-none font-bold py-0 px-1.5">
                        {s.category}
                      </Badge>
                    )}
                    {s.nif && (
                      <span className="text-[10px] font-mono text-purple-500 font-bold">
                        NIF: {s.nif}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-purple-700/80 dark:text-purple-300/70 flex-wrap">
                    {s.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-purple-400" />
                        {s.email}
                      </span>
                    )}
                    {s.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-purple-400" />
                        {s.phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[10px] text-purple-600 dark:text-pink-400 font-bold">
                      <Clock className="h-3 w-3" />
                      Entrega: ~{s.leadTimeDays || 3} dias
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleStartEdit(s)}
                    className="h-8 w-8 p-0 rounded-lg text-purple-600 hover:bg-purple-100 dark:hover:bg-white/10 cursor-pointer"
                    title="Editar fornecedor"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(s.id, s.name)}
                    className="h-8 w-8 p-0 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                    title="Desativar fornecedor"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
