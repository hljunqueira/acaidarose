-- =====================================================================
-- SCHEMA OFICIAL DE PRODUÇÃO: AÇAÍ DA ROSE (PostgreSQL 16)
-- 21 TABELAS RELACIONAIS + TRIGGERS DE INTEGRIDADE + ÍNDICES MULTI-TENANT
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- FUNÇÃO TRIGGER: ATUALIZAÇÃO AUTOMÁTICA DE updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language plpgsql;

-- FUNÇÃO TRIGGER: SEQUÊNCIA DIÁRIA DE PEDIDOS POR LOJA (Reset diário às 00:00)
CREATE OR REPLACE FUNCTION set_order_daily_sequence()
RETURNS TRIGGER AS $$
DECLARE
    current_max_seq INTEGER;
BEGIN
    SELECT COALESCE(MAX(order_number), 0) INTO current_max_seq
    FROM orders
    WHERE tenant_id = NEW.tenant_id
      AND created_at >= date_trunc('day', timezone('utc'::text, now()));
    
    NEW.order_number := current_max_seq + 1;
    RETURN NEW;
END;
$$ language plpgsql;

-- 1. LOJAS / FRANQUIAS (Tenants)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    nif VARCHAR(50),
    address TEXT,
    phone VARCHAR(50),
    mbway_phone VARCHAR(50),
    currency VARCHAR(10) DEFAULT 'EUR',
    royalty_percentage NUMERIC(5, 2) DEFAULT 5.00,
    marketing_fund_percentage NUMERIC(5, 2) DEFAULT 1.00,
    vat_rate_food NUMERIC(5, 2) DEFAULT 13.00,
    vat_rate_beverages NUMERIC(5, 2) DEFAULT 23.00,
    at_tax_api_key TEXT,
    mbway_merchant_key TEXT,
    is_headquarters BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);
DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 2. UTILIZADORES & ACESSOS (Separação Estrita Franqueadora vs Loja)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL, -- NULL apenas para SUPER_ADMIN global
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    password_hash TEXT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'CASHIER',
    active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_user_role CHECK (role IN ('SUPER_ADMIN', 'FRANCHISOR_ADMIN', 'TENANT_ADMIN', 'CASHIER')),
    CONSTRAINT chk_tenant_role_isolation CHECK (
        role IN ('SUPER_ADMIN', 'FRANCHISOR_ADMIN') OR (role IN ('TENANT_ADMIN', 'CASHIER') AND tenant_id IS NOT NULL)
    )
);
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 3. CATÁLOGO: TAÇAS / RECIPIENTES
CREATE TABLE IF NOT EXISTS product_containers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    weight_grams INTEGER DEFAULT 500,
    preco_base NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    limite_bases INTEGER NOT NULL DEFAULT 1,
    limite_complementos_gratis INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    video_url TEXT,
    display_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);
DROP TRIGGER IF EXISTS update_containers_updated_at ON product_containers;
CREATE TRIGGER update_containers_updated_at BEFORE UPDATE ON product_containers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 4. CATÁLOGO: BASES E SORBETS
CREATE TABLE IF NOT EXISTS product_bases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);
DROP TRIGGER IF EXISTS update_bases_updated_at ON product_bases;
CREATE TRIGGER update_bases_updated_at BEFORE UPDATE ON product_bases FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 5. CATÁLOGO: TOPPINGS & ACOMPANHAMENTOS
CREATE TABLE IF NOT EXISTS product_toppings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    is_premium BOOLEAN DEFAULT FALSE,
    preco_extra NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    image_url TEXT,
    is_gluten_free BOOLEAN DEFAULT FALSE,
    is_vegan BOOLEAN DEFAULT FALSE,
    allergens_json JSONB DEFAULT '[]'::jsonb,
    display_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);
