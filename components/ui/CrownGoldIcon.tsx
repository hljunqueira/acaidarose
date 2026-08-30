import React from 'react'

interface CrownGoldIconProps {
  className?: string
  size?: number | string
}

/**
 * Ícone Vetorial de Coroa Real em Ouro 3D Reluzente com Joias (Estilo Flaticon Premium)
 */
export function CrownGoldIcon({ className = 'h-8 w-8', size }: CrownGoldIconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <defs>
        {/* Gradiente Ouro Real Metálico */}
        <linearGradient id="goldGradientMain" x1="32" y1="6" x2="32" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF275" />
          <stop offset="25%" stopColor="#FFD700" />
          <stop offset="60%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>

        {/* Gradiente Ouro Escuro / Base */}
        <linearGradient id="goldGradientBase" x1="32" y1="46" x2="32" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>

        {/* Gradiente Rubi */}
        <linearGradient id="rubyGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FDA4AF" />
          <stop offset="50%" stopColor="#E11D48" />
          <stop offset="100%" stopColor="#881337" />
        </linearGradient>

        {/* Gradiente Esmeralda */}
        <linearGradient id="emeraldGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#064E3B" />
        </linearGradient>

        {/* Gradiente Safira */}
        <linearGradient id="sapphireGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="50%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>

        {/* Brilho Perolado Superior */}
        <linearGradient id="pearlGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FEF08A" />
        </linearGradient>
      </defs>

      {/* Sombra de Profundidade */}
      <path
        d="M6 22L16 48H48L58 22L44 32L32 12L20 32L6 22Z"
        fill="#78350F"
        opacity="0.35"
      />

      {/* Corpo Principal da Coroa Real */}
      <path
        d="M6 20L17 48H47L58 20L43 32L32 10L21 32L6 20Z"
        fill="url(#goldGradientMain)"
        stroke="#78350F"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Relevos Internos de Brilho Dourado */}
      <path
        d="M21 32L32 13L43 32L32 42L21 32Z"
        fill="#FEF08A"
        opacity="0.4"
      />

      {/* Base da Coroa (Aro Imperial) */}
      <rect
        x="13"
        y="46"
        width="38"
        height="10"
        rx="3"
        fill="url(#goldGradientBase)"
        stroke="#78350F"
        strokeWidth="1.5"
      />

      {/* Pérolas / Esferas de Ouro nas 5 Pontas */}
      {/* Ponta Esquerda */}
      <circle cx="6" cy="18" r="4.5" fill="url(#pearlGradient)" stroke="#B45309" strokeWidth="1" />
      <circle cx="4.5" cy="16.5" r="1.5" fill="#FFFFFF" />

      {/* Ponta Centro-Esquerda */}
      <circle cx="21" cy="30" r="3.5" fill="url(#pearlGradient)" stroke="#B45309" strokeWidth="1" />

      {/* Ponta Central Principal (Maior) */}
      <circle cx="32" cy="8" r="5.5" fill="url(#pearlGradient)" stroke="#B45309" strokeWidth="1.2" />
      <circle cx="30" cy="6" r="2" fill="#FFFFFF" />

      {/* Ponta Centro-Direita */}
      <circle cx="43" cy="30" r="3.5" fill="url(#pearlGradient)" stroke="#B45309" strokeWidth="1" />

      {/* Ponta Direita */}
      <circle cx="58" cy="18" r="4.5" fill="url(#pearlGradient)" stroke="#B45309" strokeWidth="1" />
      <circle cx="56.5" cy="16.5" r="1.5" fill="#FFFFFF" />

      {/* Pedras Preciosas Incrustadas no Aro da Base */}
      {/* Rubi Esquerdo */}
      <circle cx="20" cy="51" r="2.5" fill="url(#rubyGradient)" stroke="#4C0519" strokeWidth="0.8" />
      <circle cx="19" cy="50" r="0.8" fill="#FFFFFF" />

      {/* Esmeralda Central */}
      <polygon
        points="32,47.5 35.5,51 32,54.5 28.5,51"
        fill="url(#emeraldGradient)"
        stroke="#022C22"
        strokeWidth="0.8"
      />
      <circle cx="31.5" cy="49.5" r="0.8" fill="#FFFFFF" />

      {/* Safira Direita */}
      <circle cx="44" cy="51" r="2.5" fill="url(#sapphireGradient)" stroke="#172554" strokeWidth="0.8" />
      <circle cx="43" cy="50" r="0.8" fill="#FFFFFF" />
    </svg>
  )
}
