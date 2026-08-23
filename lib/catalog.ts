import { ProductContainer, ProductBase, ProductTopping, PaymentMethodCode } from '@/types'

export const TENANT = {
  id: 'tenant-torres-novas',
  name: 'Açaí da Rose — Matriz (Torres Novas)',
  slug: 'torres-novas',
}

export const CONTAINERS: ProductContainer[] = [
  { id: 'cnt-250', name: 'Açaí 250g', weightGrams: 250, precoBase: 6.50, limiteFrutas: 2, limiteToppings: 3, limiteCremes: 1, limiteBases: 1, limiteComplementosGratis: 3, emoji: '🍧', image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&auto=format&fit=crop&q=80', active: true },
  { id: 'cnt-350', name: 'Açaí 350g', weightGrams: 350, precoBase: 9.00, limiteFrutas: 3, limiteToppings: 4, limiteCremes: 1, limiteBases: 1, limiteComplementosGratis: 4, emoji: '🍧', image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80', active: true },
  { id: 'cnt-500', name: 'Açaí 500g', weightGrams: 500, precoBase: 12.90, limiteFrutas: 999, limiteToppings: 999, limiteCremes: 1, limiteBases: 1, limiteComplementosGratis: 999, emoji: '🍨', image: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=600&auto=format&fit=crop&q=80', active: true },
  { id: 'cnt-750', name: 'Açaí 750g', weightGrams: 750, precoBase: 18.90, limiteFrutas: 999, limiteToppings: 999, limiteCremes: 1, limiteBases: 1, limiteComplementosGratis: 999, emoji: '🍨', image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop&q=80', active: true },
  { id: 'cnt-1000', name: 'Açaí 1 Kg', weightGrams: 1000, precoBase: 25.90, limiteFrutas: 999, limiteToppings: 999, limiteCremes: 1, limiteBases: 1, limiteComplementosGratis: 999, emoji: '🥣', image: 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=600&auto=format&fit=crop&q=80', active: true },
]

export const BASES: ProductBase[] = [
  { id: 'base-acai', name: 'Açaí Tradicional Puro', description: 'Açaí especial cremoso batido na hora', emoji: '🟣', active: true },
  { id: 'base-coco', name: 'Creme de Coco', description: 'Creme gelado refrescante de coco', emoji: '🥥', active: true },
  { id: 'base-cupuacu', name: 'Creme de Cupuaçu', description: 'Cremoso típico da Amazónia', emoji: '🍈', active: true },
  { id: 'base-goiaba', name: 'Creme de Goiaba', description: 'Sabor doce e tropical de goiaba', emoji: '🌸', active: true },
  { id: 'base-graviola', name: 'Creme de Graviola', description: 'Leve, suave e aromático', emoji: '🍃', active: true },
  { id: 'base-maracuja', name: 'Creme de Maracujá', description: 'Toque cítrico e refrescante', emoji: '💛', active: true },
  { id: 'base-morango', name: 'Creme de Morango', description: 'Gelado cremoso de morango fresco', emoji: '🍓', active: true },
  { id: 'base-manga', name: 'Creme de Manga', description: 'Sabor tropical intenso', emoji: '🥭', active: true },
  { id: 'base-ninho', name: 'Creme de Ninho', description: 'Sabor clássico e doce de leite ninho', emoji: '🥛', active: true },
  { id: 'base-pitaya', name: 'Creme de Pitaya', description: 'Sorbet vibrante de fruta fresca', emoji: '🌺', active: true },
]

export const TOPPINGS: ProductTopping[] = [
  { id: 'fruta-banana', name: 'Banana', category: 'Frutas', emoji: '🍌', precoExtra: 0, isPremium: false, active: true },
  { id: 'fruta-kiwi', name: 'Kiwi', category: 'Frutas', emoji: '🥝', precoExtra: 0, isPremium: false, active: true },
  { id: 'fruta-manga', name: 'Manga', category: 'Frutas', emoji: '🥭', precoExtra: 0, isPremium: false, active: true },
  { id: 'fruta-morango', name: 'Morango', category: 'Frutas', emoji: '🍓', precoExtra: 0, isPremium: false, active: true },
  { id: 'fruta-uva', name: 'Uva', category: 'Frutas', emoji: '🍇', precoExtra: 0, isPremium: false, active: true },
  { id: 'top-biscoff-creme', name: 'Biscoff creme', category: 'Toppings', emoji: '🍪', precoExtra: 0, isPremium: false, active: true },
  { id: 'top-biscoff-picado', name: 'Biscoff picado', category: 'Toppings', emoji: '🍪', precoExtra: 0, isPremium: false, active: true },
  { id: 'top-canudo', name: 'Canudo crocante', category: 'Toppings', emoji: '🥢', precoExtra: 0, isPremium: false, active: true },
  { id: 'top-chocobol', name: 'Chocobol (Nesquik)', category: 'Toppings', emoji: '🍫', precoExtra: 0, isPremium: false, active: true },
  { id: 'top-granola', name: 'Granola', category: 'Toppings', emoji: '🌾', precoExtra: 0, isPremium: false, active: true },
  { id: 'top-iogurte', name: 'Iogurte Natural', category: 'Toppings', emoji: '🥛', precoExtra: 0, isPremium: false, active: true },
  { id: 'top-leite-condensado', name: 'Leite Condensado', category: 'Toppings', emoji: '🍯', precoExtra: 0, isPremium: false, active: true },
  { id: 'top-leite-po', name: 'Leite em Pó', category: 'Toppings', emoji: '🥛', precoExtra: 0, isPremium: false, active: true },
  { id: 'top-manteiga-amendoim', name: 'Manteiga de Amendoim', category: 'Toppings', emoji: '🥜', precoExtra: 0, isPremium: false, active: true },
  { id: 'top-marshmallow', name: 'Marshmallow', category: 'Toppings', emoji: '☁️', precoExtra: 0, isPremium: false, active: true },
  { id: 'top-mel', name: 'Mel', category: 'Toppings', emoji: '🍯', precoExtra: 0, isPremium: false, active: true },
  { id: 'top-oreo-inteiro', name: 'Oreo inteiro', category: 'Toppings', emoji: '🍪', precoExtra: 0, isPremium: false, active: true },
  { id: 'top-oreo-picado', name: 'Oreo picado', category: 'Toppings', emoji: '🍪', precoExtra: 0, isPremium: false, active: true },
  { id: 'top-ovomaltine', name: 'Ovomaltine', category: 'Toppings', emoji: '🍫', precoExtra: 0, isPremium: false, active: true },
  { id: 'top-pacoca', name: 'Paçoca', category: 'Toppings', emoji: '🥜', precoExtra: 0, isPremium: false, active: true },
  { id: 'top-pepitas', name: 'Pepitas de Chocolate', category: 'Toppings', emoji: '🍫', precoExtra: 0, isPremium: false, active: true },
  { id: 'top-pintarolas', name: 'Pintarolas (M&Ms)', category: 'Toppings', emoji: '🍬', precoExtra: 0, isPremium: false, active: true },
  { id: 'add-ninho', name: 'Creme de Ninho', category: 'Adicionais', emoji: '🥛', isSpecialAddon: true, priceTierLow: 1.00, priceTierHigh: 2.00, precoExtra: 1.00, isPremium: true, active: true },
  { id: 'add-pistache', name: 'Creme de Pistache', category: 'Adicionais', emoji: '🥜', isSpecialAddon: true, priceTierLow: 2.00, priceTierHigh: 4.00, precoExtra: 2.00, isPremium: true, active: true },
  { id: 'add-nutella', name: 'Nutella Original', category: 'Adicionais', emoji: '🍫', isSpecialAddon: true, priceTierLow: 1.00, priceTierHigh: 2.00, precoExtra: 1.00, isPremium: true, active: true },
]

export const PAYMENT_METHODS: Array<{ code: PaymentMethodCode; label: string; emoji: string; hint: string }> = [
  { code: 'NUMERARIO', label: 'Numerário', emoji: '💶', hint: 'Dinheiro' },
  { code: 'MULTIBANCO', label: 'Multibanco', emoji: '💳', hint: 'Cartão TPA' },
  { code: 'MB_WAY', label: 'MB Way', emoji: '📱', hint: 'Telemóvel' },
]