DROP TRIGGER IF EXISTS update_toppings_updated_at ON product_toppings;
CREATE TRIGGER update_toppings_updated_at BEFORE UPDATE ON product_toppings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 6. OVERRIDES DE PREÇOS POR FILIAL
CREATE TABLE IF NOT EXISTS store_price_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id VARCHAR(100) NOT NULL,
    custom_price NUMERIC(10, 2) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(tenant_id, product_id)
);

-- 7. OVERRIDES DE DISPONIBILIDADE POR FILIAL
CREATE TABLE IF NOT EXISTS store_product_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id VARCHAR(100) NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(tenant_id, product_id)
);

-- 8. MESAS & SALÃO
CREATE TABLE IF NOT EXISTS restaurant_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    table_number INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'FREE' NOT NULL,
    customer_name VARCHAR(255),
    opened_at TIMESTAMP WITH TIME ZONE,
    current_bill_total NUMERIC(10, 2) DEFAULT 0.00,
    items_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(tenant_id, table_number)
);

-- 9. PEDIDOS & COMANDAS
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cashier_id UUID REFERENCES users(id) ON DELETE SET NULL,
    cashier_name VARCHAR(255),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_nif VARCHAR(50),
    order_number INTEGER NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    vat_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'PAID' NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_reference TEXT,
    is_table_order BOOLEAN DEFAULT FALSE,
    table_number INTEGER,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancel_reason TEXT,
    cancelled_by_name VARCHAR(255),
    items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
DROP TRIGGER IF EXISTS trigger_set_order_daily_seq ON orders;
CREATE TRIGGER trigger_set_order_daily_seq BEFORE INSERT ON orders FOR EACH ROW EXECUTE PROCEDURE set_order_daily_sequence();

-- 10. TURNOS DE CAIXA
CREATE TABLE IF NOT EXISTS cashier_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    operator_id UUID NOT NULL REFERENCES users(id),
    operator_name VARCHAR(255) NOT NULL,
    opening_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    closing_balance NUMERIC(10, 2),
    total_sales_cash NUMERIC(10, 2) DEFAULT 0.00,
    total_sales_mbway NUMERIC(10, 2) DEFAULT 0.00,
    total_sales_tpa NUMERIC(10, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'OPEN' NOT NULL,
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- 11. MOVIMENTAÇÕES DE CAIXA
CREATE TABLE IF NOT EXISTS cashier_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id UUID NOT NULL REFERENCES cashier_shifts(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. CHAMADOS DE EMPREGADO DE MESA
CREATE TABLE IF NOT EXISTS waiter_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    table_number INTEGER NOT NULL,
    reason VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    attended_at TIMESTAMP WITH TIME ZONE
);

-- 13. LOGS DE AUDITORIA
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. CARDÁPIO EM VÍDEO & STORIES
CREATE TABLE IF NOT EXISTS store_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    linked_product_id UUID,
    badge_text VARCHAR(50),
    display_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. DISPOSITIVOS HOMOLOGADOS
CREATE TABLE IF NOT EXISTS store_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    device_name VARCHAR(100) NOT NULL,
    device_type VARCHAR(50) NOT NULL,
    device_token VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16. INSUMOS DA REDE COM TABELA DE MERCADO
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    market_benchmark_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    franchise_supply_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    is_critical_checklist BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 17. SALDO DE ESTOQUE POR LOJA
CREATE TABLE IF NOT EXISTS store_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    current_quantity NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    min_alert_quantity NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    last_counted_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (tenant_id, item_id)
);

-- 18. PEDIDOS DE ABASTECIMENTO B2B (Filiais -> Matriz Aveiro)
CREATE TABLE IF NOT EXISTS supply_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_number SERIAL,
    status VARCHAR(50) DEFAULT 'PENDING' NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_savings NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 19. AUDITORIA DE QUEBRAS E FECHO DE CAIXA
