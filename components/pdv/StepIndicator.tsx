'use client'

import React from 'react'
import { Check, Layers, Package, Utensils } from 'lucide-react'

interface StepIndicatorProps {
  current: number
  onSelectStep?: (step: number) => void
}

const STEPS = [
  { id: 1, label: '1. Tamanho do Açaí', icon: Package, desc: '250g a 1 Kg' },
  { id: 2, label: '2. Cremes Gelados', icon: Layers, desc: '1 opcional incluso' },
  { id: 3, label: '3. Frutas & Toppings', icon: Utensils, desc: 'Acompanhamentos & Extras' },
]

export default function StepIndicator({ current, onSelectStep }: StepIndicatorProps) {
  return (
    <div className="w-full mb-5">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {STEPS.map((s) => {
          const isDone = current > s.id
          const isActive = current === s.id
          const Icon = s.icon

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectStep && s.id <= current && onSelectStep(s.id)}
              disabled={s.id > current}
              className={`relative flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl border-2 text-left transition-all duration-200 ${
                isActive
                  ? 'bg-purple-700 text-white border-purple-600 shadow-md shadow-purple-900/15'
                  : isDone
                  ? 'bg-purple-50/90 text-purple-950 border-purple-200 hover:bg-purple-100/90 cursor-pointer'
                  : 'bg-muted/30 text-muted-foreground border-transparent opacity-50 cursor-not-allowed'
              }`}
            >
              <div
                className={`h-7 w-7 sm:h-8 sm:w-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform ${
                  isActive
                    ? 'bg-white/20 text-white shadow-inner'
                    : isDone
                    ? 'bg-purple-600 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isDone ? <Check className="h-4 w-4 stroke-[3]" /> : <Icon className="h-4 w-4" />}
              </div>

              <div className="min-w-0">
                <div className="font-extrabold text-xs tracking-tight truncate leading-tight">{s.label}</div>
                <div className={`text-[10px] truncate mt-0.5 ${isActive ? 'text-purple-100' : 'text-muted-foreground'}`}>
                  {s.desc}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
