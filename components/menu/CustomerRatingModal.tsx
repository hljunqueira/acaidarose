'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Star, CheckCircle2, MessageSquare } from 'lucide-react'
import { useLanguageStore } from '@/lib/stores/languageStore'
import { toast } from 'sonner'

interface CustomerRatingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  orderId?: string | null
  initialTable?: string | null
  initialCustomerName?: string | null
  initialCustomerPhone?: string | null
}

interface CriterionItem {
  id: string
  name: string
  nameEn?: string | null
  nameEs?: string | null
  scaleType: string
  displayOrder: number
}

export default function CustomerRatingModal({
  open,
  onOpenChange,
  tenantId,
  orderId = null,
  initialTable = null,
  initialCustomerName = '',
  initialCustomerPhone = '',
}: CustomerRatingModalProps) {
  const { language } = useLanguageStore()
  const isEn = language === 'en'
  const isEs = language === 'es'

  const [criteria, setCriteria] = useState<CriterionItem[]>([])
  const [loadingCriteria, setLoadingCriteria] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Estados do formulário
  const [overallScore, setOverallScore] = useState<number>(5)
  const [criteriaScores, setCriteriaScores] = useState<Record<string, number>>({})
  const [customerName, setCustomerName] = useState(initialCustomerName || '')
  const [customerPhone, setCustomerPhone] = useState(initialCustomerPhone || '')
  const [tableNumber, setTableNumber] = useState(initialTable || '')
  const [comment, setComment] = useState('')

  // Carrega critérios dinâmicos da loja
  useEffect(() => {
    if (!open || !tenantId) return

    setLoadingCriteria(true)
    fetch(`/api/ratings/criteria?loja=${encodeURIComponent(tenantId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.criteria)) {
          setCriteria(data.criteria)
          // Inicializa pontuação padrão 5 para cada critério
          const initScores: Record<string, number> = {}
          data.criteria.forEach((c: CriterionItem) => {
            initScores[c.id] = 5
          })
          setCriteriaScores(initScores)
        }
      })
      .catch(() => {
        setCriteria([])
      })
      .finally(() => {
        setLoadingCriteria(false)
      })
  }, [open, tenantId])

  const handleScoreCriterion = (criterionId: string, value: number) => {
    setCriteriaScores((prev) => ({
      ...prev,
      [criterionId]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (overallScore < 1) {
      toast.error(
        isEn
          ? 'Please select an overall rating.'
          : isEs
          ? 'Por favor seleccione una calificación general.'
          : 'Por favor selecione uma classificação geral.'
      )
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          orderId,
          tableNumber: tableNumber ? String(tableNumber).trim() : null,
          customerName: customerName.trim() || null,
          customerPhone: customerPhone.trim() || null,
          score: overallScore,
          criteriaScores,
          comment: comment.trim() || null,
          language,
        }),
      })

      if (!res.ok) {
        throw new Error('Falha ao registar avaliação')
      }

      setSubmitted(true)
      toast.success(
        isEn
          ? 'Thank you! Your feedback helps us improve every day.'
          : isEs
          ? '¡Gracias! Su opinión nos ayuda a mejorar día a día.'
          : 'Muito obrigado! A sua avaliação ajuda-nos a melhorar todos os dias.'
      )
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar avaliação')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reseta estado após fechamento
    setTimeout(() => {
      setSubmitted(false)
      setComment('')
      setOverallScore(5)
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 bg-white dark:bg-[#160228] text-slate-900 dark:text-white border border-purple-100 dark:border-white/10 rounded-3xl shadow-2xl">
        <DialogHeader className="pb-3 border-b border-purple-100 dark:border-white/10 text-left">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400">
              {isEn ? 'Customer Feedback' : isEs ? 'Encuesta de Satisfacción' : 'Pesquisa de Satisfação'}
            </span>
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
            {isEn
              ? 'Rate your Experience'
              : isEs
              ? 'Valora tu Experiencia'
              : 'Avalie a sua Experiência'}
          </DialogTitle>
          <p className="text-xs text-slate-600 dark:text-purple-200/70">
            {isEn
              ? 'Tell us how your visit went today.'
              : isEs
              ? 'Cuéntenos cómo fue su visita de hoy.'
              : 'Diga-nos como correu o seu pedido e o nosso atendimento.'}
          </p>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {isEn ? 'Feedback Received!' : isEs ? '¡Opinión Registrada!' : 'Avaliação Registada!'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-purple-200/80 max-w-sm mx-auto">
              {isEn
                ? 'Thank you for your valuable time. We look forward to seeing you again soon!'
                : isEs
                ? 'Muchas gracias por su tiempo. ¡Esperamos verle pronto de nuevo!'
                : 'Muito obrigado pelo seu tempo. Esperamos vê-lo novamente em breve!'}
            </p>
            <div className="pt-3">
              <Button
                type="button"
                onClick={handleClose}
                className="rounded-xl px-6 bg-purple-900 hover:bg-purple-800 text-white text-xs font-bold"
              >
                {isEn ? 'Close' : isEs ? 'Cerrar' : 'Fechar'}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
            {/* 1. NOTA GERAL (1 a 5 Estrelas) */}
            <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-white/5 border border-purple-100 dark:border-white/10 text-center space-y-2">
              <label className="text-xs font-bold text-slate-900 dark:text-white block">
                {isEn ? 'Overall Satisfaction' : isEs ? 'Satisfacción General' : 'Satisfação Geral'}
              </label>
              <div className="flex items-center justify-center gap-2 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setOverallScore(star)}
                    className="p-1 transition-all hover:scale-115 focus:outline-none"
                    aria-label={`${star} estrelas`}
                  >
                    <Star
                      className={`h-7 w-7 transition-colors ${
                        star <= overallScore
                          ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                          : 'fill-transparent text-slate-300 dark:text-white/20'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <div className="text-[11px] font-bold text-purple-700 dark:text-pink-300 pt-0.5">
                {overallScore === 5
                  ? isEn ? 'Excellent' : isEs ? 'Excelente' : 'Excelente'
                  : overallScore === 4
                  ? isEn ? 'Very Good' : isEs ? 'Muy Bueno' : 'Muito Bom'
                  : overallScore === 3
                  ? isEn ? 'Good' : isEs ? 'Bueno' : 'Bom'
                  : overallScore === 2
                  ? isEn ? 'Regular' : isEs ? 'Regular' : 'Razoável'
                  : isEn ? 'Poor' : isEs ? 'Insatisfactorio' : 'Fraco'}
              </div>
            </div>

            {/* 2. CRITÉRIOS DE AVALIAÇÃO ESPECÍFICOS DA UNIDADE */}
            {criteria.length > 0 && (
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-purple-200/80">
                  {isEn
                    ? 'Evaluation Criteria'
                    : isEs
                    ? 'Criterios de Evaluación'
                    : 'Critérios de Avaliação'}
                </span>

                <div className="space-y-2">
                  {criteria.map((c) => {
                    const criterionName =
                      isEn && c.nameEn
                        ? c.nameEn
                        : isEs && c.nameEs
                        ? c.nameEs
                        : c.name
                    const currentScore = criteriaScores[c.id] ?? 5

                    return (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-purple-50/50 dark:bg-white/5 border border-purple-100/70 dark:border-white/5"
                      >
                        <span className="font-semibold text-slate-800 dark:text-purple-100">
                          {criterionName}
                        </span>

                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleScoreCriterion(c.id, star)}
                              className="p-0.5 hover:scale-110 focus:outline-none"
                            >
                              <Star
                                className={`h-4 w-4 transition-colors ${
                                  star <= currentScore
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'fill-transparent text-slate-300 dark:text-white/20'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 3. COMENTÁRIO OU SUGESTÃO */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-purple-200 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-purple-600 dark:text-pink-400" />
                <span>
                  {isEn
                    ? 'Comments / Suggestions (Optional)'
                    : isEs
                    ? 'Comentarios o Sugerencias (Opcional)'
                    : 'Comentários ou Sugestões (Opcional)'}
                </span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  isEn
                    ? 'Leave a note for our team...'
                    : isEs
                    ? 'Deje un comentario para nuestro equipo...'
                    : 'Deixe uma mensagem para a nossa equipa...'
                }
                rows={3}
                maxLength={400}
                className="w-full text-xs p-3 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-black/30 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-purple-300/40 focus:outline-none focus:ring-2 focus:ring-purple-500 transition resize-none"
              />
            </div>

            {/* 4. IDENTIFICAÇÃO DO CLIENTE (OPCIONAL) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600 dark:text-purple-300">
                  {isEn ? 'Your Name (optional)' : isEs ? 'Su Nombre (opcional)' : 'O seu Nome (opcional)'}
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={isEn ? 'e.g. Maria Silva' : 'Ex: Maria Silva'}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-black/30 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600 dark:text-purple-300">
                  {isEn ? 'Phone / WhatsApp (optional)' : isEs ? 'Teléfono (opcional)' : 'Telemóvel (opcional)'}
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="912 345 678"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-black/30 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 rounded-xl text-xs font-bold h-10 border-purple-200 dark:border-white/15 text-slate-700 dark:text-white hover:bg-purple-50 dark:hover:bg-white/10"
              >
                {isEn ? 'Cancel' : isEs ? 'Cancelar' : 'Cancelar'}
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-2 rounded-xl text-xs font-bold h-10 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-md shadow-pink-600/20"
              >
                {submitting
                  ? (isEn ? 'Sending...' : isEs ? 'Enviando...' : 'A enviar...')
                  : (isEn ? 'Submit Feedback' : isEs ? 'Enviar Opinión' : 'Enviar Avaliação')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
