'use client'

import React, { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

export default function PortugalLiveClock() {
  const [mounted, setMounted] = useState(false)
  const [timeString, setTimeString] = useState('')
  const [dateString, setDateString] = useState('')

  useEffect(() => {
    setMounted(true)
    const updateTime = () => {
      const now = new Date()
      
      const time = now.toLocaleTimeString('pt-PT', {
        timeZone: 'Europe/Lisbon',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })

      const date = now.toLocaleDateString('pt-PT', {
        timeZone: 'Europe/Lisbon',
        weekday: 'short',
        day: '2-digit',
        month: 'short',
      })

      setTimeString(time)
      setDateString(date)
    }

    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  if (!mounted) {
    return (
      <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50/70 dark:bg-white/5 border border-purple-150 dark:border-white/10 text-xs text-purple-900 dark:text-purple-200">
        <Clock className="h-3.5 w-3.5 text-purple-600 dark:text-pink-400" />
        <span>🇵🇹 Portugal</span>
      </div>
    )
  }

  return (
    <div
      className="hidden md:flex items-center gap-2 px-3 py-1 rounded-xl bg-purple-50/80 dark:bg-white/5 border border-purple-150 dark:border-white/10 text-xs shadow-2xs transition-all"
      title="Horário Oficial de Portugal (Lisboa / GMT+1)"
    >
      <div className="flex items-center gap-1 text-purple-700 dark:text-pink-400">
        <span className="text-xs">🇵🇹</span>
        <Clock className="h-3.5 w-3.5" />
      </div>
      <div className="flex items-center gap-1.5 font-mono">
        <span className="font-bold text-purple-950 dark:text-white text-xs">
          {timeString}
        </span>
        <span className="text-[10px] text-purple-700/80 dark:text-purple-300/70 font-sans capitalize hidden xl:inline">
          · {dateString}
        </span>
      </div>
    </div>
  )
}
