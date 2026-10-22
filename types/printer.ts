export type PrinterType = 'EPSON_ESC_POS' | 'GENERIC_ESC_POS' | 'HTML_WINDOW'
export type PrinterConnectionType = 'QZ_TRAY' | 'NATIVE_PRINT'

export type PrintLayout = 'FULL_RECEIPT' | 'KITCHEN_SLIP' | 'TICKET_ONLY'

export interface StorePrinterSetting {
  id: string
  tenantId: string
  name: string
  driverName: string
  printerType: PrinterType
  connectionType: PrinterConnectionType
  printLayout?: PrintLayout
  highlightCustomer?: boolean
  printLogo?: boolean
  printQrCode?: boolean
  categories: string[] // IDs das categorias vinculadas
  products: string[] // IDs dos produtos/itens vinculados
  copies: number
  isActive: boolean
  isBackup: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreatePrinterInput {
  name: string
  driverName: string
  printerType?: PrinterType
  connectionType?: PrinterConnectionType
  printLayout?: PrintLayout
  highlightCustomer?: boolean
  printLogo?: boolean
  printQrCode?: boolean
  categories?: string[]
  products?: string[]
  copies?: number
  isActive?: boolean
  isBackup?: boolean
}

export interface UpdatePrinterInput extends Partial<CreatePrinterInput> {
  id: string
}
