'use client'

import React, { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { Button } from '@/components/ui/button'

interface PDVQRCodeScannerProps {
  onScan: (rawValue: string) => void
  onClose: () => void
  hint?: string
}

export default function PDVQRCodeScanner({
  onScan,
  onClose,
  hint = 'Aponte a câmara para o QR Code da app Açaí da Rose.',
}: PDVQRCodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const scannedRef = useRef(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [starting, setStarting] = useState(true)

  useEffect(() => {
    let stream: MediaStream | null = null
    let rafId = 0
    let active = true

    const stopCamera = () => {
      if (rafId) cancelAnimationFrame(rafId)
      if (stream) {
        stream.getTracks().forEach((t) => t.stop())
        stream = null
      }
    }

    const startCamera = async () => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setErrorMsg('Câmara indisponível neste navegador (verifique HTTPS ou permissões).')
        setStarting(false)
        return
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })

        if (!active) {
          stopCamera()
          return
        }

        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()
        setStarting(false)

        const BarcodeDetectorCtor = (window as any).BarcodeDetector
        const detector =
          typeof BarcodeDetectorCtor === 'function'
            ? new BarcodeDetectorCtor({ formats: ['qr_code'] })
            : null

        const tick = async () => {
          if (!active || scannedRef.current) return
          const v = videoRef.current
          if (v && v.readyState >= 2 && v.videoWidth > 0 && v.videoHeight > 0) {
            try {
              if (detector) {
                const codes = await detector.detect(v)
                if (codes && codes.length > 0 && codes[0]?.rawValue) {
                  scannedRef.current = true
                  stopCamera()
                  onScan(String(codes[0].rawValue).trim())
                  return
                }
              } else {
                const canvas = canvasRef.current
                if (canvas) {
                  canvas.width = v.videoWidth
                  canvas.height = v.videoHeight
                  const ctx = canvas.getContext('2d', { willReadFrequently: true })
                  if (ctx) {
                    ctx.drawImage(v, 0, 0, canvas.width, canvas.height)
                    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                    const decoded = jsQR(imgData.data, imgData.width, imgData.height, {
                      inversionAttempts: 'dontInvert',
                    })
                    if (decoded?.data) {
                      scannedRef.current = true
                      stopCamera()
                      onScan(decoded.data.trim())
                      return
                    }
                  }
                }
              }
            } catch {
              // Ignora erros pontuais de frame e continua leitura
            }
          }
          rafId = requestAnimationFrame(tick)
        }

        rafId = requestAnimationFrame(tick)
      } catch (err: any) {
        setStarting(false)
        if (err?.name === 'NotAllowedError') {
          setErrorMsg('Permissão da câmara recusada. Autorize a câmara no navegador para ler QR Codes.')
        } else if (err?.name === 'NotFoundError') {
          setErrorMsg('Nenhuma câmara detetada neste dispositivo.')
        } else {
          setErrorMsg('Não foi possível abrir a câmara. Pode digitar o código ou usar leitor USB.')
        }
      }
    }

    startCamera()
    return () => {
      active = false
      stopCamera()
    }
  }, [onScan])

  return (
    <div className="rounded-2xl border border-purple-200 dark:border-white/15 bg-black/95 overflow-hidden space-y-2 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-white/90">{hint}</span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onClose}
          className="h-7 px-2.5 text-[11px] font-bold rounded-lg bg-white/10 text-white border-white/20 hover:bg-white/20 cursor-pointer"
        >
          Fechar Câmara
        </Button>
      </div>

      {errorMsg ? (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/30 text-xs text-rose-200">
          {errorMsg}
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="w-44 h-44 rounded-2xl border-2 border-pink-400/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
          </div>
          {starting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-xs font-bold text-white">
              A abrir câmara...
            </div>
          )}
        </div>
      )}
    </div>
  )
}
