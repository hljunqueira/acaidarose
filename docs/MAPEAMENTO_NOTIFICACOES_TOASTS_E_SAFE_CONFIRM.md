# Mapeamento de Notificações, Toasts & Diálogos de Confirmação Segura (Safe Confirm)
**Açaí da Rose — Guia de Feedback Visual, Mensagens de Sucesso/Erro e Proteção contra Ações Destrutivas**

---

## 1. Visão Geral

Para garantir uma operação sem erros acidentais e uma interface responsiva, o sistema adota dois pilares de comunicação com o operador:
1. **Notificações Toast Minimalistas**: Mensagens rápidas e discretas (3 segundos) no canto inferior/superior informando o resultado de ações (sucesso, aviso ou erro de rede).
2. **Confirmação Segura (`SafeConfirmDialog`)**: Modal obrigatório antes de qualquer ação destrutiva ou sensível (eliminar produto, fechar caixa, cancelar pedido, revogar token).

---

## 2. Componente Universal: `SafeConfirmDialog`

Localizado em [`components/ui/SafeConfirmDialog.tsx`](file:///c:/Users/Henrique%20-%20PC/Desktop/Projetos%20Dev/acaidarose/components/ui/SafeConfirmDialog.tsx), o componente oferece:
* **Variantes Visuais**: `danger` (vermelho para exclusões/cancelamentos), `warning` (amarelo para fecho de turno/alertas) e `primary` (roxo para publicações em lote).
* **Confirmação com Digitação Opcional**: Exige que o operador digite uma palavra de segurança (ex: `ELIMINAR`) antes de habilitar o botão para ações de alto risco.
* **Auditoria Automática**: Informa visualmente que a ação é gravada na tabela `audit_logs`.

---

## 3. Matriz de Ações Críticas & Uso do `SafeConfirmDialog`

| Módulo / Tela | Componente Responsável | Ação Crítica | Texto de Confirmação / Requisito |
| :--- | :--- | :--- | :--- |
| **Catálogo de Taças** | `ProductRowItem.tsx` | Eliminar Taça / Copo do catálogo | *"Tem a certeza de que deseja eliminar esta taça? Itens em pedidos anteriores serão preservados."* |
| **Catálogo de Toppings** | `ProductRowItem.tsx` | Eliminar Topping / Complemento | *"Esta ação removerá o complemento do cardápio em todas as lojas."* |
| **KDS / Pedidos** | `CancelReasonDialog.tsx` | Cancelar Pedido Pago | *"Deseja cancelar o Pedido #102? O motivo de cancelamento é obrigatório e será auditado."* |
| **Salão de Mesas** | `TableCheckoutDetail.tsx` | Encerrar Conta / Liberar Mesa | *"Confirma o encerramento da Mesa 04 e a emissão do talão fiscal?"* |
| **Salão de Mesas** | `TablesHallView.tsx` | Eliminar Mesa do Mapa | *"Deseja remover a Mesa 12 do salão? Apenas mesas vazias podem ser eliminadas."* |
| **Caixa / Turnos** | `CashierOperationsDialog.tsx` | Fecho de Caixa | *"Confirma o fecho do turno? A contagem cega de numerário não poderá ser alterada após a confirmação."* |
| **Caixa / Turnos** | `CashierOperationsDialog.tsx` | Sangria de Caixa | *"Confirma a retirada de 150,00 € para o cofre?"* |
| **Franquias & Lojas** | `StoreDetailsDialog.tsx` | Desativar Filial | Exige digitação: `DESATIVAR` para congelar o acesso da loja à rede. |
| **Utilizadores** | `UserTable.tsx` | Revogar Acesso de Funcionário | *"Deseja revogar o acesso deste operador?"* |
| **Dispositivos / TI** | `Central TI (/dev)` | Revogar Token de Smart TV / Totem | *"O dispositivo desconectará imediatamente e exigirá novo pareamento."* |

---

## 4. Mapeamento de Notificações Toast por Canal

### A. PDV Balcão & Salão de Mesas
* **Item Adicionado ao Pedido**: Toast discreto *"Item adicionado ao pedido"* (1.5s).
* **Pagamento MB WAY Aprovado**: Toast verde *"Pagamento MB WAY confirmado com sucesso (12,50 €)"*.
* **Mesa Transferida**: Toast neutro *"Comanda transferida da Mesa 02 para a Mesa 05"*.
* **Chamado de Garçom Atendido**: Toast *"Chamado da Mesa 03 marcado como atendido"*.

### B. Gestão de Catálogo & Preços
* **Preço Guardado**: Toast *"Preço do Copo 500ml atualizado para 6,50 €"*.
* **Replicação em Rede**: Toast *"Preços publicados com sucesso para toda a rede (2 lojas)"*.
* **Disponibilidade Alterada**: Toast *"Nutella desativada temporariamente nesta loja"*.

### C. Gestão de Franquias & Utilizadores
* **Nova Franquia Provisionada**: Toast *"Franquia Cascais criada com sucesso com catálogo oficial vinculado"*.
* **Utilizador Criado**: Toast *"Novo operador cadastrado. Palavra-passe provisória gerada"*.

---

## 5. Padrão de Toast Minimalista (Zero Ruído Visual)

```tsx
import { useToast } from "@/hooks/use-toast"

export function useAppNotifications() {
  const { toast } = useToast()

  return {
    notifySuccess: (title: string, description?: string) =>
      toast({
        title,
        description,
        className: "bg-[#160F24] border border-[#2A1E3D] text-white shadow-xl",
      }),
    notifyError: (title: string, description?: string) =>
      toast({
        title,
        description,
        variant: "destructive",
        className: "bg-red-950 border border-red-800 text-white shadow-xl",
      }),
  }
}
```
