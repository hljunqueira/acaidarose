'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { RestaurantTable } from '@/types/tables'
import { StaffMember } from '@/types/staff'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import SingleTableQRDialog from './SingleTableQRDialog'
import BatchTablesQRPrintDialog from './BatchTablesQRPrintDialog'
import AddEditTableDialog from './AddEditTableDialog'

interface TablesManagementViewProps {
  tenantId: string
}

export default function TablesManagementView({ tenantId }: TablesManagementViewProps) {
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)

  // Dialogs
  const [addEditOpen, setAddEditOpen] = useState(false)
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null)
  const [singleQROpen, setSingleQROpen] = useState(false)
  const [selectedQRTable, setSelectedQRTable] = useState<RestaurantTable | null>(null)
  const [batchQROpen, setBatchQROpen] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [resTables, resStaff] = await Promise.all([
        fetch(`/api/tables?tenantId=${encodeURIComponent(tenantId)}`),
        fetch(`/api/staff?tenantId=${encodeURIComponent(tenantId)}`),
      ])

      const dataTables = await resTables.json()
      const dataStaff = await resStaff.json()

      if (dataTables.tables) setTables(dataTables.tables)
      if (dataStaff.staff) setStaffList(dataStaff.staff)
    } catch {
      toast.error('Erro ao carregar mesas e colaboradores')
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleOpenAdd = () => {
    setEditingTable(null)
    setAddEditOpen(true)
  }

  const handleOpenEdit = (t: RestaurantTable) => {
    setEditingTable(t)
    setAddEditOpen(true)
  }

  const handleOpenSingleQR = (t: RestaurantTable) => {
    setSelectedQRTable(t)
    setSingleQROpen(true)
  }

  const handleDeleteTable = async (t: RestaurantTable) => {
    if (!confirm(`Tem a certeza que deseja eliminar a Mesa ${t.number}?`)) return

    try {
      const res = await fetch(`/api/tables/${t.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Falha ao eliminar mesa')
      toast.success(`Mesa ${t.number} eliminada!`)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao eliminar')
    }
  }

  return (
    <div className="space-y-4">
      {/* Header Minimalista */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-purple-100">
        <div>
          <h1 className="text-base sm:text-lg font-black text-foreground tracking-tight">
            Gestão de Mesas
          </h1>
          <p className="text-[11px] text-muted-foreground">
            Configuração de mesas, garçons e impressão de QR Codes ({tables.length} mesas)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBatchQROpen(true)}
            className="h-8.5 text-xs font-bold border-purple-200 text-purple-950 hover:bg-purple-50 rounded-xl"
          >
            Imprimir Todas
          </Button>

          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="h-8.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            + Nova Mesa
          </Button>
        </div>
      </div>

      {/* Tabela de Mesas */}
      <div className="bg-white rounded-3xl border border-purple-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-purple-50/70 border-b border-purple-100 text-purple-950 font-black uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Código</th>
                <th className="py-3.5 px-4">Apelido</th>
                <th className="py-3.5 px-4">Serviço (%)</th>
                <th className="py-3.5 px-4">Situação</th>
                <th className="py-3.5 px-4">Garçom Preferido</th>
                <th className="py-3.5 px-4">QR Code</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    A carregar mesas...
                  </td>
                </tr>
              ) : tables.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    Nenhuma mesa registada nesta unidade. Clique em "+ Adicionar Mesas" para começar.
                  </td>
                </tr>
              ) : (
                tables.map((t, idx) => (
                  <tr
                    key={t.id}
                    className={`hover:bg-purple-50/40 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-purple-50/20'}`}
                  >
                    <td className="py-3.5 px-4 font-mono font-black text-sm text-purple-950">
                      {t.number}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-foreground">
                      {t.nickname || `Mesa ${t.number.toString().padStart(2, '0')}`}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground font-mono">
                      {t.serviceChargePercent ? `${t.serviceChargePercent.toFixed(1)}%` : '0,00'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        className={`text-[10px] py-0 px-2 font-bold ${
                          t.status === 'AVAILABLE'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-purple-100 text-purple-800 border-purple-200'
                        }`}
                      >
                        {t.status === 'AVAILABLE' ? 'Ativo / Livre' : 'Ocupada'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-foreground">
                      {t.assignedStaffName || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleOpenSingleQR(t)}
                        className="text-purple-700 hover:text-purple-950 font-extrabold text-xs underline underline-offset-2 cursor-pointer"
                      >
                        QR Code
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(t)}
                        className="text-xs text-purple-700 hover:text-purple-900 hover:bg-purple-100 font-bold h-7 px-2.5 rounded-lg"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTable(t)}
                        className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 font-bold h-7 px-2.5 rounded-lg"
                      >
                        Excluir
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Botão Amplo no Rodapé da Tabela */}
        <div className="p-3 bg-purple-50/50 border-t border-purple-100">
          <Button
            onClick={handleOpenAdd}
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl cursor-pointer"
          >
            + Adicionar Mesas
          </Button>
        </div>
      </div>

      {/* Modais */}
      <SingleTableQRDialog
        open={singleQROpen}
        onOpenChange={setSingleQROpen}
        table={selectedQRTable}
      />

      <BatchTablesQRPrintDialog
        open={batchQROpen}
        onOpenChange={setBatchQROpen}
        tables={tables}
      />

      <AddEditTableDialog
        open={addEditOpen}
        onOpenChange={setAddEditOpen}
        table={editingTable}
        tenantId={tenantId}
        staffList={staffList}
        onSuccess={fetchData}
      />
    </div>
  )
}
