'use client'

import React from 'react'
import { Check } from 'lucide-react'

export interface StepItem {
  id: number
  label: string
  desc?: string
}

interface StepIndicatorProps {
  current: number
  onSelectStep?: (step: number) => void
  canNavigateForward?: boolean
  steps?: StepItem[]
}

const DEFAULT_STEPS: StepItem[] = [
  { id: 1, label: '1. Tamanho do Copo / Taça', desc: '250g a 1 Kg' },
  { id: 2, label: '2. Cremes Gelados', desc: 'Até 2 opções inclusas' },
  { id: 3, label: '3. Frutas & Acompanhamentos', desc: 'Acompanhamentos & Extras' },
]

export default function StepIndicator({
  current,
  onSelectStep,
  canNavigateForward = false,
  steps = DEFAULT_STEPS,
}: StepIndicatorProps) {
  const activeSteps = steps && steps.length > 0 ? steps : DEFAULT_STEPS

  return (
    <div className="w-full mb-5">
      <div
        className={`grid gap-2 sm:gap-2.5 ${
          activeSteps.length <= 3
            ? 'grid-cols-3'
            : activeSteps.length === 4
            ? 'grid-cols-2 sm:grid-cols-4'
            : activeSteps.length === 5
            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
            : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
        }`}
      >
        {activeSteps.map((s) => {
          const isDone = current > s.id
          const isActive = current === s.id
          const isDisabled = !canNavigateForward && s.id > current

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectStep && !isDisabled && onSelectStep(s.id)}
              disabled={isDisabled}
              className={`relative flex items-center gap-2 p-2 sm:p-2.5 rounded-2xl border text-left transition-all duration-200 ${
                isActive
                  ? 'bg-purple-700 text-white border-purple-600 shadow-sm'
                  : isDone
                  ? 'bg-purple-50 text-purple-950 border-purple-200 hover:bg-purple-100 cursor-pointer'
                  : !isDisabled
                  ? 'bg-purple-50/50 text-purple-950 border-purple-200 hover:bg-purple-100/80 cursor-pointer'
                  : 'bg-muted/30 text-muted-foreground border-transparent opacity-50 cursor-not-allowed'
              }`}
            >
              <div
                className={`h-6 w-6 sm:h-7 sm:w-7 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-xs transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : isDone
                    ? 'bg-purple-600 text-white'
                    : !isDisabled
                    ? 'bg-purple-200/80 text-purple-900 font-bold'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isDone ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : s.id}
              </div>

              <div className="min-w-0 flex-1">
                <div className="font-bold text-[11px] sm:text-xs tracking-tight truncate leading-tight">{s.label}</div>
                {s.desc && (
                  <div className={`text-[9px] sm:text-[10px] truncate mt-0.5 ${isActive ? 'text-purple-100' : 'text-muted-foreground'}`}>
                    {s.desc}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
