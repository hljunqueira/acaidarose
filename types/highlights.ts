export interface HighlightItem {
  id: string
  tenantId?: string
  title: string
  subtitle?: string
  badgeLabel?: string
  badgeColor?: string
  price?: number
  imageUrl?: string
  videoUrl?: string
  mediaType?: 'VIDEO' | 'IMAGE'
  active: boolean
  displayOrder: number
}

export const CANONICAL_DEFAULT_STORIES: HighlightItem[] = [
  {
    id: 'hl-1',
    title: 'Açaí 500g Clássico',
    subtitle: 'Com Banana, Morango & Leite Ninho',
    badgeLabel: 'MAIS PEDIDO',
    badgeColor: 'bg-pink-600',
    price: 9.9,
    imageUrl: '/images/official/acai_copo_500g.jpg',
    videoUrl: '/videos/hero_cup_rotation.mp4',
    mediaType: 'VIDEO',
    active: true,
    displayOrder: 1,
  },
  {
    id: 'hl-2',
    title: 'Açaí 350g Energia',
    subtitle: 'Kiwi fresco, Granola & Mel Puro',
    badgeLabel: 'POPULAR',
    badgeColor: 'bg-purple-600',
    price: 7.9,
    imageUrl: '/images/official/acai_copo_350g.jpg',
    videoUrl: '/videos/hero_orbiting_cup.mp4',
    mediaType: 'VIDEO',
    active: true,
    displayOrder: 2,
  },
  {
    id: 'hl-3',
    title: 'Açaí 750g Família',
    subtitle: 'Camadas generosas de Frutas & Toppings',
    badgeLabel: 'COMPARTILHE',
    badgeColor: 'bg-fuchsia-600',
    price: 13.9,
    imageUrl: '/images/official/acai_tigela_750g.jpg',
    videoUrl: '/videos/hero_gliding_texture.mp4',
    mediaType: 'VIDEO',
    active: true,
    displayOrder: 3,
  },
  {
    id: 'hl-4',
    title: 'Creme de Pitaya Especial',
    subtitle: 'Colorido, refrescante e 100% natural',
    badgeLabel: 'NOVIDADE',
    badgeColor: 'bg-emerald-600',
    price: 8.5,
    imageUrl: '/images/official/acai_copo_250g.jpg',
    videoUrl: '/videos/hero_revealing_cup.mp4',
    mediaType: 'VIDEO',
    active: true,
    displayOrder: 4,
  },
]
