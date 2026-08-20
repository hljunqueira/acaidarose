import { Tenant, User, ProductContainer, ProductBase, ProductTopping, Order } from '@/types'
import { StaffMember } from '@/types/staff'
import { RestaurantTable } from '@/types/tables'
import { CashierTransaction } from '@/types/cashier'

export interface MockDataStore {
  tenants: Tenant[]
  users: User[]
  staff: StaffMember[]
  tables: RestaurantTable[]
  cashierTransactions: CashierTransaction[]
  containers: ProductContainer[]
  bases: ProductBase[]
  toppings: ProductTopping[]
  orders: Order[]
  sessions: any[]
  storeProductOverrides: Record<string, Record<string, boolean>>
  franchiseContracts: any[]
  qrCodeConfigs: Record<string, any>
  auditLogs: any[]
  reviews: any[]
}

export const HQ_TENANT: Tenant = {
  id: 'tenant-torres-novas',
  name: 'Açaí da Rose — Matriz (Torres Novas)',
  companyName: 'Rose & Vavá Portugal Lda',
  slug: 'torres-novas',
  nif: '509123456',
  address: 'Av. Manuel de Figueiredo 12',
  postalCode: '2350-771',
  city: 'Torres Novas',
  phone: '+351 911 050 264',
  mbwayPhone: '+351 911 050 264',
  currency: 'EUR',
  wifiNetwork: 'AcaiDaRose_Clientes',
  wifiPassword: 'acaiportugal2026',
  aboutText: 'O autêntico açaí artesanal brasileiro no coração de Torres Novas. Frutas frescas cortadas na hora, cremes cremosos e uma experiência única de sabor e energia.',
  instagramUrl: 'https://instagram.com/acaidarose.pt',
  googleMapsUrl: 'https://www.google.com/maps/place/A%C3%A7a%C3%AD+da+Rose+Torres+Novas/@39.483811,-8.538574,17z',
  ratingAverage: 4.9,
  ratingCount: 142,
  openingHours: {
    seg: { open: '13:00', close: '22:00' },
    ter: { open: '13:00', close: '22:00' },
    qua: { open: '13:00', close: '22:00' },
    qui: { open: '13:00', close: '22:00' },
    sex: { open: '13:00', close: '20:00' },
    sab: { open: '15:00', close: '22:00' },
    dom: { open: '15:00', close: '22:00' },
  },
  isHeadquarters: true,
  active: true,
}

export const DEFAULT_TENANT: Tenant = HQ_TENANT

export const AVEIRO_TENANT: Tenant = {
  id: 'tenant-aveiro',
  name: 'Açaí da Rose — Filial Aveiro',
  companyName: 'Açaí Aveiro Franquias Unipessoal',
  slug: 'aveiro',
  nif: '509654321',
  address: 'Avenida Dr. Lourenço Peixinho 85, Aveiro',
  postalCode: '3800-165',
  city: 'Aveiro',
  phone: '+351 911 050 264',
  mbwayPhone: '+351 911 050 264',
  currency: 'EUR',
  wifiNetwork: 'AcaiDaRose_Aveiro',
  wifiPassword: 'acaiportugal2026',
  aboutText: 'A primeira filial oficial da rede em Aveiro, trazendo toda a qualidade e tradição das nossas receitas artesanais à Veneza Portuguesa.',
  instagramUrl: 'https://instagram.com/acaidarose.aveiro',
  ratingAverage: 4.8,
  ratingCount: 89,
  openingHours: {
    seg: { open: '12:00', close: '22:00' },
    ter: { open: '12:00', close: '22:00' },
    qua: { open: '12:00', close: '22:00' },
    qui: { open: '12:00', close: '22:00' },
    sex: { open: '12:00', close: '23:00' },
    sab: { open: '12:00', close: '23:00' },
    dom: { open: '13:00', close: '22:00' },
  },
  isHeadquarters: false,
  active: true,
}

