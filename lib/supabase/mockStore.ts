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
  name: 'Açaí da Rose — Matriz Central (Torres Novas)',
  companyName: 'Rose & Vavá Portugal Lda — Franqueadora',
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
  aboutText: 'Sede Central e Matriz do autêntico açaí artesanal brasileiro em Portugal. Frutas frescas cortadas na hora, cremes artesanais e gestão de toda a rede de franquias.',
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

export const LISBOA_TENANT: Tenant = {
  id: 'tenant-lisboa',
  name: 'Açaí da Rose — Filial Lisboa (Parque das Nações)',
  companyName: 'Açaí Lisboa Franquias Lda',
  slug: 'lisboa',
  nif: '509333444',
  address: 'Alameda dos Oceanos 41, Parque das Nações',
  postalCode: '1990-203',
  city: 'Lisboa',
  phone: '+351 915 220 330',
  mbwayPhone: '+351 915 220 330',
  currency: 'EUR',
  wifiNetwork: 'AcaiDaRose_Lisboa',
  wifiPassword: 'acaiportugal2026',
  aboutText: 'A filial de Lisboa traz toda a cremosidade e tradição das receitas originais do Açaí da Rose à beira do Rio Tejo.',
  instagramUrl: 'https://instagram.com/acaidarose.lisboa',
  ratingAverage: 4.9,
  ratingCount: 185,
  openingHours: {
    seg: { open: '11:30', close: '22:30' },
    ter: { open: '11:30', close: '22:30' },
    qua: { open: '11:30', close: '22:30' },
    qui: { open: '11:30', close: '22:30' },
    sex: { open: '11:30', close: '23:30' },
    sab: { open: '11:30', close: '23:30' },
    dom: { open: '12:00', close: '22:30' },
  },
  isHeadquarters: false,
  active: true,
}

export const SANTAREM_TENANT: Tenant = {
  id: 'tenant-santarem',
  name: 'Açaí da Rose — Filial Santarém',
  companyName: 'Açaí Ribatejo Franquias Lda',
  slug: 'santarem',
  nif: '509654321',
  address: 'Rua Serpa Pinto 45, Centro Histórico',
  postalCode: '2000-046',
  city: 'Santarém',
  phone: '+351 912 880 110',
  mbwayPhone: '+351 912 880 110',
  currency: 'EUR',
  wifiNetwork: 'AcaiDaRose_Santarem',
  wifiPassword: 'acaiportugal2026',
  aboutText: 'A filial de Santarém traz toda a cremosidade e tradição do melhor açaí brasileiro para o coração do Ribatejo.',
  instagramUrl: 'https://instagram.com/acaidarose.santarem',
  ratingAverage: 4.9,
  ratingCount: 98,
  openingHours: {
    seg: { open: '12:00', close: '22:00' },
    ter: { open: '12:00', close: '22:00' },
    qua: { open: '12:00', close: '22:00' },
    qui: { open: '12:00', close: '22:00' },
    sex: { open: '12:00', close: '23:00' },
    sab: { open: '12:00', close: '23:00' },
    dom: { open: '14:00', close: '22:00' },
  },
  isHeadquarters: false,
  active: true,
}

