'use client'

import React, { useState } from 'react'
import { Tenant } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Store, MapPin, Phone, Wifi, Clock, Star, Instagram } from 'lucide-react'

interface CustomerMenuHeaderProps {
  tenant: Tenant | null
  isTable: boolean
  tableLabel: string
}

export default function CustomerMenuHeader({ tenant, isTable, tableLabel }: CustomerMenuHeaderProps) {
  const [storeModalOpen, setStoreModalOpen] = useState(false)

  // Status de funcionamento em tempo real
  const now = new Date()
  const currentHour = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  const dayKey = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][now.getDay()]
  const todayHours = tenant?.openingHours?.[dayKey] || { open: '12:00', close: '22:00' }
  const isOpen = currentHour >= todayHours.open && currentHour <= todayHours.close

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-4 pb-2">
        {/* Banner da Empresa com clique para detalhes */}
        <div
          onClick={() => setStoreModalOpen(true)}
          className="p-3.5 sm:p-4 rounded-3xl bg-gradient-to-r from-[#23033d]/95 to-[#19022c]/95 border border-white/15 hover:border-purple-400/50 transition-all cursor-pointer shadow-xl backdrop-blur-md flex items-center justify-between group"
        >
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-black text-sm sm:text-base text-white truncate group-hover:text-purple-200 transition">
                {tenant?.name || 'Açaí da Rose'}
              </span>
              <span className="text-pink-400 text-xs font-semibold hidden sm:inline-block">
                — O sabor que abraça a alma
              </span>
              <span className="text-purple-300 text-xs font-bold">›</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              {isOpen ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Aberta hoje até às {todayHours.close}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-amber-400 font-bold">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span>Abre hoje às {todayHours.open}</span>
                </span>
              )}

              {isTable ? (
                <Badge className="bg-fuchsia-600 text-white border-0 font-black text-[10px] py-0.5 px-2 rounded-lg shadow-sm">
                  {tableLabel}
                </Badge>
              ) : (
                <Badge className="bg-purple-800 text-purple-200 border-0 font-bold text-[10px] py-0.5 px-2 rounded-lg">
                  Balcão & Takeaway
                </Badge>
              )}

              {tenant?.ratingAverage && (
                <span className="text-amber-300 font-extrabold flex items-center gap-0.5 ml-1">
                  <Star className="h-3 w-3 fill-amber-300" />
                  <span>{tenant.ratingAverage.toFixed(1)}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Açaí da Rose"
              className="h-10 sm:h-12 w-auto object-contain group-hover:scale-105 transition-transform"
            />
          </div>
        </div>
      </div>

      {/* Modal com Informações da Loja */}
      <Dialog open={storeModalOpen} onOpenChange={setStoreModalOpen}>
        <DialogContent className="max-w-md p-6 bg-[#160228] text-white border border-white/20 rounded-3xl">
          <DialogHeader className="text-center">
            <img src="/logo.png" alt="Açaí da Rose" className="mx-auto h-16 w-auto object-contain mb-2" />
            <DialogTitle className="text-lg font-black text-white">
              {tenant?.name || 'Açaí da Rose'}
            </DialogTitle>
            <p className="text-xs text-purple-200/80 mt-1">{tenant?.aboutText}</p>
          </DialogHeader>

          <div className="space-y-3 my-4 text-xs">
            {tenant?.address && (
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/10">
                <MapPin className="h-4 w-4 text-fuchsia-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Morada</span>
                  <span className="text-purple-200/80">{tenant.address}, {tenant.city}</span>
                </div>
              </div>
            )}

            {tenant?.phone && (
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/10">
                <Phone className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <div>
                  <span className="font-bold text-white block">Contacto & MB Way</span>
                  <span className="text-purple-200/80">{tenant.phone}</span>
                </div>
              </div>
            )}

            {tenant?.wifiNetwork && (
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/10">
                <Wifi className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                <div>
                  <span className="font-bold text-white block">Wi-Fi para Clientes</span>
                  <span className="text-purple-200/80">Rede: <b>{tenant.wifiNetwork}</b> · Senha: <b>{tenant.wifiPassword}</b></span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={() => setStoreModalOpen(false)}
              className="w-full bg-purple-700 hover:bg-purple-800 text-white font-black text-xs h-10 rounded-2xl"
            >
              Voltar ao Cardápio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
