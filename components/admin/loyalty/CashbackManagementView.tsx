'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import ConfirmActionDialog from '@/components/ui/ConfirmActionDialog'
import { ChevronDown, RefreshCw, Trash2, X } from 'lucide-react'

type SubTab = 'SETTINGS' | 'STORES' | 'REWARDS' | 'CAMPAIGNS' | 'CUSTOMERS' | 'VOUCHERS' | 'CLEARING' | 'PUSH'

interface OverviewData {
  stats: {
    total_customers: number
    push_enabled_customers?: number
    total_points: number
    active_vouchers: number
    redeemed_vouchers: number
    pending_clearing_eur: number
  }
  referral: {
    enabled: boolean
    bonus_points: number
  }
  campaigns_config: {
    enabled: boolean
    default_multiplier: number
  }
  birthday_config?: {
    enabled: boolean
    bonus_points: number
  }
  receipt_config?: {
    show_points_on_receipt: boolean
  }
  stores_config?: {
    disabled_tenant_ids: string[]
  }
  content_config?: {
    faq: Array<{ id: string; question: string; answer: string }>
    terms_text: string
    privacy_text: string
    updated_at: string | null
  }
  presentation_config?: {
    scenes: Array<{
      index: number
      title: string
      subtitle: string
      video_url: string | null
      title_font?: string
      title_size?: number
      title_color?: string
      subtitle_font?: string
      subtitle_size?: number
      subtitle_color?: string
    }>
  }
  points_rate_config?: {
    points_per_euro: number
  }
  push_logs?: Array<{
    id: string
    tenant_id: string | null
    title: string
    body: string
    image_url?: string | null
    sent_count: number
    failed_count: number
    total_targeted: number
    sent_by_name: string | null
    tenant_name: string | null
    created_at: string
  }>
  catalog_products: Array<{
    id: string
    name: string
    description: string | null
    preco_base: number
    weight_grams: number | null
    image_url: string | null
    category_name: string | null
    menu_name: string | null
  }>
  rewards: Array<{
    id: string
    name: string
    description: string | null
    points_cost: number
    category: string
    image_url: string | null
    tenant_id: string | null
    tenant_name: string | null
    active: boolean
    total_redemptions: number
  }>
  campaigns: Array<{
    id: string
    campaign_type?: 'MULTIPLIER' | 'HIGHLIGHT' | 'AD' | string
    title: string
    subtitle?: string | null
    description: string | null
    content?: string | null
    banner_url?: string | null
    link_url?: string | null
    multiplier: number
    start_date: string
    end_date: string
    tenant_id: string | null
    tenant_name: string | null
    active: boolean
  }>
  customers: Array<{
    id: string
    name: string
    username: string
    phone: string
    email: string | null
    nif: string | null
    points_balance: number
    referral_code: string
    referrals_count: number
    tenant_id: string | null
    tenant_name: string | null
    created_at: string
  }>
  vouchers: Array<{
    id: string
    voucher_code: string
    status: string
    expires_at: string
    redeemed_at: string | null
    created_at: string
    customer_name: string
    customer_username: string
    customer_phone: string
    reward_name: string
    points_cost: number
    tenant_name: string | null
  }>
  clearing: Array<{
    id: string
    cost_amount: number
    status: string
    settled_at: string | null
    created_at: string
    voucher_code: string
    issuing_tenant_name: string | null
    redeeming_tenant_name: string | null
  }>
  tenants: Array<{
    id: string
    name: string
    city: string | null
    is_headquarters: boolean
  }>
}

