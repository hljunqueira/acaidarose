'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Laptop,
  Check,
  Power,
  Sliders,
  Scissors,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { StorePrinterSetting, PrinterType, PrinterConnectionType, PrintLayout } from '@/types/printer'
import { connectQZ, getInstalledPrinters, printRawData } from '@/lib/printers/qzClient'
import { buildTestEscPosReceipt, ESC_POS_COMMANDS } from '@/lib/printers/escposBuilder'
import { THERMAL_LOGO_BASE64 } from '@/lib/printers/logoData'
import { useMenuConfigStore } from '@/lib/stores/menuConfigStore'
import { useAuthStore } from '@/lib/stores/authStore'

interface PrinterSettingsViewProps {
  tenantId?: string
}

export default function PrinterSettingsView({ tenantId }: PrinterSettingsViewProps) {
  const activeTenantId = tenantId || '11111111-1111-1111-1111-111111111111'
  const { authFetch } = useAuthStore()
  const { categories: storeCategories } = useMenuConfigStore()
  const [localCategories, setLocalCategories] = useState<any[]>([])
  const effectiveCategories = localCategories.length > 0 ? localCategories : (storeCategories || [])

  // Lista de impressoras configuradas (100% dinâmica do PostgreSQL, sem seeds)
  const [printers, setPrinters] = useState<StorePrinterSetting[]>([])
  const [loading, setLoading] = useState(true)

  // Status de conexão com o QZ Tray
  const [qzConnected, setQzConnected] = useState(false)
  const [qzVersion, setQzVersion] = useState<string | null>(null)
  const [qzChecking, setQzChecking] = useState(false)
  const [qzError, setQzError] = useState<string | null>(null)

  // Drivers do Sistema Operacional detectados pelo QZ Tray
  const [osDrivers, setOsDrivers] = useState<string[]>([])

  // Estado do Modal de Criar/Editar
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPrinter, setEditingPrinter] = useState<StorePrinterSetting | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form Fields
  const [name, setName] = useState('')
  const [driverName, setDriverName] = useState('')
  const [customDriver, setCustomDriver] = useState('')
  const [printerType, setPrinterType] = useState<PrinterType>('EPSON_ESC_POS')
  const [connectionType, setConnectionType] = useState<PrinterConnectionType>('QZ_TRAY')
  const [printLayout, setPrintLayout] = useState<PrintLayout>('FULL_RECEIPT')
  const [highlightCustomer, setHighlightCustomer] = useState<boolean>(true)
  const [printLogo, setPrintLogo] = useState<boolean>(true)
  const [printQrCode, setPrintQrCode] = useState<boolean>(true)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [routingTab, setRoutingTab] = useState<'CATEGORIES' | 'PRODUCTS'>('CATEGORIES')
  const [productSearch, setProductSearch] = useState('')
  const [products, setProducts] = useState<any[]>([])
  const [copies, setCopies] = useState<number>(1)
  const [isActive, setIsActive] = useState<boolean>(true)
  const [isBackup, setIsBackup] = useState<boolean>(false)

  // Teste de Impressão
  const [testingPrinterId, setTestingPrinterId] = useState<string | null>(null)

  // 1. Carrega impressoras, produtos e categorias da loja via API
  const fetchPrinters = useCallback(async () => {
    setLoading(true)
    try {
      const res = await (authFetch ? authFetch(`/api/tenants/${activeTenantId}/printers`) : fetch(`/api/tenants/${activeTenantId}/printers`))
      if (res.ok) {
        const data = await res.json()
        setPrinters(Array.isArray(data.printers) ? data.printers : [])
      } else {
        setPrinters([])
      }
    } catch (err) {
      console.error('Falha ao carregar impressoras:', err)
      setPrinters([])
    } finally {
      setLoading(false)
    }

    try {
      const prodRes = await fetch(`/api/products?tenantId=${activeTenantId}`)
      if (prodRes.ok) {
        const prodData = await prodRes.json()
        setProducts(Array.isArray(prodData.containers) ? prodData.containers : [])
      }
    } catch (err) {
      console.warn('Falha ao carregar produtos para filtro de impressora:', err)
    }

    try {
      const catRes = await fetch(`/api/categories?tenantId=${encodeURIComponent(activeTenantId)}`)
      if (catRes.ok) {
        const catData = await catRes.json()
        const catList = Array.isArray(catData.categories) ? catData.categories : (Array.isArray(catData) ? catData : [])
        if (catList.length > 0) {
          setLocalCategories(catList)
        }
      }
    } catch (err) {
      console.warn('Falha ao carregar categorias para filtro de impressora:', err)
    }
  }, [activeTenantId, authFetch])

  // 2. Conexão e teste com o QZ Tray
  const checkQZConnection = useCallback(async () => {
    setQzChecking(true)
    setQzError(null)
    try {
      const status = await connectQZ()
      if (status.connected) {
        setQzConnected(true)
        setQzVersion(status.version || 'v2.2+')
        const drivers = await getInstalledPrinters()
        // Prioriza impressoras térmicas físicas (ex: MP-4200 TH, EPSON, POS) no topo
        const sorted = [...drivers].sort((a, b) => {
          const aThermal = /mp|th|pos|epson|bema|daruma|tm|thermal|receipt/i.test(a)
          const bThermal = /mp|th|pos|epson|bema|daruma|tm|thermal|receipt/i.test(b)
          const aVirtual = /xps|pdf|fax|onenote|root/i.test(a)
          const bVirtual = /xps|pdf|fax|onenote|root/i.test(b)
          if (aThermal && !bThermal) return -1
          if (!aThermal && bThermal) return 1
          if (!aVirtual && bVirtual) return -1
          if (aVirtual && !bVirtual) return 1
          return a.localeCompare(b)
        })
        setOsDrivers(sorted)
      } else {
        setQzConnected(false)
        setQzError(status.error || 'QZ Tray não responde')
      }
    } catch (err: any) {
      setQzConnected(false)
      setQzError(err?.message || 'Falha na conexão')
    } finally {
      setQzChecking(false)
    }
  }, [])

  useEffect(() => {
    fetchPrinters()
    checkQZConnection()
  }, [fetchPrinters, checkQZConnection])

  // Abrir modal de nova impressora
  const handleOpenCreateModal = () => {
    setEditingPrinter(null)
    setName('')
    // Pré-seleciona a impressora térmica física (ex: MP-4200 TH)
    const preferred = osDrivers.find((d) => /mp|th|pos|epson|bema|daruma|tm|thermal/i.test(d))
      || osDrivers.find((d) => !/xps|pdf|fax|onenote/i.test(d))
      || osDrivers[0]
      || ''
    setDriverName(preferred)
    setCustomDriver('')
    setPrinterType('EPSON_ESC_POS')
    setConnectionType('QZ_TRAY')
    setPrintLayout('FULL_RECEIPT')
    setHighlightCustomer(true)
    setPrintLogo(true)
    setPrintQrCode(true)
    setSelectedCategories([])
    setSelectedProducts([])
    setProductSearch('')
    setRoutingTab('CATEGORIES')
    setCopies(1)
    setIsActive(true)
    setIsBackup(false)
    setModalOpen(true)
  }

  // Abrir modal de edição
  const handleOpenEditModal = (printer: StorePrinterSetting) => {
    setEditingPrinter(printer)
    setName(printer.name)
    if (osDrivers.includes(printer.driverName)) {
      setDriverName(printer.driverName)
      setCustomDriver('')
    } else {
      setDriverName('__CUSTOM__')
      setCustomDriver(printer.driverName)
    }
    setPrinterType(printer.printerType)
    setConnectionType(printer.connectionType)
    setPrintLayout(printer.printLayout || 'FULL_RECEIPT')
    setHighlightCustomer(printer.highlightCustomer !== false)
    setPrintLogo(printer.printLogo !== false)
    setPrintQrCode(printer.printQrCode !== false)
    setSelectedCategories(printer.categories || [])
    setSelectedProducts(printer.products || [])
    setProductSearch('')
    setRoutingTab(printer.products?.length > 0 && (!printer.categories || printer.categories.length === 0) ? 'PRODUCTS' : 'CATEGORIES')
    setCopies(printer.copies || 1)
    setIsActive(printer.isActive)
    setIsBackup(printer.isBackup)
    setModalOpen(true)
  }

  // Alternar categoria selecionada
  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    )
  }

  // Alternar produto selecionado
  const toggleProduct = (prodId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(prodId) ? prev.filter((id) => id !== prodId) : [...prev, prodId]
    )
  }

  // Selecionar ou desmarcar todas as categorias
  const selectAllCategories = () => {
    setSelectedCategories(effectiveCategories.map((c) => c.id))
  }
  const deselectAllCategories = () => {
    setSelectedCategories([])
  }

  // Selecionar ou desmarcar todos os produtos
  const selectAllProducts = () => {
    setSelectedProducts(products.map((p) => p.id))
  }
  const deselectAllProducts = () => {
    setSelectedProducts([])
  }

  // Lista de produtos filtrada pela busca
  const filteredProductsList = products.filter((p) => {
    if (!productSearch.trim()) return true
    return (p.name || '').toLowerCase().includes(productSearch.toLowerCase())
  })

  // Submeter formulário
  const handleSubmitPrinter = async (e: React.FormEvent) => {
    e.preventDefault()
    const resolvedDriver = driverName === '__CUSTOM__' || !driverName ? customDriver.trim() : driverName.trim()

    if (!name.trim()) {
      toast.error('Informe o nome de identificação da impressora.')
      return
    }
    if (!resolvedDriver) {
      toast.error('Informe ou selecione o driver da impressora.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        name: name.trim(),
        driverName: resolvedDriver,
        printerType,
        connectionType,
        printLayout,
        highlightCustomer,
        printLogo,
        printQrCode,
        categories: selectedCategories,
        products: selectedProducts,
        copies,
        isActive,
        isBackup,
      }

      const url = editingPrinter
        ? `/api/tenants/${activeTenantId}/printers/${editingPrinter.id}`
        : `/api/tenants/${activeTenantId}/printers`
      const method = editingPrinter ? 'PUT' : 'POST'

      const res = await (authFetch ? authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }) : fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }))

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erro ao salvar configuração da impressora.')
      }

      toast.success(editingPrinter ? 'Impressora atualizada com sucesso!' : 'Impressora adicionada com sucesso!')
      setModalOpen(false)
      fetchPrinters()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('printers-updated'))
      }
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao salvar impressora.')
    } finally {
      setSubmitting(false)
    }
  }

  // Excluir impressora
  const handleDeletePrinter = async (printer: StorePrinterSetting) => {
    if (!confirm(`Tem certeza de que deseja remover a impressora "${printer.name}"?`)) return

    try {
      const url = `/api/tenants/${activeTenantId}/printers/${printer.id}`
      const res = await (authFetch ? authFetch(url, { method: 'DELETE' }) : fetch(url, { method: 'DELETE' }))

      if (!res.ok) throw new Error('Erro ao remover impressora.')

      toast.success(`Impressora "${printer.name}" removida.`)
      fetchPrinters()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('printers-updated'))
      }
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao remover impressora.')
    }
  }

  // Teste de Impressão Direto
  const handleTestPrint = async (printer: StorePrinterSetting) => {
    setTestingPrinterId(printer.id)
    try {
      if (printer.connectionType === 'NATIVE_PRINT') {
        window.print()
        toast.info('Diálogo de impressão nativo disparado.')
        return
      }

      if (!qzConnected) {
        const conn = await connectQZ()
        if (!conn.connected) {
          toast.error('O QZ Tray não está aberto no computador. Inicie o QZ Tray para imprimir.')
          return
        }
      }

      const testPayload = buildTestEscPosReceipt('AÇAÍ DA ROSE', printer.name)
      const qzData: any[] = []
      qzData.push(ESC_POS_COMMANDS.INIT)
      qzData.push(ESC_POS_COMMANDS.CODE_PAGE_WPC1252)

      if (printer.printLogo !== false && THERMAL_LOGO_BASE64) {
        qzData.push(ESC_POS_COMMANDS.ALIGN_CENTER)
        qzData.push({
          type: 'raw',
          format: 'image',
          flavor: 'base64',
          data: THERMAL_LOGO_BASE64,
          options: { language: 'ESCPOS', dotDensity: 'double' },
        })
        qzData.push('\n')
      }

      qzData.push(testPayload)
      await printRawData(printer.driverName, qzData)
      toast.success(`Teste enviado com sucesso para ${printer.name}!`)

      // Registra evento no Log de Auditoria TI de Henrique
      fetch('/api/dev/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenantId,
          action: 'TEST_PRINT_DISPATCHED',
          entity: 'IMPRESSORAS_QZ',
          entityId: printer.id,
          message: `Teste de corte e comunicação térmico enviado para "${printer.name}" (${printer.driverName}) via QZ Tray`,
          level: 'INFO',
          metadata: { printerId: printer.id, driver: printer.driverName },
        }),
      }).catch(() => {})
    } catch (err: any) {
      toast.error(`Falha no teste: ${err?.message || 'Erro de comunicação'}`)

      // Registra falha no Log de Auditoria TI de Henrique
      fetch('/api/dev/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenantId,
          action: 'TEST_PRINT_ERROR',
          entity: 'IMPRESSORAS_QZ',
          entityId: printer.id,
          message: `Falha no teste de impressão para "${printer.name}" (${printer.driverName}): ${err?.message || 'Erro de comunicação'}`,
          level: 'ERROR',
          metadata: { printerId: printer.id, driver: printer.driverName, error: err?.message },
        }),
      }).catch(() => {})
    } finally {
      setTestingPrinterId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-purple-100 dark:border-white/10">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Printer className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Impressoras Térmicas & QZ Tray
          </h2>
          <p className="text-xs text-slate-500 dark:text-purple-200/70 mt-0.5">
            Roteamento por categorias, corte com guilhotina e impressão automática sem diálogo na copa e balcão.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={checkQZConnection}
            disabled={qzChecking}
            className="h-9 px-3 rounded-xl border-purple-200 dark:border-white/15 text-xs font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${qzChecking ? 'animate-spin' : ''}`} />
            Verificar QZ Tray
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleOpenCreateModal}
            className="h-9 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Adicionar Impressora
          </Button>
        </div>
      </div>

      {/* 2. CARD DE DOWNLOAD E STATUS DO QZ TRAY */}
      <div className="p-5 rounded-2xl border border-purple-100 dark:border-white/10 bg-gradient-to-br from-purple-50/70 via-white to-pink-50/50 dark:from-white/5 dark:via-white/[0.02] dark:to-purple-950/20 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${qzConnected ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-300'}`}>
              <Laptop className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Status do Serviço QZ Tray Local
                </h3>
                {qzConnected ? (
                  <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Online ({qzVersion})
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-400 text-[10px] font-bold">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Offline / Não Detectado
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-purple-200/80 mt-1">
                {qzConnected
                  ? `Comunicação ativa via QZ Tray. Foram detectados ${osDrivers.length} driver(s) térmico(s) instalado(s) no sistema operacional.`
                  : (qzError || 'O aplicativo QZ Tray precisa estar em execução no computador do caixa para permitir o envio silencioso de comandas com corte de papel.')}
              </p>
            </div>
          </div>

          {/* Botões Oficiais de Download */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href="https://qz.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-9 px-3.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white font-bold text-xs border border-purple-200 dark:border-white/15 transition shadow-xs"
            >
              <Download className="h-3.5 w-3.5 mr-1.5 text-purple-600 dark:text-purple-400" />
              Descarregar QZ Tray Oficial
              <ExternalLink className="h-3 w-3 ml-1.5 opacity-60" />
            </a>

            <a
              href="https://github.com/qzind/tray/releases/latest/download/qz-tray-x86_64.exe"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-9 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-purple-900 dark:hover:bg-purple-800 text-xs font-semibold shadow-xs"
            >
              Instalador Windows (.exe)
            </a>
          </div>
        </div>

        {/* Guia Rápido de Instalação em 3 Passos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-purple-100/80 dark:border-white/5 text-xs">
          <div className="p-2.5 rounded-xl bg-white/80 dark:bg-white/5 border border-purple-50 dark:border-white/5">
            <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-purple-200 dark:bg-purple-800 text-[10px] font-mono flex items-center justify-center text-purple-950 dark:text-white">1</span>
              Instalar o QZ Tray
            </div>
            <p className="text-[11px] text-slate-500 dark:text-purple-200/70 mt-1 leading-relaxed">
              Descarregue e instale a versão recomendada (v2.2+). Conclua a instalação padrão do Windows.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white/80 dark:bg-white/5 border border-purple-50 dark:border-white/5">
            <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-purple-200 dark:bg-purple-800 text-[10px] font-mono flex items-center justify-center text-purple-950 dark:text-white">2</span>
              Manter Ativo no Turno
            </div>
            <p className="text-[11px] text-slate-500 dark:text-purple-200/70 mt-1 leading-relaxed">
              O ícone verde do QZ Tray fica fixo na barra de tarefas junto ao relógio do Windows durante as vendas.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white/80 dark:bg-white/5 border border-purple-50 dark:border-white/5">
            <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-purple-200 dark:bg-purple-800 text-[10px] font-mono flex items-center justify-center text-purple-950 dark:text-white">3</span>
              Mapear Categorias
            </div>
            <p className="text-[11px] text-slate-500 dark:text-purple-200/70 mt-1 leading-relaxed">
              Vincule Açaí no Copo para a Copa e Lanches para a Cozinha para separação automática e corte de papel.
            </p>
          </div>
        </div>

        {/* Dica de Resolução Imediata se Offline */}
        {!qzConnected && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>O QZ Tray já está instalado mas o navegador ainda não reconheceu? Siga estes 2 passos:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-700 dark:text-amber-200/90 pl-1">
              <li>
                <strong>Autorizar o certificado seguro local (necessário em HTTPS / Produção):</strong>{' '}
                <a
                  href="https://localhost:8181"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold underline text-purple-700 dark:text-purple-300 hover:text-purple-900"
                >
                  Abrir https://localhost:8181 numa nova aba
                </a>
                . Se o Google Chrome exibir <em>&quot;A sua ligação não é privada&quot;</em>, clique em <em>Avançado</em> e depois em <em>Ir para localhost (não seguro)</em>. Feche essa aba e clique no botão <strong>Verificar QZ Tray</strong> acima.
              </li>
              <li>
                <strong>Permissão de Rede Local no Chrome:</strong> Se surgir uma mensagem no navegador ou no ícone de configurações ao lado da URL perguntando se deseja permitir acesso à rede local, selecione <em>Permitir</em>.
              </li>
            </ol>
          </div>
        )}
      </div>

      {/* 3. LISTAGEM DE IMPRESSORAS DA UNIDADE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            Impressoras Cadastradas nesta Unidade ({printers.length})
          </h3>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500 dark:text-purple-300">
            A carregar configuração de impressoras...
          </div>
        ) : printers.length === 0 ? (
          /* EMPTY STATE 100% DINÂMICO (SEM SEEDS / SEM DEFAULT) */
          <div className="py-12 px-6 rounded-2xl border border-dashed border-purple-200 dark:border-white/10 text-center space-y-3 bg-purple-50/20 dark:bg-white/[0.01]">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 dark:bg-white/5 dark:text-purple-300 flex items-center justify-center">
              <Printer className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Nenhuma impressora configurada para esta unidade
              </h4>
              <p className="text-xs text-slate-500 dark:text-purple-200/70 mt-1 max-w-md mx-auto">
                Adicione a primeira impressora térmica para automatizar o roteamento de comandas na copa ou balcão.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleOpenCreateModal}
              className="h-9 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Configurar Primeira Impressora
            </Button>
          </div>
        ) : (
          /* GRID DE IMPRESSORAS */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {printers.map((printer) => {
              const matchedCategoryNames = (printer.categories || []).map((catId) => {
                const found = effectiveCategories.find((c) => c.id === catId)
                return found?.name || catId
              })

              return (
                <div
                  key={printer.id}
                  className={`p-4 rounded-2xl border transition shadow-xs flex flex-col justify-between gap-3 ${
                    printer.isActive
                      ? 'bg-white border-purple-100 dark:bg-white/5 dark:border-white/10'
                      : 'bg-slate-50/70 border-slate-200 dark:bg-white/[0.02] dark:border-white/5 opacity-75'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Linha Superior: Nome e Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                            {printer.name}
                          </h4>
                          {printer.isBackup && (
                            <Badge variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-400 text-[9px] px-1.5 py-0">
                              Backup
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-purple-700 dark:text-purple-300 mt-0.5 truncate">
                          Driver: {printer.driverName}
                        </div>
                      </div>

                      <Badge
                        className={`text-[10px] font-bold ${
                          printer.isActive
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400'
                        }`}
                      >
                        {printer.isActive ? 'Ativa' : 'Pausada'}
                      </Badge>
                    </div>

                    {/* Especificações Técnicas */}
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-950 dark:text-purple-200 font-bold border border-purple-200 dark:border-purple-500/20">
                        {printer.printLayout === 'KITCHEN_SLIP' ? 'Comanda Cozinha (Foto 1)' : printer.printLayout === 'TICKET_ONLY' ? 'Ticket Senha' : 'Talão Completo Caixa (Foto 2)'}
                      </span>

                      {printer.highlightCustomer !== false && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/20">
                          Senha & Nome no Topo
                        </span>
                      )}

                      {printer.printLogo !== false && (
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-900/30 text-purple-900 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-500/20">
                          Logo no Topo
                        </span>
                      )}

                      {printer.printQrCode !== false && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-500/20">
                          QR Code no Rodapé
                        </span>
                      )}

                      <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-white/5 text-purple-900 dark:text-purple-200 font-medium border border-purple-100 dark:border-white/5 flex items-center gap-1">
                        <Scissors className="h-3 w-3 text-purple-600" />
                        {printer.printerType === 'EPSON_ESC_POS' ? 'ESC/POS Térmica' : printer.printerType}
                      </span>

                      <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-white/5 text-purple-900 dark:text-purple-200 font-medium border border-purple-100 dark:border-white/5">
                        {printer.copies} {printer.copies > 1 ? 'vias' : 'via'}
                      </span>

                      <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-white/5 text-purple-900 dark:text-purple-200 font-medium border border-purple-100 dark:border-white/5">
                        {printer.connectionType === 'QZ_TRAY' ? 'QZ Tray (Silencioso)' : 'Diálogo Nativo'}
                      </span>
                    </div>

                    {/* Categorias e Produtos Vinculados */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-slate-500 dark:text-purple-300/70 uppercase">
                        Roteamento de Produção:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {matchedCategoryNames.length === 0 && (!printer.products || printer.products.length === 0) ? (
                          <span className="text-[11px] text-slate-600 dark:text-purple-200/80 italic">
                            Todas as categorias e itens (Geral)
                          </span>
                        ) : (
                          <>
                            {matchedCategoryNames.map((cName, i) => (
                              <Badge
                                key={`cat-${i}`}
                                variant="secondary"
                                className="text-[10px] font-normal bg-purple-50 dark:bg-white/10 text-slate-700 dark:text-purple-200 border-none px-2 py-0.5"
                              >
                                Categoria: {cName}
                              </Badge>
                            ))}
                            {(printer.products || []).map((prodId, i) => {
                              const foundProd = products.find((p) => p.id === prodId)
                              const prodName = foundProd?.name || prodId
                              return (
                                <Badge
                                  key={`prod-${i}`}
                                  variant="secondary"
                                  className="text-[10px] font-normal bg-pink-50 dark:bg-pink-950/30 text-pink-900 dark:text-pink-200 border border-pink-200 dark:border-pink-500/20 px-2 py-0.5"
                                >
                                  Item: {prodName}
                                </Badge>
                              )
                            })}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ações do Card */}
                  <div className="pt-3 border-t border-purple-100/60 dark:border-white/5 flex items-center justify-between gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={testingPrinterId === printer.id}
                      onClick={() => handleTestPrint(printer)}
                      className="h-8 px-2.5 rounded-lg border-purple-200 dark:border-white/15 text-[11px] font-semibold"
                    >
                      <Scissors className="h-3 w-3 mr-1 text-purple-600" />
                      {testingPrinterId === printer.id ? 'A imprimir...' : 'Testar Corte'}
                    </Button>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditModal(printer)}
                        className="h-8 w-8 p-0 text-slate-600 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white"
                        title="Editar Impressora"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePrinter(printer)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                        title="Remover Impressora"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 4. MODAL DE ADICIONAR / EDITAR IMPRESSORA */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-5xl w-[95vw] rounded-2xl p-5 max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Printer className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              {editingPrinter ? 'Editar Impressora' : 'Nova Impressora Térmica'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitPrinter} className="space-y-3.5 pt-2">
            {/* Linha 1: Nome de Identificação & Driver no SO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Nome de Exibição */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-purple-200">
                  Nome de Identificação:
                </Label>
                <Input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Copa / Açaí / Balcão"
                  className="h-9 text-xs rounded-xl"
                />
                <p className="text-[10px] text-slate-500 dark:text-purple-300/70">
                  Identifica o setor onde a impressora física está instalada.
                </p>
              </div>

              {/* Seleção do Driver no SO */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700 dark:text-purple-200">
                    Driver do Sistema Operacional:
                  </Label>
                  {qzConnected && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="h-3 w-3" /> QZ Tray Online
                    </span>
                  )}
                </div>

                {osDrivers.length > 0 ? (
                  <select
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#1a052e] text-xs text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-purple-500"
                  >
                    {osDrivers.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                    <option value="__CUSTOM__">Outro (Digitar manualmente)</option>
                  </select>
                ) : null}

                {(osDrivers.length === 0 || driverName === '__CUSTOM__') && (
                  <Input
                    type="text"
                    required
                    value={customDriver}
                    onChange={(e) => setCustomDriver(e.target.value)}
                    placeholder="Ex: POS-80, EPSON TM-T20X, etc."
                    className="h-9 text-xs rounded-xl font-mono mt-1"
                  />
                )}
                <p className="text-[10px] text-slate-500 dark:text-purple-300/70">
                  Nome exato da impressora instalada no Painel de Controle / Dispositivos do Windows.
                </p>
              </div>
            </div>

            {/* Linha 2: Protocolo e Vias */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-purple-200">
                  Protocolo:
                </Label>
                <select
                  value={printerType}
                  onChange={(e) => setPrinterType(e.target.value as PrinterType)}
                  className="w-full h-9 px-3 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#1a052e] text-xs text-slate-900 dark:text-white"
                >
                  <option value="EPSON_ESC_POS">EPSON ESC/POS (Recomendado)</option>
                  <option value="GENERIC_ESC_POS">ESC/POS Genérico</option>
                  <option value="HTML_WINDOW">HTML (Diálogo do Navegador)</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-purple-200">
                  Número de Vias:
                </Label>
                <select
                  value={copies}
                  onChange={(e) => setCopies(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#1a052e] text-xs text-slate-900 dark:text-white"
                >
                  <option value={1}>1 Via (Produção)</option>
                  <option value={2}>2 Vias (Produção + Cliente)</option>
                </select>
              </div>
            </div>

            {/* Linha: Modelo do Talão & Opções para o Caixa */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-xl border border-purple-200/70 dark:border-purple-500/20 bg-purple-50/40 dark:bg-purple-950/20">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-800 dark:text-purple-200 flex items-center justify-between">
                  <span>Modelo do Talão (Layout):</span>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">Térmica 80mm</span>
                </Label>
                <select
                  value={printLayout}
                  onChange={(e) => setPrintLayout(e.target.value as PrintLayout)}
                  className="w-full h-9 px-3 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#1a052e] text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="FULL_RECEIPT">Talão Completo de Caixa / Conferência (Foto 2 - Recomendado)</option>
                  <option value="KITCHEN_SLIP">Comanda de Produção / Copa (Foto 1 - Foco em Montagem)</option>
                  <option value="TICKET_ONLY">Ticket Rápido de Senha (Balcão)</option>
                </select>
                <p className="text-[10px] text-slate-500 dark:text-purple-300/70">
                  {printLayout === 'FULL_RECEIPT'
                    ? 'Imprime cabeçalho fiscal (NIF, Morada, Tel), itens com bases e acompanhamentos Grátis, subtotais e totais.'
                    : printLayout === 'KITCHEN_SLIP'
                    ? 'Imprime comanda operacional enxuta para a bancada de montagem dos açaís.'
                    : 'Imprime ticket econômico com senha gigante para entregar ao cliente.'}
                </p>
              </div>

              <div className="flex flex-col justify-center space-y-2.5 pt-1 md:pt-0">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs font-bold text-slate-800 dark:text-white">
                  <input
                    type="checkbox"
                    checked={highlightCustomer}
                    onChange={(e) => setHighlightCustomer(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4 mt-0.5"
                  />
                  <div>
                    <span>Destacar Senha (#001) e Cliente no Topo</span>
                    <p className="text-[10px] font-normal text-slate-500 dark:text-purple-300/70">
                      Imprime o número da comanda/senha e o nome do cliente em tamanho duplo no topo do talão para identificação e chamada rápida no caixa.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs font-bold text-slate-800 dark:text-white">
                  <input
                    type="checkbox"
                    checked={printLogo}
                    onChange={(e) => setPrintLogo(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4 mt-0.5"
                  />
                  <div>
                    <span>Imprimir Logomarca no Topo</span>
                    <p className="text-[10px] font-normal text-slate-500 dark:text-purple-300/70">
                      Imprime a logomarca oficial do Açaí da Rose em bitmap térmico monocromático de alta definição.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs font-bold text-slate-800 dark:text-white">
                  <input
                    type="checkbox"
                    checked={printQrCode}
                    onChange={(e) => setPrintQrCode(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4 mt-0.5"
                  />
                  <div>
                    <span>Imprimir QR Code da Comanda no Rodapé</span>
                    <p className="text-[10px] font-normal text-slate-500 dark:text-purple-300/70">
                      Permite que o cliente aponte a câmara do telemóvel para consultar o pedido digitalmente ou avaliar o atendimento.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Linha 3: Roteamento de Produção com Grid de 6 Colunas */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-700 dark:text-purple-200">
                  Roteamento de Produção:
                </Label>
                <div className="flex items-center gap-1 bg-purple-100/70 dark:bg-white/10 p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setRoutingTab('CATEGORIES')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                      routingTab === 'CATEGORIES'
                        ? 'bg-white dark:bg-purple-900 text-purple-950 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-purple-200 hover:text-purple-950'
                    }`}
                  >
                    Por Categorias ({selectedCategories.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoutingTab('PRODUCTS')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                      routingTab === 'PRODUCTS'
                        ? 'bg-white dark:bg-purple-900 text-purple-950 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-purple-200 hover:text-purple-950'
                    }`}
                  >
                    Por Itens / Produtos ({selectedProducts.length})
                  </button>
                </div>
              </div>

              {routingTab === 'CATEGORIES' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] px-0.5">
                    <span className="text-slate-500 dark:text-purple-300/70 font-medium">
                      {selectedCategories.length} de {effectiveCategories.length} selecionada(s)
                    </span>
                    <div className="flex items-center gap-2 font-semibold text-[11px]">
                      <button
                        type="button"
                        onClick={selectAllCategories}
                        className="text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                      >
                        Selecionar Todas
                      </button>
                      <span className="text-slate-300 dark:text-white/20">|</span>
                      <button
                        type="button"
                        onClick={deselectAllCategories}
                        className="text-slate-500 dark:text-slate-400 hover:underline cursor-pointer"
                      >
                        Desmarcar Todas
                      </button>
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto p-2.5 rounded-xl border border-purple-100 dark:border-white/10 bg-purple-50/30 dark:bg-white/[0.02] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5">
                    {effectiveCategories.length === 0 ? (
                      <div className="col-span-full text-center text-[11px] text-slate-400 py-3">
                        Nenhuma categoria encontrada no catálogo.
                      </div>
                    ) : (
                      effectiveCategories.map((cat) => {
                        const isChecked = selectedCategories.includes(cat.id)
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => toggleCategory(cat.id)}
                            className={`px-2 py-1.5 rounded-lg border text-[10.5px] font-medium text-left transition flex items-center justify-between gap-1 cursor-pointer truncate ${
                              isChecked
                                ? 'bg-purple-100 border-purple-400 text-purple-950 dark:bg-purple-900/40 dark:border-purple-400 dark:text-white shadow-xs'
                                : 'bg-white border-purple-100 text-slate-600 hover:bg-purple-50/60 dark:bg-white/5 dark:border-white/5 dark:text-purple-200/70'
                            }`}
                            title={cat.name}
                          >
                            <span className="truncate">{cat.name}</span>
                            {isChecked && <Check className="h-3 w-3 text-purple-600 dark:text-purple-400 shrink-0" />}
                          </button>
                        )
                      })
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-purple-300/60">
                    Todos os itens pertencentes às categorias marcadas serão impressos nesta impressora.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] px-0.5">
                    <span className="text-slate-500 dark:text-purple-300/70 font-medium">
                      {selectedProducts.length} de {products.length} item(ns) selecionado(s)
                    </span>
                    <div className="flex items-center gap-2 font-semibold text-[11px]">
                      <button
                        type="button"
                        onClick={selectAllProducts}
                        className="text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                      >
                        Selecionar Todos
                      </button>
                      <span className="text-slate-300 dark:text-white/20">|</span>
                      <button
                        type="button"
                        onClick={deselectAllProducts}
                        className="text-slate-500 dark:text-slate-400 hover:underline cursor-pointer"
                      >
                        Desmarcar Todos
                      </button>
                    </div>
                  </div>

                  <Input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Pesquisar produto pelo nome..."
                    className="h-8 text-xs rounded-lg"
                  />
                  <div className="max-h-48 overflow-y-auto p-2.5 rounded-xl border border-purple-100 dark:border-white/10 bg-purple-50/30 dark:bg-white/[0.02] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5">
                    {filteredProductsList.length === 0 ? (
                      <div className="col-span-full text-center text-[11px] text-slate-400 py-3">
                        Nenhum produto encontrado.
                      </div>
                    ) : (
                      filteredProductsList.map((prod) => {
                        const isChecked = selectedProducts.includes(prod.id)
                        return (
                          <button
                            key={prod.id}
                            type="button"
                            onClick={() => toggleProduct(prod.id)}
                            className={`px-2 py-1.5 rounded-lg border text-[10.5px] font-medium text-left transition flex items-center justify-between gap-1 cursor-pointer truncate ${
                              isChecked
                                ? 'bg-pink-100 border-pink-400 text-pink-950 dark:bg-pink-900/40 dark:border-pink-400 dark:text-white shadow-xs'
                                : 'bg-white border-purple-100 text-slate-600 hover:bg-purple-50/60 dark:bg-white/5 dark:border-white/5 dark:text-purple-200/70'
                            }`}
                            title={prod.name}
                          >
                            <span className="truncate">{prod.name}</span>
                            {isChecked && <Check className="h-3 w-3 text-pink-600 dark:text-pink-400 shrink-0" />}
                          </button>
                        )
                      })
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-purple-300/60">
                    Itens individuais marcados serão roteados diretamente para esta impressora.
                  </p>
                </div>
              )}
            </div>

            {/* Opções de Ativação e Backup */}
            <div className="pt-2 flex items-center justify-between gap-4 border-t border-purple-100 dark:border-white/10">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-white">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                />
                Impressora Ativa para Produção
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-purple-200">
                <input
                  type="checkbox"
                  checked={isBackup}
                  onChange={(e) => setIsBackup(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                />
                Rota de Contingência / Backup
              </label>
            </div>

            <DialogFooter className="pt-4 border-t border-purple-100 dark:border-white/10">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
              >
                {submitting ? 'A salvar...' : editingPrinter ? 'Salvar Alterações' : 'Cadastrar Impressora'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
