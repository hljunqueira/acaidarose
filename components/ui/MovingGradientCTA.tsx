'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

interface MovingGradientCTAProps {
  onClick?: () => void
  label?: string
  className?: string
}

export function MovingGradientCTA({
  onClick,
  label = 'Conhecer Nossos Copos',
  className = '',
}: MovingGradientCTAProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.96 }}
      className={`relative group inline-flex items-center justify-center p-[2px] rounded-2xl overflow-hidden cursor-pointer shadow-xl shadow-pink-600/30 transition-all ${className}`}
    >
      {/* Moving Conic Gradient Border (Originkit Inspired) */}
      <span className="absolute inset-[-1000%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#ec4899_0%,#a855f7_45%,#f43f5e_70%,#ec4899_100%)] opacity-90 group-hover:opacity-100 group-hover:animate-[spin_2s_linear_infinite]" />

      {/* Inner Button Surface */}
      <span className="relative z-10 inline-flex items-center gap-3 px-8 py-4 rounded-[14px] bg-gradient-to-r from-[#200336] via-[#2d054d] to-[#1a022d] group-hover:from-[#2e054f] group-hover:to-[#24033b] text-white font-black text-sm sm:text-base tracking-wide transition-colors">
        <span>{label}</span>
        <ArrowRight className="h-4 w-4 text-pink-400 group-hover:translate-x-1 transition-transform" />
      </span>
    </motion.button>
  )
}