export default function CashbackManagementView() {
  const { authFetch } = useAuthStore()
  const [subTab, setSubTab] = useState<SubTab>('SETTINGS')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<OverviewData | null>(null)

  // Settings form
  const [refEnabled, setRefEnabled] = useState(true)
  const [refBonus, setRefBonus] = useState('10')
  const [savingSettings, setSavingSettings] = useState(false)

  // Campaigns master config (igual ao Convidar Amigos)
  const [campaignsEnabled, setCampaignsEnabled] = useState(true)
  const [defaultMultiplier, setDefaultMultiplier] = useState('2')
  const [savingCampaignsConfig, setSavingCampaignsConfig] = useState(false)

  // New Reward form
  const [selectedCatalogId, setSelectedCatalogId] = useState('')
  const [catalogDropdownOpen, setCatalogDropdownOpen] = useState(false)
  const [catalogSearch, setCatalogSearch] = useState('')
  const catalogDropdownRef = useRef<HTMLDivElement | null>(null)
  const [rewardImageUrl, setRewardImageUrl] = useState<string | null>(null)
  const [rewardSuggestedHint, setRewardSuggestedHint] = useState<string | null>(null)
  const [rewardName, setRewardName] = useState('')
  const [rewardDesc, setRewardDesc] = useState('')
  const [rewardPoints, setRewardPoints] = useState('')
  const [rewardCategory, setRewardCategory] = useState('COPOS')
  const [rewardTenantId, setRewardTenantId] = useState('')
  const [savingReward, setSavingReward] = useState(false)
  const [rewardSourceMode, setRewardSourceMode] = useState<'CATALOG' | 'CUSTOM'>('CATALOG')
  const [uploadingRewardImg, setUploadingRewardImg] = useState(false)

  // New Campaign / Highlight / Ad form
  const [campType, setCampType] = useState<'MULTIPLIER' | 'HIGHLIGHT' | 'AD'>('MULTIPLIER')
  const [campTitle, setCampTitle] = useState('')
  const [campSubtitle, setCampSubtitle] = useState('')
  const [campDesc, setCampDesc] = useState('')
  const [campBannerUrl, setCampBannerUrl] = useState('')
  const [campLinkUrl, setCampLinkUrl] = useState('')
  const [uploadingCampImg, setUploadingCampImg] = useState(false)
  const [campMultiplier, setCampMultiplier] = useState('2')
  const [campStart, setCampStart] = useState(() => new Date().toISOString().slice(0, 10))
  const [campEnd, setCampEnd] = useState(
    () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  )
  const [campTenantId, setCampTenantId] = useState('')
  const [savingCampaign, setSavingCampaign] = useState(false)

  // Customers search, filters & management modals
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerFiltersOpen, setCustomerFiltersOpen] = useState(false)
  const [customerStoreFilter, setCustomerStoreFilter] = useState('')
  const [customerBalanceFilter, setCustomerBalanceFilter] = useState<'ALL' | 'WITH_POINTS' | 'ZERO'>('ALL')
  const [customerReferralsFilter, setCustomerReferralsFilter] = useState<'ALL' | 'WITH_REFERRALS'>('ALL')
  const [customerSortBy, setCustomerSortBy] = useState<
    'POINTS_DESC' | 'NAME_ASC' | 'NAME_DESC' | 'NEWEST' | 'OLDEST' | 'REFERRALS_DESC'
  >('POINTS_DESC')
  const [customerPage, setCustomerPage] = useState(1)
  const [customerPageSize, setCustomerPageSize] = useState(25)
  const [editingCustomer, setEditingCustomer] = useState<OverviewData['customers'][number] | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
    phone: '',
    email: '',
    nif: '',
    tenant_id: '',
    new_password: '',
  })
  const [savingCustomer, setSavingCustomer] = useState(false)

  const [pointsCustomer, setPointsCustomer] = useState<OverviewData['customers'][number] | null>(null)
  const [pointsMode, setPointsMode] = useState<'ADD' | 'REMOVE'>('ADD')
  const [pointsAmount, setPointsAmount] = useState('')
  const [pointsReason, setPointsReason] = useState('')
  const [savingPoints, setSavingPoints] = useState(false)

  const [deletingCustomer, setDeletingCustomer] = useState<OverviewData['customers'][number] | null>(null)
  const [deletingCustomerLoading, setDeletingCustomerLoading] = useState(false)

  // Push broadcast state
  const [pushTitle, setPushTitle] = useState('')
  const [pushBody, setPushBody] = useState('')
  const [pushImageUrl, setPushImageUrl] = useState('')
  const [uploadingPushImg, setUploadingPushImg] = useState(false)
  const [pushTenantId, setPushTenantId] = useState('')
  const [sendingPush, setSendingPush] = useState(false)
  const [resendingPushId, setResendingPushId] = useState<string | null>(null)
  const [editingPush, setEditingPush] = useState<
    NonNullable<OverviewData['push_logs']>[number] | null
  >(null)
  const [editPushForm, setEditPushForm] = useState({
    title: '',
    body: '',
    image_url: '',
    tenant_id: '',
  })
  const [savingEditPush, setSavingEditPush] = useState(false)

  // Birthday & Receipt settings
  const [pointsPerEuro, setPointsPerEuro] = useState('1')
  const [savingPointsRate, setSavingPointsRate] = useState(false)
  const [birthdayEnabled, setBirthdayEnabled] = useState(false)
  const [birthdayBonus, setBirthdayBonus] = useState('25')
  const [savingBirthday, setSavingBirthday] = useState(false)
  const [showPointsOnReceipt, setShowPointsOnReceipt] = useState(true)
  const [savingReceiptCfg, setSavingReceiptCfg] = useState(false)
  const [disabledStoreIds, setDisabledStoreIds] = useState<string[]>([])
  const [savingStoreToggleId, setSavingStoreToggleId] = useState<string | null>(null)
  const [faqItems, setFaqItems] = useState<Array<{ id: string; question: string; answer: string }>>([])
  const [termsText, setTermsText] = useState('')
  const [privacyText, setPrivacyText] = useState('')
  const [savingContent, setSavingContent] = useState<'FAQ' | 'TERMS' | 'PRIVACY' | null>(null)

  const DEFAULT_PRESENTATION_VIDEOS = useMemo(
    () => [
      '/videos/presentation/hero_revealing_cup.mp4',
      '/videos/presentation/hero_orbiting_cup.mp4',
      '/videos/presentation/hero_gliding_texture.mp4',
      '/videos/presentation/hero_cup_rotation.mp4',
    ],
    []
  )

  const DEFAULT_PRESENTATION_SCENES = useMemo(
    () => [
      {
        index: 0,
        title: 'AÇAÍ NÃO\nSE EXPLICA',
        subtitle: 'A essência autêntica e cremosa que conquistou Portugal.',
        video_url: null as string | null,
        title_font: 'system',
        title_size: 38,
        title_color: '#FFFFFF',
        subtitle_font: 'system',
        subtitle_size: 16,
        subtitle_color: '#F5E8FA',
      },
      {
        index: 1,
        title: 'EXPERIMENTA',
        subtitle: 'No copo, na taça ou para levar para casa. O melhor sabor todos os dias.',
        video_url: null as string | null,
        title_font: 'system',
        title_size: 38,
        title_color: '#F472B6',
        subtitle_font: 'system',
        subtitle_size: 16,
        subtitle_color: '#F5E8FA',
      },
      {
        index: 2,
        title: 'APAIXONA',
        subtitle: 'Ingredientes selecionados e combinações irresistíveis.',
        video_url: null as string | null,
        title_font: 'system',
        title_size: 38,
        title_color: '#E879F9',
        subtitle_font: 'system',
        subtitle_size: 16,
        subtitle_color: '#F5E8FA',
      },
      {
        index: 3,
        title: 'E REPETE',
        subtitle: 'Acumula pontos a cada pedido no balcão e troca por açaí grátis.',
        video_url: null as string | null,
        title_font: 'system',
        title_size: 38,
        title_color: '#F472B6',
        subtitle_font: 'system',
        subtitle_size: 16,
        subtitle_color: '#F5E8FA',
      },
    ],
    []
  )
  const [presentationOpen, setPresentationOpen] = useState(false)
  const [presentationSceneIdx, setPresentationSceneIdx] = useState(0)
  const [presentationScenes, setPresentationScenes] = useState<
    Array<{
      index: number
      title: string
      subtitle: string
      video_url: string | null
      title_font: string
      title_size: number
      title_color: string
      subtitle_font: string
      subtitle_size: number
      subtitle_color: string
    }>
  >(() => DEFAULT_PRESENTATION_SCENES)
  const [uploadingPresentationVideo, setUploadingPresentationVideo] = useState(false)
  const [savingPresentation, setSavingPresentation] = useState(false)

  // Edit Reward modal
  const [editingReward, setEditingReward] = useState<OverviewData['rewards'][number] | null>(null)
  const [editRewardForm, setEditRewardForm] = useState({
    name: '',
    description: '',
    points_cost: '',
    category: 'COPOS',
    tenant_id: '',
    image_url: '',
  })
  const [savingEditReward, setSavingEditReward] = useState(false)

  // Edit Campaign modal
  const [editingCampaign, setEditingCampaign] = useState<OverviewData['campaigns'][number] | null>(null)
  const [editCampaignForm, setEditCampaignForm] = useState({
    campaign_type: 'MULTIPLIER' as 'MULTIPLIER' | 'HIGHLIGHT' | 'AD',
    title: '',
    subtitle: '',
    description: '',
    content: '',
    banner_url: '',
    link_url: '',
    multiplier: '2',
    start_date: '',
    end_date: '',
    tenant_id: '',
  })
  const [savingEditCampaign, setSavingEditCampaign] = useState(false)

  // Customer Statement (Extrato) modal
  const [statementCustomer, setStatementCustomer] = useState<OverviewData['customers'][number] | null>(null)
  const [statementLoading, setStatementLoading] = useState(false)
  const [statementTransactions, setStatementTransactions] = useState<
    Array<{
      id: string
      type: 'CREDIT' | 'DEBIT'
      points: number
      description: string
      status: string
      created_at: string
      tenant_name: string | null
    }>
  >([])
  const [statementTypeFilter, setStatementTypeFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL')
  const [statementPeriodFilter, setStatementPeriodFilter] = useState<'ALL' | '30D' | '90D'>('ALL')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch('/api/loyalty/admin/overview')
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Erro ao carregar dados de cashback.')
        return
      }
      setData(json)
      setRefEnabled(Boolean(json?.referral?.enabled))
      setRefBonus(String(json?.referral?.bonus_points ?? 10))
      const campCfgEnabled = json?.campaigns_config?.enabled !== false
      const campCfgMult = String(json?.campaigns_config?.default_multiplier ?? 2)
      setCampaignsEnabled(campCfgEnabled)
      setDefaultMultiplier(campCfgMult)
      setCampMultiplier(campCfgMult)
      setBirthdayEnabled(Boolean(json?.birthday_config?.enabled))
      setBirthdayBonus(String(json?.birthday_config?.bonus_points ?? 25))
      setPointsPerEuro(String(json?.points_rate_config?.points_per_euro ?? 1))
      setShowPointsOnReceipt(json?.receipt_config?.show_points_on_receipt !== false)
      setDisabledStoreIds(
        Array.isArray(json?.stores_config?.disabled_tenant_ids)
          ? json.stores_config.disabled_tenant_ids
          : []
      )
      setFaqItems(
        Array.isArray(json?.content_config?.faq) && json.content_config.faq.length > 0
          ? json.content_config.faq
          : [
            {
              id: 'faq-1',
              question: 'Qual a validade dos pontos e vouchers?',
              answer:
                'Os pontos acumulados não expiram enquanto a conta estiver ativa. Após trocar pontos por um prémio, o voucher gerado tem validade de 24 horas para apresentação ao balcão.',
            },
            {
              id: 'faq-2',
              question: 'Como ganho pontos nas compras?',
              answer:
                'Mostra o teu código QR de Cashback no balcão ao pagar o teu pedido. Por cada euro em compras elegíveis acumulas pontos automaticamente.',
            },
            {
              id: 'faq-3',
              question: 'Como resgatar um prémio?',
              answer:
                'Na aba Prémios, escolhe um prémio disponível para o teu saldo, toca em Trocar Pontos e apresenta o voucher gerado ao colaborador no balcão.',
            },
          ]
      )
      setTermsText(
        typeof json?.content_config?.terms_text === 'string' &&
          json.content_config.terms_text.trim().length > 0
          ? json.content_config.terms_text
          : [
              'Bem-vindo ao programa oficial de fidelidade Açaí da Rose. Ao criar a tua conta e utilizar a nossa aplicação, concordas com as regras abaixo.',
              '',
              '1. Acumulação de Pontos',
              'Os pontos são acumulados nas tuas compras nas lojas físicas Açaí da Rose participantes em Portugal. A regra base atribui pontos por cada euro gasto, podendo existir campanhas promocionais temporárias com multiplicadores.',
              '',
              '2. Identificação no Balcão',
              'Para somar pontos, apresenta o teu QR Code dinâmico ou indica o teu número de telemóvel ao operador de caixa antes da finalização do pagamento.',
              '',
              '3. Resgate de Prémios e Vouchers',
              'Os pontos acumulados podem ser trocados por prémios disponíveis no catálogo da app. Após o resgate, é gerado um voucher válido por 24 horas. Caso o voucher não seja utilizado dentro deste prazo, os pontos são devolvidos automaticamente para a tua conta.',
              '',
              '4. Validade e Transferência',
              'Os pontos são pessoais, intransferíveis e não convertíveis em dinheiro. Contas inativas por mais de 12 meses consecutivos podem ter os pontos expirados mediante aviso prévio.',
              '',
              '5. Programa Convidar Amigos',
              'Quando ativo, ao partilhar o teu código de convite com novos clientes, ambos recebem bónus de pontos assim que o convidado completar o registo e realizar a primeira compra elegível.',
              '',
              '6. Cancelamento e Modificações',
              'A Açaí da Rose reserva-se o direito de atualizar o catálogo de prémios ou alterar estes termos mediante aviso prévio razoável na aplicação. Podes cancelar a tua conta a qualquer momento na secção Perfil.',
            ].join('\n')
      )
      setPrivacyText(
        typeof json?.content_config?.privacy_text === 'string' &&
          json.content_config.privacy_text.trim().length > 0
          ? json.content_config.privacy_text
          : [
              'A Açaí da Rose valoriza a tua privacidade e protege os teus dados pessoais em conformidade com o Regulamento Geral sobre a Proteção de Dados (RGPD) em vigor em Portugal e na União Europeia.',
              '',
              '1. Dados Recolhidos',
              'Recolhemos apenas os dados estritamente necessários para a gestão da tua conta de fidelidade: nome completo, @utilizador, número de telemóvel, email (opcional), NIF (opcional para faturação), data de nascimento (opcional para oferta de aniversário) e histórico de pontos e vouchers.',
              '',
              '2. Finalidade do Tratamento',
              'Os teus dados são utilizados exclusivamente para: (a) gerir a tua conta e saldo de pontos; (b) validar vouchers de resgate nas nossas lojas; (c) identificar a loja mais próxima quando autorizas a localização; e (d) enviar notificações de pontos ou ofertas se consentires expressamente.',
              '',
              '3. Segurança e Armazenamento',
              'As palavras-passe são armazenadas com encriptação bcrypt irreversível. Os tokens de sessão ficam guardados no cofre seguro do teu dispositivo (Keychain no iOS / Keystore no Android). Nunca vendemos nem partilhamos os teus dados com terceiros para fins comerciais.',
              '',
              '4. Os Teus Direitos (RGPD)',
              'Podes a qualquer momento aceder, retificar os teus dados em Perfil → Editar Dados, revogar consentimentos de notificações ou solicitar a portabilidade dos teus dados.',
              '',
              '5. Direito ao Esquecimento (Eliminação)',
              'Podes eliminar integralmente a tua conta a qualquer momento diretamente na app (Perfil → Eliminar Minha Conta) com remoção e anonimização imediata dos teus registos identificáveis.',
            ].join('\n')
      )
      const savedScenes = Array.isArray(json?.presentation_config?.scenes)
        ? json.presentation_config.scenes
        : []
      if (savedScenes.length > 0) {
        setPresentationScenes(
          savedScenes.map((match: any, idx: number) => {
            const def = DEFAULT_PRESENTATION_SCENES[idx % DEFAULT_PRESENTATION_SCENES.length]
            return {
              index: idx,
              title: match?.title ? String(match.title) : def.title,
              subtitle: match?.subtitle ? String(match.subtitle) : def.subtitle,
              video_url: match?.video_url ? String(match.video_url) : null,
              title_font: match?.title_font ? String(match.title_font) : def.title_font,
              title_size: Number.isFinite(Number(match?.title_size))
                ? Number(match.title_size)
                : def.title_size,
              title_color: match?.title_color ? String(match.title_color) : def.title_color,
              subtitle_font: match?.subtitle_font ? String(match.subtitle_font) : def.subtitle_font,
              subtitle_size: Number.isFinite(Number(match?.subtitle_size))
                ? Number(match.subtitle_size)
                : def.subtitle_size,
              subtitle_color: match?.subtitle_color
                ? String(match.subtitle_color)
                : def.subtitle_color,
            }
          })
        )
      } else {
        setPresentationScenes(DEFAULT_PRESENTATION_SCENES)
      }
    } catch {
      toast.error('Erro de ligação ao carregar painel de cashback.')
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!catalogDropdownOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (catalogDropdownRef.current && !catalogDropdownRef.current.contains(e.target as Node)) {
        setCatalogDropdownOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCatalogDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [catalogDropdownOpen])

  const selectedCatalogProduct = useMemo(
    () => (data?.catalog_products || []).find((p) => p.id === selectedCatalogId) || null,
    [data?.catalog_products, selectedCatalogId]
  )

  const groupedCatalogProducts = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase()
    const items = (data?.catalog_products || []).filter((p) => {
      if (!q) return true
      return [p.name, p.category_name, p.menu_name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })

    const isAcaiItem = (p: OverviewData['catalog_products'][number]) => {
      const hay = `${p.menu_name || ''} ${p.category_name || ''} ${p.name}`.toLowerCase()
      return /(açaí|acai|copo|sensação|sensacao|família|familia|taça|taca)/.test(hay)
    }

    const acai = items.filter(isAcaiItem)
    const others = items.filter((p) => !isAcaiItem(p))

    const groups: Array<{ label: string; items: OverviewData['catalog_products'] }> = []
    if (acai.length > 0) groups.push({ label: 'Açaí da Rose', items: acai })
    if (others.length > 0) groups.push({ label: 'Lanches & Outros', items: others })
    return groups
  }, [data?.catalog_products, catalogSearch])

  const handleSaveSettings = async (overrideEnabled?: boolean) => {
    const nextEnabled = overrideEnabled !== undefined ? overrideEnabled : refEnabled
    setSavingSettings(true)
    try {
      const res = await authFetch('/api/loyalty/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: nextEnabled,
          bonus_points: Number(refBonus) || 0,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Erro ao guardar configurações.')
        return
      }
      setRefEnabled(Boolean(json.referral?.enabled))
      setRefBonus(String(json.referral?.bonus_points ?? 10))
      toast.success('Configurações de Cashback atualizadas.')
    } catch {
      toast.error('Erro ao guardar configurações.')
    } finally {
      setSavingSettings(false)
    }
  }

  const handleSaveCampaignsConfig = async (overrideEnabled?: boolean) => {
    const nextEnabled = overrideEnabled !== undefined ? overrideEnabled : campaignsEnabled
    setSavingCampaignsConfig(true)
    try {
      const res = await authFetch('/api/loyalty/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaigns: {
            enabled: nextEnabled,
            default_multiplier: Number(defaultMultiplier) || 2,
          },
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Erro ao guardar configuração de campanhas.')
        return
      }
      const nextMult = String(json.campaigns?.default_multiplier ?? 2)
      setCampaignsEnabled(Boolean(json.campaigns?.enabled))
      setDefaultMultiplier(nextMult)
      setCampMultiplier(nextMult)
      toast.success('Configuração de Campanhas atualizada.')
    } catch {
      toast.error('Erro ao guardar configuração de campanhas.')
    } finally {
      setSavingCampaignsConfig(false)
    }
  }

  const suggestPointsFromPrice = (price: number): number => {
    const safePrice = Number(price) || 0
    if (safePrice <= 0) return 100
    // 20 pontos por 1 € (equivalente a 5% de retorno em cashback; ex: 6,50 € -> 130 pts)
    return Math.max(10, Math.round(safePrice * 20))
  }

  const inferRewardCategory = (name: string, weightGrams?: number | null): string => {
    const lower = name.toLowerCase()
    if (lower.includes('taça') || lower.includes('taca') || lower.includes('família') || lower.includes('familia') || lower.includes('sensação') || (weightGrams && weightGrams >= 700)) {
      return 'POTES'
    }
    if (lower.includes('adicional') || lower.includes('calda') || lower.includes('extra')) {
      return 'ADICIONAIS'
    }
    return 'COPOS'
  }

  const handleSelectCatalogProduct = (productId: string) => {
    setSelectedCatalogId(productId)
    if (!productId) {
      setRewardImageUrl(null)
      setRewardSuggestedHint(null)
      return
    }
    const product = (data?.catalog_products || []).find((p) => p.id === productId)
    if (!product) return

    const suggested = suggestPointsFromPrice(product.preco_base)
    setRewardName(product.name)
    setRewardDesc(product.description || '')
    setRewardPoints(String(suggested))
    setRewardCategory(inferRewardCategory(product.name, product.weight_grams))
    setRewardImageUrl(product.image_url || null)
    setRewardSuggestedHint(
      `Preço no cardápio: ${Number(product.preco_base).toFixed(2).replace('.', ',')} € — sugestão: ${suggested} pts (20 pts/€). Pode ajustar antes de adicionar.`
    )
  }

  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rewardName.trim() || !Number(rewardPoints)) {
      toast.error('Indica o nome e o custo em pontos.')
      return
    }
    setSavingReward(true)
    try {
      const res = await authFetch('/api/loyalty/admin/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_container_id: selectedCatalogId || null,
          name: rewardName.trim(),
          description: rewardDesc.trim() || null,
          points_cost: Number(rewardPoints),
          category: rewardCategory,
          image_url: rewardImageUrl || null,
          tenant_id: rewardTenantId || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Erro ao criar prémio.')
        return
      }
      toast.success('Prémio criado com sucesso.')
      setSelectedCatalogId('')
      setRewardImageUrl(null)
      setRewardSuggestedHint(null)
      setRewardName('')
      setRewardDesc('')
      setRewardPoints('')
      setRewardTenantId('')
      await loadData()
    } finally {
      setSavingReward(false)
    }
  }

  const handleToggleReward = async (id: string, active: boolean) => {
    const res = await authFetch('/api/loyalty/admin/rewards', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active }),
    })
    if (res.ok) {
      toast.success(active ? 'Prémio ativado.' : 'Prémio pausado.')
      await loadData()
    } else {
      toast.error('Erro ao atualizar prémio.')
    }
  }

  const handleDeleteReward = async (id: string) => {
    const res = await authFetch(`/api/loyalty/admin/rewards?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    const json = await res.json()
    if (res.ok) {
      toast.success(json?.message || 'Prémio removido.')
      await loadData()
    } else {
      toast.error(json?.error || 'Erro ao remover prémio.')
    }
  }

  const handleUploadCampaignImage = async (file: File, onDone: (url: string) => void) => {
    setUploadingCampImg(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await authFetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json?.url) {
        toast.error(json?.error || 'Erro ao carregar imagem.')
        return
      }
      onDone(json.url)
      toast.success('Imagem carregada.')
    } catch {
      toast.error('Erro de ligação ao carregar imagem.')
    } finally {
      setUploadingCampImg(false)
    }
  }

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!campTitle.trim()) {
      toast.error('Indica o título.')
      return
    }
    setSavingCampaign(true)
    try {
      const res = await authFetch('/api/loyalty/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_type: campType,
          title: campTitle.trim(),
          subtitle: campSubtitle.trim() || null,
          description: campSubtitle.trim() || campDesc.trim() || null,
          content: campDesc.trim() || null,
          banner_url: campBannerUrl.trim() || null,
          link_url: campLinkUrl.trim() || null,
          multiplier: campType === 'MULTIPLIER' ? Number(campMultiplier) || 2 : 1,
          start_date: `${campStart}T00:00:00Z`,
          end_date: `${campEnd}T23:59:59Z`,
          tenant_id: campTenantId || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Erro ao criar item.')
        return
      }
      toast.success('Publicado com sucesso.')
      setCampTitle('')
      setCampSubtitle('')
      setCampDesc('')
      setCampBannerUrl('')
      setCampLinkUrl('')
      setCampTenantId('')
      await loadData()
    } finally {
      setSavingCampaign(false)
    }
  }

  const handleToggleCampaign = async (id: string, active: boolean) => {
    const res = await authFetch('/api/loyalty/admin/campaigns', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active }),
    })
    if (res.ok) {
      toast.success(active ? 'Campanha ativada.' : 'Campanha pausada.')
      await loadData()
    } else {
      toast.error('Erro ao atualizar campanha.')
    }
  }

  const handleDeleteCampaign = async (id: string) => {
    const res = await authFetch(`/api/loyalty/admin/campaigns?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      toast.success('Campanha removida.')
      await loadData()
    } else {
      toast.error('Erro ao remover campanha.')
    }
  }

  const handleSettleClearing = async (id: string) => {
    const res = await authFetch('/api/loyalty/admin/clearing', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      toast.success('Compensação marcada como liquidada em royalties.')
      await loadData()
    } else {
      toast.error('Erro ao liquidar compensação.')
    }
  }

  const openEditCustomer = (c: OverviewData['customers'][number]) => {
    setEditingCustomer(c)
    setEditForm({
      name: c.name || '',
      username: c.username || '',
      phone: c.phone || '',
      email: c.email || '',
      nif: c.nif || '',
      tenant_id: c.tenant_id || '',
      new_password: '',
    })
  }

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCustomer) return
    setSavingCustomer(true)
    try {
      const res = await authFetch('/api/loyalty/admin/customers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCustomer.id,
          name: editForm.name,
          username: editForm.username,
          phone: editForm.phone,
          email: editForm.email,
          nif: editForm.nif,
          tenant_id: editForm.tenant_id || null,
          new_password: editForm.new_password || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Erro ao atualizar dados do cliente.')
        return
      }
      toast.success(
        json?.password_updated
          ? 'Dados e palavra-passe do cliente atualizados.'
          : 'Dados do cliente atualizados.'
      )
      setEditingCustomer(null)
      await loadData()
    } catch {
      toast.error('Erro de ligação ao guardar cliente.')
    } finally {
      setSavingCustomer(false)
    }
  }

  const openPointsModal = (c: OverviewData['customers'][number]) => {
    setPointsCustomer(c)
    setPointsMode('ADD')
    setPointsAmount('')
    setPointsReason('')
  }

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pointsCustomer) return
    const qty = Math.round(Number(pointsAmount))
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error('Indica uma quantidade de pontos maior que zero.')
      return
    }
    const delta = pointsMode === 'ADD' ? qty : -qty
    setSavingPoints(true)
    try {
      const res = await authFetch('/api/loyalty/admin/customers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pointsCustomer.id,
          action: 'ADJUST_POINTS',
          points_delta: delta,
          reason: pointsReason.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Erro ao ajustar pontos.')
        return
      }
      toast.success(
        pointsMode === 'ADD'
          ? `+${qty} pts creditados em ${pointsCustomer.name}.`
          : `-${qty} pts removidos de ${pointsCustomer.name}.`
      )
      setPointsCustomer(null)
      await loadData()
    } catch {
      toast.error('Erro de ligação ao ajustar pontos.')
    } finally {
      setSavingPoints(false)
    }
  }

  const handleDeleteCustomer = async () => {
    if (!deletingCustomer) return
    setDeletingCustomerLoading(true)
    try {
      const res = await authFetch(
        `/api/loyalty/admin/customers?id=${encodeURIComponent(deletingCustomer.id)}`,
        { method: 'DELETE' }
      )
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Erro ao remover cliente.')
        return
      }
      toast.success('Cliente removido com sucesso.')
      setDeletingCustomer(null)
      await loadData()
    } catch {
      toast.error('Erro de ligação ao remover cliente.')
    } finally {
      setDeletingCustomerLoading(false)
    }
  }

  const activeCustomerFiltersCount =
    (customerStoreFilter ? 1 : 0) +
    (customerBalanceFilter !== 'ALL' ? 1 : 0) +
    (customerReferralsFilter !== 'ALL' ? 1 : 0) +
    (customerSortBy !== 'POINTS_DESC' ? 1 : 0)

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase()
    const list = (data?.customers || []).filter((c) => {
      if (q) {
        const matches = [c.name, c.username, c.phone, c.email, c.referral_code]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
        if (!matches) return false
      }
      if (customerStoreFilter && c.tenant_id !== customerStoreFilter) return false
      if (customerBalanceFilter === 'WITH_POINTS' && (Number(c.points_balance) || 0) <= 0) {
        return false
      }
      if (customerBalanceFilter === 'ZERO' && (Number(c.points_balance) || 0) > 0) {
        return false
      }
      if (customerReferralsFilter === 'WITH_REFERRALS' && (Number(c.referrals_count) || 0) <= 0) {
        return false
      }
      return true
    })

    return [...list].sort((a, b) => {
      if (customerSortBy === 'NEWEST') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      if (customerSortBy === 'OLDEST') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
      if (customerSortBy === 'NAME_ASC') {
        return (a.name || '').localeCompare(b.name || '', 'pt', { sensitivity: 'base' })
      }
      if (customerSortBy === 'NAME_DESC') {
        return (b.name || '').localeCompare(a.name || '', 'pt', { sensitivity: 'base' })
      }
      if (customerSortBy === 'REFERRALS_DESC') {
        return (Number(b.referrals_count) || 0) - (Number(a.referrals_count) || 0)
      }
      return (Number(b.points_balance) || 0) - (Number(a.points_balance) || 0)
    })
  }, [
    data?.customers,
    customerSearch,
    customerStoreFilter,
    customerBalanceFilter,
    customerReferralsFilter,
    customerSortBy,
  ])

  useEffect(() => {
    setCustomerPage(1)
  }, [
    customerSearch,
    customerStoreFilter,
    customerBalanceFilter,
    customerReferralsFilter,
    customerSortBy,
    customerPageSize,
  ])

  const totalCustomerPages = Math.max(1, Math.ceil(filteredCustomers.length / customerPageSize))
  const safeCustomerPage = Math.min(customerPage, totalCustomerPages)
  const customerPageStart =
    filteredCustomers.length === 0 ? 0 : (safeCustomerPage - 1) * customerPageSize + 1
  const customerPageEnd = Math.min(
    filteredCustomers.length,
    safeCustomerPage * customerPageSize
  )
  const paginatedCustomers = useMemo(
    () =>
      filteredCustomers.slice(
        (safeCustomerPage - 1) * customerPageSize,
        safeCustomerPage * customerPageSize
      ),
    [filteredCustomers, safeCustomerPage, customerPageSize]
  )

  const handleExportCustomersExcel = () => {
    if (filteredCustomers.length === 0) {
      toast.error('Nenhum cliente para exportar com os filtros atuais.')
      return
    }
    const esc = (val: unknown) =>
      String(val ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

    const headers = [
      'Cliente',
      'Username',
      'Telemóvel',
      'Email',
      'NIF',
      'Loja Preferida',
      'Saldo (pts)',
      'Código Convite',
      'Indicações',
      'Data Registo',
    ]

    const rowsHtml = filteredCustomers
      .map(
        (c) =>
          `<tr>` +
          `<td>${esc(c.name)}</td>` +
          `<td>${esc(c.username)}</td>` +
          `<td style="mso-number-format:'\\@'">${esc(c.phone)}</td>` +
          `<td>${esc(c.email || '')}</td>` +
          `<td style="mso-number-format:'\\@'">${esc(c.nif || '')}</td>` +
          `<td>${esc(c.tenant_name || 'Sem loja')}</td>` +
          `<td>${Number(c.points_balance) || 0}</td>` +
          `<td>${esc(c.referral_code)}</td>` +
          `<td>${Number(c.referrals_count) || 0}</td>` +
          `<td>${esc(new Date(c.created_at).toLocaleDateString('pt-PT'))}</td>` +
          `</tr>`
      )
      .join('')

    const html =
      `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">` +
      `<head><meta charset="utf-8" /></head>` +
      `<body><table border="1"><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rowsHtml}</tbody></table></body></html>`

    const blob = new Blob(['\uFEFF' + html], {
      type: 'application/vnd.ms-excel;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `clientes-cashback-${new Date().toISOString().slice(0, 10)}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success(`Exportados ${filteredCustomers.length} cliente(s) para Excel.`)
  }

  const handleUploadPushImage = async (
    file: File,
    onDone: (url: string) => void
  ) => {
    setUploadingPushImg(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await authFetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json?.url) {
        toast.error(json?.error || 'Erro ao carregar imagem.')
        return
      }
      onDone(json.url)
      toast.success('Imagem carregada.')
    } catch {
      toast.error('Erro de ligação ao carregar imagem.')
    } finally {
      setUploadingPushImg(false)
    }
  }

  const handleSendPush = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pushTitle.trim() || !pushBody.trim()) {
      toast.error('Preenche o título e a mensagem da notificação.')
      return
    }
    setSendingPush(true)
    try {
      const res = await authFetch('/api/loyalty/admin/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: pushTitle.trim(),
          body: pushBody.trim(),
          image_url: pushImageUrl.trim() || null,
          tenant_id: pushTenantId || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Erro ao enviar notificações push.')
        return
      }
      toast.success(json?.message || 'Notificação push processada.')
      setPushTitle('')
      setPushBody('')
      setPushImageUrl('')
      await loadData()
    } catch {
      toast.error('Erro de ligação ao enviar push.')
    } finally {
      setSendingPush(false)
    }
  }

  const handleResendPush = async (log: NonNullable<OverviewData['push_logs']>[number]) => {
    setResendingPushId(log.id)
    try {
      const res = await authFetch('/api/loyalty/admin/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: log.title,
          body: log.body,
          image_url: log.image_url || null,
          tenant_id: log.tenant_id || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Erro ao reenviar notificação.')
        return
      }
      toast.success(json?.message || 'Notificação reenviada com sucesso.')
      await loadData()
    } catch {
      toast.error('Erro de ligação ao reenviar notificação.')
    } finally {
      setResendingPushId(null)
    }
  }

  const openEditPush = (log: NonNullable<OverviewData['push_logs']>[number]) => {
    setEditingPush(log)
    setEditPushForm({
      title: log.title,
      body: log.body,
      image_url: log.image_url || '',
      tenant_id: log.tenant_id || '',
    })
  }

  const handleSaveEditPush = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPush) return
    setSavingEditPush(true)
    try {
      const res = await authFetch('/api/loyalty/admin/push', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPush.id,
          title: editPushForm.title.trim(),
          body: editPushForm.body.trim(),
          image_url: editPushForm.image_url.trim() || null,
          tenant_id: editPushForm.tenant_id || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Erro ao editar notificação.')
        return
      }
      toast.success('Notificação atualizada com sucesso.')
      setEditingPush(null)
      await loadData()
    } finally {
      setSavingEditPush(false)
    }
  }

  const handleDeletePush = async (id: string) => {
    try {
      const res = await authFetch(`/api/loyalty/admin/push?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Erro ao excluir notificação.')
        return
      }
      toast.success('Notificação removida do histórico.')
      await loadData()
    } catch {
      toast.error('Erro de ligação ao remover notificação.')
    }
  }

  const handleSavePointsRate = async () => {
    const val = Number(pointsPerEuro)
    if (!Number.isFinite(val) || val <= 0) {
      toast.error('Indica uma taxa válida maior que zero (ex: 1 ponto por 1 €).')
      return
    }
    setSavingPointsRate(true)
    try {
      const res = await authFetch('/api/loyalty/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points_rate: { points_per_euro: val } }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Erro ao guardar taxa de acumulação.')
        return
      }
      setPointsPerEuro(String(json?.points_rate?.points_per_euro ?? val))
      toast.success(`Taxa atualizada: ${json?.points_rate?.points_per_euro ?? val} pt(s) por cada 1,00 €.`)
    } catch {
      toast.error('Erro de ligação ao guardar taxa.')
    } finally {
      setSavingPointsRate(false)
    }
  }

  const handleSaveBirthdayConfig = async (overrideEnabled?: boolean) => {
    const nextEnabled = overrideEnabled !== undefined ? overrideEnabled : birthdayEnabled
    setSavingBirthday(true)
    try {
      const res = await authFetch('/api/loyalty/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthday: { enabled: nextEnabled, bonus_points: Number(birthdayBonus) || 0 },
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Erro ao guardar bónus de aniversário.')
        return
      }
      setBirthdayEnabled(Boolean(json.birthday?.enabled))
      setBirthdayBonus(String(json.birthday?.bonus_points ?? 25))
      toast.success('Configuração de Bónus de Aniversário atualizada.')
    } catch {
      toast.error('Erro ao guardar bónus de aniversário.')
    } finally {
      setSavingBirthday(false)
    }
  }

  const handleSaveContent = async (section: 'FAQ' | 'TERMS' | 'PRIVACY') => {
    setSavingContent(section)
    try {
      const payload =
        section === 'FAQ'
          ? { faq: faqItems.filter((i) => i.question.trim()) }
          : section === 'TERMS'
            ? { terms_text: termsText }
            : { privacy_text: privacyText }

      const res = await authFetch('/api/loyalty/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: payload }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Erro ao guardar conteúdo.')
        return
      }
      toast.success(
        section === 'FAQ'
          ? 'Perguntas Frequentes atualizadas na app.'
          : section === 'TERMS'
            ? 'Termos de Uso atualizados na app.'
            : 'Política de Privacidade atualizada na app.'
      )
    } catch {
      toast.error('Erro de ligação ao guardar conteúdo.')
    } finally {
      setSavingContent(null)
    }
  }

  const handleUploadPresentationVideo = async (file: File, sceneIdx: number) => {
    setUploadingPresentationVideo(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await authFetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json?.url) {
        toast.error(json?.error || 'Erro ao carregar vídeo.')
        return
      }
      setPresentationScenes((prev) =>
        prev.map((s, idx) => (idx === sceneIdx ? { ...s, video_url: json.url } : s))
      )
      toast.success(`Vídeo da Cena ${sceneIdx + 1} carregado.`)
    } catch {
      toast.error('Erro de ligação ao carregar vídeo.')
    } finally {
      setUploadingPresentationVideo(false)
    }
  }

  const handleSavePresentation = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPresentation(true)
    try {
      const res = await authFetch('/api/loyalty/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presentation: { scenes: presentationScenes },
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Erro ao guardar apresentação da app.')
        return
      }
      toast.success('Apresentação da app atualizada com sucesso.')
      setPresentationOpen(false)
      await loadData()
    } catch {
      toast.error('Erro de ligação ao guardar apresentação.')
    } finally {
      setSavingPresentation(false)
    }
  }

  const handleToggleReceiptPoints = async (checked: boolean) => {
    setShowPointsOnReceipt(checked)
    setSavingReceiptCfg(true)
    try {
      const res = await authFetch('/api/loyalty/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receipt: { show_points_on_receipt: checked } }),
      })
      if (!res.ok) {
        toast.error('Erro ao atualizar configuração de recibo.')
        return
      }
      toast.success(
        checked
          ? 'Saldo e pontos de Cashback ativados no recibo do PDV.'
          : 'Pontos de Cashback ocultados no recibo do PDV.'
      )
    } catch {
      toast.error('Erro ao atualizar configuração de recibo.')
    } finally {
      setSavingReceiptCfg(false)
    }
  }

  const handleUploadRewardImage = async (file: File, onDone: (url: string) => void) => {
    setUploadingRewardImg(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await authFetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json?.url) {
        toast.error(json?.error || 'Erro ao carregar imagem.')
        return
      }
      onDone(json.url)
      toast.success('Imagem carregada.')
    } catch {
      toast.error('Erro de ligação ao carregar imagem.')
    } finally {
      setUploadingRewardImg(false)
    }
  }

  const openEditReward = (r: OverviewData['rewards'][number]) => {
    setEditingReward(r)
    setEditRewardForm({
      name: r.name || '',
      description: r.description || '',
      points_cost: String(r.points_cost || ''),
      category: r.category || 'COPOS',
      tenant_id: r.tenant_id || '',
      image_url: r.image_url || '',
    })
  }

  const handleSaveEditReward = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingReward) return
    setSavingEditReward(true)
    try {
      const res = await authFetch('/api/loyalty/admin/rewards', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingReward.id,
          name: editRewardForm.name.trim(),
          description: editRewardForm.description.trim() || null,
          points_cost: Number(editRewardForm.points_cost),
          category: editRewardForm.category,
          tenant_id: editRewardForm.tenant_id || null,
          image_url: editRewardForm.image_url.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Erro ao atualizar prémio.')
        return
      }
      toast.success('Prémio atualizado com sucesso.')
      setEditingReward(null)
      await loadData()
    } finally {
      setSavingEditReward(false)
    }
  }

  const openEditCampaign = (c: OverviewData['campaigns'][number]) => {
    const resolvedType =
      c.campaign_type === 'HIGHLIGHT' || c.campaign_type === 'AD' ? c.campaign_type : 'MULTIPLIER'
    setEditingCampaign(c)
    setEditCampaignForm({
      campaign_type: resolvedType,
      title: c.title || '',
      subtitle: c.subtitle || c.description || '',
      description: c.description || '',
      content: c.content || '',
      banner_url: c.banner_url || '',
      link_url: c.link_url || '',
      multiplier: String(c.multiplier || 2),
      start_date: c.start_date ? new Date(c.start_date).toISOString().slice(0, 10) : '',
      end_date: c.end_date ? new Date(c.end_date).toISOString().slice(0, 10) : '',
      tenant_id: c.tenant_id || '',
    })
  }

  const handleSaveEditCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCampaign) return
    setSavingEditCampaign(true)
    try {
      const res = await authFetch('/api/loyalty/admin/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCampaign.id,
          campaign_type: editCampaignForm.campaign_type,
          title: editCampaignForm.title.trim(),
          subtitle: editCampaignForm.subtitle.trim() || null,
          description: editCampaignForm.subtitle.trim() || editCampaignForm.content.trim() || null,
          content: editCampaignForm.content.trim() || null,
          banner_url: editCampaignForm.banner_url.trim() || null,
          link_url: editCampaignForm.link_url.trim() || null,
          multiplier:
            editCampaignForm.campaign_type === 'MULTIPLIER'
              ? Number(editCampaignForm.multiplier) || 2
              : 1,
          start_date: `${editCampaignForm.start_date}T00:00:00Z`,
          end_date: `${editCampaignForm.end_date}T23:59:59Z`,
          tenant_id: editCampaignForm.tenant_id || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Erro ao atualizar campanha.')
        return
      }
      toast.success('Campanha atualizada com sucesso.')
      setEditingCampaign(null)
      await loadData()
    } finally {
      setSavingEditCampaign(false)
    }
  }

  const openCustomerStatement = async (c: OverviewData['customers'][number]) => {
    setStatementCustomer(c)
    setStatementTypeFilter('ALL')
    setStatementPeriodFilter('ALL')
    setStatementTransactions([])
    setStatementLoading(true)
    try {
      const res = await authFetch(`/api/loyalty/admin/customers?id=${encodeURIComponent(c.id)}`)
      const json = await res.json()
      if (res.ok) {
        setStatementTransactions(Array.isArray(json.transactions) ? json.transactions : [])
      } else {
        toast.error(json?.error || 'Erro ao carregar extrato.')
      }
    } catch {
      toast.error('Erro de ligação ao carregar extrato.')
    } finally {
      setStatementLoading(false)
    }
  }

  const filteredStatementTransactions = useMemo(() => {
    const now = Date.now()
    return statementTransactions.filter((tx) => {
      if (statementTypeFilter !== 'ALL' && tx.type !== statementTypeFilter) return false
      if (statementPeriodFilter !== 'ALL') {
        const days = statementPeriodFilter === '30D' ? 30 : 90
        const cutoff = now - days * 24 * 60 * 60 * 1000
        if (new Date(tx.created_at).getTime() < cutoff) return false
      }
      return true
    })
  }, [statementTransactions, statementTypeFilter, statementPeriodFilter])

  const handleToggleStoreCashback = async (tenantId: string, enabled: boolean) => {
    const nextDisabled = enabled
      ? disabledStoreIds.filter((id) => id !== tenantId)
      : Array.from(new Set([...disabledStoreIds, tenantId]))

    setDisabledStoreIds(nextDisabled)
    setSavingStoreToggleId(tenantId)
    try {
      const res = await authFetch('/api/loyalty/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stores: { disabled_tenant_ids: nextDisabled },
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json?.error || 'Erro ao atualizar participação da loja.')
        await loadData()
        return
      }
      setDisabledStoreIds(json?.stores?.disabled_tenant_ids || nextDisabled)
      toast.success(
        enabled
          ? 'Loja ativada no programa de Cashback e visível na app.'
          : 'Loja removida do Cashback e ocultada na app mobile.'
      )
    } catch {
      toast.error('Erro de ligação ao atualizar loja.')
      await loadData()
    } finally {
      setSavingStoreToggleId(null)
    }
  }

  const tabs: Array<{ id: SubTab; label: string }> = [
    { id: 'SETTINGS', label: 'Regras & Indicação' },
    { id: 'STORES', label: 'Lojas / Franquias' },
    { id: 'REWARDS', label: 'Prémios' },
    { id: 'CAMPAIGNS', label: 'Campanhas & Destaques' },
    { id: 'CUSTOMERS', label: 'Clientes' },
    { id: 'VOUCHERS', label: 'Vouchers' },
    { id: 'PUSH', label: 'Notificações Push' },
  ]

  const activeRewardsCount = (data?.rewards || []).filter((r) => r.active).length
  const activeCampaignsCount = (data?.campaigns || []).filter((c) => c.active).length

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 animate-in fade-in duration-200">
      {/* Cabeçalho Corporativo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-150 dark:border-white/15">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-purple-950 dark:text-white tracking-tight">
            Gerenciamento Cashback
          </h1>
          <p className="text-xs sm:text-sm text-purple-700/80 dark:text-purple-200/70 font-medium mt-0.5">
            Controlo central da Franqueadora sobre regras de indicação, catálogo de prémios,
            campanhas e clientes.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setPresentationSceneIdx(0)
            setPresentationOpen(true)
          }}
          className="h-9 px-4 bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-xs w-fit"
        >
          Personalizar Apresentação
        </Button>
      </div>

      {/* 4 KPIs Globais (sem ícones decorativos) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-white dark:bg-[#160228] text-purple-950 dark:text-white rounded-3xl border border-purple-150 dark:border-white/15 shadow-xs">
          <div className="text-xs text-purple-700/80 dark:text-purple-300/70 font-bold">
            Clientes Ativos
          </div>
          <div className="text-2xl sm:text-3xl font-black mt-2 tracking-tight text-purple-950 dark:text-white font-mono">
            {data?.stats.total_customers ?? 0}
          </div>
          <div className="text-[11px] text-purple-600/80 dark:text-purple-200/70 font-medium mt-1">
            Registos na app de cashback
          </div>
        </Card>

        <Card className="p-5 bg-white dark:bg-[#160228] text-purple-950 dark:text-white rounded-3xl border border-purple-150 dark:border-white/15 shadow-xs">
          <div className="text-xs text-purple-700/80 dark:text-purple-300/70 font-bold">
            Pontos em Circulação
          </div>
          <div className="text-2xl sm:text-3xl font-black mt-2 tracking-tight text-purple-950 dark:text-white font-mono">
            {(data?.stats.total_points ?? 0).toLocaleString('pt-PT')}
          </div>
          <div className="text-[11px] text-purple-600/80 dark:text-purple-200/70 font-medium mt-1">
            Saldo acumulado pelos clientes
          </div>
        </Card>

        <Card className="p-5 bg-white dark:bg-[#160228] text-purple-950 dark:text-white rounded-3xl border border-purple-150 dark:border-white/15 shadow-xs">
          <div className="text-xs text-purple-700/80 dark:text-purple-300/70 font-bold">
            Vouchers Ativos
          </div>
          <div className="text-2xl sm:text-3xl font-black mt-2 tracking-tight text-purple-950 dark:text-white font-mono">
            {data?.stats.active_vouchers ?? 0}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            {data?.stats.redeemed_vouchers ?? 0} resgatados no balcão
          </div>
        </Card>

        <Card className="p-5 bg-white dark:bg-[#160228] text-purple-950 dark:text-white rounded-3xl border border-purple-150 dark:border-white/15 shadow-xs">
          <div className="text-xs text-purple-700/80 dark:text-purple-300/70 font-bold">
            Prémios Ativos
          </div>
          <div className="text-2xl sm:text-3xl font-black mt-2 tracking-tight text-purple-950 dark:text-white font-mono">
            {activeRewardsCount}
          </div>
          <div className="text-[11px] text-purple-600/80 dark:text-purple-200/70 font-medium mt-1">
            {activeCampaignsCount} campanha(s) e destaque(s) ativos
          </div>
        </Card>
      </div>

      {/* Sub-abas em Pílulas (padrão Franqueadora) */}
      <div className="max-w-full overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-1.5 p-1 bg-purple-50/70 dark:bg-white/5 rounded-2xl border border-purple-150 dark:border-white/10 w-fit shrink-0">
          {tabs.map((tab) => {
            const active = subTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${active
                  ? 'bg-gradient-to-r from-purple-700 to-pink-600 text-white shadow-xs'
                  : 'text-purple-900 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white hover:bg-purple-100/50 dark:hover:bg-white/5'
                  }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ABA 1: REGRAS & INDICAÇÃO */}
      {subTab === 'SETTINGS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="rounded-3xl border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] p-6 lg:col-span-2 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-base font-black text-purple-950 dark:text-white">
                  Taxa de Acumulação de Pontos no PDV
                </h2>
                <p className="text-xs sm:text-sm text-purple-700/80 dark:text-purple-200/70 mt-1">
                  Define quantos pontos o cliente ganha por cada 1,00 € gasto em compras pagas no
                  balcão ou mesa (multiplicado automaticamente se houver campanha ativa).
                </p>
              </div>
              <div className="flex items-end gap-3 shrink-0">
                <div className="w-40">
                  <label className="block text-[11px] font-bold text-purple-900 dark:text-purple-200 mb-1">
                    Pontos por 1,00 €
                  </label>
                  <Input
                    type="number"
                    step="0.5"
                    min={0.1}
                    value={pointsPerEuro}
                    onChange={(e) => setPointsPerEuro(e.target.value)}
                    className="rounded-xl border-purple-200 dark:border-white/15 font-mono"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleSavePointsRate}
                  disabled={savingPointsRate}
                  className="h-10 px-4 bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-md"
                >
                  {savingPointsRate ? 'A guardar...' : 'Guardar Taxa'}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] p-6 space-y-6 shadow-xs">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-black text-purple-950 dark:text-white">
                  Programa Convidar Amigos (Indicação)
                </h2>
                <p className="text-xs sm:text-sm text-purple-700/80 dark:text-purple-200/70 mt-1">
                  Quando desativado, o banner no Início, o código de indicação no Perfil e o campo
                  de código no Registo deixam de aparecer automaticamente na app mobile.
                </p>
              </div>
              <Switch
                checked={refEnabled}
                onCheckedChange={(checked) => {
                  setRefEnabled(checked)
                  handleSaveSettings(checked)
                }}
                disabled={savingSettings}
              />
            </div>

            <div className="border-t border-purple-100 dark:border-white/10 pt-5 flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-purple-900 dark:text-purple-200 mb-1.5">
                  Bónus por indicação (pontos para convidado e indicador após 1.ª compra)
                </label>
                <Input
                  type="number"
                  min={0}
                  value={refBonus}
                  onChange={(e) => setRefBonus(e.target.value)}
                  className="rounded-xl border-purple-200 dark:border-white/15"
                />
              </div>
              <Button
                size="sm"
                onClick={() => handleSaveSettings()}
                disabled={savingSettings}
                className="h-10 px-4 bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-md"
              >
                Guardar Regras
              </Button>
            </div>
          </Card>

          <Card className="rounded-3xl border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] p-6 space-y-6 shadow-xs">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-black text-purple-950 dark:text-white">
                  Bónus de Aniversário Automático
                </h2>
                <p className="text-xs sm:text-sm text-purple-700/80 dark:text-purple-200/70 mt-1">
                  Credita pontos automaticamente uma vez por ano no dia de aniversário do cliente
                  (com data preenchida no perfil) e envia notificação push de parabéns.
                </p>
              </div>
              <Switch
                checked={birthdayEnabled}
                onCheckedChange={(checked) => {
                  setBirthdayEnabled(checked)
                  handleSaveBirthdayConfig(checked)
                }}
                disabled={savingBirthday}
              />
            </div>

            <div className="border-t border-purple-100 dark:border-white/10 pt-5 flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-purple-900 dark:text-purple-200 mb-1.5">
                  Pontos de oferta no aniversário
                </label>
                <Input
                  type="number"
                  min={0}
                  value={birthdayBonus}
                  onChange={(e) => setBirthdayBonus(e.target.value)}
                  className="rounded-xl border-purple-200 dark:border-white/15 font-mono"
                />
              </div>
              <Button
                size="sm"
                onClick={() => handleSaveBirthdayConfig()}
                disabled={savingBirthday}
                className="h-10 px-4 bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-md"
              >
                Guardar Aniversário
              </Button>
            </div>
          </Card>

          <Card className="rounded-3xl border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] p-6 lg:col-span-2 shadow-xs">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-black text-purple-950 dark:text-white">
                  Exibir Pontos de Cashback no Recibo / Talão do PDV
                </h2>
                <p className="text-xs sm:text-sm text-purple-700/80 dark:text-purple-200/70 mt-1">
                  Quando ativo, o talão e a confirmação da comanda no PDV mostram os pontos ganhos
                  naquela compra e o saldo atualizado do cliente.
                </p>
              </div>
              <Switch
                checked={showPointsOnReceipt}
                onCheckedChange={handleToggleReceiptPoints}
                disabled={savingReceiptCfg}
              />
            </div>
          </Card>

          {/* PERGUNTAS FREQUENTES (FAQ) */}
          <Card className="rounded-3xl border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] p-6 lg:col-span-2 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-purple-950 dark:text-white">
                  Perguntas Frequentes (FAQ da App)
                </h2>
                <p className="text-xs sm:text-sm text-purple-700/80 dark:text-purple-200/70 mt-0.5">
                  Personalize as dúvidas frequentes exibidas no Perfil da app mobile.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setFaqItems((prev) => [
                      ...prev,
                      { id: `faq-${Date.now()}`, question: '', answer: '' },
                    ])
                  }
                  className="h-9 px-3 text-xs font-bold rounded-xl border-purple-200 dark:border-white/15 cursor-pointer"
                >
                  Adicionar Pergunta
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleSaveContent('FAQ')}
                  disabled={savingContent === 'FAQ'}
                  className="h-9 px-4 bg-gradient-to-r from-purple-700 to-pink-600 text-white text-xs font-black rounded-xl cursor-pointer shadow-xs"
                >
                  {savingContent === 'FAQ' ? 'A guardar...' : 'Guardar FAQ'}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {faqItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-purple-150 dark:border-white/10 bg-purple-50/40 dark:bg-white/[0.03] p-4 space-y-2.5"
                >
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder={`Pergunta ${idx + 1}`}
                      value={item.question}
                      onChange={(e) =>
                        setFaqItems((prev) =>
                          prev.map((f) => (f.id === item.id ? { ...f, question: e.target.value } : f))
                        )
                      }
                      className="flex-1 rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-[#12061d] font-bold text-sm"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setFaqItems((prev) => prev.filter((f) => f.id !== item.id))}
                      className="h-9 w-9 p-0 text-red-600 hover:text-red-700 cursor-pointer shrink-0"
                      aria-label="Remover pergunta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Resposta exibida ao cliente..."
                    value={item.answer}
                    onChange={(e) =>
                      setFaqItems((prev) =>
                        prev.map((f) => (f.id === item.id ? { ...f, answer: e.target.value } : f))
                      )
                    }
                    className="w-full rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#12061d] px-3 py-2 text-sm text-purple-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                </div>
              ))}
              {faqItems.length === 0 && (
                <p className="text-xs text-purple-700/70 dark:text-purple-200/60">
                  Nenhuma pergunta personalizada. Clique em &quot;Adicionar Pergunta&quot; para criar.
                </p>
              )}
            </div>
          </Card>

          {/* TERMOS DE USO */}
          <Card className="rounded-3xl border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] p-6 space-y-4 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-purple-950 dark:text-white">
                  Termos de Uso
                </h2>
                <p className="text-xs text-purple-700/80 dark:text-purple-200/70 mt-0.5">
                  Deixe em branco para usar o texto padrão da app ou escreva os seus termos.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => handleSaveContent('TERMS')}
                disabled={savingContent === 'TERMS'}
                className="h-9 px-4 bg-gradient-to-r from-purple-700 to-pink-600 text-white text-xs font-black rounded-xl cursor-pointer shrink-0"
              >
                {savingContent === 'TERMS' ? 'A guardar...' : 'Guardar Termos'}
              </Button>
            </div>
            <textarea
              rows={8}
              placeholder="Escreva os Termos de Uso do programa de Cashback..."
              value={termsText}
              onChange={(e) => setTermsText(e.target.value)}
              className="w-full rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#12061d] px-3.5 py-2.5 text-sm text-purple-950 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-500/40"
            />
          </Card>

          {/* POLÍTICA DE PRIVACIDADE */}
          <Card className="rounded-3xl border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] p-6 space-y-4 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-purple-950 dark:text-white">
                  Política de Privacidade
                </h2>
                <p className="text-xs text-purple-700/80 dark:text-purple-200/70 mt-0.5">
                  Deixe em branco para usar o texto padrão RGPD da app ou personalize aqui.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => handleSaveContent('PRIVACY')}
                disabled={savingContent === 'PRIVACY'}
                className="h-9 px-4 bg-gradient-to-r from-purple-700 to-pink-600 text-white text-xs font-black rounded-xl cursor-pointer shrink-0"
              >
                {savingContent === 'PRIVACY' ? 'A guardar...' : 'Guardar Privacidade'}
              </Button>
            </div>
            <textarea
              rows={8}
              placeholder="Escreva a Política de Privacidade e RGPD..."
              value={privacyText}
              onChange={(e) => setPrivacyText(e.target.value)}
              className="w-full rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#12061d] px-3.5 py-2.5 text-sm text-purple-950 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-500/40"
            />
          </Card>
        </div>
      )}

      {/* ABA: LOJAS / FRANQUIAS PARTICIPANTES */}
      {subTab === 'STORES' && (
        <Card className="rounded-3xl border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] overflow-hidden shadow-xs">
          <div className="p-5 border-b border-purple-100 dark:border-white/10">
            <h2 className="text-base font-black text-purple-950 dark:text-white">
              Lojas / Franquias Participantes no Cashback
            </h2>
            <p className="text-xs sm:text-sm text-purple-700/80 dark:text-purple-200/70 mt-1">
              Defina quais unidades participam do programa de Cashback. Lojas desativadas deixam de
              aparecer automaticamente no seletor de lojas da app mobile.
            </p>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-purple-50/60 dark:bg-white/5 text-left text-xs uppercase text-purple-700/80 dark:text-purple-300/70">
              <tr>
                <th className="p-3.5 font-bold">Unidade</th>
                <th className="p-3.5 font-bold">Cidade</th>
                <th className="p-3.5 font-bold">Estado no App</th>
                <th className="p-3.5 font-bold text-right">Cashback Ativo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100 dark:divide-white/10">
              {(data?.tenants || []).map((t) => {
                const isEnabled = !disabledStoreIds.includes(t.id)
                return (
                  <tr key={t.id}>
                    <td className="p-3.5 font-bold text-purple-950 dark:text-white">{t.name}</td>
                    <td className="p-3.5 text-purple-900/80 dark:text-purple-200/80">
                      {t.city || '—'}
                    </td>
                    <td className="p-3.5">
                      <Badge variant={isEnabled ? 'default' : 'secondary'}>
                        {isEnabled ? 'Visível no App' : 'Oculta no App'}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right">
                      <Switch
                        checked={isEnabled}
                        disabled={savingStoreToggleId === t.id}
                        onCheckedChange={(checked) => handleToggleStoreCashback(t.id, checked)}
                      />
                    </td>
                  </tr>
                )
              })}
              {!loading && (data?.tenants || []).length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-purple-700/70 dark:text-purple-200/60">
                    Nenhuma loja ativa cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {/* ABA 2: PRÉMIOS */}
      {subTab === 'REWARDS' && (
        <div className="space-y-5">
          <form
            onSubmit={handleCreateReward}
            className="rounded-3xl border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] p-5 space-y-4 shadow-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-purple-950 dark:text-white">Novo Prémio</h2>
                <p className="text-xs text-purple-700/70 dark:text-purple-200/60">
                  Escolha um produto do cardápio ou cadastre um prémio personalizado fora do cardápio (ex: Balde 5 litros, brindes).
                </p>
              </div>
              <div className="flex items-center gap-1 p-1 bg-purple-50/80 dark:bg-white/5 rounded-xl border border-purple-150 dark:border-white/10 w-fit shrink-0">
                <button
                  type="button"
                  onClick={() => setRewardSourceMode('CATALOG')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${rewardSourceMode === 'CATALOG'
                    ? 'bg-gradient-to-r from-purple-700 to-pink-600 text-white shadow-xs'
                    : 'text-purple-900 dark:text-purple-200 hover:bg-purple-100/60 dark:hover:bg-white/5'
                    }`}
                >
                  Do Cardápio
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRewardSourceMode('CUSTOM')
                    setSelectedCatalogId('')
                    setCatalogDropdownOpen(false)
                    setRewardSuggestedHint('')
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${rewardSourceMode === 'CUSTOM'
                    ? 'bg-gradient-to-r from-purple-700 to-pink-600 text-white shadow-xs'
                    : 'text-purple-900 dark:text-purple-200 hover:bg-purple-100/60 dark:hover:bg-white/5'
                    }`}
                >
                  Fora do Cardápio
                </button>
              </div>
            </div>

            {rewardSourceMode === 'CATALOG' && (
              <div className="space-y-1.5" ref={catalogDropdownRef}>
                <label className="block text-xs font-bold text-purple-900 dark:text-purple-200">
                  Selecionar o produto
                </label>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setCatalogDropdownOpen((prev) => !prev)}
                    className="w-full min-h-11 px-3.5 py-2 rounded-xl border border-purple-200 dark:border-white/15 bg-purple-50/40 dark:bg-[#12061d] hover:bg-purple-50/80 dark:hover:bg-white/5 transition-colors flex items-center justify-between gap-3 text-left cursor-pointer"
                  >
                    {selectedCatalogProduct ? (
                      <div className="flex items-center gap-3 min-w-0">
                        {selectedCatalogProduct.image_url ? (
                          <img
                            src={selectedCatalogProduct.image_url}
                            alt={selectedCatalogProduct.name}
                            className="w-8 h-8 rounded-lg object-cover border border-purple-150 dark:border-white/10 shrink-0"
                          />
                        ) : null}
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-purple-950 dark:text-white truncate">
                            {selectedCatalogProduct.name}
                          </div>
                          <div className="text-[11px] text-purple-700/75 dark:text-purple-200/70">
                            {selectedCatalogProduct.category_name || 'Cardápio'} ·{' '}
                            {Number(selectedCatalogProduct.preco_base).toFixed(2).replace('.', ',')} €
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-purple-700/70 dark:text-purple-200/60">
                        Selecionar produto do cardápio (Açaí primeiro) ou preencher manualmente...
                      </span>
                    )}

                    <div className="flex items-center gap-1.5 shrink-0">
                      {selectedCatalogProduct ? (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectCatalogProduct('')
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              e.stopPropagation()
                              handleSelectCatalogProduct('')
                            }
                          }}
                          className="p-1 rounded-lg hover:bg-purple-200/60 dark:hover:bg-white/10 text-purple-700 dark:text-purple-200"
                          aria-label="Limpar produto selecionado"
                        >
                          <X className="w-3.5 h-3.5" />
                        </span>
                      ) : null}
                      <ChevronDown
                        className={`w-4 h-4 text-purple-700 dark:text-purple-200 transition-transform ${catalogDropdownOpen ? 'rotate-180' : ''
                          }`}
                      />
                    </div>
                  </button>

                  {catalogDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-2 z-40 rounded-2xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#1a052d] shadow-xl overflow-hidden">
                      <div className="p-2.5 border-b border-purple-100 dark:border-white/10 bg-purple-50/40 dark:bg-white/5">
                        <Input
                          placeholder="Pesquisar açaí, copo, taça ou lanche..."
                          value={catalogSearch}
                          onChange={(e) => setCatalogSearch(e.target.value)}
                          autoFocus
                          className="h-9 rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-[#12061d] text-xs"
                        />
                      </div>

                      <div className="max-h-72 overflow-y-auto divide-y divide-purple-100/70 dark:divide-white/10">
                        {groupedCatalogProducts.length === 0 ? (
                          <div className="p-4 text-center text-xs text-purple-700/70 dark:text-purple-200/60">
                            Nenhum produto encontrado no cardápio.
                          </div>
                        ) : (
                          groupedCatalogProducts.map((group) => (
                            <div key={group.label}>
                              <div className="px-3.5 py-2 text-[10px] font-black uppercase tracking-wider text-purple-700/80 dark:text-pink-300 bg-purple-50/70 dark:bg-white/5 sticky top-0">
                                {group.label} ({group.items.length})
                              </div>
                              <div className="divide-y divide-purple-50 dark:divide-white/5">
                                {group.items.map((p) => {
                                  const suggested = suggestPointsFromPrice(p.preco_base)
                                  const priceLabel = Number(p.preco_base).toFixed(2).replace('.', ',')
                                  const isSelected = selectedCatalogId === p.id
                                  return (
                                    <button
                                      key={p.id}
                                      type="button"
                                      onClick={() => {
                                        handleSelectCatalogProduct(p.id)
                                        setCatalogDropdownOpen(false)
                                        setCatalogSearch('')
                                      }}
                                      className={`w-full px-3.5 py-2.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${isSelected
                                        ? 'bg-purple-100/70 dark:bg-purple-900/40'
                                        : 'hover:bg-purple-50/70 dark:hover:bg-white/5'
                                        }`}
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        {p.image_url ? (
                                          <img
                                            src={p.image_url}
                                            alt={p.name}
                                            className="w-9 h-9 rounded-lg object-cover border border-purple-150 dark:border-white/10 shrink-0"
                                          />
                                        ) : (
                                          <div className="w-9 h-9 rounded-lg bg-purple-100/70 dark:bg-white/10 shrink-0" />
                                        )}
                                        <div className="min-w-0">
                                          <div className="text-sm font-bold text-purple-950 dark:text-white truncate">
                                            {p.name}
                                          </div>
                                          <div className="text-[11px] text-purple-700/70 dark:text-purple-200/60 truncate">
                                            {p.category_name || group.label}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-xs font-mono text-purple-700/80 dark:text-purple-200/80">
                                          {priceLabel} €
                                        </span>
                                        <span className="px-2 py-0.5 rounded-lg bg-purple-100 dark:bg-pink-500/20 text-purple-800 dark:text-pink-300 text-xs font-black font-mono">
                                          {suggested} pts
                                        </span>
                                      </div>
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {rewardSuggestedHint ? (
                  <p className="text-xs font-medium text-purple-700 dark:text-pink-300">
                    {rewardSuggestedHint}
                  </p>
                ) : null}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                  Nome do Prémio
                </label>
                <Input
                  placeholder={rewardSourceMode === 'CUSTOM' ? 'Ex: Balde 5 litros' : 'Ex: Copo 250gr'}
                  value={rewardName}
                  onChange={(e) => setRewardName(e.target.value)}
                  className="rounded-xl border-purple-200 dark:border-white/15"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                  Custo em Pontos
                </label>
                <Input
                  type="number"
                  min={1}
                  placeholder={rewardSourceMode === 'CUSTOM' ? 'Ex: 1800' : 'Ex: 130'}
                  value={rewardPoints}
                  onChange={(e) => setRewardPoints(e.target.value)}
                  className="rounded-xl border-purple-200 dark:border-white/15 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                  Categoria
                </label>
                <select
                  value={rewardCategory}
                  onChange={(e) => setRewardCategory(e.target.value)}
                  className="w-full h-10 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#12061d] px-3 text-sm text-purple-950 dark:text-white"
                >
                  <option value="COPOS">Copos</option>
                  <option value="ADICIONAIS">Adicionais</option>
                  <option value="POTES">Taças / Potes</option>
                  <option value="ESPECIAIS">Especiais / Outros</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                  Âmbito
                </label>
                <select
                  value={rewardTenantId}
                  onChange={(e) => setRewardTenantId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#12061d] px-3 text-sm text-purple-950 dark:text-white"
                >
                  <option value="">Toda a Rede (Global)</option>
                  {(data?.tenants || []).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-6">
                <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                  Descrição (opcional)
                </label>
                <Input
                  placeholder={
                    rewardSourceMode === 'CUSTOM'
                      ? 'Ex: Balde com 4,5 kg de açaí'
                      : 'Ex: Inclui 2 cremes e acompanhamentos tradicionais'
                  }
                  value={rewardDesc}
                  onChange={(e) => setRewardDesc(e.target.value)}
                  className="rounded-xl border-purple-200 dark:border-white/15"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                  Imagem do Prémio (opcional)
                </label>
                <div className="flex items-center gap-2">
                  {rewardImageUrl ? (
                    <img
                      src={rewardImageUrl}
                      alt="Pré-visualização do prémio"
                      className="w-10 h-10 rounded-xl object-cover border border-purple-200 dark:border-white/15 shrink-0"
                    />
                  ) : null}
                  <label className="flex-1 inline-flex items-center justify-center h-10 px-3.5 rounded-xl border border-dashed border-purple-300 dark:border-white/20 bg-purple-50/40 dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-xs font-bold text-purple-900 dark:text-white cursor-pointer transition-colors">
                    <span>
                      {uploadingRewardImg
                        ? 'A carregar...'
                        : rewardImageUrl
                          ? 'Alterar Imagem'
                          : 'Carregar Imagem'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingRewardImg}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleUploadRewardImage(file, (url) => setRewardImageUrl(url))
                        }
                        e.target.value = ''
                      }}
                    />
                  </label>
                  {rewardImageUrl ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setRewardImageUrl('')}
                      className="h-10 px-2.5 rounded-xl border-red-200 dark:border-red-500/30 text-xs font-bold text-red-600 hover:text-red-700 cursor-pointer shrink-0"
                    >
                      Remover
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={savingReward}
                  className="w-full h-10 px-4 bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-md"
                >
                  Adicionar Prémio
                </Button>
              </div>
            </div>
          </form>

          <Card className="rounded-3xl border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] overflow-hidden shadow-xs">
            <table className="w-full text-sm">
              <thead className="bg-purple-50/60 dark:bg-white/5 text-left text-xs uppercase text-purple-700/80 dark:text-purple-300/70">
                <tr>
                  <th className="p-3.5 font-bold">Produto</th>
                  <th className="p-3.5 font-bold">Lojas</th>
                  <th className="p-3.5 font-bold">Pontos</th>
                  <th className="p-3.5 font-bold">Resgates</th>
                  <th className="p-3.5 font-bold">Ativo/Inativo</th>
                  <th className="p-3.5 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100 dark:divide-white/10">
                {(data?.rewards || []).map((r) => (
                  <tr key={r.id}>
                    <td className="p-3.5 font-bold text-purple-950 dark:text-white">
                      <div className="flex items-center gap-3">
                        {r.image_url ? (
                          <img
                            src={r.image_url}
                            alt={r.name}
                            className="w-9 h-9 rounded-lg object-cover border border-purple-150 dark:border-white/10 shrink-0"
                          />
                        ) : null}
                        <div>
                          <div>{r.name}</div>
                          {r.description ? (
                            <p className="text-xs font-normal text-purple-700/70 dark:text-purple-200/60">
                              {r.description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-purple-900/80 dark:text-purple-200/80">
                      {r.tenant_name || 'Toda a Rede'}
                    </td>
                    <td className="p-3.5 font-black font-mono text-purple-700 dark:text-pink-400">
                      {r.points_cost} pts
                    </td>
                    <td className="p-3.5 font-mono text-purple-900/80 dark:text-purple-200/80">
                      {r.total_redemptions}
                    </td>
                    <td className="p-3.5">
                      <Switch
                        checked={r.active}
                        onCheckedChange={(val) => handleToggleReward(r.id, val)}
                      />
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditReward(r)}
                          className="h-8 px-2.5 text-xs font-bold rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-900 dark:text-white cursor-pointer"
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteReward(r.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 cursor-pointer"
                          aria-label={`Remover prémio ${r.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && (data?.rewards || []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-purple-700/70 dark:text-purple-200/60">
                      Nenhum prémio cadastrado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* ABA 3: CAMPANHAS & DESTAQUES */}
      {subTab === 'CAMPAIGNS' && (
        <div className="space-y-5">
          <Card className="rounded-3xl border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] p-6 space-y-5 shadow-xs">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-black text-purple-950 dark:text-white">
                  Campanhas & Destaques no App
                </h2>
                <p className="text-xs sm:text-sm text-purple-700/80 dark:text-purple-200/70 mt-1">
                  Quando desativado, o carrossel de campanhas, destaques e publicidades fica oculto
                  na app mobile sem apagar os registos abaixo.
                </p>
              </div>
              <Switch
                checked={campaignsEnabled}
                onCheckedChange={(checked) => {
                  setCampaignsEnabled(checked)
                  handleSaveCampaignsConfig(checked)
                }}
                disabled={savingCampaignsConfig}
              />
            </div>

            <div className="border-t border-purple-100 dark:border-white/10 pt-4 flex flex-col sm:flex-row sm:items-end gap-4 max-w-xl">
              <div className="flex-1">
                <label className="block text-xs font-bold text-purple-900 dark:text-purple-200 mb-1.5">
                  Multiplicador padrão sugerido (ex: 2x pontos)
                </label>
                <Input
                  type="number"
                  step="0.5"
                  min={1}
                  value={defaultMultiplier}
                  onChange={(e) => setDefaultMultiplier(e.target.value)}
                  className="rounded-xl border-purple-200 dark:border-white/15"
                />
              </div>
              <Button
                size="sm"
                onClick={() => handleSaveCampaignsConfig()}
                disabled={savingCampaignsConfig}
                className="h-10 px-4 bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-md"
              >
                Guardar Regra
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <form
              onSubmit={handleCreateCampaign}
              className="lg:col-span-7 rounded-3xl border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] p-6 space-y-4 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-base font-black text-purple-950 dark:text-white">
                  Nova Publicação
                </h2>
                <div className="flex items-center gap-1 p-1 bg-purple-50/80 dark:bg-white/5 rounded-xl border border-purple-150 dark:border-white/10 w-fit">
                  {(
                    [
                      { id: 'MULTIPLIER', label: 'Multiplicador' },
                      { id: 'HIGHLIGHT', label: 'Destaque / Novidade' },
                      { id: 'AD', label: 'Publicidade / Link' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setCampType(opt.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${campType === opt.id
                        ? 'bg-gradient-to-r from-purple-700 to-pink-600 text-white shadow-xs'
                        : 'text-purple-900 dark:text-purple-200 hover:bg-purple-100/60 dark:hover:bg-white/5'
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={campType === 'MULTIPLIER' ? '' : 'sm:col-span-2'}>
                  <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                    Título
                  </label>
                  <Input
                    placeholder={
                      campType === 'MULTIPLIER'
                        ? 'Ex: Pontos em Dobro'
                        : campType === 'HIGHLIGHT'
                          ? 'Ex: Experimenta o nosso Milkshake'
                          : 'Ex: Avalia-nos no Google'
                    }
                    value={campTitle}
                    onChange={(e) => setCampTitle(e.target.value)}
                    required
                    className="rounded-xl border-purple-200 dark:border-white/15"
                  />
                </div>

                {campType === 'MULTIPLIER' && (
                  <div>
                    <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                      Multiplicador de Pontos
                    </label>
                    <Input
                      type="number"
                      step="0.5"
                      min={1}
                      placeholder="Ex: 2"
                      value={campMultiplier}
                      onChange={(e) => setCampMultiplier(e.target.value)}
                      className="rounded-xl border-purple-200 dark:border-white/15 font-mono"
                    />
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                    Subtítulo / Resumo (opcional)
                  </label>
                  <Input
                    placeholder="Ex: Válido em todas as compras ao balcão ou resumo curto do destaque"
                    value={campSubtitle}
                    onChange={(e) => setCampSubtitle(e.target.value)}
                    className="rounded-xl border-purple-200 dark:border-white/15"
                  />
                </div>

                {campType !== 'AD' && (
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                      Texto completo (opcional — abre ao tocar no card na app)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Escreve os detalhes completos da campanha ou novidade..."
                      value={campDesc}
                      onChange={(e) => setCampDesc(e.target.value)}
                      className="w-full rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#12061d] px-3 py-2 text-sm text-purple-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    />
                  </div>
                )}

                {campType !== 'MULTIPLIER' && (
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                      Link de destino {campType === 'AD' ? '(Google, Instagram, parceiro)' : '(opcional)'}
                    </label>
                    <Input
                      type="url"
                      placeholder="https://..."
                      value={campLinkUrl}
                      onChange={(e) => setCampLinkUrl(e.target.value)}
                      className="rounded-xl border-purple-200 dark:border-white/15"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                    Data de Início
                  </label>
                  <Input
                    type="date"
                    value={campStart}
                    onChange={(e) => setCampStart(e.target.value)}
                    className="rounded-xl border-purple-200 dark:border-white/15"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                    Data de Fim
                  </label>
                  <Input
                    type="date"
                    value={campEnd}
                    onChange={(e) => setCampEnd(e.target.value)}
                    className="rounded-xl border-purple-200 dark:border-white/15"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                    Âmbito
                  </label>
                  <select
                    value={campTenantId}
                    onChange={(e) => setCampTenantId(e.target.value)}
                    className="w-full h-10 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#12061d] px-3 text-sm text-purple-950 dark:text-white"
                  >
                    <option value="">Toda a Rede (Global)</option>
                    {(data?.tenants || []).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                    Imagem (opcional)
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 inline-flex items-center justify-center h-10 px-3.5 rounded-xl border border-dashed border-purple-300 dark:border-white/20 bg-purple-50/40 dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-xs font-bold text-purple-900 dark:text-white cursor-pointer transition-colors">
                      <span>
                        {uploadingCampImg
                          ? 'A carregar...'
                          : campBannerUrl
                            ? 'Alterar Imagem'
                            : 'Carregar Imagem'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingCampImg}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleUploadCampaignImage(file, (url) => setCampBannerUrl(url))
                          }
                          e.target.value = ''
                        }}
                      />
                    </label>
                    {campBannerUrl ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setCampBannerUrl('')}
                        className="h-10 px-2.5 rounded-xl border-red-200 dark:border-red-500/30 text-xs font-bold text-red-600 hover:text-red-700 cursor-pointer shrink-0"
                      >
                        Remover
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  disabled={savingCampaign}
                  className="h-10 px-5 bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-md"
                >
                  {savingCampaign ? 'A publicar...' : 'Publicar no App'}
                </Button>
              </div>
            </form>

            <Card className="lg:col-span-5 rounded-3xl border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-black text-purple-950 dark:text-white">
                  Pré-visualização no Início
                </h3>
                <Badge variant="secondary" className="text-[11px] font-bold">
                  {campType === 'MULTIPLIER'
                    ? `${campMultiplier || 2}x Pontos`
                    : campType === 'HIGHLIGHT'
                      ? 'Destaque'
                      : 'Publicidade'}
                </Badge>
              </div>

              <div className="rounded-2xl border border-purple-150 dark:border-white/15 bg-purple-50/40 dark:bg-[#12061d] overflow-hidden">
                {campBannerUrl ? (
                  <img
                    src={campBannerUrl}
                    alt="Pré-visualização da campanha"
                    className="w-full h-44 object-cover border-b border-purple-150 dark:border-white/10"
                  />
                ) : (
                  <div className="w-full h-36 flex items-center justify-center bg-purple-100/50 dark:bg-white/5 border-b border-purple-150 dark:border-white/10 px-4 text-center">
                    <span className="text-xs font-medium text-purple-700/60 dark:text-purple-200/50">
                      Sem imagem anexada
                    </span>
                  </div>
                )}

                <div className="p-4 space-y-1.5">
                  <div className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-pink-400">
                    {campType === 'MULTIPLIER'
                      ? `Campanha ${campMultiplier || 2}x Pontos`
                      : campType === 'HIGHLIGHT'
                        ? 'Novidade · Açaí da Rose'
                        : 'Publicidade · Parceiro'}
                  </div>
                  <div className="text-sm font-black text-purple-950 dark:text-white leading-snug break-words">
                    {campTitle.trim() || 'Título do destaque ou campanha'}
                  </div>
                  <p className="text-xs text-purple-800/80 dark:text-purple-200/75 leading-relaxed break-words">
                    {campSubtitle.trim() ||
                      campDesc.trim() ||
                      'O subtítulo ou descrição aparecerá aqui no carrossel do Início.'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="rounded-3xl border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] overflow-hidden shadow-xs">
            <table className="w-full text-sm">
              <thead className="bg-purple-50/60 dark:bg-white/5 text-left text-xs uppercase text-purple-700/80 dark:text-purple-300/70">
                <tr>
                  <th className="p-3.5 font-bold">Publicação</th>
                  <th className="p-3.5 font-bold">Tipo</th>
                  <th className="p-3.5 font-bold">Período</th>
                  <th className="p-3.5 font-bold">Âmbito</th>
                  <th className="p-3.5 font-bold">Ativa</th>
                  <th className="p-3.5 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100 dark:divide-white/10">
                {(data?.campaigns || []).map((c) => {
                  const typeKey =
                    c.campaign_type === 'HIGHLIGHT' || c.campaign_type === 'AD'
                      ? c.campaign_type
                      : 'MULTIPLIER'
                  return (
                    <tr key={c.id}>
                      <td className="p-3.5 font-bold text-purple-950 dark:text-white">
                        <div className="flex items-center gap-3">
                          {c.banner_url ? (
                            <img
                              src={c.banner_url}
                              alt={c.title}
                              className="w-11 h-11 rounded-xl object-cover border border-purple-150 dark:border-white/10 shrink-0"
                            />
                          ) : null}
                          <div>
                            <div>{c.title}</div>
                            {c.subtitle || c.description ? (
                              <p className="text-xs font-normal text-purple-700/70 dark:text-purple-200/60 line-clamp-1">
                                {c.subtitle || c.description}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <Badge variant="secondary" className="font-bold">
                          {typeKey === 'MULTIPLIER'
                            ? `${Number(c.multiplier)}x Pontos`
                            : typeKey === 'HIGHLIGHT'
                              ? 'Destaque'
                              : 'Publicidade'}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-xs text-purple-900/80 dark:text-purple-200/80">
                        {new Date(c.start_date).toLocaleDateString('pt-PT')} —{' '}
                        {new Date(c.end_date).toLocaleDateString('pt-PT')}
                      </td>
                      <td className="p-3.5 text-purple-900/80 dark:text-purple-200/80">
                        {c.tenant_name || 'Toda a Rede'}
                      </td>
                      <td className="p-3.5">
                        <Switch
                          checked={c.active}
                          onCheckedChange={(val) => handleToggleCampaign(c.id, val)}
                        />
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditCampaign(c)}
                            className="h-8 px-2.5 text-xs font-bold rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-900 dark:text-white cursor-pointer"
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCampaign(c.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 cursor-pointer"
                            aria-label={`Remover ${c.title}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {!loading && (data?.campaigns || []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-purple-700/70 dark:text-purple-200/60">
                      Nenhuma campanha cadastrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* ABA 4: CLIENTES */}
      {subTab === 'CUSTOMERS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <Input
              placeholder="Pesquisar cliente por nome, @username, telemóvel ou código..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="sm:max-w-md rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-[#160228]"
            />

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <select
                value={customerSortBy}
                onChange={(e) =>
                  setCustomerSortBy(
                    e.target.value as
                    | 'POINTS_DESC'
                    | 'NAME_ASC'
                    | 'NAME_DESC'
                    | 'NEWEST'
                    | 'OLDEST'
                    | 'REFERRALS_DESC'
                  )
                }
                aria-label="Ordenar clientes"
                className="h-10 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#160228] px-3 text-xs font-bold text-purple-900 dark:text-white"
              >
                <option value="POINTS_DESC">Ordenar: Maior saldo</option>
                <option value="NAME_ASC">Ordem alfabética (A–Z)</option>
                <option value="NAME_DESC">Ordem alfabética (Z–A)</option>
                <option value="NEWEST">Mais recentes</option>
                <option value="OLDEST">Mais antigos</option>
                <option value="REFERRALS_DESC">Mais indicações</option>
              </select>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setCustomerFiltersOpen((prev) => !prev)}
                className={`h-10 px-4 text-xs font-bold rounded-xl border-purple-200 dark:border-white/15 cursor-pointer ${customerFiltersOpen || activeCustomerFiltersCount > 0
                  ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-900 dark:text-white border-purple-400'
                  : 'bg-white dark:bg-[#160228] text-purple-900 dark:text-white hover:bg-purple-50 dark:hover:bg-white/5'
                  }`}
              >
                Filtrar{activeCustomerFiltersCount > 0 ? ` (${activeCustomerFiltersCount})` : ''}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleExportCustomersExcel}
                className="h-10 px-4 bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-xs"
              >
                Exportar Excel
              </Button>
            </div>
          </div>

          {customerFiltersOpen && (
            <Card className="rounded-2xl border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] p-4 shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                    Loja Preferida
                  </label>
                  <select
                    value={customerStoreFilter}
                    onChange={(e) => setCustomerStoreFilter(e.target.value)}
                    className="w-full h-9 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#12061d] px-3 text-xs text-purple-950 dark:text-white"
                  >
                    <option value="">Todas as Lojas</option>
                    {(data?.tenants || []).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                    Saldo de Pontos
                  </label>
                  <select
                    value={customerBalanceFilter}
                    onChange={(e) =>
                      setCustomerBalanceFilter(e.target.value as 'ALL' | 'WITH_POINTS' | 'ZERO')
                    }
                    className="w-full h-9 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#12061d] px-3 text-xs text-purple-950 dark:text-white"
                  >
                    <option value="ALL">Todos</option>
                    <option value="WITH_POINTS">Com saldo (&gt; 0 pts)</option>
                    <option value="ZERO">Sem saldo (0 pts)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                    Indicações
                  </label>
                  <select
                    value={customerReferralsFilter}
                    onChange={(e) =>
                      setCustomerReferralsFilter(e.target.value as 'ALL' | 'WITH_REFERRALS')
                    }
                    className="w-full h-9 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#12061d] px-3 text-xs text-purple-950 dark:text-white"
                  >
                    <option value="ALL">Todos</option>
                    <option value="WITH_REFERRALS">Com indicações (&gt; 0)</option>
                  </select>
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                      Ordenar por
                    </label>
                    <select
                      value={customerSortBy}
                      onChange={(e) =>
                        setCustomerSortBy(
                          e.target.value as
                          | 'POINTS_DESC'
                          | 'NAME_ASC'
                          | 'NAME_DESC'
                          | 'NEWEST'
                          | 'OLDEST'
                          | 'REFERRALS_DESC'
                        )
                      }
                      className="w-full h-9 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#12061d] px-3 text-xs text-purple-950 dark:text-white"
                    >
                      <option value="POINTS_DESC">Maior saldo</option>
                      <option value="NAME_ASC">Ordem alfabética (A–Z)</option>
                      <option value="NAME_DESC">Ordem alfabética (Z–A)</option>
                      <option value="NEWEST">Mais recentes</option>
                      <option value="OLDEST">Mais antigos</option>
                      <option value="REFERRALS_DESC">Mais indicações</option>
                    </select>
                  </div>
                  {activeCustomerFiltersCount > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setCustomerStoreFilter('')
                        setCustomerBalanceFilter('ALL')
                        setCustomerReferralsFilter('ALL')
                        setCustomerSortBy('POINTS_DESC')
                      }}
                      className="h-9 px-2.5 text-xs text-purple-700 dark:text-purple-200 cursor-pointer shrink-0"
                    >
                      Limpar
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}

          <Card className="rounded-3xl border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] overflow-x-auto shadow-xs">
            <table className="w-full text-sm">
              <thead className="bg-purple-50/60 dark:bg-white/5 text-left text-xs uppercase text-purple-700/80 dark:text-purple-300/70">
                <tr>
                  <th className="p-3.5 font-bold">Cliente</th>
                  <th className="p-3.5 font-bold">Telemóvel</th>
                  <th className="p-3.5 font-bold">Saldo</th>
                  <th className="p-3.5 font-bold">Código Convite</th>
                  <th className="p-3.5 font-bold">Indicações</th>
                  <th className="p-3.5 font-bold">Registo</th>
                  <th className="p-3.5 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100 dark:divide-white/10">
                {paginatedCustomers.map((c) => (
                  <tr key={c.id}>
                    <td className="p-3.5">
                      <div className="font-bold text-purple-950 dark:text-white">{c.name}</div>
                      <div className="text-xs text-purple-700/70 dark:text-purple-200/60">
                        {c.username}
                        {c.email ? ` · ${c.email}` : ''}
                      </div>
                    </td>
                    <td className="p-3.5 text-purple-900/80 dark:text-purple-200/80">{c.phone || '—'}</td>
                    <td className="p-3.5 font-black font-mono text-purple-700 dark:text-pink-400">
                      {c.points_balance} pts
                    </td>
                    <td className="p-3.5 font-mono text-xs">{c.referral_code}</td>
                    <td className="p-3.5 font-mono">{c.referrals_count}</td>
                    <td className="p-3.5 text-xs text-purple-700/70 dark:text-purple-200/60">
                      {new Date(c.created_at).toLocaleDateString('pt-PT')}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openCustomerStatement(c)}
                          className="h-8 px-2.5 text-xs font-bold rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-900 dark:text-white cursor-pointer"
                        >
                          Extrato
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPointsModal(c)}
                          className="h-8 px-2.5 text-xs font-bold rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-900 dark:text-white cursor-pointer"
                        >
                          Pontos
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditCustomer(c)}
                          className="h-8 px-2.5 text-xs font-bold rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-900 dark:text-white cursor-pointer"
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingCustomer(c)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 cursor-pointer"
                          aria-label={`Remover cliente ${c.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-purple-700/70 dark:text-purple-200/60">
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {filteredCustomers.length > 0 && (
              <div className="px-4 py-3.5 border-t border-purple-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-purple-50/30 dark:bg-white/[0.02]">
                <div className="flex items-center gap-3 text-xs text-purple-700/80 dark:text-purple-200/75">
                  <span>
                    A mostrar{' '}
                    <strong className="font-bold text-purple-950 dark:text-white">
                      {customerPageStart}–{customerPageEnd}
                    </strong>{' '}
                    de{' '}
                    <strong className="font-bold text-purple-950 dark:text-white">
                      {filteredCustomers.length.toLocaleString('pt-PT')}
                    </strong>{' '}
                    clientes
                  </span>
                  <select
                    value={customerPageSize}
                    onChange={(e) => setCustomerPageSize(Number(e.target.value))}
                    aria-label="Clientes por página"
                    className="h-8 rounded-lg border border-purple-200 dark:border-white/15 bg-white dark:bg-[#12061d] px-2 text-xs font-bold text-purple-950 dark:text-white"
                  >
                    <option value={25}>25 / pág.</option>
                    <option value={50}>50 / pág.</option>
                    <option value={100}>100 / pág.</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={safeCustomerPage <= 1}
                    onClick={() => setCustomerPage((p) => Math.max(1, p - 1))}
                    className="h-8 px-3 text-xs font-bold rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-purple-900 dark:text-white cursor-pointer disabled:opacity-40"
                  >
                    Anterior
                  </Button>
                  <span className="px-2.5 text-xs font-bold font-mono text-purple-900 dark:text-purple-200">
                    {safeCustomerPage} / {totalCustomerPages}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={safeCustomerPage >= totalCustomerPages}
                    onClick={() => setCustomerPage((p) => Math.min(totalCustomerPages, p + 1))}
                    className="h-8 px-3 text-xs font-bold rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-purple-900 dark:text-white cursor-pointer disabled:opacity-40"
                  >
                    Seguinte
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ABA 5: VOUCHERS */}
      {subTab === 'VOUCHERS' && (
        <Card className="rounded-3xl border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] overflow-x-auto shadow-xs">
          <table className="w-full text-sm">
            <thead className="bg-purple-50/60 dark:bg-white/5 text-left text-xs uppercase text-purple-700/80 dark:text-purple-300/70">
              <tr>
                <th className="p-3.5 font-bold">Código</th>
                <th className="p-3.5 font-bold">Prémio</th>
                <th className="p-3.5 font-bold">Cliente</th>
                <th className="p-3.5 font-bold">Loja</th>
                <th className="p-3.5 font-bold">Status</th>
                <th className="p-3.5 font-bold">Validade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100 dark:divide-white/10">
              {(data?.vouchers || []).map((v) => {
                const statusLabelMap: Record<string, string> = {
                  ACTIVE: 'Ativo',
                  REDEEMED: 'Resgatado',
                  EXPIRED: 'Expirado',
                  CANCELLED: 'Cancelado',
                  REFUNDED: 'Estornado',
                }
                const statusLabel = statusLabelMap[v.status] || v.status
                return (
                  <tr key={v.id}>
                    <td className="p-3.5 font-mono text-xs font-bold text-purple-700 dark:text-pink-400">
                      {v.voucher_code}
                    </td>
                    <td className="p-3.5 font-bold text-purple-950 dark:text-white">
                      {v.reward_name}
                    </td>
                    <td className="p-3.5">
                      <div className="font-medium text-purple-950 dark:text-white">
                        {v.customer_name}
                      </div>
                      <div className="text-xs text-purple-700/70 dark:text-purple-200/60">
                        {v.customer_phone}
                      </div>
                    </td>
                    <td className="p-3.5 text-purple-900/80 dark:text-purple-200/80">
                      {v.tenant_name || '—'}
                    </td>
                    <td className="p-3.5">
                      <Badge
                        variant={v.status === 'ACTIVE' ? 'default' : 'secondary'}
                        className={
                          v.status === 'REDEEMED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border-0'
                            : undefined
                        }
                      >
                        {statusLabel}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-xs text-purple-700/70 dark:text-purple-200/60">
                      {new Date(v.expires_at).toLocaleString('pt-PT')}
                    </td>
                  </tr>
                )
              })}
              {!loading && (data?.vouchers || []).length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-purple-700/70 dark:text-purple-200/60">
                    Nenhum voucher emitido ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {/* ABA 6: CLEARING B2B */}
      {subTab === 'CLEARING' && (
        <Card className="rounded-3xl border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] overflow-x-auto shadow-xs">
          <table className="w-full text-sm">
            <thead className="bg-purple-50/60 dark:bg-white/5 text-left text-xs uppercase text-purple-700/80 dark:text-purple-300/70">
              <tr>
                <th className="p-3.5 font-bold">Voucher</th>
                <th className="p-3.5 font-bold">Loja Emissora</th>
                <th className="p-3.5 font-bold">Loja de Resgate</th>
                <th className="p-3.5 font-bold">Valor CMV</th>
                <th className="p-3.5 font-bold">Estado</th>
                <th className="p-3.5 font-bold text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100 dark:divide-white/10">
              {(data?.clearing || []).map((s) => (
                <tr key={s.id}>
                  <td className="p-3.5 font-mono text-xs">{s.voucher_code}</td>
                  <td className="p-3.5">{s.issuing_tenant_name || '—'}</td>
                  <td className="p-3.5">{s.redeeming_tenant_name || '—'}</td>
                  <td className="p-3.5 font-black font-mono">
                    {Number(s.cost_amount).toFixed(2).replace('.', ',')} €
                  </td>
                  <td className="p-3.5">
                    <Badge variant={s.status === 'PENDING' ? 'destructive' : 'secondary'}>
                      {s.status === 'PENDING' ? 'Pendente' : 'Liquidado'}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-right">
                    {s.status === 'PENDING' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSettleClearing(s.id)}
                        className="h-8 px-3 text-xs font-bold rounded-xl border-purple-200 dark:border-white/15 cursor-pointer"
                      >
                        Liquidar
                      </Button>
                    ) : (
                      <span className="text-xs text-purple-700/60 dark:text-purple-200/50">
                        {s.settled_at ? new Date(s.settled_at).toLocaleDateString('pt-PT') : 'OK'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && (data?.clearing || []).length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-purple-700/70 dark:text-purple-200/60">
                    Sem acertos entre lojas registados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {/* ABA 7: NOTIFICAÇÕES PUSH */}
      {subTab === 'PUSH' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <Card className="lg:col-span-7 rounded-3xl border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] p-6 space-y-5 shadow-xs">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-black text-purple-950 dark:text-white">
                    Enviar Notificação Push para a App
                  </h2>
                  <p className="text-xs sm:text-sm text-purple-700/80 dark:text-purple-200/70 mt-1">
                    Notificações transacionais (pontos ganhos, vouchers validados, aniversário e
                    estornos) são enviadas automaticamente.
                  </p>
                </div>
                <Badge className="bg-purple-100 dark:bg-pink-500/20 text-purple-800 dark:text-pink-300 border-0 font-mono font-bold shrink-0">
                  {data?.stats.push_enabled_customers ?? 0} dispositivos ativos
                </Badge>
              </div>

              <form onSubmit={handleSendPush} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                    Público-alvo
                  </label>
                  <select
                    value={pushTenantId}
                    onChange={(e) => setPushTenantId(e.target.value)}
                    className="w-full h-10 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#12061d] px-3 text-sm text-purple-950 dark:text-white"
                  >
                    <option value="">Todos os clientes da rede (Global)</option>
                    {(data?.tenants || []).map((t) => (
                      <option key={t.id} value={t.id}>
                        Clientes com loja preferida: {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                    Título
                  </label>
                  <Input
                    placeholder="Ex: Hoje há Pontos em Dobro na Açaí da Rose!"
                    value={pushTitle}
                    onChange={(e) => setPushTitle(e.target.value)}
                    maxLength={80}
                    required
                    className="rounded-xl border-purple-200 dark:border-white/15"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                    Mensagem
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ex: Passa ao balcão até às 22h e acumula 2x pontos no teu Copo favorito."
                    value={pushBody}
                    onChange={(e) => setPushBody(e.target.value)}
                    maxLength={240}
                    required
                    className="w-full rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#12061d] px-3 py-2 text-sm text-purple-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                    Imagem (opcional)
                  </label>
                  <div className="flex items-center gap-2.5">
                    <label className="flex-1 inline-flex items-center justify-center h-11 px-4 rounded-xl border border-dashed border-purple-300 dark:border-white/20 bg-purple-50/40 dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-xs font-bold text-purple-900 dark:text-white cursor-pointer transition-colors">
                      <span>
                        {uploadingPushImg
                          ? 'A carregar imagem...'
                          : pushImageUrl
                            ? 'Alterar Imagem'
                            : 'Carregar Imagem'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingPushImg}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleUploadPushImage(file, (url) => setPushImageUrl(url))
                          }
                          e.target.value = ''
                        }}
                      />
                    </label>
                    {pushImageUrl ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setPushImageUrl('')}
                        className="h-11 px-3.5 rounded-xl border-red-200 dark:border-red-500/30 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer shrink-0"
                      >
                        Remover
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="submit"
                    disabled={sendingPush}
                    className="h-10 px-5 bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-md"
                  >
                    {sendingPush ? 'A enviar...' : 'Enviar Notificação Push'}
                  </Button>
                </div>
              </form>
            </Card>

            <Card className="lg:col-span-5 rounded-3xl border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-black text-purple-950 dark:text-white">
                  Pré-visualização na App
                </h3>
                <span className="text-[11px] font-bold text-purple-700/75 dark:text-purple-200/70 truncate">
                  {pushTenantId
                    ? data?.tenants.find((t) => t.id === pushTenantId)?.name || 'Loja selecionada'
                    : 'Toda a Rede'}
                </span>
              </div>

              <div className="rounded-2xl border border-purple-150 dark:border-white/15 bg-purple-50/40 dark:bg-[#12061d] overflow-hidden">
                {pushImageUrl ? (
                  <img
                    src={pushImageUrl}
                    alt="Pré-visualização da notificação"
                    className="w-full h-44 object-cover border-b border-purple-150 dark:border-white/10"
                  />
                ) : (
                  <div className="w-full h-36 flex items-center justify-center bg-purple-100/50 dark:bg-white/5 border-b border-purple-150 dark:border-white/10 px-4 text-center">
                    <span className="text-xs font-medium text-purple-700/60 dark:text-purple-200/50">
                      Sem imagem anexada
                    </span>
                  </div>
                )}

                <div className="p-4 space-y-1.5">
                  <div className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-pink-400">
                    Açaí da Rose · Cashback
                  </div>
                  <div className="text-sm font-black text-purple-950 dark:text-white leading-snug break-words">
                    {pushTitle.trim() || 'Título da notificação'}
                  </div>
                  <p className="text-xs text-purple-800/80 dark:text-purple-200/75 leading-relaxed whitespace-pre-wrap break-words">
                    {pushBody.trim() || 'A mensagem da campanha ou promoção aparecerá aqui.'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="rounded-3xl border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] overflow-x-auto shadow-xs">
            <div className="px-5 py-3.5 border-b border-purple-100 dark:border-white/10">
              <h3 className="text-sm font-black text-purple-950 dark:text-white">
                Histórico de Disparos Push
              </h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-purple-50/60 dark:bg-white/5 text-left text-xs uppercase text-purple-700/80 dark:text-purple-300/70">
                <tr>
                  <th className="p-3.5 font-bold">Data</th>
                  <th className="p-3.5 font-bold">Notificação</th>
                  <th className="p-3.5 font-bold">Público</th>
                  <th className="p-3.5 font-bold">Entregues</th>
                  <th className="p-3.5 font-bold">Enviado por</th>
                  <th className="p-3.5 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100 dark:divide-white/10">
                {(data?.push_logs || []).map((log) => (
                  <tr key={log.id}>
                    <td className="p-3.5 text-xs text-purple-700/75 dark:text-purple-200/70 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('pt-PT')}
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        {log.image_url ? (
                          <img
                            src={log.image_url}
                            alt={log.title}
                            className="w-11 h-11 rounded-xl object-cover border border-purple-150 dark:border-white/10 shrink-0"
                          />
                        ) : null}
                        <div>
                          <div className="font-bold text-purple-950 dark:text-white">{log.title}</div>
                          <div className="text-xs text-purple-700/70 dark:text-purple-200/60">
                            {log.body}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-xs text-purple-900/80 dark:text-purple-200/80">
                      {log.tenant_name || 'Toda a Rede'}
                    </td>
                    <td className="p-3.5 font-mono text-xs font-bold text-purple-700 dark:text-pink-400">
                      {log.sent_count} / {log.total_targeted}
                    </td>
                    <td className="p-3.5 text-xs text-purple-700/75 dark:text-purple-200/70">
                      {log.sent_by_name || 'Franqueadora'}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={resendingPushId === log.id}
                          onClick={() => handleResendPush(log)}
                          className="h-8 px-2.5 text-xs font-bold rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-900 dark:text-white cursor-pointer"
                        >
                          {resendingPushId === log.id ? '...' : 'Reenviar'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditPush(log)}
                          className="h-8 px-2.5 text-xs font-bold rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-900 dark:text-white cursor-pointer"
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePush(log.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 cursor-pointer"
                          aria-label={`Excluir notificação ${log.title}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && (data?.push_logs || []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-purple-700/70 dark:text-purple-200/60">
                      Nenhum disparo de notificação push registado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* MODAL: AJUSTAR PONTOS DO CLIENTE */}
      <Dialog open={Boolean(pointsCustomer)} onOpenChange={(open) => !open && setPointsCustomer(null)}>
        <DialogContent className="max-w-md p-6 bg-white dark:bg-[#160228] border border-purple-150 dark:border-white/15 text-purple-950 dark:text-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-purple-950 dark:text-white">
              Ajustar Pontos — {pointsCustomer?.name}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAdjustPoints} className="space-y-4 pt-2">
            <div className="rounded-2xl bg-purple-50/70 dark:bg-white/5 border border-purple-150 dark:border-white/10 p-3.5 flex items-center justify-between">
              <span className="text-xs font-bold text-purple-700/80 dark:text-purple-200/70">
                Saldo atual
              </span>
              <span className="text-lg font-black font-mono text-purple-950 dark:text-white">
                {pointsCustomer?.points_balance ?? 0} pts
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 bg-purple-50/70 dark:bg-white/5 rounded-2xl border border-purple-150 dark:border-white/10">
              <button
                type="button"
                onClick={() => setPointsMode('ADD')}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${pointsMode === 'ADD'
                  ? 'bg-gradient-to-r from-purple-700 to-pink-600 text-white shadow-xs'
                  : 'text-purple-900 dark:text-purple-200'
                  }`}
              >
                Adicionar Pontos (+)
              </button>
              <button
                type="button"
                onClick={() => setPointsMode('REMOVE')}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${pointsMode === 'REMOVE'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-purple-900 dark:text-purple-200'
                  }`}
              >
                Remover Pontos (-)
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                Quantidade de pontos
              </label>
              <Input
                type="number"
                min={1}
                placeholder="Ex: 50"
                value={pointsAmount}
                onChange={(e) => setPointsAmount(e.target.value)}
                required
                className="rounded-xl border-purple-200 dark:border-white/15 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                Motivo (aparece no extrato do cliente)
              </label>
              <Input
                placeholder="Ex: Bónus de cortesia / Correção de compra"
                value={pointsReason}
                onChange={(e) => setPointsReason(e.target.value)}
                className="rounded-xl border-purple-200 dark:border-white/15"
              />
            </div>

            <DialogFooter className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPointsCustomer(null)}
                disabled={savingPoints}
                className="rounded-xl cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={savingPoints}
                className="bg-gradient-to-r from-purple-700 to-pink-600 text-white text-xs font-black rounded-xl cursor-pointer"
              >
                {savingPoints ? 'A guardar...' : 'Confirmar Ajuste'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDITAR DADOS & PALAVRA-PASSE DO CLIENTE */}
      <Dialog open={Boolean(editingCustomer)} onOpenChange={(open) => !open && setEditingCustomer(null)}>
        <DialogContent className="max-w-lg p-6 bg-white dark:bg-[#160228] border border-purple-150 dark:border-white/15 text-purple-950 dark:text-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-purple-950 dark:text-white">
              Editar Cliente — {editingCustomer?.name}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveCustomer} className="space-y-3.5 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                  Nome Completo
                </label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  className="rounded-xl border-purple-200 dark:border-white/15"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                  @username
                </label>
                <Input
                  value={editForm.username}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, username: e.target.value }))}
                  required
                  className="rounded-xl border-purple-200 dark:border-white/15"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                  Telemóvel
                </label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                  required
                  className="rounded-xl border-purple-200 dark:border-white/15"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="rounded-xl border-purple-200 dark:border-white/15"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                  NIF (opcional)
                </label>
                <Input
                  value={editForm.nif}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, nif: e.target.value }))}
                  className="rounded-xl border-purple-200 dark:border-white/15"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                  Loja Preferida
                </label>
                <select
                  value={editForm.tenant_id}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, tenant_id: e.target.value }))}
                  className="w-full h-10 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#12061d] px-3 text-sm text-purple-950 dark:text-white"
                >
                  <option value="">Sem loja definida</option>
                  {(data?.tenants || []).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t border-purple-100 dark:border-white/10 pt-3">
              <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                Nova Palavra-passe (deixe em branco para manter a atual)
              </label>
              <Input
                type="password"
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                value={editForm.new_password}
                onChange={(e) => setEditForm((prev) => ({ ...prev, new_password: e.target.value }))}
                className="rounded-xl border-purple-200 dark:border-white/15"
              />
            </div>

            <DialogFooter className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingCustomer(null)}
                disabled={savingCustomer}
                className="rounded-xl cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={savingCustomer}
                className="bg-gradient-to-r from-purple-700 to-pink-600 text-white text-xs font-black rounded-xl cursor-pointer"
              >
                {savingCustomer ? 'A guardar...' : 'Guardar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: CONFIRMAR REMOÇÃO DO CLIENTE */}
      <ConfirmActionDialog
        open={Boolean(deletingCustomer)}
        onOpenChange={(open) => !open && setDeletingCustomer(null)}
        title="Remover Cliente de Cashback"
        description={
          deletingCustomer
            ? `Tem a certeza que pretende remover ${deletingCustomer.name} (${deletingCustomer.phone || deletingCustomer.email || deletingCustomer.username})? O acesso à app será revogado e os dados ficarão disponíveis para novo registo.`
            : undefined
        }
        confirmLabel="Remover Cliente"
        cancelLabel="Cancelar"
        variant="destructive"
        loading={deletingCustomerLoading}
        onConfirm={handleDeleteCustomer}
      />

      {/* MODAL: EDITAR PRÉMIO */}
      <Dialog open={Boolean(editingReward)} onOpenChange={(open) => !open && setEditingReward(null)}>
        <DialogContent className="max-w-lg p-6 bg-white dark:bg-[#160228] border border-purple-150 dark:border-white/15 text-purple-950 dark:text-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-purple-950 dark:text-white">
              Editar Prémio
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEditReward} className="space-y-3.5 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                  Nome do Prémio
                </label>
                <Input
                  value={editRewardForm.name}
                  onChange={(e) => setEditRewardForm((p) => ({ ...p, name: e.target.value }))}
                  required
                  className="rounded-xl border-purple-200 dark:border-white/15"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                  Custo em Pontos
                </label>
                <Input
                  type="number"
                  min={1}
                  value={editRewardForm.points_cost}
                  onChange={(e) => setEditRewardForm((p) => ({ ...p, points_cost: e.target.value }))}
                  required
                  className="rounded-xl border-purple-200 dark:border-white/15 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                  Categoria
                </label>
                <select
                  value={editRewardForm.category}
                  onChange={(e) => setEditRewardForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full h-10 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#12061d] px-3 text-sm text-purple-950 dark:text-white"
                >
                  <option value="COPOS">Copos</option>
                  <option value="ADICIONAIS">Adicionais</option>
                  <option value="POTES">Taças / Potes</option>
                  <option value="ESPECIAIS">Especiais / Outros</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                  Âmbito
                </label>
                <select
                  value={editRewardForm.tenant_id}
                  onChange={(e) => setEditRewardForm((p) => ({ ...p, tenant_id: e.target.value }))}
                  className="w-full h-10 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#12061d] px-3 text-sm text-purple-950 dark:text-white"
                >
                  <option value="">Toda a Rede (Global)</option>
                  {(data?.tenants || []).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                Descrição (opcional)
              </label>
              <Input
                value={editRewardForm.description}
                onChange={(e) => setEditRewardForm((p) => ({ ...p, description: e.target.value }))}
                className="rounded-xl border-purple-200 dark:border-white/15"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                Imagem do Prémio (opcional)
              </label>
              <div className="flex items-center gap-2">
                <label className="flex-1 inline-flex items-center justify-center h-10 px-3.5 rounded-xl border border-dashed border-purple-300 dark:border-white/20 bg-purple-50/40 dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-xs font-bold text-purple-900 dark:text-white cursor-pointer transition-colors">
                  <span>
                    {uploadingRewardImg
                      ? 'A carregar...'
                      : editRewardForm.image_url
                        ? 'Alterar Imagem'
                        : 'Carregar Imagem'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingRewardImg}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleUploadRewardImage(file, (url) =>
                          setEditRewardForm((p) => ({ ...p, image_url: url }))
                        )
                      }
                      e.target.value = ''
                    }}
                  />
                </label>
                {editRewardForm.image_url ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setEditRewardForm((p) => ({ ...p, image_url: '' }))}
                    className="h-10 px-3 rounded-xl border-red-200 dark:border-red-500/30 text-xs font-bold text-red-600 hover:text-red-700 cursor-pointer shrink-0"
                  >
                    Remover
                  </Button>
                ) : null}
              </div>
              {editRewardForm.image_url ? (
                <img
                  src={editRewardForm.image_url}
                  alt="Pré-visualização do prémio"
                  className="mt-2.5 w-full h-32 rounded-xl object-cover border border-purple-200 dark:border-white/15"
                />
              ) : null}
            </div>
            <DialogFooter className="pt-2 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingReward(null)} className="rounded-xl cursor-pointer">
                Cancelar
              </Button>
              <Button type="submit" disabled={savingEditReward} className="bg-gradient-to-r from-purple-700 to-pink-600 text-white text-xs font-black rounded-xl cursor-pointer">
                {savingEditReward ? 'A guardar...' : 'Guardar Prémio'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDITAR CAMPANHA / DESTAQUE */}
      <Dialog open={Boolean(editingCampaign)} onOpenChange={(open) => !open && setEditingCampaign(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-6 bg-white dark:bg-[#160228] border border-purple-150 dark:border-white/15 text-purple-950 dark:text-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-purple-950 dark:text-white">
              Editar Campanha / Destaque
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEditCampaign} className="space-y-3.5 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                Tipo
              </label>
              <select
                value={editCampaignForm.campaign_type}
                onChange={(e) =>
                  setEditCampaignForm((p) => ({
                    ...p,
                    campaign_type: e.target.value as 'MULTIPLIER' | 'HIGHLIGHT' | 'AD',
                  }))
                }
                className="w-full h-10 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#12061d] px-3 text-sm text-purple-950 dark:text-white"
              >
                <option value="MULTIPLIER">Multiplicador de Pontos</option>
                <option value="HIGHLIGHT">Destaque / Novidade</option>
                <option value="AD">Publicidade / Link</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                  Título
                </label>
                <Input
                  value={editCampaignForm.title}
                  onChange={(e) => setEditCampaignForm((p) => ({ ...p, title: e.target.value }))}
                  required
                  className="rounded-xl border-purple-200 dark:border-white/15"
                />
              </div>
              {editCampaignForm.campaign_type === 'MULTIPLIER' && (
                <div>
                  <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                    Multiplicador
                  </label>
                  <Input
                    type="number"
                    step="0.5"
                    min={1}
                    value={editCampaignForm.multiplier}
                    onChange={(e) =>
                      setEditCampaignForm((p) => ({ ...p, multiplier: e.target.value }))
                    }
                    required
                    className="rounded-xl border-purple-200 dark:border-white/15 font-mono"
                  />
                </div>
              )}
              <div className={editCampaignForm.campaign_type === 'MULTIPLIER' ? '' : 'sm:col-span-2'}>
                <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                  Âmbito
                </label>
                <select
                  value={editCampaignForm.tenant_id}
                  onChange={(e) => setEditCampaignForm((p) => ({ ...p, tenant_id: e.target.value }))}
                  className="w-full h-10 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#12061d] px-3 text-sm text-purple-950 dark:text-white"
                >
                  <option value="">Toda a Rede (Global)</option>
                  {(data?.tenants || []).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                  Data de Início
                </label>
                <Input
                  type="date"
                  value={editCampaignForm.start_date}
                  onChange={(e) => setEditCampaignForm((p) => ({ ...p, start_date: e.target.value }))}
                  required
                  className="rounded-xl border-purple-200 dark:border-white/15"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                  Data de Fim
                </label>
                <Input
                  type="date"
                  value={editCampaignForm.end_date}
                  onChange={(e) => setEditCampaignForm((p) => ({ ...p, end_date: e.target.value }))}
                  required
                  className="rounded-xl border-purple-200 dark:border-white/15"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                Subtítulo / Resumo (opcional)
              </label>
              <Input
                value={editCampaignForm.subtitle}
                onChange={(e) => setEditCampaignForm((p) => ({ ...p, subtitle: e.target.value }))}
                className="rounded-xl border-purple-200 dark:border-white/15"
              />
            </div>
            {editCampaignForm.campaign_type !== 'AD' && (
              <div>
                <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                  Texto completo (opcional)
                </label>
                <textarea
                  rows={3}
                  value={editCampaignForm.content}
                  onChange={(e) => setEditCampaignForm((p) => ({ ...p, content: e.target.value }))}
                  className="w-full rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#12061d] px-3 py-2 text-sm text-purple-950 dark:text-white"
                />
              </div>
            )}
            {editCampaignForm.campaign_type !== 'MULTIPLIER' && (
              <div>
                <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                  Link de destino (opcional)
                </label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={editCampaignForm.link_url}
                  onChange={(e) => setEditCampaignForm((p) => ({ ...p, link_url: e.target.value }))}
                  className="rounded-xl border-purple-200 dark:border-white/15"
                />
              </div>
            )}
            <div>
              <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                Imagem (opcional)
              </label>
              <div className="flex items-center gap-2">
                <label className="flex-1 inline-flex items-center justify-center h-10 px-3.5 rounded-xl border border-dashed border-purple-300 dark:border-white/20 bg-purple-50/40 dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-xs font-bold text-purple-900 dark:text-white cursor-pointer transition-colors">
                  <span>
                    {uploadingCampImg
                      ? 'A carregar...'
                      : editCampaignForm.banner_url
                        ? 'Alterar Imagem'
                        : 'Carregar Imagem'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingCampImg}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleUploadCampaignImage(file, (url) =>
                          setEditCampaignForm((p) => ({ ...p, banner_url: url }))
                        )
                      }
                      e.target.value = ''
                    }}
                  />
                </label>
                {editCampaignForm.banner_url ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setEditCampaignForm((p) => ({ ...p, banner_url: '' }))}
                    className="h-10 px-3 rounded-xl border-red-200 dark:border-red-500/30 text-xs font-bold text-red-600 hover:text-red-700 cursor-pointer shrink-0"
                  >
                    Remover
                  </Button>
                ) : null}
              </div>
              {editCampaignForm.banner_url ? (
                <img
                  src={editCampaignForm.banner_url}
                  alt="Pré-visualização"
                  className="mt-2.5 w-full h-32 rounded-xl object-cover border border-purple-200 dark:border-white/15"
                />
              ) : null}
            </div>
            <DialogFooter className="pt-2 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingCampaign(null)} className="rounded-xl cursor-pointer">
                Cancelar
              </Button>
              <Button type="submit" disabled={savingEditCampaign} className="bg-gradient-to-r from-purple-700 to-pink-600 text-white text-xs font-black rounded-xl cursor-pointer">
                {savingEditCampaign ? 'A guardar...' : 'Guardar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: EXTRATO DO CLIENTE COM FILTROS */}
      <Dialog open={Boolean(statementCustomer)} onOpenChange={(open) => !open && setStatementCustomer(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6 bg-white dark:bg-[#160228] border border-purple-150 dark:border-white/15 text-purple-950 dark:text-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-purple-950 dark:text-white">
              Extrato de Cashback — {statementCustomer?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-purple-100 dark:border-white/10">
            <div className="flex items-center gap-1 p-1 bg-purple-50/70 dark:bg-white/5 rounded-xl border border-purple-150 dark:border-white/10">
              {(['ALL', 'CREDIT', 'DEBIT'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setStatementTypeFilter(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${statementTypeFilter === t
                    ? 'bg-gradient-to-r from-purple-700 to-pink-600 text-white'
                    : 'text-purple-900 dark:text-purple-200'
                    }`}
                >
                  {t === 'ALL' ? 'Todos' : t === 'CREDIT' ? 'Créditos' : 'Débitos'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 p-1 bg-purple-50/70 dark:bg-white/5 rounded-xl border border-purple-150 dark:border-white/10">
              {(['ALL', '30D', '90D'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setStatementPeriodFilter(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${statementPeriodFilter === p
                    ? 'bg-purple-900 dark:bg-pink-600 text-white'
                    : 'text-purple-900 dark:text-purple-200'
                    }`}
                >
                  {p === 'ALL' ? 'Todo o período' : p === '30D' ? '30 dias' : '90 dias'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-purple-100 dark:divide-white/10 pr-1">
            {statementLoading ? (
              <div className="p-6 text-center text-xs text-purple-700/70 dark:text-purple-200/60">
                A carregar extrato...
              </div>
            ) : filteredStatementTransactions.length === 0 ? (
              <div className="p-6 text-center text-xs text-purple-700/70 dark:text-purple-200/60">
                Sem movimentos para o filtro selecionado.
              </div>
            ) : (
              filteredStatementTransactions.map((tx) => (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-purple-950 dark:text-white">
                      {tx.description}
                    </div>
                    <div className="text-[11px] text-purple-700/70 dark:text-purple-200/60">
                      {new Date(tx.created_at).toLocaleString('pt-PT')}
                      {tx.tenant_name ? ` · ${tx.tenant_name}` : ''}
                    </div>
                  </div>
                  <div
                    className={`text-sm font-black font-mono shrink-0 ${tx.type === 'CREDIT'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                      }`}
                  >
                    {tx.type === 'CREDIT' ? '+' : '-'}
                    {tx.points} pts
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDITAR NOTIFICAÇÃO PUSH */}
      <Dialog open={Boolean(editingPush)} onOpenChange={(open) => !open && setEditingPush(null)}>
        <DialogContent className="max-w-lg p-6 bg-white dark:bg-[#160228] border border-purple-150 dark:border-white/15 text-purple-950 dark:text-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-purple-950 dark:text-white">
              Editar Notificação Push
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEditPush} className="space-y-4 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                Público-alvo
              </label>
              <select
                value={editPushForm.tenant_id}
                onChange={(e) => setEditPushForm((p) => ({ ...p, tenant_id: e.target.value }))}
                className="w-full h-10 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#12061d] px-3 text-sm text-purple-950 dark:text-white"
              >
                <option value="">Todos os clientes da rede (Global)</option>
                {(data?.tenants || []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                Título
              </label>
              <Input
                value={editPushForm.title}
                onChange={(e) => setEditPushForm((p) => ({ ...p, title: e.target.value }))}
                maxLength={80}
                required
                className="rounded-xl border-purple-200 dark:border-white/15"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                Mensagem
              </label>
              <textarea
                rows={3}
                value={editPushForm.body}
                onChange={(e) => setEditPushForm((p) => ({ ...p, body: e.target.value }))}
                maxLength={240}
                required
                className="w-full rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#12061d] px-3 py-2 text-sm text-purple-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                Imagem (opcional)
              </label>
              <div className="flex items-center gap-2">
                <label className="flex-1 inline-flex items-center justify-center h-10 px-3.5 rounded-xl border border-dashed border-purple-300 dark:border-white/20 bg-purple-50/40 dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-xs font-bold text-purple-900 dark:text-white cursor-pointer transition-colors">
                  <span>
                    {uploadingPushImg
                      ? 'A carregar imagem...'
                      : editPushForm.image_url
                        ? 'Alterar Imagem'
                        : 'Carregar Imagem'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingPushImg}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleUploadPushImage(file, (url) =>
                          setEditPushForm((p) => ({ ...p, image_url: url }))
                        )
                      }
                      e.target.value = ''
                    }}
                  />
                </label>
                {editPushForm.image_url ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setEditPushForm((p) => ({ ...p, image_url: '' }))}
                    className="h-10 px-3 rounded-xl border-red-200 dark:border-red-500/30 text-xs font-bold text-red-600 hover:text-red-700 cursor-pointer shrink-0"
                  >
                    Remover
                  </Button>
                ) : null}
              </div>
              {editPushForm.image_url ? (
                <img
                  src={editPushForm.image_url}
                  alt="Pré-visualização"
                  className="mt-2.5 w-full h-32 rounded-xl object-cover border border-purple-200 dark:border-white/15"
                />
              ) : null}
            </div>
            <DialogFooter className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingPush(null)}
                className="rounded-xl cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={savingEditPush}
                className="bg-gradient-to-r from-purple-700 to-pink-600 text-white text-xs font-black rounded-xl cursor-pointer"
              >
                {savingEditPush ? 'A guardar...' : 'Guardar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: PERSONALIZAR APRESENTAÇÃO DA APP (4 CENAS DE VÍDEO) */}
      <Dialog open={presentationOpen} onOpenChange={setPresentationOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6 bg-white dark:bg-[#160228] border border-purple-150 dark:border-white/15 text-purple-950 dark:text-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-purple-950 dark:text-white">
              Personalizar Apresentação da App
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSavePresentation} className="space-y-5 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-purple-50/80 dark:bg-white/5 rounded-2xl border border-purple-150 dark:border-white/10">
                {presentationScenes.map((scene, idx) => (
                  <button
                    key={`${scene.index}-${idx}`}
                    type="button"
                    onClick={() => setPresentationSceneIdx(idx)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      presentationSceneIdx === idx
                        ? 'bg-gradient-to-r from-purple-700 to-pink-600 text-white shadow-xs'
                        : 'text-purple-900 dark:text-purple-200 hover:bg-purple-100/60 dark:hover:bg-white/5'
                    }`}
                  >
                    Cena {idx + 1}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={presentationScenes.length >= 10}
                  onClick={() => {
                    const nextIdx = presentationScenes.length
                    setPresentationScenes((prev) => [
                      ...prev,
                      {
                        index: nextIdx,
                        title: '',
                        subtitle: '',
                        video_url: null,
                        title_font: 'system',
                        title_size: 38,
                        title_color: '#FFFFFF',
                        subtitle_font: 'system',
                        subtitle_size: 16,
                        subtitle_color: '#F5E8FA',
                      },
                    ])
                    setPresentationSceneIdx(nextIdx)
                  }}
                  className="h-9 px-3 text-xs font-bold rounded-xl border-purple-200 dark:border-white/15 cursor-pointer"
                >
                  + Nova Cena
                </Button>
                {presentationScenes.length > 1 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const nextScenes = presentationScenes
                        .filter((_, idx) => idx !== presentationSceneIdx)
                        .map((s, idx) => ({ ...s, index: idx }))
                      setPresentationScenes(nextScenes)
                      setPresentationSceneIdx(Math.max(0, Math.min(presentationSceneIdx, nextScenes.length - 1)))
                    }}
                    className="h-9 px-3 text-xs font-bold rounded-xl border-red-200 dark:border-red-500/30 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                  >
                    Excluir Cena
                  </Button>
                )}
              </div>
            </div>

            {(() => {
              const activeScene = presentationScenes[presentationSceneIdx]
              if (!activeScene) return null
              const resolvePreviewFont = (fontKey: string) => {
                if (fontKey === 'serif') return 'Georgia, "Times New Roman", serif'
                if (fontKey === 'mono') return '"Courier New", ui-monospace, monospace'
                if (fontKey === 'rounded') return '"Trebuchet MS", "Arial Rounded MT Bold", sans-serif'
                return 'inherit'
              }
              return (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                  <div className="md:col-span-7 space-y-4">
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80">
                        Título da Cena {presentationSceneIdx + 1}
                      </label>
                      <textarea
                        rows={2}
                        value={activeScene.title}
                        onChange={(e) =>
                          setPresentationScenes((prev) =>
                            prev.map((s, idx) =>
                              idx === presentationSceneIdx ? { ...s, title: e.target.value } : s
                            )
                          )
                        }
                        placeholder="Ex: AÇAÍ NÃO SE EXPLICA"
                        required
                        className="w-full rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#12061d] px-3 py-2 text-sm font-bold text-purple-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-purple-700/75 dark:text-purple-200/65 mb-0.5">
                            Fonte
                          </label>
                          <select
                            value={activeScene.title_font}
                            onChange={(e) =>
                              setPresentationScenes((prev) =>
                                prev.map((s, idx) =>
                                  idx === presentationSceneIdx
                                    ? { ...s, title_font: e.target.value }
                                    : s
                                )
                              )
                            }
                            className="w-full h-9 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#12061d] px-2 text-xs text-purple-950 dark:text-white"
                          >
                            <option value="system">Padrão (Sans)</option>
                            <option value="serif">Elegante (Serif)</option>
                            <option value="rounded">Suave (Rounded)</option>
                            <option value="mono">Moderna (Mono)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-purple-700/75 dark:text-purple-200/65 mb-0.5">
                            Tamanho (px)
                          </label>
                          <Input
                            type="number"
                            min={18}
                            max={64}
                            value={activeScene.title_size}
                            onChange={(e) =>
                              setPresentationScenes((prev) =>
                                prev.map((s, idx) =>
                                  idx === presentationSceneIdx
                                    ? { ...s, title_size: Number(e.target.value) || 38 }
                                    : s
                                )
                              )
                            }
                            className="h-9 rounded-xl border-purple-200 dark:border-white/15 font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-purple-700/75 dark:text-purple-200/65 mb-0.5">
                            Cor
                          </label>
                          <label className="flex items-center gap-2 h-9 px-2 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#12061d] cursor-pointer">
                            <input
                              type="color"
                              value={activeScene.title_color}
                              onChange={(e) =>
                                setPresentationScenes((prev) =>
                                  prev.map((s, idx) =>
                                    idx === presentationSceneIdx
                                      ? { ...s, title_color: e.target.value }
                                      : s
                                  )
                                )
                              }
                              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                            />
                            <span className="text-[11px] font-mono text-purple-900 dark:text-purple-100 uppercase">
                              {activeScene.title_color}
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80">
                        Descrição da Cena {presentationSceneIdx + 1}
                      </label>
                      <textarea
                        rows={3}
                        value={activeScene.subtitle}
                        onChange={(e) =>
                          setPresentationScenes((prev) =>
                            prev.map((s, idx) =>
                              idx === presentationSceneIdx ? { ...s, subtitle: e.target.value } : s
                            )
                          )
                        }
                        placeholder="Descrição exibida abaixo do título..."
                        className="w-full rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#12061d] px-3 py-2 text-sm text-purple-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-purple-700/75 dark:text-purple-200/65 mb-0.5">
                            Fonte
                          </label>
                          <select
                            value={activeScene.subtitle_font}
                            onChange={(e) =>
                              setPresentationScenes((prev) =>
                                prev.map((s, idx) =>
                                  idx === presentationSceneIdx
                                    ? { ...s, subtitle_font: e.target.value }
                                    : s
                                )
                              )
                            }
                            className="w-full h-9 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#12061d] px-2 text-xs text-purple-950 dark:text-white"
                          >
                            <option value="system">Padrão (Sans)</option>
                            <option value="serif">Elegante (Serif)</option>
                            <option value="rounded">Suave (Rounded)</option>
                            <option value="mono">Moderna (Mono)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-purple-700/75 dark:text-purple-200/65 mb-0.5">
                            Tamanho (px)
                          </label>
                          <Input
                            type="number"
                            min={11}
                            max={32}
                            value={activeScene.subtitle_size}
                            onChange={(e) =>
                              setPresentationScenes((prev) =>
                                prev.map((s, idx) =>
                                  idx === presentationSceneIdx
                                    ? { ...s, subtitle_size: Number(e.target.value) || 16 }
                                    : s
                                )
                              )
                            }
                            className="h-9 rounded-xl border-purple-200 dark:border-white/15 font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-purple-700/75 dark:text-purple-200/65 mb-0.5">
                            Cor
                          </label>
                          <label className="flex items-center gap-2 h-9 px-2 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#12061d] cursor-pointer">
                            <input
                              type="color"
                              value={activeScene.subtitle_color}
                              onChange={(e) =>
                                setPresentationScenes((prev) =>
                                  prev.map((s, idx) =>
                                    idx === presentationSceneIdx
                                      ? { ...s, subtitle_color: e.target.value }
                                      : s
                                  )
                                )
                              }
                              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                            />
                            <span className="text-[11px] font-mono text-purple-900 dark:text-purple-100 uppercase">
                              {activeScene.subtitle_color}
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1">
                        Vídeo de Fundo da Cena {presentationSceneIdx + 1}
                      </label>
                      <div className="flex items-center gap-2">
                        <label className="flex-1 inline-flex items-center justify-center h-11 px-4 rounded-xl border border-dashed border-purple-300 dark:border-white/20 bg-purple-50/40 dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-xs font-bold text-purple-900 dark:text-white cursor-pointer transition-colors">
                          <span>
                            {uploadingPresentationVideo
                              ? 'A carregar vídeo...'
                              : activeScene.video_url
                                ? 'Alterar Vídeo'
                                : 'Carregar Vídeo'}
                          </span>
                          <input
                            type="file"
                            accept="video/*"
                            className="hidden"
                            disabled={uploadingPresentationVideo}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleUploadPresentationVideo(file, presentationSceneIdx)
                              }
                              e.target.value = ''
                            }}
                          />
                        </label>
                        {activeScene.video_url ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setPresentationScenes((prev) =>
                                prev.map((s, idx) =>
                                  idx === presentationSceneIdx ? { ...s, video_url: null } : s
                                )
                              )
                            }
                            className="h-11 px-3 rounded-xl border-red-200 dark:border-red-500/30 text-xs font-bold text-red-600 hover:text-red-700 cursor-pointer shrink-0"
                          >
                            Usar Padrão
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-5">
                    <div className="text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 mb-1.5">
                      Pré-visualização — Cena {presentationSceneIdx + 1}
                    </div>
                    <div className="relative rounded-2xl overflow-hidden border border-purple-200 dark:border-white/15 bg-[#11011c] aspect-[9/14] flex flex-col justify-end p-4">
                      {(() => {
                        const previewVideoSrc =
                          activeScene.video_url ||
                          (presentationSceneIdx < DEFAULT_PRESENTATION_VIDEOS.length
                            ? DEFAULT_PRESENTATION_VIDEOS[presentationSceneIdx]
                            : null)
                        return previewVideoSrc ? (
                          <video
                            key={previewVideoSrc}
                            src={previewVideoSrc}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
                            <span className="text-xs font-medium text-purple-200/60">
                              Nenhum vídeo carregado
                            </span>
                          </div>
                        )
                      })()}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/30" />
                      <div className="relative z-10 space-y-1.5">
                        <div
                          className="font-black leading-tight whitespace-pre-line break-words"
                          style={{
                            fontFamily: resolvePreviewFont(activeScene.title_font),
                            fontSize: `${Math.max(14, Math.round(activeScene.title_size * 0.55))}px`,
                            color: activeScene.title_color,
                          }}
                        >
                          {activeScene.title || `Cena ${presentationSceneIdx + 1}`}
                        </div>
                        <p
                          className="leading-relaxed break-words"
                          style={{
                            fontFamily: resolvePreviewFont(activeScene.subtitle_font),
                            fontSize: `${Math.max(10, Math.round(activeScene.subtitle_size * 0.78))}px`,
                            color: activeScene.subtitle_color,
                          }}
                        >
                          {activeScene.subtitle || 'Descrição da cena...'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}

            <DialogFooter className="pt-2 flex items-center justify-end gap-2 border-t border-purple-100 dark:border-white/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPresentationOpen(false)}
                className="rounded-xl cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={savingPresentation || uploadingPresentationVideo}
                className="bg-gradient-to-r from-purple-700 to-pink-600 text-white text-xs font-black rounded-xl cursor-pointer"
              >
                {savingPresentation ? 'A guardar...' : 'Guardar Apresentação'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
