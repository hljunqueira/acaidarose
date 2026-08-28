'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/i18n/formatters'
import { Printer, FileText, Building2, Download } from 'lucide-react'
import { FranchiseContractData } from './EditRoyaltyDialog'

interface FranchiseReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contracts: FranchiseContractData[]
}

export default function FranchiseReportDialog({
  open,
  onOpenChange,
  contracts,
}: FranchiseReportDialogProps) {
  const totalNetworkRevenue = contracts.reduce((acc, c) => acc + c.monthlyRevenue, 0)
  const totalRoyalties = contracts.reduce((acc, c) => acc + (c.monthlyRevenue * (c.royaltyPercent / 100)), 0)
  const totalMarketing = contracts.reduce((acc, c) => acc + (c.monthlyRevenue * (c.marketingPercent / 100)), 0)
  const totalNet = totalRoyalties + totalMarketing

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-white dark:bg-[#160228] text-slate-900 dark:text-white border border-purple-150 dark:border-white/20 rounded-3xl shadow-2xl">
        <DialogHeader className="text-left space-y-1 pb-3 border-b border-purple-100 dark:border-white/10">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-base font-black text-purple-950 dark:text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-700 dark:text-pink-400" />
              <span>Mapa Consolidado de Royalties & Repasses (Contabilidade)</span>
            </DialogTitle>
            <Badge className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-[9px] font-bold">
              Mês Vigente
            </Badge>
          </div>
          <p className="text-xs text-purple-700/80 dark:text-purple-200/70">
            Holding: <b>Rose & Vavá Portugal Lda</b> · NIF: <b>509123456</b>
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Tabela do Mapa */}
          <div className="border border-purple-150 dark:border-white/15 rounded-2xl overflow-hidden shadow-xs dark:shadow-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-purple-100/70 dark:bg-white/10 text-purple-950 dark:text-white text-[10px] uppercase font-black">
                <tr>
                  <th className="p-2.5">Unidade / Franquia</th>
                  <th className="p-2.5 text-right">Faturamento</th>
                  <th className="p-2.5 text-center">Taxas (Roy/Mkt)</th>
                  <th className="p-2.5 text-right">Royalties</th>
                  <th className="p-2.5 text-right">Fundo Mkt</th>
                  <th className="p-2.5 text-right">Total Devido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100 dark:divide-white/10 font-medium">
                {contracts.map((c) => {
                  const roy = c.monthlyRevenue * (c.royaltyPercent / 100)
                  const mkt = c.monthlyRevenue * (c.marketingPercent / 100)
                  const tot = roy + mkt
                  return (
                    <tr key={c.id} className="hover:bg-purple-50/50 dark:hover:bg-white/5 transition">
                      <td className="p-2.5">
                        <div className="font-bold text-purple-950 dark:text-white">{c.storeName}</div>
                        <div className="text-[10px] text-purple-700/80 dark:text-purple-200/60 font-mono">NIF: {c.nif}</div>
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-purple-950 dark:text-white">
                        {formatCurrency(c.monthlyRevenue)}
                      </td>
                      <td className="p-2.5 text-center font-mono text-[11px] text-purple-800 dark:text-pink-300">
                        {c.royaltyPercent}% / {c.marketingPercent}%
                      </td>
                      <td className="p-2.5 text-right font-mono text-purple-950 dark:text-white">
                        {formatCurrency(roy)}
                      </td>
                      <td className="p-2.5 text-right font-mono text-purple-950 dark:text-white">
                        {formatCurrency(mkt)}
                      </td>
                      <td className="p-2.5 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(tot)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-purple-100/70 dark:bg-white/10 font-black border-t border-purple-200 dark:border-white/15 text-purple-950 dark:text-white">
                <tr>
                  <td className="p-2.5">TOTAL GERAL DA REDE</td>
                  <td className="p-2.5 text-right font-mono">{formatCurrency(totalNetworkRevenue)}</td>
                  <td className="p-2.5 text-center text-[10px] uppercase">Consolidado</td>
                  <td className="p-2.5 text-right font-mono">{formatCurrency(totalRoyalties)}</td>
                  <td className="p-2.5 text-right font-mono">{formatCurrency(totalMarketing)}</td>
                  <td className="p-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatCurrency(totalNet)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-white/5 border border-purple-150 dark:border-white/10 text-[11px] text-purple-800 dark:text-purple-200/80">
            <b>Nota de Encerramento Contábil:</b> O fecho financeiro ocorre todo dia 05 com liquidação dos débitos diretos até o dia 10 de cada mês através de IBAN / SEPA da Holding.
          </div>
        </div>

        <DialogFooter className="pt-2 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs font-bold border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-purple-950 dark:text-white cursor-pointer"
          >
            Fechar
          </Button>
          <Button
            type="button"
            onClick={handlePrint}
            className="bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-700/20 gap-1.5 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Imprimir / Salvar PDF</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
