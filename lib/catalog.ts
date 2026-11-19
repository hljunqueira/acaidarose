/**
 * @deprecated
 * Os dados estáticos de catálogo foram desativados.
 * Todo o catálogo, preços, cotas e limites são geridos dinamicamente pelo PostgreSQL
 * através de `product_containers`, `product_bases`, `product_toppings` e `/api/products`.
 */
import { ProductContainer, ProductBase, ProductTopping } from '@/types'

export const CONTAINERS: ProductContainer[] = []
export const BASES: ProductBase[] = []
export const TOPPINGS: ProductTopping[] = []
