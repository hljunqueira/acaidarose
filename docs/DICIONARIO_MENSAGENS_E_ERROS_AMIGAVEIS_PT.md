# Guia de Mensagens de Erro Amigáveis & UX Copywriting (PT-PT)
**Açaí da Rose — Padronização de Feedbacks Claros, Gentis e Acionáveis em Toda a Plataforma**

---

## 1. Princípios de UX Copywriting para Mensagens de Erro

Para evitar frustração de clientes no telemóvel e de operadores no balcão, todas as mensagens de erro do **Açaí da Rose** seguem 4 regras fundamentais:

1. **Tom Gentil & Humano**: Nunca culpar o utilizador ou exibir jargões técnicos crípticos (ex: em vez de *"Error 500: Database connection failure"*, exibe *"Não foi possível concluir esta operação. Por favor, tente dentro de instantes"*).
2. **Orientação Acionável**: Todo erro informa claramente **o que aconteceu** e **o que fazer a seguir** para resolver.
3. **Linguagem Nativa de Portugal (PT-PT)**: Uso correto de termos como *telemóvel*, *palavra-passe*, *fatura*, *fecho de caixa*, *numerário* e *toppings*.
4. **Sem Emojis Decorativos**: Títulos e descrições limpas, tipográficas e profissionais.

---

## 2. Catálogo de Mensagens por Domínio do Sistema

### A. Autenticação & Permissões
| Código Técnico | Título Amigável | Mensagem / Descrição |
| :--- | :--- | :--- |
| `AUTH_INVALID_CREDENTIALS` | **Dados de acesso incorretos** | *O e-mail ou a palavra-passe introduzida não estão corretos. Por favor, tente novamente.* |
| `AUTH_SESSION_EXPIRED` | **Sessão expirada** | *A sua sessão de trabalho terminou. Por favor, inicie sessão novamente para continuar.* |
| `AUTH_UNAUTHORIZED` | **Acesso reservado** | *Não tem permissão para aceder a esta área. Contacte o responsável da loja.* |

---

### B. Pagamentos & MB WAY
| Código Técnico | Título Amigável | Mensagem / Descrição |
| :--- | :--- | :--- |
| `PAYMENT_MBWAY_INVALID_PHONE` | **Número de telemóvel inválido** | *Por favor, introduza um número de telemóvel português válido de 9 dígitos para o MB WAY.* |
| `PAYMENT_MBWAY_TIMEOUT` | **Tempo de aprovação esgotado** | *O pedido de pagamento na aplicação MB WAY expirou. Gostaria de enviar uma nova notificação?* |
| `PAYMENT_MBWAY_REJECTED` | **Pagamento recusado** | *O pagamento foi cancelado ou recusado na aplicação MB WAY. Pode tentar novamente ou escolher outro meio.* |
| `PAYMENT_TPA_ERROR` | **Falha no terminal** | *Não foi possível comunicar com o TPA. Por favor, verifique a ligação do cartão e tente novamente.* |

---

### C. Salão, Mesas & Comandas
| Código Técnico | Título Amigável | Mensagem / Descrição |
| :--- | :--- | :--- |
| `TABLE_ALREADY_OCCUPIED` | **Mesa já ocupada** | *Esta mesa já tem um pedido em aberto. Pode adicionar novos itens à conta existente.* |
| `TABLE_EMPTY_BILL` | **Mesa sem consumo ativo** | *Não existem itens lançados nesta mesa para emitir fatura.* |
| `TABLE_TRANSFER_SAME` | **Transferência inválida** | *A mesa de destino não pode ser igual à mesa de origem.* |

---

### D. Montagem do Açaí & Catálogo
| Código Técnico | Título Amigável | Mensagem / Descrição |
| :--- | :--- | :--- |
| `PRODUCT_TOPPING_LIMIT_EXCEEDED`| **Limite de complementos atingido** | *Já selecionou o número máximo de toppings incluídos nesta taça. Os próximos serão cobrados à parte.* |
| `PRODUCT_BASE_REQUIRED` | **Escolha pelo menos uma base** | *Por favor, selecione o sabor de açaí ou sorbet antes de avançar para os complementos.* |
| `PRODUCT_UNAVAILABLE_STORE` | **Ingrediente esgotado nesta loja** | *Este topping encontra-se temporariamente em falta nesta unidade. Por favor, escolha outra opção deliciosa.* |

---

### E. Caixa, Turnos & Sangrias
| Código Técnico | Título Amigável | Mensagem / Descrição |
| :--- | :--- | :--- |
| `CASHIER_NOT_OPEN` | **Caixa fechado** | *É necessário abrir o turno de caixa antes de registar vendas no balcão.* |
| `CASHIER_SANGRIA_EXCEEDS_BALANCE`| **Valor de sangria indisponível** | *O valor da retirada é superior ao numerário disponível na gaveta do caixa.* |

---

### F. Franquias, NIF & Conectividade
| Código Técnico | Título Amigável | Mensagem / Descrição |
| :--- | :--- | :--- |
| `FRANCHISE_INVALID_NIF` | **NIF português inválido** | *O Número de Identificação Fiscal introduzido não é válido. Verifique os 9 dígitos.* |
| `NETWORK_OFFLINE` | **Sem ligação à internet** | *Verifique a sua ligação Wi-Fi ou dados móveis. O sistema sincronizará os dados assim que voltar online.* |
| `SERVER_UNEXPECTED_ERROR` | **Ocorreu um momento inesperado** | *Não foi possível concluir esta operação. O nosso suporte já foi notificado. Por favor, tente dentro de instantes.* |

---

## 3. Como Utilizar no Frontend e nos Toasts

```tsx
import { getFriendlyErrorMessage } from '@/lib/i18n/errorMessages'
import { useToast } from '@/hooks/use-toast'

export function useCustomErrorToast() {
  const { toast } = useToast()

  return (error: unknown) => {
    const { title, description } = getFriendlyErrorMessage(error)
    toast({
      title,
      description,
      variant: 'destructive',
      className: 'bg-[#160F24] border border-red-800 text-white shadow-2xl',
    })
  }
}
```
