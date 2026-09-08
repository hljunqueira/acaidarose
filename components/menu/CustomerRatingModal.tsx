'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Star, CheckCircle2, ArrowLeft, ArrowRight, Send, Check } from 'lucide-react'
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

  // Estados da Pesquisa de Satisfação 2.0
  const [activeSurvey, setActiveSurvey] = useState<any | null>(null)
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [loadingSurvey, setLoadingSurvey] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Respostas do formulário 2.0
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, any>>({})

  // Estados do formulário legado / fallback (quando nenhuma pesquisa 2.0 estiver ativa)
  const [legacyScore, setLegacyScore] = useState<number>(5)
  const [legacyComment, setLegacyComment] = useState('')
  const [legacyCustomerName, setLegacyCustomerName] = useState(initialCustomerName || '')
  const [legacyCustomerPhone, setLegacyCustomerPhone] = useState(initialCustomerPhone || '')
  const [legacyCriteria, setLegacyCriteria] = useState<any[]>([])
  const [legacyCriteriaScores, setLegacyCriteriaScores] = useState<Record<string, number>>({})

  // Carregar pesquisa de satisfação ativa da loja
  useEffect(() => {
    if (!open || !tenantId) return

    setLoadingSurvey(true)
    fetch(`/api/surveys/active?loja=${encodeURIComponent(tenantId)}&lang=${encodeURIComponent(language)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.survey) {
          setActiveSurvey(data.survey)
          setCurrentStep(0)
          // Inicializar respostas pré-preenchidas com nome/telefone se houver
          const initAnswers: Record<string, any> = {}
          const questions = data.survey.questions || []
          for (const q of questions) {
            if (q.type === 'nps') {
              initAnswers[q.id] = { type: 'nps', score: 10, comment: '' }
            } else if (q.type === 'customer_data') {
              initAnswers[q.id] = {
                type: 'customer_data',
                name: initialCustomerName || '',
                phone: initialCustomerPhone || '',
                email: '',
                birthday: '',
              }
            } else if (q.type === 'metrics') {
              const metricsMap: Record<string, number> = {}
              ;(q.metrics || []).forEach((m: string) => {
                metricsMap[m] = 5
              })
              initAnswers[q.id] = { type: 'metrics', metrics: metricsMap }
            } else if (q.type === 'multiple_choice') {
              initAnswers[q.id] = {
                type: 'multiple_choice',
                choice: q.choices?.[0] || '',
                isOther: false,
                otherText: '',
              }
            } else if (q.type === 'open') {
              initAnswers[q.id] = { type: 'open', answer: '' }
            }
          }
          setSurveyAnswers(initAnswers)
        } else {
          setActiveSurvey(null)
          // Fallback para critérios clássicos
          fetch(`/api/ratings/criteria?loja=${encodeURIComponent(tenantId)}`)
            .then((res) => res.json())
            .then((cData) => {
              if (Array.isArray(cData.criteria)) {
                setLegacyCriteria(cData.criteria)
                const sMap: Record<string, number> = {}
                cData.criteria.forEach((c: any) => {
                  sMap[c.id] = 5
                })
                setLegacyCriteriaScores(sMap)
              }
            })
            .catch(() => setLegacyCriteria([]))
        }
      })
      .catch(() => {
        setActiveSurvey(null)
      })
      .finally(() => {
        setLoadingSurvey(false)
      })
  }, [open, tenantId, language])

  // Submissão da Pesquisa de Satisfação 2.0
  const handleSurveySubmit = async () => {
    if (!activeSurvey?.id) return

    setSubmitting(true)
    try {
      const answersList = Object.entries(surveyAnswers).map(([qId, ans]) => ({
        question_id: qId,
        ...ans,
      }))

      const res = await fetch(`/api/surveys/${activeSurvey.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          orderId,
          tableNumber: initialTable ? String(initialTable).trim() : null,
          answers: answersList,
          language,
        }),
      })

      if (!res.ok) {
        throw new Error('Falha ao registar avaliação.')
      }

      setSubmitted(true)
      toast.success(
        isEn
          ? 'Thank you! Your feedback helps us improve every day.'
          : isEs
          ? '¡Muchas gracias! Su opinión nos ayuda a mejorar día a día.'
          : 'Muito obrigado! A sua avaliação ajuda-nos a melhorar todos os dias.'
      )
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar avaliação')
    } finally {
      setSubmitting(false)
    }
  }

  // Submissão Clássica / Fallback
  const handleLegacySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          orderId,
          tableNumber: initialTable ? String(initialTable).trim() : null,
          customerName: legacyCustomerName.trim() || null,
          customerPhone: legacyCustomerPhone.trim() || null,
          score: legacyScore,
          criteriaScores: legacyCriteriaScores,
          comment: legacyComment.trim() || null,
          language,
        }),
      })

      if (!res.ok) throw new Error('Falha ao registar avaliação')

      setSubmitted(true)
      toast.success(
        isEn
          ? 'Thank you for your feedback!'
          : isEs
          ? '¡Muchas gracias por su opinión!'
          : 'Muito obrigado pela sua avaliação!'
      )
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar avaliação')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(() => {
      setSubmitted(false)
      setCurrentStep(0)
    }, 300)
  }

  const questions: any[] = activeSurvey?.questions || []
  const currentQ = questions[currentStep]
  const isLastQuestion = currentStep === questions.length - 1

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto p-5 sm:p-6 bg-white dark:bg-[#160228] text-slate-900 dark:text-white border border-purple-100 dark:border-white/10 rounded-3xl shadow-2xl">
        {/* Cabeçalho */}
        <DialogHeader className="pb-3 border-b border-purple-100 dark:border-white/10 text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400">
              {isEn
                ? 'Customer Satisfaction Survey'
                : isEs
                ? 'Encuesta de Satisfacción'
                : 'Pesquisa de Satisfação'}
            </span>
            {activeSurvey && questions.length > 0 && !submitted && (
              <span className="text-xs font-bold text-slate-400 font-mono">
                {currentStep + 1} / {questions.length}
              </span>
            )}
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
            {activeSurvey?.title ||
              (isEn
                ? 'Rate your Experience'
                : isEs
                ? 'Valora tu Experiencia'
                : 'Avalie a sua Experiência')}
          </DialogTitle>
          <p className="text-xs text-slate-600 dark:text-purple-200/70">
            {activeSurvey?.description ||
              (isEn
                ? 'Tell us how your visit went today.'
                : isEs
                ? 'Cuéntenos cómo fue su visita de hoy.'
                : 'Diga-nos como correu o seu pedido e o nosso atendimento.')}
          </p>

          {/* Barra de Progresso da Pesquisa 2.0 */}
          {activeSurvey && questions.length > 1 && !submitted && (
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden mt-2">
              <div
                style={{
                  width: `${((currentStep + 1) / questions.length) * 100}%`,
                }}
                className="h-full bg-purple-900 dark:bg-pink-500 transition-all duration-300"
              />
            </div>
          )}
        </DialogHeader>

        {/* TELA DE AGRADECIMENTO / SUCESSO */}
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
                className="rounded-xl px-6 bg-purple-900 hover:bg-purple-800 text-white text-xs font-bold cursor-pointer"
              >
                {isEn ? 'Close' : isEs ? 'Cerrar' : 'Fechar'}
              </Button>
            </div>
          </div>
        ) : activeSurvey && currentQ ? (
          /* FORMULÁRIO PESQUISA DE SATISFAÇÃO 2.0 PASSO A PASSO */
          <div className="py-3 space-y-4 text-xs">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                {currentQ.title}
              </h3>
              {currentQ.description && (
                <p className="text-xs text-slate-500 dark:text-purple-300/80">
                  {currentQ.description}
                </p>
              )}
            </div>

            {/* 1. NPS (0 A 10) */}
            {currentQ.type === 'nps' && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-11 gap-1">
                  {Array.from({ length: 11 }).map((_, n) => {
                    const currentScore = surveyAnswers[currentQ.id]?.score
                    const isSelected = currentScore === n

                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => {
                          setSurveyAnswers((prev) => ({
                            ...prev,
                            [currentQ.id]: {
                              ...(prev[currentQ.id] || {}),
                              type: 'nps',
                              score: n,
                            },
                          }))
                        }}
                        className={`h-9 rounded-xl text-xs font-bold font-mono transition cursor-pointer border ${
                          isSelected
                            ? n >= 9
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : n >= 7
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-rose-600 text-white border-rose-600 shadow-sm'
                            : n >= 9
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                            : n >= 7
                            ? 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800 hover:bg-blue-100'
                            : 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800 hover:bg-rose-100'
                        }`}
                      >
                        {n}
                      </button>
                    )
                  })}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold px-1">
                  <span>{isEn ? '0 - Not at all likely' : isEs ? '0 - Nada probable' : '0 - Nada provável'}</span>
                  <span>{isEn ? '10 - Extremely likely' : isEs ? '10 - Extremamente provável' : '10 - Muito provável'}</span>
                </div>

                {currentQ.explainScore && (
                  <div className="pt-2">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-purple-200 mb-1">
                      {isEn
                        ? 'Tell us why you gave this score (optional):'
                        : isEs
                        ? 'Cuéntenos el motivo de su puntuación (opcional):'
                        : 'Conte-nos o motivo da sua nota (opcional):'}
                    </label>
                    <textarea
                      rows={2}
                      value={surveyAnswers[currentQ.id]?.comment || ''}
                      onChange={(e) => {
                        const val = e.target.value
                        setSurveyAnswers((prev) => ({
                          ...prev,
                          [currentQ.id]: {
                            ...(prev[currentQ.id] || {}),
                            type: 'nps',
                            comment: val,
                          },
                        }))
                      }}
                      placeholder={
                        isEn
                          ? 'What did you like the most, or what can we improve?'
                          : isEs
                          ? '¿Qué le gustó más o qué podemos mejorar?'
                          : 'O que mais gostou ou o que podemos melhorar?'
                      }
                      className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-purple-200 dark:border-white/15 text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}
              </div>
            )}

            {/* 2. RESPOSTA ABERTA */}
            {currentQ.type === 'open' && (
              <div className="pt-2">
                <textarea
                  rows={4}
                  value={surveyAnswers[currentQ.id]?.answer || ''}
                  onChange={(e) => {
                    const val = e.target.value
                    setSurveyAnswers((prev) => ({
                      ...prev,
                      [currentQ.id]: {
                        type: 'open',
                        answer: val,
                      },
                    }))
                  }}
                  placeholder={
                    isEn
                      ? 'Write your feedback here with total honesty...'
                      : isEs
                      ? 'Escriba su comentario aquí con total sinceridad...'
                      : 'Escreva o seu comentário aqui com total sinceridade...'
                  }
                  className="w-full p-3 rounded-2xl text-xs bg-slate-50 dark:bg-white/5 border border-purple-200 dark:border-white/15 text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            {/* 3. DADOS DO CLIENTE */}
            {currentQ.type === 'customer_data' && (
              <div className="space-y-3 pt-1">
                {currentQ.collectName && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-purple-200 mb-1">
                      {isEn ? 'Full Name' : isEs ? 'Nombre Completo' : 'Nome Completo'}
                    </label>
                    <input
                      type="text"
                      value={surveyAnswers[currentQ.id]?.name || ''}
                      onChange={(e) => {
                        const val = e.target.value
                        setSurveyAnswers((prev) => ({
                          ...prev,
                          [currentQ.id]: {
                            ...(prev[currentQ.id] || {}),
                            type: 'customer_data',
                            name: val,
                          },
                        }))
                      }}
                      placeholder={isEn ? 'Your name' : isEs ? 'Su nombre' : 'O seu nome'}
                      className="w-full h-10 px-3 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-purple-200 dark:border-white/15 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}

                {currentQ.collectPhone && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-purple-200 mb-1">
                      {isEn ? 'Phone / WhatsApp' : isEs ? 'Teléfono / WhatsApp' : 'Telemóvel / WhatsApp'}
                    </label>
                    <input
                      type="tel"
                      value={surveyAnswers[currentQ.id]?.phone || ''}
                      onChange={(e) => {
                        const val = e.target.value
                        setSurveyAnswers((prev) => ({
                          ...prev,
                          [currentQ.id]: {
                            ...(prev[currentQ.id] || {}),
                            type: 'customer_data',
                            phone: val,
                          },
                        }))
                      }}
                      placeholder="Ex: 912 345 678"
                      className="w-full h-10 px-3 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-purple-200 dark:border-white/15 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}

                {currentQ.collectEmail && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-purple-200 mb-1">
                      {isEn ? 'E-mail' : isEs ? 'Correo Electrónico' : 'E-mail'}
                    </label>
                    <input
                      type="email"
                      value={surveyAnswers[currentQ.id]?.email || ''}
                      onChange={(e) => {
                        const val = e.target.value
                        setSurveyAnswers((prev) => ({
                          ...prev,
                          [currentQ.id]: {
                            ...(prev[currentQ.id] || {}),
                            type: 'customer_data',
                            email: val,
                          },
                        }))
                      }}
                      placeholder="exemplo@email.com"
                      className="w-full h-10 px-3 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-purple-200 dark:border-white/15 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}

                {currentQ.collectBirthday && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-purple-200 mb-1">
                      {isEn ? 'Birthday' : isEs ? 'Fecha de Cumpleaños' : 'Data de Nascimento'}
                    </label>
                    <input
                      type="date"
                      value={surveyAnswers[currentQ.id]?.birthday || ''}
                      onChange={(e) => {
                        const val = e.target.value
                        setSurveyAnswers((prev) => ({
                          ...prev,
                          [currentQ.id]: {
                            ...(prev[currentQ.id] || {}),
                            type: 'customer_data',
                            birthday: val,
                          },
                        }))
                      }}
                      className="w-full h-10 px-3 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-purple-200 dark:border-white/15 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}
              </div>
            )}

            {/* 4. AVALIAR MÉTRICAS */}
            {currentQ.type === 'metrics' && (
              <div className="space-y-2.5 pt-1">
                {(currentQ.metrics || []).map((metric: string, idx: number) => {
                  const currentMetricScore = surveyAnswers[currentQ.id]?.metrics?.[metric] ?? 5

                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-purple-50/60 dark:bg-white/5 border border-purple-100 dark:border-white/10 flex items-center justify-between gap-3"
                    >
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        {metric}
                      </span>

                      <div className="flex items-center gap-1 shrink-0">
                        {currentQ.metricsFormat === 'emojis' ? (
                          ['😠', '🙁', '😐', '🙂', '😍'].map((emoji, eIdx) => {
                            const val = eIdx + 1
                            const isSelected = currentMetricScore === val
                            return (
                              <button
                                key={eIdx}
                                type="button"
                                onClick={() => {
                                  setSurveyAnswers((prev) => ({
                                    ...prev,
                                    [currentQ.id]: {
                                      ...(prev[currentQ.id] || {}),
                                      type: 'metrics',
                                      metrics: {
                                        ...(prev[currentQ.id]?.metrics || {}),
                                        [metric]: val,
                                      },
                                    },
                                  }))
                                }}
                                className={`text-lg p-1 transition cursor-pointer ${
                                  isSelected ? 'scale-125 opacity-100' : 'opacity-40 hover:opacity-80'
                                }`}
                              >
                                {emoji}
                              </button>
                            )
                          })
                        ) : (
                          [1, 2, 3, 4, 5].map((star) => {
                            const isSelected = star <= currentMetricScore
                            return (
                              <button
                                key={star}
                                type="button"
                                onClick={() => {
                                  setSurveyAnswers((prev) => ({
                                    ...prev,
                                    [currentQ.id]: {
                                      ...(prev[currentQ.id] || {}),
                                      type: 'metrics',
                                      metrics: {
                                        ...(prev[currentQ.id]?.metrics || {}),
                                        [metric]: star,
                                      },
                                    },
                                  }))
                                }}
                                className="p-0.5 cursor-pointer focus:outline-none transition hover:scale-115"
                              >
                                <Star
                                  className={`h-5 w-5 ${
                                    isSelected
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'fill-transparent text-slate-300 dark:text-white/20'
                                  }`}
                                />
                              </button>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* 5. MÚLTIPLA ESCOLHA */}
            {currentQ.type === 'multiple_choice' && (
              <div className="space-y-2 pt-1">
                {(currentQ.choices || []).map((choice: string, idx: number) => {
                  const isSelected =
                    !surveyAnswers[currentQ.id]?.isOther &&
                    surveyAnswers[currentQ.id]?.choice === choice

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSurveyAnswers((prev) => ({
                          ...prev,
                          [currentQ.id]: {
                            type: 'multiple_choice',
                            choice,
                            isOther: false,
                            otherText: '',
                          },
                        }))
                      }}
                      className={`w-full text-left p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                          : 'bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-purple-100 border-purple-100 dark:border-white/10 hover:border-purple-300'
                      }`}
                    >
                      <span className="text-xs font-semibold">{choice}</span>
                      {isSelected && <Check className="h-4 w-4 shrink-0" />}
                    </button>
                  )
                })}

                {currentQ.allowOther && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSurveyAnswers((prev) => ({
                          ...prev,
                          [currentQ.id]: {
                            type: 'multiple_choice',
                            choice: '',
                            isOther: true,
                            otherText: prev[currentQ.id]?.otherText || '',
                          },
                        }))
                      }}
                      className={`w-full text-left p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                        surveyAnswers[currentQ.id]?.isOther
                          ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                          : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-purple-200 border-dashed border-purple-200 dark:border-white/15 hover:border-purple-400'
                      }`}
                    >
                      <span className="text-xs font-semibold">
                        {isEn
                          ? 'Other (please specify)'
                          : isEs
                          ? 'Otro (especifique)'
                          : 'Outro (por favor especifique)'}
                      </span>
                      {surveyAnswers[currentQ.id]?.isOther && <Check className="h-4 w-4 shrink-0" />}
                    </button>

                    {surveyAnswers[currentQ.id]?.isOther && (
                      <input
                        type="text"
                        value={surveyAnswers[currentQ.id]?.otherText || ''}
                        onChange={(e) => {
                          const val = e.target.value
                          setSurveyAnswers((prev) => ({
                            ...prev,
                            [currentQ.id]: {
                              ...(prev[currentQ.id] || {}),
                              isOther: true,
                              otherText: val,
                            },
                          }))
                        }}
                        placeholder={
                          isEn
                            ? 'Please describe...'
                            : isEs
                            ? 'Por favor describa...'
                            : 'Por favor descreva...'
                        }
                        className="w-full h-10 px-3 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-purple-200 dark:border-white/15 text-slate-900 dark:text-white mt-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        autoFocus
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* BOTÕES DE NAVEGAÇÃO (VOLTAR / AVANÇAR / CONCLUIR) */}
            <div className="pt-4 border-t border-purple-100 dark:border-white/10 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                disabled={currentStep === 0 || submitting}
                className="h-10 px-4 rounded-xl text-xs font-bold border-purple-200 dark:border-white/15 cursor-pointer disabled:opacity-30"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                <span>{isEn ? 'Back' : isEs ? 'Volver' : 'Voltar'}</span>
              </Button>

              {isLastQuestion ? (
                <Button
                  type="button"
                  onClick={handleSurveySubmit}
                  disabled={submitting}
                  className="h-10 px-5 rounded-xl text-xs font-bold bg-purple-900 hover:bg-purple-800 text-white cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>
                    {submitting
                      ? isEn
                        ? 'Sending...'
                        : isEs
                        ? 'Enviando...'
                        : 'A enviar...'
                      : isEn
                      ? 'Submit Feedback'
                      : isEs
                      ? 'Enviar Opinión'
                      : 'Concluir Avaliação'}
                  </span>
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => setCurrentStep((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="h-10 px-5 rounded-xl text-xs font-bold bg-purple-900 hover:bg-purple-800 text-white cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <span>{isEn ? 'Next' : isEs ? 'Siguiente' : 'Avançar'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* FORMULÁRIO LEGADO / FALLBACK POR ESTRELAS CASO A LOJA NÃO TENHA MODELO 2.0 ATIVO */
          <form onSubmit={handleLegacySubmit} className="space-y-4 py-2 text-xs">
            <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-white/5 border border-purple-100 dark:border-white/10 text-center space-y-2">
              <label className="text-xs font-bold text-slate-900 dark:text-white block">
                {isEn ? 'Overall Satisfaction' : isEs ? 'Satisfacción General' : 'Satisfação Geral'}
              </label>
              <div className="flex items-center justify-center gap-2 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setLegacyScore(star)}
                    className="p-1 transition-all hover:scale-115 focus:outline-none cursor-pointer"
                  >
                    <Star
                      className={`h-7 w-7 transition-colors ${
                        star <= legacyScore
                          ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                          : 'fill-transparent text-slate-300 dark:text-white/20'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {legacyCriteria.length > 0 && (
              <div className="space-y-2 pt-1">
                {legacyCriteria.map((crit) => (
                  <div
                    key={crit.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-purple-100 dark:border-white/10 flex items-center justify-between"
                  >
                    <span className="font-semibold text-slate-800 dark:text-white">
                      {isEn ? crit.nameEn || crit.name : isEs ? crit.nameEs || crit.name : crit.name}
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() =>
                            setLegacyCriteriaScores((prev) => ({ ...prev, [crit.id]: s }))
                          }
                          className="p-0.5 focus:outline-none"
                        >
                          <Star
                            className={`h-4 w-4 ${
                              s <= (legacyCriteriaScores[crit.id] ?? 5)
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-transparent text-slate-300 dark:text-white/20'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-purple-200 mb-1">
                {isEn ? 'Your comments (optional)' : isEs ? 'Sus comentarios (opcional)' : 'O seu comentário (opcional)'}
              </label>
              <textarea
                rows={3}
                value={legacyComment}
                onChange={(e) => setLegacyComment(e.target.value)}
                placeholder={
                  isEn
                    ? 'Tell us what you liked or what can improve...'
                    : isEs
                    ? 'Cuéntenos qué le gustó o qué podemos mejorar...'
                    : 'Conte-nos o que gostou ou o que podemos melhorar...'
                }
                className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-purple-200 dark:border-white/15 text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <DialogFooter className="pt-2 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                className="text-xs font-semibold text-slate-500"
              >
                {isEn ? 'Cancel' : isEs ? 'Cancelar' : 'Cancelar'}
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="h-10 px-5 rounded-xl text-xs font-bold bg-purple-900 hover:bg-purple-800 text-white cursor-pointer shadow-xs"
              >
                {submitting
                  ? isEn
                    ? 'Submitting...'
                    : isEs
                    ? 'Enviando...'
                    : 'A enviar...'
                  : isEn
                  ? 'Submit Review'
                  : isEs
                  ? 'Enviar Opinión'
                  : 'Enviar Avaliação'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