function getInitialStore(): MockDataStore {
  const tenants: Tenant[] = [
    HQ_TENANT,
    AVEIRO_TENANT,
  ]

  const users: User[] = [
    // 1. Franqueadora Multi-Loja (Acesso Global Ilimitado)
    {
      id: 'usr-franqueadora',
      tenantId: 'tenant-torres-novas',
      name: 'Açaí da Rose (Franqueadora)',
      email: 'franqueadora@acairose.pt',
      password: '123456',
      passwordHash: '123456',
      role: 'SUPER_ADMIN',
      active: true,
      createdAt: new Date().toISOString(),
    },
    // 2. Gerente Matriz Torres Novas
    {
      id: 'usr-gerente-torres',
      tenantId: 'tenant-torres-novas',
      name: 'Gerente Torres Novas',
      email: 'torresnovas@acairose.pt',
      password: '123456',
      passwordHash: '123456',
      role: 'TENANT_ADMIN',
      active: true,
      createdAt: new Date().toISOString(),
    },
    // Operadores Caixa Torres Novas
    {
      id: 'usr-caixa1-torres',
      tenantId: 'tenant-torres-novas',
      name: 'Operador Caixa 1 (Torres Novas)',
      email: 'caixa1.torresnovas@acairose.pt',
      password: '123456',
      passwordHash: '123456',
      role: 'CASHIER',
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr-caixa2-torres',
      tenantId: 'tenant-torres-novas',
      name: 'Operador Caixa 2 (Torres Novas)',
      email: 'caixa2.torresnovas@acairose.pt',
      password: '123456',
      passwordHash: '123456',
      role: 'CASHIER',
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr-caixa3-torres',
      tenantId: 'tenant-torres-novas',
      name: 'Operador Caixa 3 (Torres Novas)',
      email: 'caixa3.torresnovas@acairose.pt',
      password: '123456',
      passwordHash: '123456',
      role: 'CASHIER',
      active: true,
      createdAt: new Date().toISOString(),
    },

    // 3. Gerente Filial Aveiro
    {
      id: 'usr-gerente-aveiro',
      tenantId: 'tenant-aveiro',
      name: 'Gerente Aveiro',
      email: 'aveiro@acairose.pt',
      password: '123456',
      passwordHash: '123456',
      role: 'TENANT_ADMIN',
      active: true,
      createdAt: new Date().toISOString(),
    },
    // Operadores Caixa Aveiro
    {
      id: 'usr-caixa1-aveiro',
      tenantId: 'tenant-aveiro',
      name: 'Operador Caixa 1 (Aveiro)',
      email: 'caixa1.aveiro@acairose.pt',
      password: '123456',
      passwordHash: '123456',
      role: 'CASHIER',
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr-caixa2-aveiro',
      tenantId: 'tenant-aveiro',
      name: 'Operador Caixa 2 (Aveiro)',
      email: 'caixa2.aveiro@acairose.pt',
      password: '123456',
      passwordHash: '123456',
      role: 'CASHIER',
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr-caixa3-aveiro',
      tenantId: 'tenant-aveiro',
      name: 'Operador Caixa 3 (Aveiro)',
      email: 'caixa3.aveiro@acairose.pt',
      password: '123456',
      passwordHash: '123456',
      role: 'CASHIER',
      active: true,
      createdAt: new Date().toISOString(),
    },
  ]

  // 1. RECIPIENTES OFICIAIS COM FOTOS REAIS DE AÇAÍ
  const containers: ProductContainer[] = [
    {
      id: 'cnt-250',
      tenantId: null,
      name: 'Açaí 250g',
      weightGrams: 250,
      precoBase: 6.50,
      limiteFrutas: 2,
      limiteToppings: 3,
      limiteCremes: 1,
      limiteBases: 1,
      limiteComplementosGratis: 3,
      emoji: '🍧',
      image: '/images/acai_250g.jpg',
      active: true,
      displayOrder: 1,
    },
    {
      id: 'cnt-350',
      tenantId: null,
      name: 'Açaí 350g',
      weightGrams: 350,
      precoBase: 9.00,
      limiteFrutas: 3,
      limiteToppings: 4,
      limiteCremes: 1,
      limiteBases: 1,
      limiteComplementosGratis: 4,
      emoji: '🍧',
      image: '/images/acai_350g.jpg',
      active: true,
      displayOrder: 2,
    },
    {
      id: 'cnt-500',
      tenantId: null,
      name: 'Açaí 500g',
      weightGrams: 500,
      precoBase: 12.90,
      limiteFrutas: 999,
      limiteToppings: 999,
      limiteCremes: 1,
      limiteBases: 1,
      limiteComplementosGratis: 999,
      emoji: '🍨',
      image: '/images/acai_500g.jpg',
      active: true,
      displayOrder: 3,
    },
    {
      id: 'cnt-750',
      tenantId: null,
      name: 'Açaí 750g',
      weightGrams: 750,
      precoBase: 18.90,
      limiteFrutas: 999,
      limiteToppings: 999,
      limiteCremes: 1,
      limiteBases: 1,
      limiteComplementosGratis: 999,
      emoji: '🍨',
      image: '/images/acai_750g.jpg',
      active: true,
      displayOrder: 4,
    },
    {
      id: 'cnt-1000',
      tenantId: null,
      name: 'Açaí 1 Kg',
      weightGrams: 1000,
      precoBase: 25.90,
      limiteFrutas: 999,
      limiteToppings: 999,
      limiteCremes: 1,
      limiteBases: 1,
      limiteComplementosGratis: 999,
      emoji: '🥣',
      image: '/images/acai_1kg.jpg',
      active: true,
      displayOrder: 5,
    },
  ]

  // 2. CREMES GELADOS (1 Opcional Incluso) COM FOTOS REAIS
  const bases: ProductBase[] = [
    { id: 'base-acai', tenantId: null, name: 'Açaí Tradicional Puro', description: 'Açaí artesanal cremoso batido na hora', emoji: '🟣', active: true, displayOrder: 1 },
    { id: 'base-coco', tenantId: null, name: 'Creme de Coco', description: 'Creme gelado refrescante de coco', emoji: '🥥', active: true, displayOrder: 2 },
    { id: 'base-cupuacu', tenantId: null, name: 'Creme de Cupuaçu', description: 'Cremoso típico da Amazónia', emoji: '🍈', active: true, displayOrder: 3 },
    { id: 'base-goiaba', tenantId: null, name: 'Creme de Goiaba', description: 'Sabor doce e tropical de goiaba', emoji: '🌸', active: true, displayOrder: 4 },
    { id: 'base-graviola', tenantId: null, name: 'Creme de Graviola', description: 'Leve, suave e aromático', emoji: '🍃', active: true, displayOrder: 5 },
    { id: 'base-maracuja', tenantId: null, name: 'Creme de Maracujá', description: 'Toque cítrico e refrescante', emoji: '💛', active: true, displayOrder: 6 },
    { id: 'base-morango', tenantId: null, name: 'Creme de Morango', description: 'Gelado cremoso de morango fresco', emoji: '🍓', active: true, displayOrder: 7 },
    { id: 'base-manga', tenantId: null, name: 'Creme de Manga', description: 'Sabor tropical intenso', emoji: '🥭', active: true, displayOrder: 8 },
    { id: 'base-ninho', tenantId: null, name: 'Creme de Ninho', description: 'Sabor clássico e doce de leite ninho', emoji: '🥛', active: true, displayOrder: 9 },
    { id: 'base-pitaya', tenantId: null, name: 'Creme de Pitaya', description: 'Sorbet vibrante de fruta fresca', emoji: '🌺', active: true, displayOrder: 10 },
  ]

  // 3. FRUTAS, TOPPINGS E ADICIONAIS
  const toppings: ProductTopping[] = [
    // Frutas (5)
    { id: 'fruta-banana', tenantId: null, name: 'Banana', category: 'Frutas', emoji: '🍌', precoExtra: 0, isPremium: false, active: true, displayOrder: 1 },
    { id: 'fruta-kiwi', tenantId: null, name: 'Kiwi', category: 'Frutas', emoji: '🥝', precoExtra: 0, isPremium: false, active: true, displayOrder: 2 },
    { id: 'fruta-manga', tenantId: null, name: 'Manga', category: 'Frutas', emoji: '🥭', precoExtra: 0, isPremium: false, active: true, displayOrder: 3 },
    { id: 'fruta-morango', tenantId: null, name: 'Morango', category: 'Frutas', emoji: '🍓', precoExtra: 0, isPremium: false, active: true, displayOrder: 4 },
    { id: 'fruta-uva', tenantId: null, name: 'Uva', category: 'Frutas', emoji: '🍇', precoExtra: 0, isPremium: false, active: true, displayOrder: 5 },

    // Toppings (16)
    { id: 'top-biscoff-creme', tenantId: null, name: 'Biscoff creme', category: 'Toppings', emoji: '🍪', precoExtra: 0, isPremium: false, active: true, displayOrder: 6 },
    { id: 'top-biscoff-picado', tenantId: null, name: 'Biscoff picado', category: 'Toppings', emoji: '🍪', precoExtra: 0, isPremium: false, active: true, displayOrder: 7 },
    { id: 'top-canudo', tenantId: null, name: 'Canudo crocante', category: 'Toppings', emoji: '🥢', precoExtra: 0, isPremium: false, active: true, displayOrder: 8 },
    { id: 'top-chocobol', tenantId: null, name: 'Chocobol (Nesquik)', category: 'Toppings', emoji: '🍫', precoExtra: 0, isPremium: false, active: true, displayOrder: 9 },
    { id: 'top-granola', tenantId: null, name: 'Granola', category: 'Toppings', emoji: '🌾', precoExtra: 0, isPremium: false, active: true, displayOrder: 10 },
    { id: 'top-iogurte', tenantId: null, name: 'Iogurte Natural', category: 'Toppings', emoji: '🥛', precoExtra: 0, isPremium: false, active: true, displayOrder: 11 },
    { id: 'top-leite-condensado', tenantId: null, name: 'Leite Condensado', category: 'Toppings', emoji: '🍯', precoExtra: 0, isPremium: false, active: true, displayOrder: 12 },
    { id: 'top-leite-po', tenantId: null, name: 'Leite em Pó', category: 'Toppings', emoji: '🥛', precoExtra: 0, isPremium: false, active: true, displayOrder: 13 },
    { id: 'top-manteiga-amendoim', tenantId: null, name: 'Manteiga de Amendoim', category: 'Toppings', emoji: '🥜', precoExtra: 0, isPremium: false, active: true, displayOrder: 14 },
    { id: 'top-marshmallow', tenantId: null, name: 'Marshmallow', category: 'Toppings', emoji: '☁️', precoExtra: 0, isPremium: false, active: true, displayOrder: 15 },
    { id: 'top-mel', tenantId: null, name: 'Mel', category: 'Toppings', emoji: '🍯', precoExtra: 0, isPremium: false, active: true, displayOrder: 16 },
    { id: 'top-oreo-inteiro', tenantId: null, name: 'Oreo inteiro', category: 'Toppings', emoji: '🍪', precoExtra: 0, isPremium: false, active: true, displayOrder: 17 },
    { id: 'top-oreo-picado', tenantId: null, name: 'Oreo picado', category: 'Toppings', emoji: '🍪', precoExtra: 0, isPremium: false, active: true, displayOrder: 18 },
    { id: 'top-ovomaltine', tenantId: null, name: 'Ovomaltine', category: 'Toppings', emoji: '🍫', precoExtra: 0, isPremium: false, active: true, displayOrder: 19 },
    { id: 'top-pacoca', tenantId: null, name: 'Paçoca', category: 'Toppings', emoji: '🥜', precoExtra: 0, isPremium: false, active: true, displayOrder: 20 },
    { id: 'top-pepitas', tenantId: null, name: 'Pepitas de Chocolate', category: 'Toppings', emoji: '🍫', precoExtra: 0, isPremium: false, active: true, displayOrder: 21 },
    { id: 'top-pintarolas', tenantId: null, name: 'Pintarolas (M&Ms)', category: 'Toppings', emoji: '🍬', precoExtra: 0, isPremium: false, active: true, displayOrder: 22 },

    // Adicionais Especiais (Cobrança Dinâmica por Peso)
    { id: 'add-ninho', tenantId: null, name: 'Creme de Ninho', category: 'Adicionais', emoji: '🥛', isSpecialAddon: true, priceTierLow: 1.00, priceTierHigh: 2.00, precoExtra: 1.00, isPremium: true, active: true, displayOrder: 23 },
    { id: 'add-pistache', tenantId: null, name: 'Creme de Pistache', category: 'Adicionais', emoji: '🥜', isSpecialAddon: true, priceTierLow: 2.00, priceTierHigh: 4.00, precoExtra: 2.00, isPremium: true, active: true, displayOrder: 24 },
    { id: 'add-nutella', tenantId: null, name: 'Nutella Original', category: 'Adicionais', emoji: '🍫', isSpecialAddon: true, priceTierLow: 1.00, priceTierHigh: 2.00, precoExtra: 1.00, isPremium: true, active: true, displayOrder: 25 },
  ]

  const now = new Date().toISOString()
  const orders: Order[] = [
    // Pedido Mesa 02 em aberto
    {
      id: 'ord-qr-1',
      tenantId: 'tenant-torres-novas',
      orderNumber: 101,
      total: 13.90,
      totalAmount: 13.90,
      subtotal: 13.90,
      subtotalAmount: 13.90,
      itemsCount: 1,
      paymentMethod: 'MB_WAY',
      paymentStatus: 'PENDING',
      status: 'NEW',
      isTableOrder: true,
      tableNumber: 'Mesa 02',
      customerName: 'Tiago Santos',
      customerPhone: '+351 912 345 678',
      items: [
        {
          id: 'item-1',
          container: containers[2], // 500g
          bases: [bases[0]], // Açaí Tradicional
          toppings: [
            { id: 'fruta-morango', name: 'Morango', category: 'Frutas', emoji: '🍓', isPaid: false, precoCobrado: 0, precoExtra: 0, active: true },
            { id: 'fruta-banana', name: 'Banana', category: 'Frutas', emoji: '🍌', isPaid: false, precoCobrado: 0, precoExtra: 0, active: true },
            { id: 'top-granola', name: 'Granola', category: 'Toppings', emoji: '🌾', isPaid: false, precoCobrado: 0, precoExtra: 0, active: true },
            { id: 'add-nutella', name: 'Nutella Original', category: 'Adicionais', emoji: '🍫', isPaid: true, precoCobrado: 1.00, precoExtra: 1.00, active: true },
          ],
          lineTotal: 13.90,
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    // Pedido Balcão pago
    {
      id: 'ord-tn-1',
      tenantId: 'tenant-torres-novas',
      orderNumber: 102,
      total: 6.50,
      totalAmount: 6.50,
      subtotal: 6.50,
      subtotalAmount: 6.50,
      itemsCount: 1,
      paymentMethod: 'MB_WAY',
      paymentStatus: 'PAID',
      status: 'PAID',
      isTableOrder: false,
      tableNumber: 'Balcão',
      customerName: 'Manuel Silva',
      customerPhone: '+351 911 050 264',
      mbwayPhone: '+351 911 050 264',
      items: [],
      createdAt: now,
      updatedAt: now,
    },
  ]

  const franchiseContracts = [
    {
      id: 'cont-001',
      tenantId: 'tenant-torres-novas',
      storeName: 'Açaí da Rose — Matriz (Torres Novas)',
      franchiseeName: 'Rose & Vavá Portugal Lda',
      nif: '509123456',
      startDate: '2024-01-15',
      renewalDate: '2029-01-15',
      franchiseFee: 25000.00,
      monthsActive: 18,
      royaltyPercent: 4.0, // > 12 meses = 4%
      marketingPercent: 2.0,
      status: 'ATIVO',
      monthlyRevenue: 18450.00,
    },
    {
      id: 'cont-002',
      tenantId: 'tenant-aveiro',
      storeName: 'Açaí da Rose — Filial Aveiro',
      franchiseeName: 'Açaí Aveiro Franquias Unipessoal',
      nif: '509654321',
      startDate: '2026-04-01',
      renewalDate: '2031-04-01',
      franchiseFee: 25000.00,
      monthsActive: 4,
      royaltyPercent: 0.0, // <= 6 meses = 0% carência
      marketingPercent: 2.0,
      status: 'ATIVO',
      monthlyRevenue: 12890.00,
    },
  ]

  const staff: StaffMember[] = [
    {
      id: 'staff-01',
      tenantId: 'tenant-torres-novas',
      code: 'G01',
      name: 'Karol Silva',
      nickname: 'Atendente Karol',
      phone: '+351 912 345 678',
      serviceCommission: 5.0,
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'staff-02',
      tenantId: 'tenant-torres-novas',
      code: 'G02',
      name: 'Tiago Santos',
      nickname: 'Atendente Tiago',
      phone: '+351 913 456 789',
      serviceCommission: 5.0,
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'staff-03',
      tenantId: 'tenant-aveiro',
      code: 'G01',
      name: 'Manuel Silva',
      nickname: 'Atendente Manuel',
      phone: '+351 914 567 890',
      serviceCommission: 5.0,
      active: true,
      createdAt: new Date().toISOString(),
    },
  ]

  const tables: RestaurantTable[] = [
    {
      id: 'tbl-01',
      tenantId: 'tenant-torres-novas',
      number: 1,
      code: '1',
      nickname: 'Salão Principal 01',
      serviceChargePercent: 0,
      status: 'AVAILABLE',
      assignedStaffId: 'staff-01',
      assignedStaffName: 'Atendente Karol',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tbl-02',
      tenantId: 'tenant-torres-novas',
      number: 2,
      code: '2',
      nickname: 'Salão Principal 02',
      serviceChargePercent: 0,
      status: 'OCCUPIED',
      assignedStaffId: 'staff-01',
      assignedStaffName: 'Atendente Karol',
      activatedAt: '14:02',
      total: 13.90,
      items: [
        {
          id: 'item-tbl-02',
          container: containers[2], // 500g
          bases: [bases[0]], // Puro
          toppings: [
            { ...toppings[0], isPaid: false, precoCobrado: 0 },
            { ...toppings[1], isPaid: false, precoCobrado: 0 },
            { ...toppings[4], isPaid: false, precoCobrado: 0 },
            { ...toppings[8], isPaid: false, precoCobrado: 0 },
          ],
          lineTotal: 13.90,
        },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tbl-03',
      tenantId: 'tenant-torres-novas',
      number: 3,
      code: '3',
      nickname: 'Esplanada 01',
      serviceChargePercent: 0,
      status: 'AVAILABLE',
      assignedStaffId: 'staff-02',
      assignedStaffName: 'Atendente Tiago',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tbl-04',
      tenantId: 'tenant-torres-novas',
      number: 4,
      code: '4',
      nickname: 'Esplanada 02',
      serviceChargePercent: 0,
      status: 'AVAILABLE',
      assignedStaffId: 'staff-02',
      assignedStaffName: 'Atendente Tiago',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tbl-05',
      tenantId: 'tenant-aveiro',
      number: 1,
      code: '1',
      nickname: 'Mesa Balcão 01',
      serviceChargePercent: 0,
      status: 'AVAILABLE',
      assignedStaffId: 'staff-03',
      assignedStaffName: 'Atendente Manuel',
      createdAt: new Date().toISOString(),
    },
  ]

  const cashierTransactions: CashierTransaction[] = [
    {
      id: 'tx-001',
      tenantId: 'tenant-torres-novas',
      type: 'SUPPLY',
      amount: 100.00,
      reason: 'Fundo de maneio / Troco de abertura do turno',
      operatorName: 'Açaí da Rose (Franqueadora)',
      timestamp: new Date().toISOString(),
    },
  ]

  const qrCodeConfigs: Record<string, any> = {
    'tenant-torres-novas': {
      mode: 'ORDER_EMISSION', // 'DISABLED' | 'VIEW_ONLY' | 'ORDER_EMISSION'
      useDelivery: true,
      allowMbwayPayment: true,
      tableMode: 'FIXED_QR', // 'FIXED_QR' | 'TYPED_TABLE'
      customerNameRule: 'OPTIONAL', // 'NONE' | 'OPTIONAL' | 'REQUIRED'
      customerPhoneRule: 'REQUIRED',
      customerNifRule: 'OPTIONAL',
      bannerUrl: '',
    },
    'tenant-aveiro': {
      mode: 'ORDER_EMISSION',
      useDelivery: true,
      allowMbwayPayment: true,
      tableMode: 'FIXED_QR',
      customerNameRule: 'OPTIONAL',
      customerPhoneRule: 'REQUIRED',
      customerNifRule: 'OPTIONAL',
      bannerUrl: '',
    },
  }

  const auditLogs: any[] = [
    {
      id: 'log-01',
      tenantId: 'tenant-torres-novas',
      user: 'franqueadora@acairose.pt',
      action: 'SINCRONIZACAO_CARDAPIO',
      details: 'Disparo de replicação master do cardápio para todas as unidades franqueadas',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'log-02',
      tenantId: 'tenant-torres-novas',
      user: 'franqueadora@acairose.pt',
      action: 'CADASTRO_PRODUTO',
      details: 'Criação do produto Açaí 1Kg com fotos reais e regras de toppings livres',
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
  ]

  const storeProductOverrides: Record<string, Record<string, boolean>> = {
    'tenant-torres-novas': {},
    'tenant-aveiro': {},
  }

  const sessions: any[] = []
  const reviews: any[] = []

  return { tenants, users, staff, tables, cashierTransactions, containers, bases, toppings, orders, sessions, storeProductOverrides, franchiseContracts, qrCodeConfigs, auditLogs, reviews }
}

const globalForMock = globalThis as unknown as { __mock_store_v6__?: MockDataStore }

export function getMockStore(): MockDataStore {
  if (!globalForMock.__mock_store_v6__) {
    globalForMock.__mock_store_v6__ = getInitialStore()
  }
  return globalForMock.__mock_store_v6__
}

export const mockStore = new Proxy({} as MockDataStore, {
  get(_target, prop) {
    return (getMockStore() as any)[prop]
  },
  set(_target, prop, val) {
    ;(getMockStore() as any)[prop] = val
    return true
  },
})