export const AVEIRO_TENANT: Tenant = {
  id: 'tenant-aveiro',
  name: 'Açaí da Rose — Filial Aveiro',
  companyName: 'Açaí Aveiro Franquias Unipessoal',
  slug: 'aveiro',
  nif: '509789123',
  address: 'Avenida Dr. Lourenço Peixinho 85, Aveiro',
  postalCode: '3800-165',
  city: 'Aveiro',
  phone: '+351 913 550 770',
  mbwayPhone: '+351 913 550 770',
  currency: 'EUR',
  wifiNetwork: 'AcaiDaRose_Aveiro',
  wifiPassword: 'acaiportugal2026',
  aboutText: 'A filial de Aveiro traz a qualidade e tradição das receitas artesanais do Açaí da Rose à Veneza Portuguesa.',
  instagramUrl: 'https://instagram.com/acaidarose.aveiro',
  ratingAverage: 4.9,
  ratingCount: 120,
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

export const DEFAULT_TENANT: Tenant = HQ_TENANT

function getInitialStore(): MockDataStore {
  const tenants: Tenant[] = [
    HQ_TENANT,
    LISBOA_TENANT,
    SANTAREM_TENANT,
    AVEIRO_TENANT,
  ]

  const users: User[] = [
    // 1. Franqueadora Multi-Loja (Acesso Global Ilimitado a Todas as Lojas)
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
    {
      id: 'usr-super-alias',
      tenantId: 'tenant-torres-novas',
      name: 'Açaí da Rose (Franqueadora)',
      email: 'super@acairose.pt',
      password: '123456',
      passwordHash: '123456',
      role: 'SUPER_ADMIN',
      active: true,
      createdAt: new Date().toISOString(),
    },

    // 2. Loja 1 — Lisboa / Parque das Nações (Email Principal)
    {
      id: 'usr-gerente-lisboa',
      tenantId: 'tenant-lisboa',
      name: 'Gerente Loja 1 (Lisboa)',
      email: 'lisboa@acairose.pt',
      password: '123456',
      passwordHash: '123456',
      role: 'TENANT_ADMIN',
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr-admin-alias',
      tenantId: 'tenant-lisboa',
      name: 'Gerente Loja 1 (Lisboa)',
      email: 'admin@acairose.pt',
      password: '123456',
      passwordHash: '123456',
      role: 'TENANT_ADMIN',
      active: true,
      createdAt: new Date().toISOString(),
    },

    // 3. Loja 2 — Santarém (Email Principal)
    {
      id: 'usr-gerente-santarem',
      tenantId: 'tenant-santarem',
      name: 'Gerente Loja 2 (Santarém)',
      email: 'santarem@acairose.pt',
      password: '123456',
      passwordHash: '123456',
      role: 'TENANT_ADMIN',
      active: true,
      createdAt: new Date().toISOString(),
    },

    // 4. Loja 3 — Aveiro (Email Principal)
    {
      id: 'usr-gerente-aveiro',
      tenantId: 'tenant-aveiro',
      name: 'Gerente Loja 3 (Aveiro)',
      email: 'aveiro@acairose.pt',
      password: '123456',
      passwordHash: '123456',
      role: 'TENANT_ADMIN',
      active: true,
      createdAt: new Date().toISOString(),
    },

    // Operador de Caixa
    {
      id: 'usr-caixa-alias',
      tenantId: 'tenant-lisboa',
      name: 'Operador Caixa Lisboa',
      email: 'caixa@acairose.pt',
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
      image: '/images/official/acai_copo_250g.jpg',
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
      image: '/images/official/acai_copo_350g.jpg',
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
      image: '/images/official/acai_copo_500g.jpg',
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
      image: '/images/official/acai_tigela_750g.jpg',
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
      image: '/images/official/acai_balde_1kg.jpg',
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
      royaltyPercent: 4.0,
      marketingPercent: 2.0,
      status: 'ATIVO',
      monthlyRevenue: 18450.00,
    },
    {
      id: 'cont-002',
      tenantId: 'tenant-santarem',
      storeName: 'Açaí da Rose — Filial Santarém',
      franchiseeName: 'Açaí Ribatejo Franquias Lda',
      nif: '509654321',
      startDate: '2025-06-01',
      renewalDate: '2030-06-01',
      franchiseFee: 25000.00,
      monthsActive: 12,
      royaltyPercent: 4.0,
      marketingPercent: 2.0,
      status: 'ATIVO',
      monthlyRevenue: 14200.00,
    },
    {
      id: 'cont-003',
      tenantId: 'tenant-lisboa',
      storeName: 'Açaí da Rose — Filial Lisboa Oriente',
      franchiseeName: 'Rose & Açaí Lisboa Franquias Lda',
      nif: '509789123',
      startDate: '2026-01-10',
      renewalDate: '2031-01-10',
      franchiseFee: 25000.00,
      monthsActive: 6,
      royaltyPercent: 0.0,
      marketingPercent: 2.0,
      status: 'ATIVO',
      monthlyRevenue: 22800.00,
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
      tenantId: 'tenant-santarem',
      code: 'G01',
      name: 'Gonçalo Ribeiro',
      nickname: 'Atendente Gonçalo',
      phone: '+351 914 567 890',
      serviceCommission: 5.0,
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'staff-04',
      tenantId: 'tenant-aveiro',
      code: 'G01',
      name: 'Manuel Silva',
      nickname: 'Atendente Manuel',
      phone: '+351 915 678 901',
      serviceCommission: 5.0,
      active: true,
      createdAt: new Date().toISOString(),
    },
  ]

  const tables: RestaurantTable[] = [
    // Loja 1: Lisboa (Parque das Nações)
    {
      id: 'tbl-lx-01',
      tenantId: 'tenant-lisboa',
      number: 1,
      code: '1',
      nickname: 'Salão Tejo 01',
      serviceChargePercent: 0,
      status: 'AVAILABLE',
      assignedStaffId: 'staff-01',
      assignedStaffName: 'Atendente Sofia',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tbl-lx-02',
      tenantId: 'tenant-lisboa',
      number: 2,
      code: '2',
      nickname: 'Esplanada Tejo 02',
      serviceChargePercent: 0,
      status: 'OCCUPIED',
      assignedStaffId: 'staff-01',
      assignedStaffName: 'Atendente Sofia',
      activatedAt: '14:02',
      total: 12.90,
      items: [
        {
          id: 'item-tbl-lx-02',
          container: containers[2], // 500g
          bases: [bases[0]], // Puro
          toppings: [
            { ...toppings[0], isPaid: false, precoCobrado: 0 },
            { ...toppings[1], isPaid: false, precoCobrado: 0 },
          ],
          lineTotal: 12.90,
        },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tbl-lx-03',
      tenantId: 'tenant-lisboa',
      number: 3,
      code: '3',
      nickname: 'Balcão Rápido',
      serviceChargePercent: 0,
      status: 'AVAILABLE',
      assignedStaffId: 'staff-02',
      assignedStaffName: 'Atendente Duarte',
      createdAt: new Date().toISOString(),
    },

    {
      id: 'tbl-tn-01',
      tenantId: 'tenant-torres-novas',
      number: 1,
      code: '1',
      nickname: 'Salão Matriz 01',
      serviceChargePercent: 0,
      status: 'AVAILABLE',
      assignedStaffId: 'staff-01',
      assignedStaffName: 'Atendente Karol',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tbl-tn-02',
      tenantId: 'tenant-torres-novas',
      number: 2,
      code: '2',
      nickname: 'Salão Matriz 02',
      serviceChargePercent: 0,
      status: 'OCCUPIED',
      assignedStaffId: 'staff-01',
      assignedStaffName: 'Atendente Karol',
      activatedAt: '14:15',
      total: 13.90,
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
      createdAt: new Date().toISOString(),
    },

    // Loja 2: Santarém
    {
      id: 'tbl-st-01',
      tenantId: 'tenant-santarem',
      number: 1,
      code: '1',
      nickname: 'Salão Centro 01',
      serviceChargePercent: 0,
      status: 'AVAILABLE',
      assignedStaffId: 'staff-03',
      assignedStaffName: 'Atendente Gonçalo',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tbl-st-02',
      tenantId: 'tenant-santarem',
      number: 2,
      code: '2',
      nickname: 'Salão Centro 02',
      serviceChargePercent: 0,
      status: 'AVAILABLE',
      assignedStaffId: 'staff-03',
      assignedStaffName: 'Atendente Gonçalo',
      createdAt: new Date().toISOString(),
    },

    // Loja 3: Aveiro
    {
      id: 'tbl-av-01',
      tenantId: 'tenant-aveiro',
      number: 1,
      code: '1',
      nickname: 'Salão Ria 01',
      serviceChargePercent: 0,
      status: 'AVAILABLE',
      assignedStaffId: 'staff-04',
      assignedStaffName: 'Atendente Manuel',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tbl-av-02',
      tenantId: 'tenant-aveiro',
      number: 2,
      code: '2',
      nickname: 'Salão Ria 02',
      serviceChargePercent: 0,
      status: 'AVAILABLE',
      assignedStaffId: 'staff-04',
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
      mode: 'ORDER_EMISSION',
      useDelivery: true,
      allowMbwayPayment: true,
      tableMode: 'FIXED_QR',
      customerNameRule: 'OPTIONAL',
      customerPhoneRule: 'REQUIRED',
      customerNifRule: 'OPTIONAL',
      bannerUrl: '',
    },
    'tenant-lisboa': {
      mode: 'ORDER_EMISSION',
      useDelivery: true,
      allowMbwayPayment: true,
      tableMode: 'FIXED_QR',
      customerNameRule: 'OPTIONAL',
      customerPhoneRule: 'REQUIRED',
      customerNifRule: 'OPTIONAL',
      bannerUrl: '',
    },
    'tenant-santarem': {
      mode: 'ORDER_EMISSION',
      useDelivery: true,
      allowMbwayPayment: true,
      tableMode: 'FIXED_QR',
      customerNameRule: 'OPTIONAL',
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
    'tenant-lisboa': {},
    'tenant-santarem': {},
    'tenant-aveiro': {},
  }

  const sessions: any[] = []
  const reviews: any[] = []

  return { tenants, users, staff, tables, cashierTransactions, containers, bases, toppings, orders, sessions, storeProductOverrides, franchiseContracts, qrCodeConfigs, auditLogs, reviews }
}

const globalForMock = globalThis as unknown as { __mock_store_v10__?: MockDataStore }

export function getMockStore(): MockDataStore {
  if (!globalForMock.__mock_store_v10__) {
    globalForMock.__mock_store_v10__ = getInitialStore()
  }
  return globalForMock.__mock_store_v10__
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
