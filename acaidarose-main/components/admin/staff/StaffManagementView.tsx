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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-purple-100">
        <div>
          <h1 className="text-base sm:text-lg font-black text-foreground tracking-tight">
            Garçons & Atendentes
          </h1>
          <p className="text-[11px] text-muted-foreground">
            Gestão da equipe de salão e comissões ({staffList.length} colaboradores)
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleOpenNew}
          className="h-8.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs"
        >
          + Novo Colaborador
        </Button>
      </div>

      {/* Tabela de Colaboradores */}
      <div className="bg-white rounded-3xl border border-purple-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-purple-50/70 border-b border-purple-100 text-purple-950 font-black uppercase text-[10px] tracking-wider">
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
            <tbody className="divide-y divide-purple-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    A carregar colaboradores...
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    Nenhum garçom ou atendente registado nesta unidade.
                  </td>
                </tr>
              ) : (
                staffList.map((st, idx) => (
                  <tr
                    key={st.id}
                    className={`hover:bg-purple-50/40 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-purple-50/20'}`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-900">{st.code}</td>
                    <td className="py-3.5 px-4 font-bold text-foreground">{st.name}</td>
                    <td className="py-3.5 px-4 font-medium text-purple-950">{st.nickname}</td>
                    <td className="py-3.5 px-4 text-muted-foreground font-mono">{st.phone || '—'}</td>
                    <td className="py-3.5 px-4 font-semibold text-foreground">
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
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-zinc-100 text-zinc-600 border-zinc-200'
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
                        className="text-xs text-purple-700 hover:text-purple-900 hover:bg-purple-100 font-bold h-7 px-2.5 rounded-lg"
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
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-foreground">
              {editingStaff ? 'Editar Atendente' : 'Novo Garçom / Atendente'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 my-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">Código</Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="ex: G01"
                  required
                  className="rounded-xl h-10 text-xs font-mono font-bold"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <Label className="text-xs font-bold text-foreground">Apelido (Crachá / PDV)</Label>
                <Input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="ex: Atendente Karol"
                  required
                  className="rounded-xl h-10 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-foreground">Nome Completo</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: Karol Silva"
                required
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">Telemóvel</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+351 912..."
                  className="rounded-xl h-10 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">Comissão de Serviço (%)</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={serviceCommission}
                  onChange={(e) => setServiceCommission(e.target.value)}
                  className="rounded-xl h-10 text-xs font-mono"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDialogOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-4"
              >
                {saving ? 'A gravar...' : editingStaff ? 'Atualizar' : 'Guardar Atendente'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
