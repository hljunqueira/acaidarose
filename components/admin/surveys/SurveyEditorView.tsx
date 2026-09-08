'use client'

import React, { useState } from 'react'
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  Eye,
  Sliders,
  CheckSquare,
  FileText,
  User,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'

export type QuestionType = 'nps' | 'open' | 'customer_data' | 'metrics' | 'multiple_choice'

export interface SurveyQuestion {
  id: string
  type: QuestionType
  title: string
  description?: string
  // Opções para NPS
  explainScore?: boolean
  // Opções para Dados do Cliente
  collectName?: boolean
  collectPhone?: boolean
  collectEmail?: boolean
  collectBirthday?: boolean
  // Opções para Avaliar Métricas (até 10 itens)
  metricsFormat?: 'emojis' | 'numbers'
  metrics?: string[]
  // Opções para Múltipla Escolha (até 10 opções)
  choices?: string[]
  allowOther?: boolean
}

export interface SurveyModel {
  id?: string
  title: string
  description: string
  questions: SurveyQuestion[]
  survey_type?: string
  active_stores?: string[]
  translations?: Record<string, any>
}

export type SurveyPresetType = 'NPS_ONLY' | 'LEADS_ONLY' | 'NPS_LEADS' | 'FULL' | 'CUSTOM'

export const PRESET_DEFINITIONS: Record<
  Exclude<SurveyPresetType, 'CUSTOM'>,
  { title: string; description: string; questions: SurveyQuestion[] }
> = {
  NPS_ONLY: {
    title: 'Pesquisa de Satisfação NPS — Açaí da Rose',
    description: 'Diga-nos numa escala de 0 a 10 a sua probabilidade de recomendação.',
    questions: [
      {
        id: 'q_nps',
        type: 'nps',
        title: 'Numa escala de 0 a 10, qual a probabilidade de recomendar o Açaí da Rose a um amigo ou familiar?',
        description: '0 = Nada provável, 10 = Extremamente provável',
        explainScore: true,
      },
    ],
  },
  LEADS_ONLY: {
    title: 'Clube de Vantagens & Ofertas — Açaí da Rose',
    description: 'Cadastre-se para receber novidades exclusivas e ofertas no seu aniversário.',
    questions: [
      {
        id: 'q_leads',
        type: 'customer_data',
        title: 'Deixe os seus dados para surpresas e ofertas exclusivas',
        description: 'Não partilhamos os seus dados com terceiros.',
        collectName: true,
        collectPhone: true,
        collectEmail: true,
        collectBirthday: true,
      },
    ],
  },
  NPS_LEADS: {
    title: 'Avaliação & Clube de Benefícios — Açaí da Rose',
    description: 'Avalie a sua experiência e participe no nosso clube de ofertas exclusivas.',
    questions: [
      {
        id: 'q_nps',
        type: 'nps',
        title: 'Numa escala de 0 a 10, qual a probabilidade de recomendar o Açaí da Rose a amigos ou familiares?',
        description: '0 = Nada provável, 10 = Extremamente provável',
        explainScore: true,
      },
      {
        id: 'q_leads',
        type: 'customer_data',
        title: 'Quer receber benefícios exclusivos e ofertas no seu aniversário?',
        description: 'Deixe os seus contactos para novidades exclusivas da nossa comunidade.',
        collectName: true,
        collectPhone: true,
        collectEmail: true,
        collectBirthday: true,
      },
    ],
  },
  FULL: {
    title: 'Pesquisa de Satisfação Padrão — Açaí da Rose',
    description: 'O seu feedback é fundamental para continuarmos a entregar a melhor taça de açaí de Portugal.',
    questions: [
      {
        id: 'q_nps',
        type: 'nps',
        title: 'Numa escala de 0 a 10, qual a probabilidade de recomendar o Açaí da Rose a amigos ou familiares?',
        description: '0 = Nada provável, 10 = Extremamente provável',
        explainScore: true,
      },
      {
        id: 'q_metrics',
        type: 'metrics',
        title: 'Como avalia cada um dos aspetos da sua experiência hoje?',
        metrics: [
          'Sabor e Qualidade do Açaí',
          'Rapidez na Entrega do Pedido',
          'Simpatia e Atendimento',
          'Limpeza e Ambiente da Loja',
        ],
        description: 'Classifique cada item abaixo.',
        metricsFormat: 'numbers',
      },
      {
        id: 'q_channel',
        type: 'multiple_choice',
        title: 'Como conheceu o Açaí da Rose?',
        choices: [
          'Instagram / Redes Sociais',
          'Recomendação de amigos ou familiares',
          'A passar em frente à loja',
          'Google Maps / Pesquisa online',
        ],
        allowOther: true,
        description: 'Selecione a principal opção.',
      },
      {
        id: 'q_leads',
        type: 'customer_data',
        title: 'Quer receber benefícios exclusivos e ofertas no seu aniversário?',
        description: 'Deixe os seus contactos para novidades exclusivas da nossa comunidade.',
        collectName: true,
        collectPhone: true,
        collectEmail: true,
        collectBirthday: true,
      },
      {
        id: 'q_open',
        type: 'open',
        title: 'Tem alguma sugestão ou elogio para a nossa equipa?',
        description: 'A sua opinião sincera ajuda-nos a melhorar todos os dias.',
      },
    ],
  },
}

