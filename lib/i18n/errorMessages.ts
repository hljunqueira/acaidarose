/**
 * Açaí da Rose — Dicionário e Utilitário de Mensagens de Erro Amigáveis em Português (PT-PT)
 * Converte códigos técnicos de erro em orientações claras, gentis e acionáveis para o utilizador.
 */

export const ERROR_MESSAGES_PT = {
  // 1. AUTENTICAÇÃO E ACESSOS
  AUTH_INVALID_CREDENTIALS: {
    title: 'Dados de acesso incorretos',
    description: 'O e-mail ou a palavra-passe introduzida não estão corretos. Por favor, tente novamente.',
  },
  AUTH_SESSION_EXPIRED: {
    title: 'Sessão expirada',
    description: 'A sua sessão de trabalho terminou. Por favor, inicie sessão novamente para continuar.',
  },
  AUTH_UNAUTHORIZED: {
    title: 'Acesso reservado',
    description: 'Não tem permissão para aceder a esta área. Contacte o responsável da loja.',
  },
  AUTH_USER_DISABLED: {
    title: 'Conta temporariamente suspensa',
    description: 'O seu utilizador foi desativado. Por favor, fale com a administração da sua loja.',
  },

  // 2. PAGAMENTOS & MB WAY
  PAYMENT_MBWAY_INVALID_PHONE: {
    title: 'Número de telemóvel inválido',
    description: 'Por favor, introduza um número de telemóvel português válido de 9 dígitos para o MB WAY.',
  },
  PAYMENT_MBWAY_TIMEOUT: {
    title: 'Tempo de aprovação esgotado',
    description: 'O pedido de pagamento na aplicação MB WAY expirou. Gostaria de enviar uma nova notificação?',
  },
  PAYMENT_MBWAY_REJECTED: {
    title: 'Pagamento recusado',
    description: 'O pagamento foi cancelado ou recusado na aplicação MB WAY. Pode tentar novamente ou escolher outro meio.',
  },
  PAYMENT_TPA_ERROR: {
    title: 'Falha na comunicação com o terminal',
    description: 'Não foi possível processar o cartão no TPA. Por favor, tente novamente.',
  },
  PAYMENT_INSUFFICIENT_AMOUNT: {
    title: 'Valor recebido insuficiente',
    description: 'O montante entregue em numerário é inferior ao total da conta.',
  },

  // 3. MESAS & SALÃO
  TABLE_ALREADY_OCCUPIED: {
    title: 'Mesa já ocupada',
    description: 'Esta mesa já tem um pedido em aberto. Pode adicionar novos itens à conta existente.',
  },
  TABLE_NOT_FOUND: {
    title: 'Mesa não encontrada',
    description: 'O número de mesa selecionado não existe na configuração do salão.',
  },
  TABLE_EMPTY_BILL: {
    title: 'Mesa sem consumo ativo',
    description: 'Não existem itens lançados nesta mesa para emitir fatura.',
  },
  TABLE_TRANSFER_SAME: {
    title: 'Transferência inválida',
    description: 'A mesa de destino não pode ser igual à mesa de origem.',
  },

  // 4. CATÁLOGO & MONTAGEM DA TAÇA
  PRODUCT_TOPPING_LIMIT_EXCEEDED: {
    title: 'Limite de complementos atingido',
    description: 'Já selecionou o número máximo de toppings incluídos nesta taça. Os próximos serão cobrados à parte.',
  },
  PRODUCT_BASE_REQUIRED: {
    title: 'Escolha pelo menos uma base',
    description: 'Por favor, selecione o sabor de açaí ou sorbet antes de avançar para os complementos.',
  },
  PRODUCT_UNAVAILABLE_STORE: {
    title: 'Ingrediente esgotado nesta loja',
    description: 'Este topping encontra-se temporariamente em falta nesta unidade. Por favor, escolha outra opção deliciosa.',
  },

  // 5. CAIXA & TURNOS
  CASHIER_ALREADY_OPEN: {
    title: 'Turno de caixa já em aberto',
    description: 'Já existe um turno de caixa ativo para este operador.',
  },
  CASHIER_NOT_OPEN: {
    title: 'Caixa fechado',
    description: 'É necessário abrir o turno de caixa antes de registar vendas no balcão.',
  },
  CASHIER_SANGRIA_EXCEEDS_BALANCE: {
    title: 'Valor de sangria indisponível',
    description: 'O valor da retirada é superior ao numerário disponível na gaveta do caixa.',
  },

  // 6. GESTÃO DE FRANQUIAS & FISCALIDADE
  FRANCHISE_INVALID_NIF: {
    title: 'NIF português inválido',
    description: 'O Número de Identificação Fiscal introduzido não é válido. Verifique os 9 dígitos.',
  },
  FRANCHISE_SLUG_EXISTS: {
    title: 'Nome de loja já utilizado',
    description: 'Já existe uma unidade com este identificador. Por favor, escolha outro nome ou localidade.',
  },
  FISCAL_INVOICE_FAILED: {
    title: 'Aviso de emissão fiscal',
    description: 'A venda foi registada com sucesso, mas a fatura eletrónica está a aguardar validação da AT.',
  },

  // 7. CONECTIVIDADE & ERROS GENÉRICOS
  NETWORK_OFFLINE: {
    title: 'Sem ligação à internet',
    description: 'Verifique a sua ligação Wi-Fi ou dados móveis. O sistema sincronizará os dados assim que voltar online.',
  },
  SERVER_UNEXPECTED_ERROR: {
    title: 'Ocorreu um momento inesperado',
    description: 'Não foi possível concluir esta operação. O nosso suporte já foi notificado. Por favor, tente dentro de instantes.',
  },
} as const

export type ErrorCode = keyof typeof ERROR_MESSAGES_PT

/**
 * Converte qualquer erro (código, string ou Error) em mensagem amigável em PT-PT.
 */
export function getFriendlyErrorMessage(err: unknown): { title: string; description: string } {
  if (typeof err === 'string' && err in ERROR_MESSAGES_PT) {
    return ERROR_MESSAGES_PT[err as ErrorCode]
  }

  if (err instanceof Error) {
    const errorKey = Object.keys(ERROR_MESSAGES_PT).find((key) =>
      err.message.toUpperCase().includes(key)
    ) as ErrorCode | undefined

    if (errorKey) {
      return ERROR_MESSAGES_PT[errorKey]
    }

    if (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('Failed to fetch')) {
      return ERROR_MESSAGES_PT.NETWORK_OFFLINE
    }
  }

  return ERROR_MESSAGES_PT.SERVER_UNEXPECTED_ERROR
}
