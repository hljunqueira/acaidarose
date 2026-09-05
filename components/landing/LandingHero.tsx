'use client'

import React, { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { MovingGradientCTA } from '@/components/ui/MovingGradientCTA'
import { MapPin, ChevronDown } from 'lucide-react'

// Cenas Cinematográficas dos 4 Atos Oficiais em Caixa Alta
const CINEMATIC_SCENES = [
  {
    id: 'scene-1',
    side: 'left',
    phrase: 'AÇAÍ NÃO SE EXPLICA',
    gradient: false,
    videoSrc: '/videos/hero_revealing_cup.mp4',
    poster: '/images/official/acai_copo_300ml.jpg',
  },
  {
    id: 'scene-2',
    side: 'right',
    phrase: 'EXPERIMENTA',
    gradient: true,
    videoSrc: '/videos/hero_orbiting_cup.mp4',
    poster: '/images/official/acai_copo_500ml.jpg',
  },
  {
    id: 'scene-3',
    side: 'left',
    phrase: 'APAIXONA',
    gradient: true,
    videoSrc: '/videos/hero_gliding_texture.mp4',
    poster: '/images/official/acai_copo_novo.jpg',
  },
  {
    id: 'scene-4',
    side: 'right',
    phrase: 'E REPETE',
    gradient: true,
    videoSrc: '/videos/hero_cup_rotation.mp4',
    poster: '/images/official/acai_copo_700ml.jpg',
  },
]

export default function LandingHero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeSceneIndex, setActiveSceneIndex] = useState(0)

  // Scroll Progress Master (0 a 1 em 380vh)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  // Sincronização dos 4 Atos com o Scroll
  useEffect(() => {
    return scrollYProgress.on('change', (progress) => {
      if (progress < 0.25) {
        setActiveSceneIndex(0)
      } else if (progress < 0.5) {
        setActiveSceneIndex(1)
      } else if (progress < 0.75) {
        setActiveSceneIndex(2)
      } else {
        setActiveSceneIndex(3)
      }
    })
  }, [scrollYProgress])

  // =========================================================================
  // TRANSIÇÕES DINÂMICAS: ESQUERDA ➔ DIREITA ➔ ESQUERDA ➔ DIREITA COM CTAs
  // =========================================================================

  // Ato 1 (Esquerda · 0% -> 25%): "AÇAÍ NÃO SE EXPLICA:"
  const phrase1Opacity = useTransform(scrollYProgress, [0, 0.18, 0.25], [1, 1, 0])
  const phrase1X = useTransform(scrollYProgress, [0, 0.18, 0.25], [0, 0, -45])
  const phrase1Y = useTransform(scrollYProgress, [0, 0.18, 0.25], [0, 0, -20])

  // Ato 2 (Direita · 25% -> 50%): "EXPERIMENTA"
  const phrase2Opacity = useTransform(scrollYProgress, [0.25, 0.32, 0.44, 0.5], [0, 1, 1, 0])
  const phrase2X = useTransform(scrollYProgress, [0.25, 0.32, 0.44, 0.5], [45, 0, 0, 45])
  const phrase2Y = useTransform(scrollYProgress, [0.25, 0.32, 0.44, 0.5], [20, 0, 0, -20])

  // Ato 3 (Esquerda · 50% -> 75%): "APAIXONA"
  const phrase3Opacity = useTransform(scrollYProgress, [0.5, 0.57, 0.69, 0.75], [0, 1, 1, 0])
  const phrase3X = useTransform(scrollYProgress, [0.5, 0.57, 0.69, 0.75], [-45, 0, 0, -45])
  const phrase3Y = useTransform(scrollYProgress, [0.5, 0.57, 0.69, 0.75], [20, 0, 0, -20])

  // Ato 4 (Direita + CTAs · 75% -> 100%): "E REPETE"
  const phrase4Opacity = useTransform(scrollYProgress, [0.75, 0.82, 1], [0, 1, 1])
  const phrase4X = useTransform(scrollYProgress, [0.75, 0.82, 1], [45, 0, 0])
  const phrase4Y = useTransform(scrollYProgress, [0.75, 0.82, 1], [20, 0, 0])

  // Revelação dos Botões de Ação no Clímax Final
  const ctaOpacity = useTransform(scrollYProgress, [0.83, 0.92], [0, 1])
  const ctaY = useTransform(scrollYProgress, [0.83, 0.92], [25, 0])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const currentScene = CINEMATIC_SCENES[activeSceneIndex]

  return (
    <div ref={containerRef} className="relative h-[380vh] bg-[#11011c]">
      {/* Sticky Viewport 100vh com Visão Total Fullscreen */}
      <section className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">

        {/* =========================================================================
            CAMADA DE VÍDEO FULL-BLEED (TELA CHEIA CINEMATOGRÁFICA)
           ========================================================================= */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-[#11011c]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScene.videoSrc}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.75, ease: 'easeInOut' }}
              className="absolute inset-0 w-full h-full"
            >
              <video
                src={currentScene.videoSrc}
                poster={currentScene.poster}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                className="w-full h-full object-cover object-center filter brightness-[0.96] contrast-[1.04]"
              />
            </motion.div>
          </AnimatePresence>

          {/* Vinhetas Laterais Suaves para Garantir Contraste Perfeito do Texto */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#11011c]/80 via-transparent to-[#11011c]/80 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#11011c] via-transparent to-black/50 pointer-events-none" />
        </div>

        {/* =========================================================================
            CONTAINER DE POSICIONAMENTO LATERAL ASSIMÉTRICO (MAX-W 1536PX)
           ========================================================================= */}
        <div className="relative z-10 w-full max-w-[1536px] mx-auto px-6 sm:px-12 lg:px-16 h-full flex items-center">

          {/* ATO 1: LADO ESQUERDO ("AÇAÍ NÃO SE EXPLICA:") */}
          <motion.div
            style={{ opacity: phrase1Opacity, x: phrase1X, y: phrase1Y }}
            className="absolute left-6 sm:left-12 lg:left-16 text-left max-w-sm sm:max-w-md lg:max-w-xl space-y-3 pointer-events-none"
          >
            <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-white leading-[1.05] tracking-tight font-['Outfit'] drop-shadow-[0_10px_35px_rgba(0,0,0,0.95)]">
              AÇAÍ NÃO SE EXPLICA
            </h1>
          </motion.div>

          {/* ATO 2: LADO DIREITO ("EXPERIMENTA") */}
          <motion.div
            style={{ opacity: phrase2Opacity, x: phrase2X, y: phrase2Y }}
            className="absolute right-6 sm:right-12 lg:right-16 text-right max-w-sm sm:max-w-md lg:max-w-xl space-y-3 pointer-events-none flex flex-col items-end"
          >
            <h2 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-black bg-gradient-to-r from-pink-400 via-rose-300 to-fuchsia-300 bg-clip-text text-transparent leading-[1.05] tracking-tight font-['Outfit'] drop-shadow-[0_10px_40px_rgba(236,72,153,0.55)]">
              EXPERIMENTA
            </h2>
          </motion.div>

          {/* ATO 3: LADO ESQUERDO ("APAIXONA") */}
          <motion.div
            style={{ opacity: phrase3Opacity, x: phrase3X, y: phrase3Y }}
            className="absolute left-6 sm:left-12 lg:left-16 text-left max-w-sm sm:max-w-md lg:max-w-xl space-y-3 pointer-events-none"
          >
            <h2 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-black bg-gradient-to-r from-pink-400 via-fuchsia-400 to-purple-300 bg-clip-text text-transparent leading-[1.05] tracking-tight font-['Outfit'] drop-shadow-[0_10px_40px_rgba(236,72,153,0.55)]">
              APAIXONA
            </h2>
          </motion.div>

          {/* ATO 4: LADO DIREITO COM CTAs ("E REPETE") */}
          <motion.div
            style={{ opacity: phrase4Opacity, x: phrase4X, y: phrase4Y }}
            className="absolute right-6 sm:right-12 lg:right-16 text-right max-w-sm sm:max-w-md lg:max-w-xl space-y-6 flex flex-col items-end"
          >
            <h2 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-black bg-gradient-to-r from-pink-400 via-fuchsia-400 to-purple-300 bg-clip-text text-transparent leading-[1.05] tracking-tight font-['Outfit'] drop-shadow-[0_10px_40px_rgba(236,72,153,0.55)]">
              E REPETE
            </h2>

            {/* CTAs Finais */}
            <motion.div
              style={{ opacity: ctaOpacity, y: ctaY }}
              className="flex flex-wrap items-center justify-end gap-4 pt-2"
            >
              <MovingGradientCTA
                onClick={() => scrollTo('produtos')}
                label="Conhecer Nossos Copos"
              />

              <button
                type="button"
                onClick={() => scrollTo('loja')}
                className="h-13 sm:h-14 px-6 sm:px-7 rounded-2xl border border-white/25 bg-black/50 hover:bg-black/70 text-purple-100 hover:text-white font-bold text-xs sm:text-sm backdrop-blur-md cursor-pointer transition-all hover:scale-105 shadow-2xl flex items-center gap-2"
              >
                <MapPin className="h-4 w-4 text-pink-400" />
                <span>Visitar Loja em Torres Novas</span>
              </button>
            </motion.div>
          </motion.div>
        </div>

        {/* Indicador Flutuante Elevado e Transparente 'Role para baixo' */}
        <motion.div
          style={{ opacity: phrase1Opacity }}
          onClick={() => {
            if (containerRef.current) {
              window.scrollBy({ top: window.innerHeight * 0.85, behavior: 'smooth' })
            }
          }}
          className="absolute bottom-16 sm:bottom-20 md:bottom-24 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 cursor-pointer group select-none"
        >
          <div className="flex flex-col items-center gap-1.5 transition-all group-hover:scale-110">
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-[0.25em] text-white/90 group-hover:text-pink-300 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] font-['Outfit']">
              Role para baixo
            </span>
            <div className="p-1 rounded-full text-pink-400 group-hover:text-pink-300 drop-shadow-[0_2px_10px_rgba(236,72,153,0.8)]">
              <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 animate-bounce" />
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  )
}

