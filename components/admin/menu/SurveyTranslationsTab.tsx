'use client'

import React, { useState, useEffect } from 'react'
import { FileText, Save, RefreshCw, Globe, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import { SurveyModel, SurveyQuestion } from '../surveys/SurveyEditorView'

export default function SurveyTranslationsTab() {
  const { user, token } = useAuthStore()
  const [surveys, setSurveys] = useState<SurveyModel[]>([])
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>('')
  const [currentSurvey, setCurrentSurvey] = useState<SurveyModel | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Buffer de traduções: { en: { title, description, questions: { [qId]: { title, description, choices, metrics } } }, es: { ... } }
  const [translations, setTranslations] = useState<{
    en: { title: string; description: string; questions: Record<string, any> }
    es: { title: string; description: string; questions: Record<string, any> }
  }>({
    en: { title: '', description: '', questions: {} },
    es: { title: '', description: '', questions: {} },
  })

  // Carregar pesquisas disponíveis
  const loadSurveys = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/surveys')
      const data = await res.json()
      if (res.ok && Array.isArray(data.surveys)) {
        setSurveys(data.surveys)
        if (data.surveys.length > 0) {
          const firstId = selectedSurveyId || data.surveys[0].id
          setSelectedSurveyId(firstId)
          selectSurvey(data.surveys.find((s: any) => s.id === firstId) || data.surveys[0])
        }
      }
    } catch {
      toast.error('Erro ao carregar pesquisas para tradução.')
    } finally {
      setLoading(false)
    }
  }

  const selectSurvey = (survey: SurveyModel) => {
    setCurrentSurvey(survey)
    const existing = survey.translations || {}

    setTranslations({
      en: {
        title: existing.en?.title || '',
        description: existing.en?.description || '',
        questions: existing.en?.questions || {},
      },
      es: {
        title: existing.es?.title || '',
        description: existing.es?.description || '',
        questions: existing.es?.questions || {},
      },
    })
  }

  useEffect(() => {
    loadSurveys()
  }, [])

  const handleSurveyChange = (id: string) => {
    setSelectedSurveyId(id)
    const found = surveys.find((s) => s.id === id)
    if (found) selectSurvey(found)
  }

  // Atualizar campo de tradução
  const updateQuestionTranslation = (
    lang: 'en' | 'es',
    qId: string,
    field: string,
    value: any
  ) => {
    setTranslations((prev) => {
      const langObj = prev[lang]
      const qObj = langObj.questions[qId] || {}
      return {
        ...prev,
        [lang]: {
          ...langObj,
          questions: {
            ...langObj.questions,
            [qId]: {
              ...qObj,
              [field]: value,
            },
          },
        },
      }
    })
  }

  // Guardar traduções
  const handleSaveTranslations = async () => {
    if (!currentSurvey?.id) return
    setSaving(true)
    try {
      const res = await fetch(`/api/surveys/${currentSurvey.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || user?.id || '',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          title: currentSurvey.title,
          description: currentSurvey.description,
          translations,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar traduções')

      toast.success('Traduções da pesquisa guardadas com sucesso!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-slate-500">
        <RefreshCw className="h-6 w-6 mx-auto animate-spin mb-2 text-purple-600" />
        <span>A carregar pesquisas para tradução...</span>
      </div>
    )
  }

  if (surveys.length === 0) {
    return (
      <div className="p-12 text-center rounded-3xl bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10 text-xs text-slate-500 space-y-2">
        <FileText className="h-8 w-8 mx-auto text-purple-300" />
        <p>Nenhuma pesquisa cadastrada no sistema. Crie um modelo primeiro em Feedbacks &gt; Pesquisa de Satisfação.</p>
      </div>
    )
  }

  const questions: SurveyQuestion[] = Array.isArray(currentSurvey?.questions)
    ? currentSurvey!.questions
    : []

  return (
    <div className="space-y-5">
      {/* Barra de Seleção de Modelo e Ação Guardar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-700 dark:text-purple-200">
            Modelo de Pesquisa:
          </span>
          <select
            value={selectedSurveyId}
            onChange={(e) => handleSurveyChange(e.target.value)}
            className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-purple-200 dark:border-white/15 text-slate-900 dark:text-white text-xs font-bold"
          >
            {surveys.map((s) => (
              <option key={s.id} value={s.id} className="text-black dark:text-white dark:bg-slate-900">
                {s.title}
              </option>
            ))}
          </select>
        </div>

        <Button
          type="button"
          onClick={handleSaveTranslations}
          disabled={saving}
          className="h-9 px-4 rounded-xl text-xs font-bold bg-purple-900 hover:bg-purple-800 text-white cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0"
        >
          <Save className="h-3.5 w-3.5" />
          <span>{saving ? 'A guardar...' : 'Guardar Traduções'}</span>
        </Button>
      </div>

      {/* Título e Descrição da Pesquisa */}
      <div className="p-5 rounded-3xl bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10 space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-pink-300">
          Título &amp; Apresentação da Pesquisa
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500">Português 🇵🇹 (Original)</span>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 text-xs text-slate-800 dark:text-white font-medium">
              {currentSurvey?.title}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500">Inglês 🇺🇸 (EN)</span>
            <input
              type="text"
              value={translations.en.title}
              onChange={(e) =>
                setTranslations((prev) => ({
                  ...prev,
                  en: { ...prev.en, title: e.target.value },
                }))
              }
              placeholder="Ex: Customer Satisfaction Survey"
              className="w-full h-9 px-3 rounded-xl text-xs bg-white dark:bg-white/5 border border-purple-200 dark:border-white/15 text-slate-900 dark:text-white"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500">Espanhol 🇪🇸 (ES)</span>
            <input
              type="text"
              value={translations.es.title}
              onChange={(e) =>
                setTranslations((prev) => ({
                  ...prev,
                  es: { ...prev.es, title: e.target.value },
                }))
              }
              placeholder="Ex: Encuesta de Satisfacción del Cliente"
              className="w-full h-9 px-3 rounded-xl text-xs bg-white dark:bg-white/5 border border-purple-200 dark:border-white/15 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Lista de Perguntas */}
      <div className="space-y-4">
        <div className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
          Perguntas da Pesquisa ({questions.length})
        </div>

        {questions.map((q, idx) => {
          const transEn = translations.en.questions[q.id] || {}
          const transEs = translations.es.questions[q.id] || {}

          return (
            <div
              key={q.id || idx}
              className="p-5 rounded-3xl bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10 space-y-4"
            >
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-purple-100 dark:bg-white/10 text-purple-900 dark:text-pink-300 text-xs font-bold flex items-center justify-center">
                  #{idx + 1}
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  {q.type === 'nps'
                    ? 'NPS (0 a 10)'
                    : q.type === 'customer_data'
                    ? 'Dados do Cliente'
                    : q.type === 'metrics'
                    ? 'Avaliar Métricas'
                    : q.type === 'multiple_choice'
                    ? 'Múltipla Escolha'
                    : 'Resposta Aberta'}
                </span>
              </div>

              {/* Título da Pergunta em 3 Colunas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-500">🇵🇹 PT (Original)</span>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 text-xs text-slate-800 dark:text-white">
                    {q.title}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-500">🇺🇸 Inglês (EN)</span>
                  <input
                    type="text"
                    value={transEn.title || ''}
                    onChange={(e) => updateQuestionTranslation('en', q.id, 'title', e.target.value)}
                    placeholder="Question in English..."
                    className="w-full h-10 px-3 rounded-xl text-xs bg-white dark:bg-white/5 border border-purple-200 dark:border-white/15 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-500">🇪🇸 Espanhol (ES)</span>
                  <input
                    type="text"
                    value={transEs.title || ''}
                    onChange={(e) => updateQuestionTranslation('es', q.id, 'title', e.target.value)}
                    placeholder="Pregunta en Español..."
                    className="w-full h-10 px-3 rounded-xl text-xs bg-white dark:bg-white/5 border border-purple-200 dark:border-white/15 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Subtítulo / Descrição da Pergunta */}
              {q.description && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  <div className="text-[11px] text-slate-400 italic px-1">{q.description}</div>
                  <input
                    type="text"
                    value={transEn.description || ''}
                    onChange={(e) =>
                      updateQuestionTranslation('en', q.id, 'description', e.target.value)
                    }
                    placeholder="Subtitle in English..."
                    className="w-full h-8 px-2.5 rounded-lg text-xs bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10 text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={transEs.description || ''}
                    onChange={(e) =>
                      updateQuestionTranslation('es', q.id, 'description', e.target.value)
                    }
                    placeholder="Subtítulo en Español..."
                    className="w-full h-8 px-2.5 rounded-lg text-xs bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              {/* Se for Múltipla Escolha: Alternativas */}
              {q.type === 'multiple_choice' && Array.isArray(q.choices) && (
                <div className="pt-2 border-t border-purple-100 dark:border-white/10 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Tradução das Opções de Resposta:
                  </div>
                  {q.choices.map((ch, cIdx) => {
                    const chEnList = Array.isArray(transEn.choices) ? [...transEn.choices] : []
                    const chEsList = Array.isArray(transEs.choices) ? [...transEs.choices] : []

                    return (
                      <div key={cIdx} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                        <span className="text-xs text-slate-700 dark:text-purple-200 truncate">
                          {cIdx + 1}. {ch}
                        </span>
                        <input
                          type="text"
                          value={chEnList[cIdx] || ''}
                          onChange={(e) => {
                            chEnList[cIdx] = e.target.value
                            updateQuestionTranslation('en', q.id, 'choices', chEnList)
                          }}
                          placeholder={`Option ${cIdx + 1} (EN)`}
                          className="w-full h-8 px-2.5 rounded-lg text-xs bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10 text-slate-900 dark:text-white"
                        />
                        <input
                          type="text"
                          value={chEsList[cIdx] || ''}
                          onChange={(e) => {
                            chEsList[cIdx] = e.target.value
                            updateQuestionTranslation('es', q.id, 'choices', chEsList)
                          }}
                          placeholder={`Opción ${cIdx + 1} (ES)`}
                          className="w-full h-8 px-2.5 rounded-lg text-xs bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10 text-slate-900 dark:text-white"
                        />
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Se for Métricas: Itens */}
              {q.type === 'metrics' && Array.isArray(q.metrics) && (
                <div className="pt-2 border-t border-purple-100 dark:border-white/10 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Tradução dos Itens Avaliados:
                  </div>
                  {q.metrics.map((m, mIdx) => {
                    const mEnList = Array.isArray(transEn.metrics) ? [...transEn.metrics] : []
                    const mEsList = Array.isArray(transEs.metrics) ? [...transEs.metrics] : []

                    return (
                      <div key={mIdx} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                        <span className="text-xs text-slate-700 dark:text-purple-200 truncate">
                          {mIdx + 1}. {m}
                        </span>
                        <input
                          type="text"
                          value={mEnList[mIdx] || ''}
                          onChange={(e) => {
                            mEnList[mIdx] = e.target.value
                            updateQuestionTranslation('en', q.id, 'metrics', mEnList)
                          }}
                          placeholder={`Item ${mIdx + 1} (EN)`}
                          className="w-full h-8 px-2.5 rounded-lg text-xs bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10 text-slate-900 dark:text-white"
                        />
                        <input
                          type="text"
                          value={mEsList[mIdx] || ''}
                          onChange={(e) => {
                            mEsList[mIdx] = e.target.value
                            updateQuestionTranslation('es', q.id, 'metrics', mEsList)
                          }}
                          placeholder={`Item ${mIdx + 1} (ES)`}
                          className="w-full h-8 px-2.5 rounded-lg text-xs bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10 text-slate-900 dark:text-white"
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
