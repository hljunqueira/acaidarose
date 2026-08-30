'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { RestaurantTable } from '@/types/tables'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import SingleTableQRDialog from './SingleTableQRDialog'
import BatchTablesQRPrintDialog from './BatchTablesQRPrintDialog'
import AddEditTableDialog from './AddEditTableDialog'
import ConfirmActionDialog from '@/components/ui/ConfirmActionDialog'
import { Copy } from 'lucide-react'

interface TablesManagementViewProps {
  tenantId: string
}

export default function TablesManagementView({ tenantId }: TablesManagementViewProps) {
  const { user } = useAuthStore()
  const isMaster = !user || user.role === 'SUPER_ADMIN' || user.role === 'FRANCHISOR_ADMIN'

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

  const handleCopyTableHash = async (hash: string) => {
    if (!hash) return
    try {
      await navigator.clipboard.writeText(hash)
      toast.success(`Hash ${hash} copiada!`)
    } catch {
      toast.error('Erro ao copiar hash')
    }
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
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-black text-purple-950 dark:text-white tracking-tight">
              Gestão de Mesas
            </h1>
            {!isMaster && (
              <Badge className="bg-purple-100 dark:bg-white/10 text-purple-800 dark:text-purple-300 text-[10px] font-bold border-0">
                Modo Franqueado (Leitura)
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-purple-700/80 dark:text-purple-200/70">
            {isMaster
              ? `Configure as mesas do salão e imprima as placas de QR Code (${tables.length} mesas registadas)`
              : `Visualização e impressão das placas de QR Code da unidade (${tables.length} mesas ativas)`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBatchQROpen(true)}
            className="h-9 text-xs font-bold border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-950 dark:text-white rounded-xl cursor-pointer shadow-xs"
          >
            Imprimir Todas as Placas
          </Button>

          {isMaster && (
            <Button
              size="sm"
              onClick={handleOpenAdd}
              className="h-9 bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 dark:hover:from-pink-500 dark:hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              Nova Mesa
            </Button>
          )}
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
                <th className="py-3.5 px-4">Hash do QR Code</th>
                <th className="py-3.5 px-4">Situação</th>
                <th className="py-3.5 px-4">QR Code Autoatendimento</th>
                {isMaster && <th className="py-3.5 px-4 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100 dark:divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={isMaster ? 6 : 5} className="py-12 text-center text-purple-700 dark:text-purple-300/60 font-bold">
                    A carregar mesas...
                  </td>
                </tr>
              ) : tables.length === 0 ? (
                <tr>
                  <td colSpan={isMaster ? 6 : 5} className="py-12 text-center text-purple-700/70 dark:text-purple-300/60">
                    Nenhuma mesa registada nesta unidade.
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
                      <button
                        type="button"
                        onClick={() => handleCopyTableHash(t.code || `tb${t.number}`)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-white/5 hover:bg-purple-100 dark:hover:bg-white/10 border border-purple-150 dark:border-white/10 font-mono text-[11px] font-bold text-purple-900 dark:text-purple-200 transition-colors cursor-pointer"
                        title="Clique para copiar a Hash desta mesa"
                      >
                        <span>{t.code || `tb${t.number}`}</span>
                        <Copy className="h-3 w-3 opacity-60" />
                      </button>
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
                    {isMaster && (
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
                          className="text-xs text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 hover:bg-pink-50 dark:hover:bg-pink-950/30 font-bold h-7 px-2.5 rounded-lg cursor-pointer"
                        >
                          Eliminar
                        </Button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialogs */}
      <SingleTableQRDialog
        table={selectedQRTable}
        tenantId={tenantId}
        open={singleQROpen}
        onOpenChange={setSingleQROpen}
      />

      <BatchTablesQRPrintDialog
        tables={tables}
        open={batchQROpen}
        onOpenChange={setBatchQROpen}
      />

      {isMaster && (
        <>
          <AddEditTableDialog
            open={addEditOpen}
            onOpenChange={setAddEditOpen}
            table={editingTable}
            tenantId={tenantId}
            existingTables={tables}
            onSuccess={fetchData}
          />

          <ConfirmActionDialog
            open={Boolean(tableToDelete)}
            onOpenChange={(open) => !open && setTableToDelete(null)}
            title="Eliminar Mesa"
            description={`Tem a certeza que deseja eliminar a Mesa ${tableToDelete?.number}? Esta ação removerá a mesa do salão.`}
            confirmLabel="Eliminar Mesa"
            cancelLabel="Cancelar"
            variant="destructive"
            loading={deleteLoading}
            onConfirm={handleConfirmDeleteTable}
          />
        </>
      )}
    </div>
  )
}
