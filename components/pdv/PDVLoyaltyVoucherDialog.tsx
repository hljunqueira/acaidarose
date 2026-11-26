'use client'

import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import PDVQRCodeScanner from './PDVQRCodeScanner'

interface PDVLoyaltyVoucherDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  cashierUserId?: string
}

interface LookupCustomer {
  id: string
  name: string
  username: string
  phone: string
  points_balance: number
}

interface ActiveVoucherItem {
  id: string
  voucher_code: string
  reward_name: string
  points_cost: number
  expires_at: string
}

export default function PDVLoyaltyVoucherDialog({
  open,
  onOpenChange,
  tenantId,
  cashierUserId,
}: PDVLoyaltyVoucherDialogProps) {
  const { authFetch } = useAuthStore()
  const [voucherCode, setVoucherCode] = useState('')
  const [redeemingCode, setRedeemingCode] = useState<string | null>(null)
  const [lastRedeemed, setLastRedeemed] = useState<{ code: string; rewardName: string } | null>(null)

  const [lookupQuery, setLookupQuery] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const [customer, setCustomer] = useState<LookupCustomer | null>(null)
  const [activeVouchers, setActiveVouchers] = useState<ActiveVoucherItem[]>([])
  const [notFoundMsg, setNotFoundMsg] = useState<string | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)

  useEffect(() => {
    if (open) {
      setVoucherCode('')
      setLookupQuery('')
      setCustomer(null)
      setActiveVouchers([])
      setNotFoundMsg(null)
      setLastRedeemed(null)
      setScannerOpen(false)
    }
  }, [open])

  const handleRedeemCode = async (codeToRedeem: string) => {
    const cleanCode = codeToRedeem.trim().toUpperCase()
    if (!cleanCode) {
      toast.error('Introduza ou leia o código do voucher (ex: ROSE-A7K9X2).')
      return
    }
    setRedeemingCode(cleanCode)
    setLastRedeemed(null)
    try {
      const res = await authFetch('/api/pdv/loyalty/redeem-voucher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucher_code: cleanCode,
          tenant_id: tenantId,
          cashier_user_id: cashierUserId || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Voucher inválido ou expirado.')
        return
      }
      const rewardName = json?.rewardName || 'Prémio Cashback'
      setLastRedeemed({ code: cleanCode, rewardName })
      setVoucherCode('')
      setActiveVouchers((prev) => prev.filter((v) => v.voucher_code !== cleanCode))
      toast.success(`Voucher validado — Entregar: ${rewardName}`)
    } catch {
      toast.error('Erro de ligação ao validar voucher.')
    } finally {
      setRedeemingCode(null)
    }
  }

  const performCustomerLookup = async (queryText: string) => {
    const q = queryText.trim()
    if (!q) return
    setLookingUp(true)
    setNotFoundMsg(null)
    try {
      const res = await authFetch('/api/pdv/loyalty/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Erro ao pesquisar cliente.')
        return
      }
      if (!json?.customer) {
        setCustomer(null)
        setActiveVouchers([])
        setNotFoundMsg(json?.message || 'Cliente não encontrado no Cashback.')
        return
      }
      setCustomer(json.customer)
      setActiveVouchers(Array.isArray(json.active_vouchers) ? json.active_vouchers : [])
    } catch {
      toast.error('Erro de ligação ao consultar cliente.')
    } finally {
      setLookingUp(false)
    }
  }

  const handleLookupCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    await performCustomerLookup(lookupQuery)
  }

  const handleQRCodeScanned = (rawValue: string) => {
    setScannerOpen(false)
    const trimmed = rawValue.trim()
    if (!trimmed) return

    // Deteta automaticamente se é QR do cliente (JSON / @username / telemóvel) ou código de voucher (ROSE-...)
    const isCustomerQR =
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      trimmed.startsWith('@') ||
      /^\+?\d{7,15}$/.test(trimmed.replace(/\s+/g, ''))

    if (isCustomerQR) {
      setLookupQuery(trimmed.startsWith('{') ? '' : trimmed)
      performCustomerLookup(trimmed)
    } else {
      const upper = trimmed.toUpperCase()
      setVoucherCode(upper)
      handleRedeemCode(upper)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 bg-white dark:bg-[#160228] text-purple-950 dark:text-white border border-purple-150 dark:border-white/15 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-purple-950 dark:text-white">
            Resgate de Voucher Cashback
          </DialogTitle>
          <DialogDescription className="text-xs text-purple-700/80 dark:text-purple-200/70">
            Valide o código do voucher diretamente ou consulte os vouchers ativos pelo telemóvel / @username do cliente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Confirmação de entrega */}
          {lastRedeemed && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 space-y-1">
              <div className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-300">
                Voucher Validado com Sucesso
              </div>
              <div className="text-sm font-black text-emerald-950 dark:text-white">
                Entregar ao cliente: {lastRedeemed.rewardName}
              </div>
              <div className="text-[11px] font-mono text-emerald-700/80 dark:text-emerald-300/80">
                Código: {lastRedeemed.code}
              </div>
            </div>
          )}

          {/* Câmara QR Code (Voucher ou Identificação do Cliente) */}
          {scannerOpen ? (
            <PDVQRCodeScanner
              onScan={handleQRCodeScanned}
              onClose={() => setScannerOpen(false)}
              hint="Aponte para o QR Code do Voucher ou do Cartão Cashback do cliente."
            />
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setScannerOpen(true)}
              className="w-full h-11 rounded-2xl border-purple-300 dark:border-pink-500/40 bg-purple-50/70 dark:bg-white/5 hover:bg-purple-100/70 dark:hover:bg-white/10 text-purple-900 dark:text-pink-300 text-xs font-black cursor-pointer"
            >
              Ler QR Code com Câmara (Voucher ou Cliente)
            </Button>
          )}

          {/* 1. Validar Código Direto (ou leitor QR) */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleRedeemCode(voucherCode)
            }}
            className="p-4 rounded-2xl bg-purple-50/60 dark:bg-white/5 border border-purple-150 dark:border-white/10 space-y-2.5"
          >
            <label className="block text-xs font-black text-purple-950 dark:text-white">
              Validar por Código do Voucher (ou Leitor QR)
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: ROSE-COPO-48291"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                autoFocus
                className="h-10 font-mono text-xs uppercase rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-[#12061d]"
              />
              <Button
                type="submit"
                disabled={Boolean(redeemingCode)}
                className="h-10 px-4 bg-gradient-to-r from-purple-700 to-pink-600 text-white text-xs font-black rounded-xl cursor-pointer shrink-0"
              >
                {redeemingCode === voucherCode.trim().toUpperCase() && redeemingCode
                  ? 'A validar...'
                  : 'Validar e Entregar'}
              </Button>
            </div>
          </form>

          {/* 2. Consultar por Cliente */}
          <div className="space-y-3">
            <form onSubmit={handleLookupCustomer} className="space-y-2">
              <label className="block text-xs font-black text-purple-950 dark:text-white">
                Ou Consultar Cliente (Telemóvel / @username)
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: 910000001 ou @cliente"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  className="h-10 text-xs rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-[#12061d]"
                />
                <Button
                  type="submit"
                  variant="outline"
                  disabled={lookingUp}
                  className="h-10 px-4 text-xs font-bold rounded-xl border-purple-200 dark:border-white/15 cursor-pointer shrink-0"
                >
                  {lookingUp ? 'A procurar...' : 'Procurar'}
                </Button>
              </div>
            </form>

            {notFoundMsg && (
              <p className="text-xs text-purple-700/75 dark:text-purple-200/70">{notFoundMsg}</p>
            )}

            {customer && (
              <div className="p-4 rounded-2xl border border-purple-150 dark:border-white/15 bg-white dark:bg-white/5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-black text-purple-950 dark:text-white">
                      {customer.name}
                    </div>
                    <div className="text-xs text-purple-700/75 dark:text-purple-200/70">
                      {customer.username} · {customer.phone}
                    </div>
                  </div>
                  <Badge className="bg-purple-100 dark:bg-pink-500/20 text-purple-800 dark:text-pink-300 border-0 font-mono font-black">
                    {customer.points_balance} pts
                  </Badge>
                </div>

                {activeVouchers.length === 0 ? (
                  <div className="text-xs text-purple-700/70 dark:text-purple-200/60 pt-2 border-t border-purple-100 dark:border-white/10">
                    Este cliente não tem vouchers ativos para levantar neste momento.
                  </div>
                ) : (
                  <div className="space-y-2 pt-2 border-t border-purple-100 dark:border-white/10">
                    <div className="text-[11px] font-bold uppercase text-purple-700/80 dark:text-purple-300/70">
                      Vouchers Ativos ({activeVouchers.length})
                    </div>
                    {activeVouchers.map((v) => (
                      <div
                        key={v.id}
                        className="p-3 rounded-xl bg-purple-50/70 dark:bg-white/5 border border-purple-150 dark:border-white/10 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-black text-purple-950 dark:text-white truncate">
                            {v.reward_name}
                          </div>
                          <div className="text-[11px] font-mono text-purple-700 dark:text-pink-300">
                            {v.voucher_code} · expira{' '}
                            {new Date(v.expires_at).toLocaleString('pt-PT')}
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          disabled={Boolean(redeemingCode)}
                          onClick={() => handleRedeemCode(v.voucher_code)}
                          className="h-8 px-3 bg-gradient-to-r from-purple-700 to-pink-600 text-white text-xs font-black rounded-xl cursor-pointer shrink-0"
                        >
                          {redeemingCode === v.voucher_code ? 'A validar...' : 'Resgatar'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
