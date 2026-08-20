#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  MVP "Açaí da Rose" — PDV Multi-tenant PT-PT com Motor de Montagem de Açaí nativo.
  Sistema estritamente informacional (SEM gateways). Registro manual do método de pagamento
  (Numerário, Multibanco, MB Way, Plataforma). Wizard 3 passos + Carrinho + Modal de finalização.

backend:
  - task: "POST /api/orders (finalizar comanda)"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Validado via curl: cria order com orderNumber sequencial diário por tenant, salva bases/toppings snapshot, paymentMethod (NUMERARIO|MULTIBANCO|MB_WAY|PLATAFORMA), sem token de pagamento. Grava AuditLog."
  - task: "GET /api/orders?tenantId=... (relatório do dia)"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Retorna orders + totais agregados por método de pagamento."

frontend:
  - task: "PDV Touch — Wizard + Cart + Payment Modal"
    implemented: true
    working: true
    file: "/app/app/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Grid 70/30, wizard 3 passos (Recipiente/Bases/Toppings), Zustand persist LocalStorage, contador visual de gratis/pagos, modal de finalização com 4 métodos, comprovativo pós-registo. Validado visualmente."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 0
  run_ui: false

test_plan:
  current_focus:
    - "POST /api/orders (finalizar comanda)"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    - agent: "main"
      message: "Adicionadas 3 features enterprise + refinamento visual: (1) Gestão de Utilizadores + Lojas: SUPER_ADMIN cria/edita tenants (com seed automático de catálogo por loja) e users; TENANT_ADMIN gere users da sua própria loja; (2) Cancelar Comanda: motivo obrigatório (mín 3 chars), audit log, exclusão dos totais mas visível na tabela; (3) Histórico Cliente: campos opcionais Nome/Telemóvel no modal de pagamento; pesquisa full-text por cliente no Fecho de Caixa. Também aplicado o LOGO REAL do utilizador (/public/logo.png) em header, login e recibo, e imagens premium reais de açaí (Pexels) nos cards de recipientes. Multi-tenant CRUD todo testado via curl com sucesso."

  - task: "CRUD /api/tenants (SUPER_ADMIN only)"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    status_history:
      - working: true
        agent: "main"
        comment: "Criação de loja Porto testada + seed automático de catálogo por tenant. Lista retorna 2 tenants. TENANT_ADMIN recebe 403."

  - task: "CRUD /api/users (SUPER_ADMIN + TENANT_ADMIN limitado)"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    status_history:
      - working: true
        agent: "main"
        comment: "SUPER cria admin da loja Porto e cashier; TENANT_ADMIN vê apenas users do seu tenant. Testado."

  - task: "POST /api/orders/:id/cancel (anular)"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    status_history:
      - working: true
        agent: "main"
        comment: "Rejeita sem motivo (400), aceita com motivo, muda status para CANCELLED, grava audit log. Report exclui do total pago e mostra em card separado."

  - task: "GET /api/orders/search por cliente"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    status_history:
      - working: true
        agent: "main"
        comment: "Pesquisa por customerName OU customerPhone via regex case-insensitive. Testado com q=Ana."

  - task: "POST /api/auth/login (multi-role)"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    status_history:
      - working: true
        agent: "main"
        comment: "Login testado via curl com admin@acairose.pt, retorna token e user com role TENANT_ADMIN + tenantId. Sessions armazenadas em MongoDB."

  - task: "CRUD /api/products/{containers|bases|toppings}"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    status_history:
      - working: true
        agent: "main"
        comment: "POST topping premium testado, retorna item criado com id/tenantId. Rota exige token TENANT_ADMIN/SUPER_ADMIN, senão 403. Soft-delete via deletedAt."

  - task: "GET /api/reports/day (fecho de caixa)"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    status_history:
      - working: true
        agent: "main"
        comment: "Retorna date, count, total, byMethod{NUMERARIO,MULTIBANCO,MB_WAY,PLATAFORMA} com count+total e array de orders. Suporta filtro ?date=YYYY-MM-DD."

  - task: "GET /api/orders/:id (recibo)"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    status_history:
      - working: true
        agent: "main"
        comment: "Retorna order + tenant para renderização do recibo em /receipt/[id]."
