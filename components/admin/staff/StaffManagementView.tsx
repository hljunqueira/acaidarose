'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { StaffMember } from '@/types/staff'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface StaffManagementViewProps {
  tenantId: string
}

export default function StaffManagementView({ tenantId }: StaffManagementViewProps) {
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)

  // Form state
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [nickname, setNickname] = useState('')
  const [phone, setPhone] = useState('')
  const [serviceCommission, setServiceCommission] = useState('5.0')
  const [active, setActive] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchStaff = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/staff?tenantId=${encodeURIComponent(tenantId)}`)
      const data = await res.json()
      if (data.staff) {
        setStaffList(data.staff)
      }
    } catch {
      toast.error('Erro ao carregar colaboradores')
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  const handleOpenNew = () => {
    setEditingStaff(null)
    const nextCode = `G${(staffList.length + 1).toString().padStart(2, '0')}`
    setCode(nextCode)
    setName('')
    setNickname('')
    setPhone('')
    setServiceCommission('5.0')
    setActive(true)
    setDialogOpen(true)
  }

  const handleOpenEdit = (st: StaffMember) => {
    setEditingStaff(st)
    setCode(st.code)
    setName(st.name)
    setNickname(st.nickname)
    setPhone(st.phone || '')
    setServiceCommission((st.serviceCommission || 0).toString())
    setActive(st.active)
    setDialogOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code || !name) {
      toast.error('Preencha o código e o nome do atendente')
      return
    }

    setSaving(true)
    try {
      const payload = {
        tenantId,
        code,
        name,
        nickname: nickname || name,
        phone,
        serviceCommission: Number(serviceCommission) || 0,
        active,
      }

      const url = editingStaff ? `/api/staff/${editingStaff.id}` : '/api/staff'
      const method = editingStaff ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Falha ao salvar colaborador')
      toast.success(editingStaff ? 'Colaborador atualizado!' : 'Colaborador adicionado com sucesso!')
      setDialogOpen(false)
      fetchStaff()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gravar')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (st: StaffMember) => {
    try {
      const res = await fetch(`/api/staff/${st.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !st.active }),
      })
      if (!res.ok) throw new Error('Falha ao alterar situação')
      toast.success(`Situação de ${st.nickname} alterada!`)
      fetchStaff()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao alterar')
    }
  }

  return (
    <div className="space-y-4">
      {/* Header Minimalista */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-purple-100 dark:border-white/10">
        <div>
          <h1 className="text-base sm:text-lg font-black text-purple-950 dark:text-white tracking-tight">
            Garçons & Atendentes
          </h1>
          <p className="text-[11px] text-purple-700/80 dark:text-purple-200/70">
            Gestão da equipe de salão e comissões ({staffList.length} colaboradores)
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleOpenNew}
          className="h-9 bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 dark:hover:from-pink-500 dark:hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-700/20 dark:shadow-pink-600/30 cursor-pointer"
        >
          + Novo Colaborador
        </Button>
      </div>

      {/* Tabela de Colaboradores */}
      <div className="bg-white dark:bg-[#160228]/95 rounded-3xl border border-purple-150 dark:border-white/15 shadow-xs dark:shadow-xl overflow-hidden text-slate-900 dark:text-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-purple-50/70 dark:bg-white/5 border-b border-purple-100 dark:border-white/10 text-purple-950 dark:text-purple-200 font-black uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Código</th>
                <th className="py-3.5 px-4">Nome Completo</th>
                <th className="py-3.5 px-4">Apelido (Crachá)</th>
                <th className="py-3.5 px-4">Telemóvel</th>
                <th className="py-3.5 px-4">Comissão (%)</th>
                <th className="py-3.5 px-4">Situação</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100 dark:divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-purple-700 dark:text-purple-300/60 font-bold">
                    A carregar colaboradores...
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-purple-700/70 dark:text-purple-300/60">
                    Nenhum garçom ou atendente registado nesta unidade.
                  </td>
                </tr>
              ) : (
                staffList.map((st) => (
                  <tr
                    key={st.id}
                    className="hover:bg-purple-50/50 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-800 dark:text-pink-300">{st.code}</td>
                    <td className="py-3.5 px-4 font-bold text-purple-950 dark:text-white">{st.name}</td>
                    <td className="py-3.5 px-4 font-medium text-purple-900 dark:text-purple-200">{st.nickname}</td>
                    <td className="py-3.5 px-4 text-purple-700/80 dark:text-purple-200/70 font-mono">{st.phone || '—'}</td>
                    <td className="py-3.5 px-4 font-semibold text-purple-950 dark:text-white">
                      {st.serviceCommission ? `${st.serviceCommission.toFixed(1)}%` : '0.0%'}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(st)}
                        className="cursor-pointer"
                      >
                        <Badge
                          className={`text-[10px] py-0 px-2 font-bold ${
                            st.active
                              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                              : 'bg-zinc-200 dark:bg-zinc-700/50 text-zinc-800 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-600'
                          }`}
                        >
                          {st.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(st)}
                        className="text-xs text-purple-800 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white hover:bg-purple-100/70 dark:hover:bg-white/10 font-bold h-7 px-2.5 rounded-lg cursor-pointer"
                      >
                        Editar
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Cadastro / Edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md p-6 bg-white dark:bg-[#160228] border-purple-200 dark:border-white/15 text-slate-900 dark:text-white shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-purple-950 dark:text-white">
              {editingStaff ? 'Editar Atendente' : 'Novo Garçom / Atendente'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 my-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-purple-900 dark:text-purple-200">Código</Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="ex: G01"
                  required
                  className="rounded-xl h-10 text-xs font-mono font-bold bg-white dark:bg-white/10 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <Label className="text-xs font-bold text-purple-900 dark:text-purple-200">Apelido (Crachá / PDV)</Label>
                <Input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="ex: Marcos"
                  required
                  className="rounded-xl h-10 text-xs bg-white dark:bg-white/10 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-purple-900 dark:text-purple-200">Nome Completo</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: Marcos Silva"
                required
                className="rounded-xl h-10 text-xs bg-white dark:bg-white/10 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-purple-900 dark:text-purple-200">Telemóvel / WhatsApp</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+351 912 345 678"
                  className="rounded-xl h-10 text-xs bg-white dark:bg-white/10 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-purple-900 dark:text-purple-200">Comissão de Serviço (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={serviceCommission}
                  onChange={(e) => setServiceCommission(e.target.value)}
                  placeholder="5.0"
                  className="rounded-xl h-10 text-xs font-mono bg-white dark:bg-white/10 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="activeCheckbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 rounded accent-purple-700 dark:accent-pink-600 cursor-pointer"
              />
              <Label htmlFor="activeCheckbox" className="text-xs font-bold text-purple-900 dark:text-purple-200 cursor-pointer">
                Colaborador ativo na escala de atendimento
              </Label>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-950 dark:text-white rounded-xl h-10 text-xs cursor-pointer shadow-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 dark:hover:from-pink-500 dark:hover:to-purple-500 text-white font-bold rounded-xl h-10 text-xs shadow-md shadow-purple-700/20 dark:shadow-pink-600/30 cursor-pointer"
              >
                {saving ? 'A gravar...' : editingStaff ? 'Salvar Alterações' : 'Adicionar Colaborador'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
