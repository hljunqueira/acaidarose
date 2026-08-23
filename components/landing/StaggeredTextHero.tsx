'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface AnimatedLineProps {
  text: string
  className?: string
  delay?: number
  gradient?: boolean
  noWrap?: boolean
}

export function AnimatedPhrase({
  text,
  className = '',
  delay = 0,
  gradient = false,
  noWrap = false,
}: AnimatedLineProps) {
  const words = text.split(' ')

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: delay,
      },
    },
  }

  const wordVariants = {
    hidden: {
      opacity: 0,
      y: 40,
      rotateX: -40,
      filter: 'blur(8px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      filter: 'blur(0px)',
      transition: {
        type: 'spring',
        damping: 18,
        stiffness: 140,
      },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`flex items-center justify-center gap-x-3.5 ${
        noWrap ? 'flex-nowrap whitespace-nowrap' : 'flex-wrap'
      } ${className}`}
      style={{ perspective: 1000 }}
    >
      {words.map((word, idx) => (
        <motion.span
          key={idx}
          variants={wordVariants}
          className={`inline-block ${
            gradient
              ? 'bg-gradient-to-r from-pink-400 via-rose-300 to-fuchsia-300 bg-clip-text text-transparent drop-shadow-md'
              : 'text-white drop-shadow-md'
          }`}
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  )
}