export function detectPresetType(questions: SurveyQuestion[]): SurveyPresetType {
  if (questions.length === 1 && questions[0].type === 'nps') return 'NPS_ONLY'
  if (questions.length === 1 && questions[0].type === 'customer_data') return 'LEADS_ONLY'
  if (
    questions.length === 2 &&
    questions.some((q) => q.type === 'nps') &&
    questions.some((q) => q.type === 'customer_data')
  ) {
    return 'NPS_LEADS'
  }
  if (
    questions.length >= 4 &&
    questions.some((q) => q.type === 'nps') &&
    questions.some((q) => q.type === 'metrics')
  ) {
    return 'FULL'
  }
  return 'CUSTOM'
}

interface SurveyEditorViewProps {
  initialSurvey?: SurveyModel | null
  onBack: () => void
  onSaveSuccess: (savedSurvey: any) => void
}

export default function SurveyEditorView({
  initialSurvey,
  onBack,
  onSaveSuccess,
}: SurveyEditorViewProps) {
  const { user, token } = useAuthStore()
  const [title, setTitle] = useState(initialSurvey?.title || '')
  const [description, setDescription] = useState(initialSurvey?.description || '')
  const [questions, setQuestions] = useState<SurveyQuestion[]>(() => {
    if (initialSurvey?.questions && initialSurvey.questions.length > 0) {
      return initialSurvey.questions
    }
    // Pergunta padrão inicial canônica: NPS
    return [
      {
        id: 'q_nps_initial',
        type: 'nps',
        title: 'Numa escala de 0 a 10, qual a probabilidade de recomendar o Açaí da Rose a um amigo ou familiar?',
        description: '0 = Nada provável, 10 = Extremamente provável',
        explainScore: true,
      },
    ]
  })
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0)
  const [saving, setSaving] = useState(false)

  // Adicionar nova pergunta
  const handleAddQuestion = (type: QuestionType) => {
    if (questions.length >= 10) {
      toast.error('Limite máximo de 10 perguntas por pesquisa atingido.')
      return
    }

    const newId = `q_${Date.now()}`
    let newQ: SurveyQuestion

    switch (type) {
      case 'nps':
        newQ = {
          id: newId,
          type: 'nps',
          title: 'Numa escala de 0 a 10, qual a probabilidade de recomendar o Açaí da Rose?',
          description: '',
          explainScore: true,
        }
        break
      case 'open':
        newQ = {
          id: newId,
          type: 'open',
          title: 'O que podemos fazer para tornar a sua experiência ainda melhor?',
          description: 'A sua opinião sincera ajuda-nos a crescer.',
        }
        break
      case 'customer_data':
        newQ = {
          id: newId,
          type: 'customer_data',
          title: 'Deixe os seus dados para surpresas e novidades exclusivas',
          description: 'Não partilhamos os seus dados com terceiros.',
          collectName: true,
          collectPhone: true,
          collectEmail: true,
          collectBirthday: true,
        }
        break
      case 'metrics':
        newQ = {
          id: newId,
          type: 'metrics',
          title: 'Como avalia cada um dos itens abaixo?',
          description: 'Toque para classificar cada aspeto.',
          metricsFormat: 'emojis',
          metrics: ['Qualidade do Açaí', 'Tempo de Espera', 'Atendimento da Equipa', 'Limpeza do Espaço'],
        }
        break
      case 'multiple_choice':
        newQ = {
          id: newId,
          type: 'multiple_choice',
          title: 'Como conheceu o Açaí da Rose?',
          description: 'Selecione uma opção.',
          choices: ['Instagram / Redes Sociais', 'Recomendação de amigos', 'A passar em frente à loja', 'Google Maps'],
          allowOther: true,
        }
        break
    }

    const nextList = [...questions, newQ]
    setQuestions(nextList)
    setActiveQuestionIndex(nextList.length - 1)
  }

  // Atualizar campo de uma pergunta
  const handleUpdateQuestion = (index: number, updates: Partial<SurveyQuestion>) => {
    setQuestions((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], ...updates }
      return copy
    })
  }

  // Mover pergunta
  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === questions.length - 1) return

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const copy = [...questions]
    const item = copy.splice(index, 1)[0]
    copy.splice(targetIndex, 0, item)
    setQuestions(copy)
    setActiveQuestionIndex(targetIndex)
  }

  // Remover pergunta
  const handleRemoveQuestion = (index: number) => {
    if (questions.length <= 1) {
      toast.error('A pesquisa precisa ter pelo menos 1 pergunta.')
      return
    }
    const copy = [...questions]
    copy.splice(index, 1)
    setQuestions(copy)
    setActiveQuestionIndex(Math.max(0, index - 1))
  }

  // Alterar o tipo de uma pergunta existente
  const handleChangeQuestionType = (index: number, newType: QuestionType) => {
    setQuestions((prev) => {
      const copy = [...prev]
      const current = copy[index]
      if (!current || current.type === newType) return copy

      let updated: SurveyQuestion = {
        ...current,
        type: newType,
      }

      if (newType === 'nps') {
        updated = {
          id: current.id,
          type: 'nps',
          title: current.title || 'Numa escala de 0 a 10, qual a probabilidade de recomendar o Açaí da Rose?',
          description: current.description || '0 = Nada provável, 10 = Extremamente provável',
          explainScore: true,
        }
      } else if (newType === 'customer_data') {
        updated = {
          id: current.id,
          type: 'customer_data',
          title: current.title || 'Deixe os seus dados para surpresas e novidades exclusivas',
          description: current.description || 'Não partilhamos os seus dados com terceiros.',
          collectName: true,
          collectPhone: true,
          collectEmail: true,
          collectBirthday: true,
        }
      } else if (newType === 'metrics') {
        updated = {
          id: current.id,
          type: 'metrics',
          title: current.title || 'Como avalia cada um dos itens abaixo?',
          description: current.description || 'Toque para classificar cada aspeto.',
          metricsFormat: 'numbers',
          metrics:
            current.metrics && current.metrics.length > 0
              ? current.metrics
              : ['Qualidade do Açaí', 'Tempo de Espera', 'Atendimento da Equipa', 'Limpeza do Espaço'],
        }
      } else if (newType === 'multiple_choice') {
        updated = {
          id: current.id,
          type: 'multiple_choice',
          title: current.title || 'Como conheceu o Açaí da Rose?',
          description: current.description || 'Selecione uma opção.',
          choices:
            current.choices && current.choices.length > 0
              ? current.choices
              : ['Instagram / Redes Sociais', 'Recomendação de amigos', 'A passar em frente à loja', 'Google Maps'],
          allowOther: true,
        }
      } else if (newType === 'open') {
        updated = {
          id: current.id,
          type: 'open',
          title: current.title || 'O que podemos fazer para tornar a sua experiência ainda melhor?',
          description: current.description || 'A sua opinião sincera ajuda-nos a crescer.',
        }
      }

      copy[index] = updated
      return copy
    })
    toast.success('Tipo de pergunta atualizado!')
  }

  // Aplicar Preset de Formato com 1-Clique
  const handleApplyPreset = (presetKey: Exclude<SurveyPresetType, 'CUSTOM'>) => {
    const preset = PRESET_DEFINITIONS[presetKey]
    if (!preset) return

    if (
      questions.length > 1 &&
      !window.confirm('Aplicar este formato irá redefinir as perguntas para o modelo selecionado. Deseja continuar?')
    ) {
      return
    }

    setTitle(preset.title)
    setDescription(preset.description)
    setQuestions([...preset.questions])
    setActiveQuestionIndex(0)
    toast.success('Formato de pesquisa aplicado com sucesso!')
  }

  // Guardar pesquisa
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Por favor, informe um título para a pesquisa.')
      return
    }

    if (questions.length === 0) {
      toast.error('Adicione pelo menos uma pergunta à pesquisa.')
      return
    }

    // Validar se todas as perguntas têm título
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].title.trim()) {
        toast.error(`A pergunta #${i + 1} precisa de um título preenchido.`)
        setActiveQuestionIndex(i)
        return
      }
    }

    setSaving(true)
    try {
      const isEditing = Boolean(initialSurvey?.id)
      const url = isEditing ? `/api/surveys/${initialSurvey?.id}` : '/api/surveys'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || user?.id || '',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          questions,
          survey_type: detectPresetType(questions),
          active_stores: initialSurvey?.active_stores || [],
          translations: initialSurvey?.translations || {},
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao guardar pesquisa')
      }

      toast.success(isEditing ? 'Pesquisa atualizada com sucesso!' : 'Pesquisa criada com sucesso!')
      onSaveSuccess(data.survey)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao guardar pesquisa de satisfação')
    } finally {
      setSaving(false)
    }
  }

  const currentQ = questions[activeQuestionIndex] || questions[0]
  const currentPreset = detectPresetType(questions)

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Barra superior de ações */}
      <div className="flex items-center justify-between pb-3 border-b border-purple-100 dark:border-white/10">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-9 px-3 rounded-xl text-xs font-bold text-slate-600 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            <span>Voltar aos Modelos</span>
          </Button>
          <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">
            {initialSurvey?.id ? 'Editar Modelo de Pesquisa' : 'Novo Modelo de Pesquisa'}
          </h2>
        </div>

        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="h-9 px-4 rounded-xl text-xs font-bold bg-purple-900 hover:bg-purple-800 text-white cursor-pointer shadow-sm flex items-center gap-1.5"
        >
          <Save className="h-3.5 w-3.5" />
          <span>{saving ? 'A guardar...' : 'Guardar Modelo'}</span>
        </Button>
      </div>

      {/* Grid de 2 colunas: Construtor (Esquerda) vs Visualização do Cliente (Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-y-auto pr-1">
        {/* COLUNA ESQUERDA: EDITOR DE CONTEÚDO */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card de Formato & Presets Rápidos de 1-Clique */}
          <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-purple-900 dark:text-pink-300">
                Tipo / Formato da Pesquisa
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-white/10 text-purple-900 dark:text-pink-300 border border-purple-200 dark:border-white/15">
                {currentPreset === 'NPS_ONLY'
                  ? 'Somente NPS (1 etapa)'
                  : currentPreset === 'LEADS_ONLY'
                  ? 'Somente Dados do Cliente (1 etapa)'
                  : currentPreset === 'NPS_LEADS'
                  ? 'NPS + Dados do Cliente (2 etapas)'
                  : currentPreset === 'FULL'
                  ? 'Pesquisa Completa 2.0 (5 etapas)'
                  : 'Personalizada'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-purple-300/80">
              Selecione um formato pronto para configurar as perguntas automaticamente, ou personalize abaixo:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleApplyPreset('NPS_ONLY')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  currentPreset === 'NPS_ONLY'
                    ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                    : 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-purple-200 border-purple-100 dark:border-white/10 hover:border-purple-300'
                }`}
              >
                <div className="text-xs font-bold">Somente NPS</div>
                <div className="text-[10px] opacity-80 mt-0.5">1 etapa · Nota 0 a 10</div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('LEADS_ONLY')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  currentPreset === 'LEADS_ONLY'
                    ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                    : 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-purple-200 border-purple-100 dark:border-white/10 hover:border-purple-300'
                }`}
              >
                <div className="text-xs font-bold">Dados do Cliente</div>
                <div className="text-[10px] opacity-80 mt-0.5">1 etapa · Captura Leads</div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('NPS_LEADS')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  currentPreset === 'NPS_LEADS'
                    ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                    : 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-purple-200 border-purple-100 dark:border-white/10 hover:border-purple-300'
                }`}
              >
                <div className="text-xs font-bold">NPS + Dados</div>
                <div className="text-[10px] opacity-80 mt-0.5">2 etapas · Nota e Leads</div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('FULL')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  currentPreset === 'FULL'
                    ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                    : 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-purple-200 border-purple-100 dark:border-white/10 hover:border-purple-300'
                }`}
              >
                <div className="text-xs font-bold">Pesquisa Completa</div>
                <div className="text-[10px] opacity-80 mt-0.5">5 etapas · Estrelas + Leads</div>
              </button>
            </div>
          </div>

          {/* Informações Gerais do Modelo */}
          <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10 shadow-xs space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-purple-900 dark:text-pink-300">
              Informações do Modelo
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-purple-200 mb-1">
                Título da Pesquisa *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Pesquisa de Satisfação Padrão — Açaí da Rose"
                className="w-full h-10 px-3 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-purple-200 dark:border-white/15 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-purple-200 mb-1">
                Descrição ou Mensagem de Agradecimento (opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Ex: O seu feedback é fundamental para continuarmos a entregar o melhor açaí de Portugal."
                className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-purple-200 dark:border-white/15 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>
          </div>

          {/* Navegação de Perguntas e Botão de Adicionar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-800 dark:text-white">
                Perguntas ({questions.length} de 10)
              </div>
              <div className="text-[11px] text-slate-500 dark:text-purple-300">
                Selecione uma pergunta para editar
              </div>
            </div>

            {/* Abas horizontais para cada pergunta */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
              {questions.map((q, idx) => (
                <button
                  key={q.id || idx}
                  type="button"
                  onClick={() => setActiveQuestionIndex(idx)}
                  className={`h-8 px-3 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 cursor-pointer border ${
                    activeQuestionIndex === idx
                      ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                      : 'bg-white dark:bg-white/5 text-slate-700 dark:text-purple-200 border-purple-100 dark:border-white/10 hover:border-purple-300'
                  }`}
                >
                  <span>#{idx + 1}</span>
                  <span className="truncate max-w-[110px]">
                    {q.type === 'nps'
                      ? 'NPS'
                      : q.type === 'customer_data'
                      ? 'Dados'
                      : q.type === 'metrics'
                      ? 'Métricas'
                      : q.type === 'multiple_choice'
                      ? 'Múltipla'
                      : 'Aberta'}
                  </span>
                </button>
              ))}

              {questions.length < 10 && (
                <div className="relative group shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 rounded-xl text-xs font-bold border-dashed border-purple-300 dark:border-white/20 text-purple-800 dark:text-pink-300 hover:bg-purple-50 dark:hover:bg-white/10 cursor-pointer"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    <span>Adicionar</span>
                  </Button>

                  {/* Menu popover de tipos de pergunta */}
                  <div className="absolute left-0 top-full mt-1.5 w-56 p-1.5 rounded-2xl bg-white dark:bg-[#200336] border border-purple-200 dark:border-white/15 shadow-xl hidden group-hover:block z-30">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-purple-300/60 px-2 py-1">
                      Escolha o tipo:
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('nps')}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium text-slate-800 dark:text-white hover:bg-purple-50 dark:hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                    >
                      <Sliders className="h-3.5 w-3.5 text-purple-600" />
                      <span>1. NPS (0 a 10)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('open')}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium text-slate-800 dark:text-white hover:bg-purple-50 dark:hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                    >
                      <FileText className="h-3.5 w-3.5 text-blue-600" />
                      <span>2. Resposta aberta</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('customer_data')}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium text-slate-800 dark:text-white hover:bg-purple-50 dark:hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                    >
                      <User className="h-3.5 w-3.5 text-emerald-600" />
                      <span>3. Dados do cliente</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('metrics')}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium text-slate-800 dark:text-white hover:bg-purple-50 dark:hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                    >
                      <Sliders className="h-3.5 w-3.5 text-amber-600" />
                      <span>4. Avaliar métricas</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('multiple_choice')}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium text-slate-800 dark:text-white hover:bg-purple-50 dark:hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                    >
                      <CheckSquare className="h-3.5 w-3.5 text-pink-600" />
                      <span>5. Múltipla escolha</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Editor da Pergunta Ativa */}
            {currentQ && (
              <div className="p-5 rounded-3xl bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10 shadow-xs space-y-4">
                {/* Cabeçalho da pergunta com seletor dinâmico de tipo e botões de mover / excluir */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-100 dark:border-white/10">
                  <div className="flex items-center gap-2.5">
                    <span className="h-6 w-6 rounded-full bg-purple-100 dark:bg-white/10 text-purple-900 dark:text-pink-300 text-xs font-bold flex items-center justify-center shrink-0">
                      #{activeQuestionIndex + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-purple-200 shrink-0">
                        Tipo de Pergunta:
                      </label>
                      <select
                        value={currentQ.type}
                        onChange={(e) => handleChangeQuestionType(activeQuestionIndex, e.target.value as QuestionType)}
                        className="h-8 px-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-[#200336] text-slate-900 dark:text-white border border-purple-200 dark:border-white/15 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                      >
                        <option value="nps" className="text-black dark:text-white dark:bg-[#200336]">
                          1. NPS (0 a 10)
                        </option>
                        <option value="customer_data" className="text-black dark:text-white dark:bg-[#200336]">
                          2. Dados do Cliente (Nome, WhatsApp, Email, Aniversário)
                        </option>
                        <option value="metrics" className="text-black dark:text-white dark:bg-[#200336]">
                          3. Avaliar Métricas (Estrelas / Expressões)
                        </option>
                        <option value="multiple_choice" className="text-black dark:text-white dark:bg-[#200336]">
                          4. Múltipla Escolha
                        </option>
                        <option value="open" className="text-black dark:text-white dark:bg-[#200336]">
                          5. Resposta Aberta (Texto Livre)
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleMoveQuestion(activeQuestionIndex, 'up')}
                      disabled={activeQuestionIndex === 0}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                      title="Mover para cima"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveQuestion(activeQuestionIndex, 'down')}
                      disabled={activeQuestionIndex === questions.length - 1}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                      title="Mover para baixo"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(activeQuestionIndex)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer ml-1"
                      title="Excluir pergunta"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Título da Pergunta */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-purple-200 mb-1">
                    Pergunta / Enunciado *
                  </label>
                  <input
                    type="text"
                    value={currentQ.title}
                    onChange={(e) => handleUpdateQuestion(activeQuestionIndex, { title: e.target.value })}
                    placeholder="Escreva a pergunta que o cliente irá ver..."
                    className="w-full h-10 px-3 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-purple-200 dark:border-white/15 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Descrição Auxiliar da Pergunta */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-purple-200 mb-1">
                    Subtítulo / Orientação (opcional)
                  </label>
                  <input
                    type="text"
                    value={currentQ.description || ''}
                    onChange={(e) => handleUpdateQuestion(activeQuestionIndex, { description: e.target.value })}
                    placeholder="Instruções breves para o cliente..."
                    className="w-full h-9 px-3 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-purple-200 dark:border-white/15 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* CONFIGURAÇÕES ESPECÍFICAS DE CADA TIPO */}
                {/* 1. NPS */}
                {currentQ.type === 'nps' && (
                  <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-white/5 border border-purple-100 dark:border-white/10 space-y-2.5">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentQ.explainScore ?? true}
                        onChange={(e) => handleUpdateQuestion(activeQuestionIndex, { explainScore: e.target.checked })}
                        className="h-4 w-4 rounded border-purple-300 text-purple-900 focus:ring-purple-500"
                      />
                      <span className="text-xs font-semibold text-slate-800 dark:text-purple-100">
                        Explicar a pontuação (caixa de comentário aberta)
                      </span>
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-purple-300/70 pl-6">
                      Se ativado, abre um campo de texto livre para o cliente justificar a sua nota.
                    </p>
                  </div>
                )}

                {/* 3. DADOS DO CLIENTE */}
                {currentQ.type === 'customer_data' && (
                  <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-white/5 border border-purple-100 dark:border-white/10 space-y-2.5">
                    <div className="text-xs font-bold text-slate-800 dark:text-purple-100">
                      Campos a solicitar ao cliente:
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-purple-200">
                        <input
                          type="checkbox"
                          checked={currentQ.collectName ?? true}
                          onChange={(e) => handleUpdateQuestion(activeQuestionIndex, { collectName: e.target.checked })}
                          className="h-4 w-4 rounded border-purple-300 text-purple-900 focus:ring-purple-500"
                        />
                        <span>Nome Completo</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-purple-200">
                        <input
                          type="checkbox"
                          checked={currentQ.collectPhone ?? true}
                          onChange={(e) => handleUpdateQuestion(activeQuestionIndex, { collectPhone: e.target.checked })}
                          className="h-4 w-4 rounded border-purple-300 text-purple-900 focus:ring-purple-500"
                        />
                        <span>Telefone / WhatsApp</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-purple-200">
                        <input
                          type="checkbox"
                          checked={currentQ.collectEmail ?? true}
                          onChange={(e) => handleUpdateQuestion(activeQuestionIndex, { collectEmail: e.target.checked })}
                          className="h-4 w-4 rounded border-purple-300 text-purple-900 focus:ring-purple-500"
                        />
                        <span>E-mail</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-purple-200">
                        <input
                          type="checkbox"
                          checked={currentQ.collectBirthday ?? true}
                          onChange={(e) => handleUpdateQuestion(activeQuestionIndex, { collectBirthday: e.target.checked })}
                          className="h-4 w-4 rounded border-purple-300 text-purple-900 focus:ring-purple-500"
                        />
                        <span>Data de Nascimento</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* 4. AVALIAR MÉTRICAS */}
                {currentQ.type === 'metrics' && (
                  <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-white/5 border border-purple-100 dark:border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-800 dark:text-purple-100">
                        Formato de Avaliação:
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuestion(activeQuestionIndex, { metricsFormat: 'emojis' })}
                          className={`px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                            currentQ.metricsFormat !== 'numbers'
                              ? 'bg-purple-900 text-white border-purple-900'
                              : 'bg-white dark:bg-white/10 text-slate-700 dark:text-white border-purple-200'
                          }`}
                        >
                          Expressões (1 a 5)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuestion(activeQuestionIndex, { metricsFormat: 'numbers' })}
                          className={`px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                            currentQ.metricsFormat === 'numbers'
                              ? 'bg-purple-900 text-white border-purple-900'
                              : 'bg-white dark:bg-white/10 text-slate-700 dark:text-white border-purple-200'
                          }`}
                        >
                          Números (1 a 5)
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-800 dark:text-purple-100">
                        Itens a Avaliar (até 10 itens):
                      </div>
                      {(currentQ.metrics || []).map((metric, mIdx) => (
                        <div key={mIdx} className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-400 w-4">{mIdx + 1}.</span>
                          <input
                            type="text"
                            value={metric}
                            onChange={(e) => {
                              const copy = [...(currentQ.metrics || [])]
                              copy[mIdx] = e.target.value
                              handleUpdateQuestion(activeQuestionIndex, { metrics: copy })
                            }}
                            placeholder="Nome do item (ex: Qualidade do Açaí)"
                            className="flex-1 h-8 px-2.5 rounded-lg text-xs bg-white dark:bg-white/10 border border-purple-200 dark:border-white/15 text-slate-900 dark:text-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const copy = [...(currentQ.metrics || [])]
                              copy.splice(mIdx, 1)
                              handleUpdateQuestion(activeQuestionIndex, { metrics: copy })
                            }}
                            disabled={(currentQ.metrics || []).length <= 1}
                            className="p-1 text-slate-400 hover:text-rose-500 disabled:opacity-30 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}

                      {(currentQ.metrics || []).length < 10 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const copy = [...(currentQ.metrics || []), 'Novo Item']
                            handleUpdateQuestion(activeQuestionIndex, { metrics: copy })
                          }}
                          className="h-8 text-xs font-bold text-purple-700 dark:text-pink-300 hover:bg-purple-100 dark:hover:bg-white/10"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          <span>Adicionar Item</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. MÚLTIPLA ESCOLHA */}
                {currentQ.type === 'multiple_choice' && (
                  <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-white/5 border border-purple-100 dark:border-white/10 space-y-3">
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-800 dark:text-purple-100">
                        Opções de Resposta (até 10 alternativas):
                      </div>
                      {(currentQ.choices || []).map((choice, cIdx) => (
                        <div key={cIdx} className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-400 w-4">{cIdx + 1}.</span>
                          <input
                            type="text"
                            value={choice}
                            onChange={(e) => {
                              const copy = [...(currentQ.choices || [])]
                              copy[cIdx] = e.target.value
                              handleUpdateQuestion(activeQuestionIndex, { choices: copy })
                            }}
                            placeholder="Texto da alternativa"
                            className="flex-1 h-8 px-2.5 rounded-lg text-xs bg-white dark:bg-white/10 border border-purple-200 dark:border-white/15 text-slate-900 dark:text-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const copy = [...(currentQ.choices || [])]
                              copy.splice(cIdx, 1)
                              handleUpdateQuestion(activeQuestionIndex, { choices: copy })
                            }}
                            disabled={(currentQ.choices || []).length <= 1}
                            className="p-1 text-slate-400 hover:text-rose-500 disabled:opacity-30 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}

                      {(currentQ.choices || []).length < 10 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const copy = [...(currentQ.choices || []), 'Nova Opção']
                            handleUpdateQuestion(activeQuestionIndex, { choices: copy })
                          }}
                          className="h-8 text-xs font-bold text-purple-700 dark:text-pink-300 hover:bg-purple-100 dark:hover:bg-white/10"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          <span>Adicionar Alternativa</span>
                        </Button>
                      )}
                    </div>

                    <div className="pt-2 border-t border-purple-100 dark:border-white/10">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentQ.allowOther ?? true}
                          onChange={(e) => handleUpdateQuestion(activeQuestionIndex, { allowOther: e.target.checked })}
                          className="h-4 w-4 rounded border-purple-300 text-purple-900 focus:ring-purple-500"
                        />
                        <span className="text-xs font-semibold text-slate-800 dark:text-purple-100">
                          Incluir opção aberta &quot;Outro (por favor especifique)&quot;
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA: LIVE PREVIEW (VISUALIZAÇÃO DO CLIENTE NO MENU) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-purple-200">
            <Eye className="h-3.5 w-3.5 text-purple-700 dark:text-pink-400" />
            <span>Visualização do Cliente no Menu</span>
          </div>

          {/* Moldura de Smartphone / Card Limpo */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-100 dark:bg-[#150220] border-2 border-purple-200 dark:border-white/15 shadow-md flex flex-col justify-between min-h-[460px]">
            <div className="space-y-4">
              {/* Barra de progresso do cliente */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-purple-300">
                  <span>Pergunta {activeQuestionIndex + 1} de {questions.length}</span>
                  <span>{Math.round(((activeQuestionIndex + 1) / questions.length) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                  <div
                    style={{ width: `${((activeQuestionIndex + 1) / questions.length) * 100}%` }}
                    className="h-full bg-purple-900 dark:bg-pink-500 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Título e Subtítulo da Pergunta Ativa */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {currentQ?.title || 'Pergunta de Exemplo'}
                </h3>
                {currentQ?.description && (
                  <p className="text-[11px] text-slate-500 dark:text-purple-300/80 mt-1">
                    {currentQ.description}
                  </p>
                )}
              </div>

              {/* Corpo da Pergunta */}
              <div className="pt-2">
                {/* 1. NPS PREVIEW */}
                {currentQ?.type === 'nps' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-11 gap-1">
                      {Array.from({ length: 11 }).map((_, n) => (
                        <button
                          key={n}
                          type="button"
                          className={`h-8 rounded-lg text-xs font-bold font-mono transition border ${
                            n >= 9
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-500 hover:text-white'
                              : n >= 7
                              ? 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-500 hover:text-white'
                              : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-500 hover:text-white'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium px-0.5">
                      <span>Pouco Provável (0)</span>
                      <span>Muito Provável (10)</span>
                    </div>

                    {currentQ.explainScore && (
                      <div className="pt-2">
                        <textarea
                          rows={2}
                          readOnly
                          placeholder="Conte-nos o motivo da sua nota..."
                          className="w-full p-2 rounded-xl text-xs bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10 text-slate-600 dark:text-slate-300 resize-none"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* 2. RESPOSTA ABERTA PREVIEW */}
                {currentQ?.type === 'open' && (
                  <div>
                    <textarea
                      rows={4}
                      readOnly
                      placeholder="Escreva a sua resposta aqui com total sinceridade..."
                      className="w-full p-3 rounded-2xl text-xs bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10 text-slate-600 dark:text-slate-300 resize-none"
                    />
                  </div>
                )}

                {/* 3. DADOS DO CLIENTE PREVIEW */}
                {currentQ?.type === 'customer_data' && (
                  <div className="space-y-2">
                    {currentQ.collectName && (
                      <input
                        type="text"
                        readOnly
                        placeholder="Nome Completo"
                        className="w-full h-8 px-3 rounded-xl text-xs bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10 text-slate-400"
                      />
                    )}
                    {currentQ.collectPhone && (
                      <input
                        type="text"
                        readOnly
                        placeholder="Telemóvel / WhatsApp"
                        className="w-full h-8 px-3 rounded-xl text-xs bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10 text-slate-400"
                      />
                    )}
                    {currentQ.collectEmail && (
                      <input
                        type="text"
                        readOnly
                        placeholder="E-mail"
                        className="w-full h-8 px-3 rounded-xl text-xs bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10 text-slate-400"
                      />
                    )}
                    {currentQ.collectBirthday && (
                      <input
                        type="text"
                        readOnly
                        placeholder="Data de Nascimento (DD/MM/AAAA)"
                        className="w-full h-8 px-3 rounded-xl text-xs bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10 text-slate-400"
                      />
                    )}
                  </div>
                )}

                {/* 4. AVALIAR MÉTRICAS PREVIEW */}
                {currentQ?.type === 'metrics' && (
                  <div className="space-y-2.5">
                    {(currentQ.metrics || []).map((m, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10 flex items-center justify-between gap-2"
                      >
                        <span className="text-xs font-medium text-slate-800 dark:text-white truncate">
                          {m}
                        </span>

                        <div className="flex items-center gap-1 shrink-0">
                          {currentQ.metricsFormat === 'numbers' ? (
                            [1, 2, 3, 4, 5].map((num) => (
                              <span
                                key={num}
                                className="h-6 w-6 rounded-md bg-purple-50 dark:bg-white/10 text-purple-900 dark:text-pink-300 text-[11px] font-bold flex items-center justify-center border border-purple-200 dark:border-white/15"
                              >
                                {num}
                              </span>
                            ))
                          ) : (
                            ['😠', '🙁', '😐', '🙂', '😍'].map((emoji, eIdx) => (
                              <span key={eIdx} className="text-base cursor-default opacity-80 hover:opacity-100">
                                {emoji}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 5. MÚLTIPLA ESCOLHA PREVIEW */}
                {currentQ?.type === 'multiple_choice' && (
                  <div className="space-y-2">
                    {(currentQ.choices || []).map((ch, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10 flex items-center gap-2.5 text-xs text-slate-700 dark:text-purple-200"
                      >
                        <div className="h-4 w-4 rounded-full border border-purple-300 dark:border-white/20" />
                        <span>{ch}</span>
                      </div>
                    ))}
                    {currentQ.allowOther && (
                      <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-dashed border-purple-200 dark:border-white/10 flex items-center gap-2.5 text-xs text-slate-400">
                        <div className="h-4 w-4 rounded-full border border-dashed border-purple-300" />
                        <span>Outro (especifique...)</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Rodapé do preview com navegação de exemplo do cliente */}
            <div className="pt-4 border-t border-purple-100 dark:border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">&lt; Voltar</span>
              <span className="h-7 px-3 rounded-lg bg-purple-900 text-white text-[11px] font-bold flex items-center justify-center">
                Avançar &gt;
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