CREATE TABLE IF NOT EXISTS inventory_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cashier_shift_id UUID REFERENCES cashier_shifts(id),
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    theoretical_quantity NUMERIC(10, 2) NOT NULL,
    counted_quantity NUMERIC(10, 2) NOT NULL,
    difference NUMERIC(10, 2) NOT NULL,
    reason VARCHAR(100),
    operator_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 20. AVALIAÇÕES NPS DE CLIENTES
CREATE TABLE IF NOT EXISTS customer_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 21. SOLICITAÇÕES DE CARDÁPIO DAS FILIAIS (Governança Matriz Aveiro)
CREATE TABLE IF NOT EXISTS franchise_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    request_type VARCHAR(50) DEFAULT 'PRICE_CHANGE' NOT NULL, -- PRICE_CHANGE, ITEM_AVAILABILITY, NEW_ITEM_PROPOSAL
    product_id VARCHAR(100) NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    requested_price NUMERIC(10, 2),
    current_price NUMERIC(10, 2),
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING' NOT NULL, -- PENDING, APPROVED, REJECTED
    admin_notes TEXT, -- Parecer ou justificativa da Matriz Aveiro
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT chk_franchise_request_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    CONSTRAINT chk_franchise_request_type CHECK (request_type IN ('PRICE_CHANGE', 'ITEM_AVAILABILITY', 'NEW_ITEM_PROPOSAL'))
);

-- ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_orders_tenant_date ON orders(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_tables_tenant ON restaurant_tables(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_containers_tenant ON product_containers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_devices_token ON store_devices(device_token);
CREATE INDEX IF NOT EXISTS idx_inventory_tenant ON store_inventory(tenant_id, item_id);
CREATE INDEX IF NOT EXISTS idx_supply_tenant ON supply_orders(tenant_id, status);

-- =====================================================================
-- INSERÇÃO EXCLUSIVA DAS DUAS LOJAS OFICIAIS (SEM DADOS FALSOS DE TESTE)
-- =====================================================================
INSERT INTO tenants (id, name, slug, nif, address, is_headquarters, active)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Açaí da Rose — Sede Franqueadora & Matriz Aveiro', 'aveiro', '500123456', 'Aveiro, Portugal', TRUE, TRUE),
    ('22222222-2222-2222-2222-222222222222', 'Açaí da Rose — Filial Torres Novas', 'torres-novas', '500789012', 'Torres Novas, Portugal', FALSE, TRUE)
ON CONFLICT (slug) DO UPDATE 
SET is_headquarters = EXCLUDED.is_headquarters, name = EXCLUDED.name;

-- 1. SUPER ADMIN (Henrique Linhares Junqueira - Master TI com Acesso a Tudo)
INSERT INTO users (tenant_id, email, name, password_hash, role, active)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'henriquelinharesjunqueira@gmail.com',
    'Henrique Linhares Junqueira (Super Admin / Master TI)',
    crypt('183834@Hlj', gen_salt('bf')),
    'SUPER_ADMIN',
    TRUE
) ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    role = 'SUPER_ADMIN',
    active = TRUE;

-- 2. ADMIN FRANQUEADORA (Painel Franqueadora com Acesso a Todas as Lojas da Rede)
INSERT INTO users (tenant_id, email, name, password_hash, role, active)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'franqueadora@acaidarose.pt',
    'Diretoria Franqueadora',
    crypt('Franquia@AcaiRose2026', gen_salt('bf')),
    'FRANCHISOR_ADMIN',
    TRUE
) ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    role = 'FRANCHISOR_ADMIN',
    active = TRUE;

-- 3. ADMIN LOJA (Gerente Local com Acesso Exclusivo à Loja Vinculada - Torres Novas)
INSERT INTO users (tenant_id, email, name, password_hash, role, active)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'gerente.torresnovas@acaidarose.pt',
    'Gerente Torres Novas',
    crypt('TorresNovas@2026', gen_salt('bf')),
    'TENANT_ADMIN',
    TRUE
) ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    role = 'TENANT_ADMIN',
    active = TRUE;
