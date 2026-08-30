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
import ConfirmActionDialog from '@/components/ui/ConfirmActionDialog'

interface TablesManagementViewProps {
  tenantId: string
}

export default function TablesManagementView({ tenantId }: TablesManagementViewProps) {
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [loading, setLoading] = useState(true)

  // Dialogs
  const [addEditOpen, setAddEditOpen] = useState(false)
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null)
  const [singleQROpen, setSingleQROpen] = useState(false)
  const [selectedQRTable, setSelectedQRTable] = useState<RestaurantTable | null>(null)
  const [batchQROpen, setBatchQROpen] = useState(false)
  const [tableToDelete, setTableToDelete] = useState<RestaurantTable | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const resTables = await fetch(`/api/tables?tenantId=${encodeURIComponent(tenantId)}`)
      const dataTables = await resTables.json()
      if (dataTables.tables) setTables(dataTables.tables)
    } catch {
      toast.error('Erro ao carregar mesas')
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

  const handleDeleteTable = (t: RestaurantTable) => {
    setTableToDelete(t)
  }

  const handleConfirmDeleteTable = async () => {
    if (!tableToDelete) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/tables/${tableToDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Falha ao eliminar mesa')
      toast.success(`Mesa ${tableToDelete.number} eliminada com sucesso!`)
      setTableToDelete(null)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao eliminar')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header Minimalista */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-purple-100 dark:border-white/10">
        <div>
          <h1 className="text-base sm:text-lg font-black text-purple-950 dark:text-white tracking-tight">
            Gestão de Mesas
          </h1>
          <p className="text-[11px] text-purple-700/80 dark:text-purple-200/70">
            Configure as mesas do salão e imprima as placas de QR Code ({tables.length} mesas registadas)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBatchQROpen(true)}
            className="h-9 text-xs font-bold border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-950 dark:text-white rounded-xl cursor-pointer shadow-xs"
          >
            Imprimir Todas
          </Button>

          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="h-9 bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 dark:hover:from-pink-500 dark:hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-700/20 dark:shadow-pink-600/30 cursor-pointer"
          >
            Nova Mesa
          </Button>
        </div>
      </div>

      {/* Tabela de Mesas */}
      <div className="bg-white dark:bg-[#160228]/95 rounded-3xl border border-purple-150 dark:border-white/15 shadow-xs dark:shadow-xl overflow-hidden text-slate-900 dark:text-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-purple-50/70 dark:bg-white/5 border-b border-purple-100 dark:border-white/10 text-purple-950 dark:text-purple-200 font-black uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Mesa</th>
                <th className="py-3.5 px-4">Apelido / Localização</th>
                <th className="py-3.5 px-4">Situação</th>
                <th className="py-3.5 px-4">QR Code Autoatendimento</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100 dark:divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-purple-700 dark:text-purple-300/60 font-bold">
                    A carregar mesas...
                  </td>
                </tr>
              ) : tables.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-purple-700/70 dark:text-purple-300/60">
                    Nenhuma mesa registada nesta unidade. Clique em "Adicionar Mesas" para começar.
                  </td>
                </tr>
              ) : (
                tables.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-purple-50/50 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-black text-sm text-purple-800 dark:text-pink-300">
                      Mesa {t.number.toString().padStart(2, '0')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-purple-950 dark:text-white">
                      {t.nickname || `Mesa ${t.number.toString().padStart(2, '0')}`}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        className={`text-[10px] py-0.5 px-2.5 font-bold ${
                          t.status === 'AVAILABLE'
                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                            : 'bg-pink-100 dark:bg-pink-500/20 text-pink-800 dark:text-pink-300 border border-pink-200 dark:border-pink-500/30'
                        }`}
                      >
                        {t.status === 'AVAILABLE' ? 'Disponível / Livre' : 'Em Atendimento'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleOpenSingleQR(t)}
                        className="inline-flex items-center gap-1 text-purple-700 dark:text-pink-400 hover:text-purple-900 dark:hover:text-pink-300 font-bold text-xs underline underline-offset-2 cursor-pointer"
                      >
                        <span>Ver / Imprimir Placa</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(t)}
                        className="text-xs text-purple-800 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white hover:bg-purple-100/70 dark:hover:bg-white/10 font-bold h-7 px-2.5 rounded-lg cursor-pointer"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTable(t)}
                        className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 font-bold h-7 px-2.5 rounded-lg cursor-pointer"
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
        <div className="p-3 bg-purple-50/40 dark:bg-black/20 border-t border-purple-100 dark:border-white/10">
          <Button
            onClick={handleOpenAdd}
            className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-2xl cursor-pointer shadow-sm"
          >
            Adicionar Mesas
          </Button>
        </div>
      </div>

      {/* Modais */}
      <SingleTableQRDialog
        open={singleQROpen}
        onOpenChange={setSingleQROpen}
        table={selectedQRTable}
        tenantId={tenantId}
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
        onSuccess={fetchData}
      />

      {/* Modal de Confirmação de Eliminação de Mesa */}
      <ConfirmActionDialog
        open={Boolean(tableToDelete)}
        onOpenChange={(open) => !open && setTableToDelete(null)}
        title={`Eliminar Mesa ${tableToDelete?.number}?`}
        description="Tem a certeza que deseja eliminar esta mesa? O QR Code impresso para esta mesa deixará de ser reconhecido."
        confirmLabel="Sim, Eliminar Mesa"
        cancelLabel="Cancelar"
        variant="destructive"
        loading={deleteLoading}
        onConfirm={handleConfirmDeleteTable}
      />
    </div>
  )
}
