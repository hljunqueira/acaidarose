'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
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
  Copy,
  CheckCheck,
  Server,
  Eye,
  Code2,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { StorePrinterSetting, PrinterType, PrinterConnectionType, PrintLayout } from '@/types/printer'
import {
  checkAgentStatus,
  getAgentPrinters,
  printViaAgent,
  configureAgentStoreToken,
  AgentStatus,
} from '@/lib/printers/windowsPrintAgentClient'
import {
  buildTestEscPosReceipt,
  buildFullOrderEscPosReceipt,
  buildOrderKitchenEscPosReceipt,
  buildTicketOnlyEscPosReceipt,
  ESC_POS_COMMANDS,
} from '@/lib/printers/escposBuilder'
import { THERMAL_LOGO_BASE64 } from '@/lib/printers/logoData'
import { useMenuConfigStore } from '@/lib/stores/menuConfigStore'
import { useAuthStore } from '@/lib/stores/authStore'
import { useFranchiseStore } from '@/lib/stores/franchiseStore'

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

  // Status de conexão com o Servidor de Impressão Windows Local
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null)
  const [agentChecking, setAgentChecking] = useState(false)
  const [linkingAgent, setLinkingAgent] = useState(false)
  const [copiedToken, setCopiedToken] = useState(false)

  // Drivers do Sistema Operacional detectados pelo Servidor de Impressão
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
  const [connectionType, setConnectionType] = useState<PrinterConnectionType>('WINDOWS_AGENT')
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

  // Estados de Pré-visualização do Talão / Código Renderizado
  const [previewPrinter, setPreviewPrinter] = useState<StorePrinterSetting | null>(null)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [previewTab, setPreviewTab] = useState<'THERMAL' | 'CODE'>('THERMAL')
  const [previewLayoutOverride, setPreviewLayoutOverride] = useState<PrintLayout | null>(null)
  const [previewCopied, setPreviewCopied] = useState(false)

  const { getTenant, currentTenant } = useFranchiseStore()
  const activeTenantObj = getTenant ? getTenant(activeTenantId) : currentTenant
  const storeDisplayInfo = useMemo(() => ({
    name: activeTenantObj?.name || 'Açaí da Rose',
    nif: (activeTenantObj as any)?.nif || '518 293 847',
    address: (activeTenantObj as any)?.address || (activeTenantObj as any)?.morada || 'Figueira da Foz, Portugal',
    phone: (activeTenantObj as any)?.phone || (activeTenantObj as any)?.telefone || '+351 912 345 678',
  }), [activeTenantObj])

  // Pedido demonstrativo para simulação
  const sampleOrder = useMemo(() => {
    const acaiCatId = effectiveCategories.find((c) =>
      (c.name || '').toLowerCase().includes('açaí') || (c.name || '').toLowerCase().includes('copo') || (c.name || '').toLowerCase().includes('taça')
    )?.id || 'cat-acai'

    const lancheCatId = effectiveCategories.find((c) =>
      (c.name || '').toLowerCase().includes('lanche') || (c.name || '').toLowerCase().includes('tosta') || (c.name || '').toLowerCase().includes('salgado')
    )?.id || 'cat-lanches'

    const bebidaCatId = effectiveCategories.find((c) =>
      (c.name || '').toLowerCase().includes('bebida') || (c.name || '').toLowerCase().includes('sumo')
    )?.id || 'cat-bebidas'

    return {
      id: 'demo-order-042',
      orderNumber: '042',
      daily_order_seq: 42,
      createdAt: new Date().toISOString(),
      customerName: 'Henrique Silva',
      customerPhone: '912 345 678',
      tableNumber: '04',
      consumptionType: 'DINE_IN',
      paymentMethod: 'MBWAY',
      paymentStatus: 'PAID',
      status: 'PAID',
      total: 12.50,
      notes: 'Caprichar no creme de ninho e tosta bem quente!',
      bagQuantity: 0,
      items: [
        {
          id: 'item-acai-500',
          containerId: 'acai-500g',
          containerName: 'Copo 500gr',
          containerFormat: 'Copo',
          packagingType: 'COPO',
          categoryId: acaiCatId,
          quantity: 1,
          containerPrice: 7.50,
          lineTotal: 7.50,
          bases: ['Açaí Tradicional', 'Creme de Ninho'],
          toppings: [
            { name: 'Banana', isPaid: false, quantity: 1 },
            { name: 'Morango', isPaid: false, quantity: 1 },
            { name: 'Leite Ninho', isPaid: false, quantity: 2 },
            { name: 'Granola Tradicional', isPaid: false, quantity: 1 },
            { name: 'Nutella Pura', isPaid: true, precoCobrado: 1.50, isPremium: true, quantity: 1 },
          ],
        },
        {
          id: 'item-tosta-mista',
          containerId: 'tosta-mista',
          containerName: 'Tosta Mista da Rose',
          containerFormat: 'Pão Rústico',
          packagingType: 'LANCHE',
          categoryId: lancheCatId,
          quantity: 1,
          containerPrice: 3.50,
          lineTotal: 3.50,
          selectedOptions: [
            { groupName: 'Pão', name: 'Rústico Alentejano', price: 0 },
            { groupName: 'Recheio', name: 'Queijo da Serra & Fiambre', price: 0 },
          ],
          notes: 'Bem tostadinha',
        },
        {
          id: 'item-sumo-laranja',
          containerId: 'sumo-laranja',
          containerName: 'Sumo de Laranja Natural',
          containerFormat: 'Copo 300ml',
          packagingType: 'BEBIDA',
          categoryId: bebidaCatId,
          quantity: 1,
          containerPrice: 1.50,
          lineTotal: 1.50,
        },
      ],
    }
  }, [effectiveCategories])

  // Geração do código renderizado da pré-visualização
  const renderedPreview = useMemo(() => {
    if (!previewPrinter) return { raw: '', clean: '', layout: 'FULL_RECEIPT' as PrintLayout }
    const layout = (previewLayoutOverride || previewPrinter.printLayout || 'FULL_RECEIPT') as PrintLayout

    let raw = ''
    if (layout === 'KITCHEN_SLIP') {
      raw = buildOrderKitchenEscPosReceipt(sampleOrder, {
        storeName: storeDisplayInfo.name,
        printerTitle: previewPrinter.name,
        categoryFilter: previewPrinter.categories,
        productFilter: previewPrinter.products,
        totalCopies: previewPrinter.copies || 1,
        omitInit: true,
        omitCut: false,
      })
    } else if (layout === 'TICKET_ONLY') {
      raw = buildTicketOnlyEscPosReceipt(sampleOrder, {
        storeName: storeDisplayInfo.name,
        omitInit: true,
        omitCut: false,
      })
    } else {
      raw = buildFullOrderEscPosReceipt(sampleOrder, {
        storeInfo: storeDisplayInfo,
        printerTitle: previewPrinter.name,
        highlightCustomer: previewPrinter.highlightCustomer !== false,
        categoryFilter: previewPrinter.categories,
        productFilter: previewPrinter.products,
        totalCopies: previewPrinter.copies || 1,
        omitInit: true,
        omitCut: false,
      })
    }

    // Limpeza de bytes de controle binários para renderizar visualmente como papel térmico
    const clean = raw
      .replace(/\x1b@/g, '')
      .replace(/\x1bt[\x00-\xFF]/g, '')
      .replace(/\x1ba[\x00\x01\x02]/g, '')
      .replace(/\x1bE[\x00\x01]/g, '')
      .replace(/\x1d![\x00-\x7F]/g, '')
      .replace(/\x1b![\x00-\x7F]/g, '')
      .replace(/\x1dV[\x00\x01]/g, '\n[=== CORTE DE GUILHOTINA ===]\n')
      .replace(/[\x00-\x09\x0B-\x1F]/g, '')

    return { raw, clean, layout }
  }, [previewPrinter, previewLayoutOverride, sampleOrder, storeDisplayInfo])

  const handleOpenPreviewModal = (printer: StorePrinterSetting) => {
    setPreviewPrinter(printer)
    setPreviewLayoutOverride(null)
    setPreviewTab('THERMAL')
    setPreviewCopied(false)
    setPreviewModalOpen(true)
  }

  const handleCopyPreviewCode = () => {
    if (!renderedPreview.clean) return
    navigator.clipboard.writeText(renderedPreview.clean)
    setPreviewCopied(true)
    toast.success('Código da comanda copiado para a área de transferência!')
    setTimeout(() => setPreviewCopied(false), 2500)
  }

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

  // 2. Conexão e teste com o Servidor de Impressão Windows Local
  const checkAgentConnection = useCallback(async () => {
    setAgentChecking(true)
    try {
      const agent = await checkAgentStatus(activeTenantId)
      setAgentStatus(agent)

      if (agent.online) {
        const agentDrivers = await getAgentPrinters(activeTenantId)
        if (agentDrivers.length > 0) {
          const sorted = [...agentDrivers].sort((a, b) => {
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
        }
      }
    } catch (err: any) {
      console.warn('Falha ao verificar Servidor de Impressão:', err)
    } finally {
      setAgentChecking(false)
    }
  }, [activeTenantId])

  const handleCopyToken = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(activeTenantId)
      setCopiedToken(true)
      toast.success('Token de integração da loja copiado!')
      setTimeout(() => setCopiedToken(false), 2500)
    }
  }

  const handleLinkAgent = async () => {
    setLinkingAgent(true)
    try {
      const res = await configureAgentStoreToken(activeTenantId)
      if (res.success) {
        toast.success(`Servidor Windows vinculado com sucesso à loja! (${res.storeName || 'Loja Conectada'})`)
        const updated = await checkAgentStatus()
        setAgentStatus(updated)
      } else {
        toast.error(`Falha ao vincular: ${res.error}`)
      }
    } catch (err: any) {
      toast.error(`Erro ao vincular: ${err?.message || 'Servidor offline'}`)
    } finally {
      setLinkingAgent(false)
    }
  }

  useEffect(() => {
    fetchPrinters()
    checkAgentConnection()
  }, [fetchPrinters, checkAgentConnection])

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
    setConnectionType('WINDOWS_AGENT')
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

      if (!agentStatus?.online) {
        toast.error('O Servidor de Impressão Windows não está em execução nesta máquina. Inicie o acaidarose-print-agent.exe.')
        return
      }

      const testPayload = buildTestEscPosReceipt('AÇAÍ DA ROSE', printer.name)
      const fullPayload =
        ESC_POS_COMMANDS.INIT +
        ESC_POS_COMMANDS.CODE_PAGE_WPC1252 +
        testPayload +
        ESC_POS_COMMANDS.FEED_4_LINES +
        ESC_POS_COMMANDS.CUT_FULL

      const agentRes = await printViaAgent({
        printerName: printer.driverName,
        rawText: fullPayload,
        copies: 1,
        docName: `Teste - ${printer.name}`,
      })

      if (agentRes.success) {
        toast.success(`Teste térmico impresso com sucesso em ${printer.name}!`)

        fetch('/api/dev/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId: activeTenantId,
            action: 'TEST_PRINT_DISPATCHED',
            entity: 'WINDOWS_PRINT_AGENT',
            entityId: printer.id,
            message: `Teste térmico enviado para "${printer.name}" (${printer.driverName}) via Servidor Windows`,
            level: 'INFO',
            metadata: { printerId: printer.id, driver: printer.driverName },
          }),
        }).catch(() => {})
      } else {
        toast.error(`Falha ao imprimir teste: ${agentRes.error}`)
      }
    } catch (err: any) {
      toast.error(`Falha no teste: ${err?.message || 'Erro de comunicação'}`)

      // Registra falha no Log de Auditoria TI de Henrique
      fetch('/api/dev/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenantId,
          action: 'TEST_PRINT_ERROR',
          entity: 'WINDOWS_PRINT_AGENT',
          entityId: printer.id,
          message: `Falha no teste de impressão para "${printer.name}" (${printer.driverName}): ${err?.message || 'Erro de comunicação'}`,
          level: 'ERROR',
          metadata: { printerId: printer.id, driver: printer.driverName, error: err?.message },
        }),
      }).catch(() => { })
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
            Central de Impressão Térmica
          </h2>
          <p className="text-xs text-slate-500 dark:text-purple-200/70 mt-0.5">
            Servidor de impressão local para Windows, corte mecânico e roteamento por setor.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={checkAgentConnection}
            disabled={agentChecking}
            className="h-9 px-3 rounded-xl border-purple-200 dark:border-white/15 text-xs font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${agentChecking ? 'animate-spin' : ''}`} />
            Verificar Servidor
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

      {/* 2. SERVIDOR DE IMPRESSÃO WINDOWS LOCAL */}
      <div className="p-5 rounded-2xl border border-purple-200 dark:border-purple-800/40 bg-gradient-to-br from-purple-50 via-white to-pink-50/40 dark:from-purple-950/20 dark:via-white/[0.02] dark:to-purple-900/10 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${agentStatus?.online ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-300' : 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300 border border-slate-300'}`}>
              <Server className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Servidor de Impressão Windows Local
                </h3>
                {agentStatus?.online ? (
                  <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {agentStatus.source === 'CLOUD_HEARTBEAT'
                      ? `Conectado (Servidor Windows Ativo · ${agentStatus.diffSeconds !== undefined ? `Ping ${agentStatus.diffSeconds}s` : 'Nuvem'})`
                      : `Online (Porta 4040 · ${agentStatus.version || 'v1.0.0'})`}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-slate-300 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                    Desconectado / Fechado
                  </Badge>
                )}
                {agentStatus?.online && (agentStatus.storeToken === activeTenantId || agentStatus.source === 'CLOUD_HEARTBEAT') && (
                  <Badge className="bg-purple-600 text-white text-[10px] font-semibold">
                    Loja Vinculada
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-purple-200/80 mt-1">
                {agentStatus?.online
                  ? `Comunicação ativa com o Windows Spooler (${agentStatus.storeName || 'Loja'}). Impressão silenciosa sem confirmações de tela.`
                  : 'Execute o aplicativo acaidarose-print-agent.exe no computador do balcão para impressão 100% silenciosa e sem confirmações na tela.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {agentStatus?.online && agentStatus.storeToken !== activeTenantId && (
              <Button
                type="button"
                size="sm"
                onClick={handleLinkAgent}
                disabled={linkingAgent}
                className="h-9 px-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                <Check className="h-3.5 w-3.5 mr-1.5" />
                {linkingAgent ? 'Vinculando...' : 'Vincular a Esta Loja'}
              </Button>
            )}

            <a
              href="/downloads/acaidarose-servidor-impressao.zip"
              download="acaidarose-servidor-impressao.zip"
              className="inline-flex items-center justify-center h-9 px-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition"
              title="Baixar pacote completo com instalador automático no Windows"
            >
              <Download className="h-3.5 w-3.5 mr-1.5 text-white" />
              Baixar Pacote Completo (.zip)
            </a>

            <a
              href="/downloads/acaidarose-print-agent.exe"
              download="acaidarose-print-agent.exe"
              className="inline-flex items-center justify-center h-9 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-purple-950 dark:hover:bg-purple-900 font-bold text-xs shadow-xs transition"
              title="Baixar apenas o arquivo executável"
            >
              <Download className="h-3.5 w-3.5 mr-1.5 text-purple-400" />
              Executável (.exe)
            </a>
          </div>
        </div>

        {/* Bloco de Token da Loja */}
        <div className="p-3 rounded-xl bg-white/90 dark:bg-white/5 border border-purple-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              Token de Integração desta Loja:
            </span>
            <p className="text-[11px] text-slate-500 dark:text-purple-200/60 font-mono">
              {activeTenantId}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyToken}
              className="h-8 px-3 rounded-lg border-purple-200 dark:border-white/15 text-[11px] font-semibold"
            >
              {copiedToken ? (
                <>
                  <CheckCheck className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Copiar Token
                </>
              )}
            </Button>
          </div>
        </div>
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
                  className={`p-4 rounded-2xl border transition shadow-xs flex flex-col justify-between gap-3 ${printer.isActive
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
                        className={`text-[10px] font-bold ${printer.isActive
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
                        {printer.connectionType === 'NATIVE_PRINT'
                          ? 'Diálogo do Navegador'
                          : 'Servidor Windows (Silencioso)'}
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
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenPreviewModal(printer)}
                        className="h-8 px-2.5 rounded-lg border-purple-200 dark:border-white/15 text-[11px] font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 cursor-pointer"
                        title="Ver layout simulado e código ESC/POS renderizado"
                      >
                        <Eye className="h-3 w-3 mr-1 text-purple-600 dark:text-purple-400" />
                        Pré-visualizar
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={testingPrinterId === printer.id}
                        onClick={() => handleTestPrint(printer)}
                        className="h-8 px-2.5 rounded-lg border-purple-200 dark:border-white/15 text-[11px] font-semibold cursor-pointer"
                      >
                        <Scissors className="h-3 w-3 mr-1 text-purple-600" />
                        {testingPrinterId === printer.id ? 'A imprimir...' : 'Testar Corte'}
                      </Button>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditModal(printer)}
                        className="h-8 w-8 p-0 text-slate-600 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white cursor-pointer"
                        title="Editar Impressora"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePrinter(printer)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
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
                  {agentStatus?.online && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="h-3 w-3" /> Servidor Windows Online
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
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${routingTab === 'CATEGORIES'
                        ? 'bg-white dark:bg-purple-900 text-purple-950 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-purple-200 hover:text-purple-950'
                      }`}
                  >
                    Por Categorias ({selectedCategories.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoutingTab('PRODUCTS')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${routingTab === 'PRODUCTS'
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
                            className={`px-2 py-1.5 rounded-lg border text-[10.5px] font-medium text-left transition flex items-center justify-between gap-1 cursor-pointer truncate ${isChecked
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
                            className={`px-2 py-1.5 rounded-lg border text-[10.5px] font-medium text-left transition flex items-center justify-between gap-1 cursor-pointer truncate ${isChecked
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

      {/* 5. MODAL DE PRÉ-VISUALIZAÇÃO DA COMANDA E CÓDIGO RENDERIZADO */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-4xl w-[95vw] rounded-3xl p-5 md:p-6 max-h-[92vh] overflow-y-auto bg-slate-50 dark:bg-[#120224] border border-purple-200 dark:border-white/10">
          <DialogHeader className="pb-3 border-b border-purple-100 dark:border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Pré-visualização do Talão · {previewPrinter?.name || 'Impressora'}
                </DialogTitle>
                <p className="text-xs text-slate-500 dark:text-purple-300/70 mt-0.5">
                  Driver: <span className="font-mono text-purple-700 dark:text-purple-300 font-semibold">{previewPrinter?.driverName}</span> · {previewPrinter?.copies || 1} via(s) · {storeDisplayInfo.name}
                </p>
              </div>

              {/* Botão Copiar Código */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyPreviewCode}
                className="h-8 px-3 rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-purple-900 dark:text-purple-200 font-bold text-xs shadow-xs hover:bg-purple-50 dark:hover:bg-white/10 cursor-pointer self-start sm:self-auto"
              >
                {previewCopied ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                    Código Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1.5 text-purple-600 dark:text-purple-400" />
                    Copiar Código
                  </>
                )}
              </Button>
            </div>
          </DialogHeader>

          {/* Barra de Controles: Alternador de Modelo e Alternador de Visão */}
          <div className="py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-purple-100 dark:border-white/10">
            {/* Seletor de Modelo de Impressão */}
            <div className="flex items-center gap-1 bg-purple-100/70 dark:bg-white/5 p-1 rounded-xl text-xs font-semibold">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-purple-300 px-1.5 hidden sm:inline">
                Modelo:
              </span>
              <button
                type="button"
                onClick={() => setPreviewLayoutOverride('KITCHEN_SLIP')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-xs ${renderedPreview.layout === 'KITCHEN_SLIP'
                    ? 'bg-white dark:bg-purple-900 text-purple-950 dark:text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-purple-200 hover:text-purple-950'
                  }`}
              >
                Comanda Cozinha (Foto 1)
              </button>
              <button
                type="button"
                onClick={() => setPreviewLayoutOverride('FULL_RECEIPT')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-xs ${renderedPreview.layout === 'FULL_RECEIPT'
                    ? 'bg-white dark:bg-purple-900 text-purple-950 dark:text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-purple-200 hover:text-purple-950'
                  }`}
              >
                Talão Caixa (Foto 2)
              </button>
              <button
                type="button"
                onClick={() => setPreviewLayoutOverride('TICKET_ONLY')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-xs ${renderedPreview.layout === 'TICKET_ONLY'
                    ? 'bg-white dark:bg-purple-900 text-purple-950 dark:text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-purple-200 hover:text-purple-950'
                  }`}
              >
                Ticket Senha
              </button>
            </div>

            {/* Alternador Visual: Papel Térmico vs Código Puro */}
            <div className="flex items-center gap-1 bg-purple-100/70 dark:bg-white/5 p-1 rounded-xl text-xs font-semibold self-end md:self-auto">
              <button
                type="button"
                onClick={() => setPreviewTab('THERMAL')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer text-xs flex items-center gap-1.5 ${previewTab === 'THERMAL'
                    ? 'bg-white dark:bg-purple-900 text-purple-950 dark:text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-purple-200 hover:text-purple-950'
                  }`}
              >
                <Eye className="h-3.5 w-3.5" />
                Papel Térmico (80mm)
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('CODE')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer text-xs flex items-center gap-1.5 ${previewTab === 'CODE'
                    ? 'bg-white dark:bg-purple-900 text-purple-950 dark:text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-purple-200 hover:text-purple-950'
                  }`}
              >
                <Code2 className="h-3.5 w-3.5" />
                Código Renderizado
              </button>
            </div>
          </div>

          {/* Área Central de Conteúdo */}
          <div className="py-4">
            {previewTab === 'THERMAL' ? (
              /* ABA 1: SIMULAÇÃO REALISTA DA BOBINA DE PAPEL TÉRMICO (80MM / 40 COLUNAS) */
              <div className="flex flex-col items-center">
                <div className="w-full max-w-[420px] bg-[#fbf9f4] dark:bg-[#1a1224] text-slate-900 dark:text-slate-100 p-5 rounded-2xl shadow-lg border border-amber-900/10 dark:border-purple-500/20 relative">
                  {/* Indicador de Topo Serrilhado */}
                  <div className="text-center text-[10px] text-slate-400 dark:text-purple-300/40 tracking-widest pb-3 font-mono border-b border-dashed border-slate-300 dark:border-white/10 mb-3">
                    - - - - CORTE SUPERIOR DA BOBINA - - - -
                  </div>

                  {/* Corpo Formatado em Monospaced Estrito */}
                  <pre className="font-mono text-[12px] leading-[18px] whitespace-pre overflow-x-auto select-text scrollbar-thin">
                    {renderedPreview.clean}
                  </pre>

                  {/* Indicador de Guilhotina Inferior */}
                  <div className="text-center text-[10px] text-slate-400 dark:text-purple-300/40 tracking-widest pt-3 font-mono border-t border-dashed border-slate-300 dark:border-white/10 mt-3">
                    - - - - CORTE DA GUILHOTINA (ESC/POS) - - - -
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-purple-300/70 mt-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Simulação exata de 40 colunas monospaçadas com acentuação PT-PT e símbolo € (Windows-1252).
                </p>
              </div>
            ) : (
              /* ABA 2: CÓDIGO FONTE RENDERIZADO & METADADOS TÉCNICOS */
              <div className="space-y-3">
                {/* Metadados Técnicos da Impressão */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10">
                    <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-purple-300/60">Protocolo</div>
                    <div className="font-bold text-purple-950 dark:text-white mt-0.5">ESC/POS Nativo</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10">
                    <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-purple-300/60">Tabela de Caracteres</div>
                    <div className="font-bold text-purple-950 dark:text-white mt-0.5">Windows-1252 (€)</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10">
                    <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-purple-300/60">Volume de Dados</div>
                    <div className="font-bold text-purple-950 dark:text-white mt-0.5">~{renderedPreview.raw.length} bytes</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10">
                    <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-purple-300/60">Total de Linhas</div>
                    <div className="font-bold text-purple-950 dark:text-white mt-0.5">{renderedPreview.clean.split('\n').length} linhas</div>
                  </div>
                </div>

                {/* Bloco de Código ESC/POS Renderizado */}
                <div className="rounded-2xl border border-slate-800 bg-[#0c0517] p-4 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[460px] shadow-inner relative">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-[11px] text-purple-300/70">
                    <span>// Saída bruta formatada para envio ao Spooler Win32 ({previewPrinter?.driverName})</span>
                    <button
                      type="button"
                      onClick={handleCopyPreviewCode}
                      className="text-purple-300 hover:text-white underline cursor-pointer"
                    >
                      Copiar Tudo
                    </button>
                  </div>
                  <pre className="whitespace-pre font-mono leading-relaxed select-text">
                    {renderedPreview.clean}
                  </pre>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-3 border-t border-purple-100 dark:border-white/10 flex flex-row items-center justify-between sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => previewPrinter && handleTestPrint(previewPrinter)}
              className="text-xs font-semibold border-purple-200 dark:border-white/15"
            >
              <Scissors className="h-3.5 w-3.5 mr-1.5 text-purple-600" />
              Disparar Teste Físico
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPreviewModalOpen(false)}
              className="text-xs font-bold"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
