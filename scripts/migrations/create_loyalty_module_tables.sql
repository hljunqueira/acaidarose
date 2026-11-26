-- ============================================================================
-- AÇAÍ DA ROSE - MÓDULO DE CASHBACK E FIDELIDADE MOBILE
-- SCRIPT DE CRIAÇÃO DAS TABELAS NO POSTGRESQL 16
-- 100% LIMPO: SEM SEEDS OU MOCKS (TABELAS INICIAM VAZIAS)
-- ============================================================================

-- 0. ALTERAÇÕES NO CATÁLOGO MESTRE DE PRODUTOS
ALTER TABLE IF EXISTS product_containers 
ADD COLUMN IF NOT EXISTS cashback_enabled BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE IF EXISTS product_containers 
ADD COLUMN IF NOT EXISTS points_cost INT NULL;

-- 1. TABELA DE CLIENTES DO CASHBACK
CREATE TABLE IF NOT EXISTS loyalty_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL, -- Loja ativa de preferência
    username VARCHAR(50) NOT NULL UNIQUE,                    -- ex: @mariac_luis
    phone VARCHAR(30) NOT NULL UNIQUE,                       -- ex: +351912345678
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE,
    nif VARCHAR(20) NULL,                                    -- NIF 100% OPCIONAL
    birth_date DATE,                                         -- Campanha de aniversário
    password_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255),                         -- Rotação silenciosa de Refresh Token
    push_token TEXT,                                         -- Token nativo APNs (iOS) ou FCM (Android)
    push_platform VARCHAR(10),                               -- 'ios' ou 'android'
    points_balance INT NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
    referral_code VARCHAR(30) UNIQUE NOT NULL,               -- ex: ROSE-8752
    referred_by_id UUID REFERENCES loyalty_customers(id) ON DELETE SET NULL,
    avatar_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',            -- 'ACTIVE', 'INACTIVE', 'SUSPENDED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CATÁLOGO DE RECOMPENSAS / PRÊMIOS RESGATÁVEIS
CREATE TABLE IF NOT EXISTS loyalty_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,  -- Matriz ou específica
    product_container_id UUID REFERENCES product_containers(id) ON DELETE SET NULL,
    code VARCHAR(50),                                        -- ex: 'acai-001'
    name VARCHAR(150) NOT NULL,                               -- ex: 'Copo 250gr' ou 'Copo 350gr'
    description TEXT,
    points_cost INT NOT NULL CHECK (points_cost > 0),         -- ex: 130
    category VARCHAR(50) DEFAULT 'COPOS',                    -- 'COPOS', 'ADICIONAIS', 'POTES'
    image_url TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. EXTRATO DE TRANSAÇÕES DE PONTOS (CRÉDITOS E DÉBITOS)
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES loyalty_customers(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('CREDIT', 'DEBIT')),
    points INT NOT NULL CHECK (points > 0),
    description VARCHAR(255) NOT NULL,                       -- ex: 'Compra em Loja — Figueira da Foz'
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    idempotency_key VARCHAR(100) UNIQUE,                     -- Blindagem contra duplo clique ou retry de rede
    offline_synced BOOLEAN NOT NULL DEFAULT FALSE,           -- Indica se foi originada em contingência offline
    cashier_user_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'APPROVED',          -- 'APPROVED', 'PENDING', 'CANCELLED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. VOUCHERS DE RESGATE ATIVOS
CREATE TABLE IF NOT EXISTS loyalty_vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES loyalty_customers(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES loyalty_rewards(id) ON DELETE RESTRICT,
    voucher_code VARCHAR(50) UNIQUE NOT NULL,                -- ex: 'ROSE-500G-98412'
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',            -- 'ACTIVE', 'REDEEMED', 'EXPIRED', 'REFUNDED'
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,            -- 24 horas a partir do resgate
    redeemed_at TIMESTAMP WITH TIME ZONE,
    redeemed_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    cashier_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. REGRAS DE PONTUAÇÃO E CAMPANHAS PROMOCIONAIS DINÂMICAS
CREATE TABLE IF NOT EXISTS loyalty_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL = Rede Toda, ou UUID da loja
    title VARCHAR(150) NOT NULL,                             -- ex: 'Semana da Avelã em Dobro'
    description TEXT,
    multiplier NUMERIC(3, 2) NOT NULL DEFAULT 1.00,          -- ex: 2.00 para dobro de pontos
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    banner_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. COMPENSAÇÃO FINANCEIRA ENTRE LOJAS (CLEARING MULTI-LOJA)
CREATE TABLE IF NOT EXISTS loyalty_clearing_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issuing_tenant_id UUID NOT NULL REFERENCES tenants(id),   -- Loja onde o ponto foi ganho
    redeeming_tenant_id UUID NOT NULL REFERENCES tenants(id), -- Loja onde o prêmio foi retirado
    voucher_id UUID NOT NULL REFERENCES loyalty_vouchers(id),
    cost_amount NUMERIC(10, 2) NOT NULL,                     -- Custo de insumos (CMV) em Euro
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',           -- 'PENDING', 'SETTLED_IN_ROYALTIES'
    settled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. RETAIL MEDIA E PARCERIAS CO-MARKETING
CREATE TABLE IF NOT EXISTS loyalty_ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL = Rede Toda, ou UUID da loja local
    advertiser_name VARCHAR(150) NOT NULL,                    -- ex: 'Fitness Factory Torres Novas'
    campaign_title VARCHAR(150) NOT NULL,
    badge_label VARCHAR(50) DEFAULT 'Parceiro Oficial',       -- 'Parceiro Oficial', 'Vantagem Amiga'
    banner_url TEXT NOT NULL,
    target_url TEXT NOT NULL,                                 -- Link externo ou deep link
    placement VARCHAR(50) NOT NULL DEFAULT 'HOME_FEED',       -- 'HOME_FEED', 'REWARDS_TOP', 'VOUCHER_MODAL'
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    priority INT NOT NULL DEFAULT 0,
    impressions_count INT NOT NULL DEFAULT 0,
    clicks_count INT NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. CONFIGURAÇÕES DINÂMICAS & FEATURE FLAGS MODULARES (ZERO ACOPLAMENTO)
CREATE TABLE IF NOT EXISTS loyalty_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL = Padrão Global Franqueadora
    key VARCHAR(100) NOT NULL UNIQUE,                        -- ex: 'feature_reorder_favorite_enabled'
    value JSONB NOT NULL,                                    -- ex: {"enabled": false}
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ÍNDICES DE ALTA PERFORMANCE & INTEGRIDADE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_loyalty_customers_username ON loyalty_customers(LOWER(username));
CREATE INDEX IF NOT EXISTS idx_loyalty_customers_phone ON loyalty_customers(phone);
CREATE INDEX IF NOT EXISTS idx_loyalty_customers_referral ON loyalty_customers(referral_code);
CREATE INDEX IF NOT EXISTS idx_loyalty_customers_push ON loyalty_customers(push_token) WHERE push_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_customer ON loyalty_transactions(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_tenant ON loyalty_transactions(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_order ON loyalty_transactions(order_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_loyalty_transactions_idempotency ON loyalty_transactions(idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_loyalty_vouchers_code ON loyalty_vouchers(voucher_code);
CREATE INDEX IF NOT EXISTS idx_loyalty_vouchers_customer ON loyalty_vouchers(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_loyalty_vouchers_tenant ON loyalty_vouchers(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_loyalty_campaigns_active ON loyalty_campaigns(tenant_id, active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_loyalty_ads_tenant ON loyalty_ads(tenant_id, active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_loyalty_clearing_status ON loyalty_clearing_settlements(status, issuing_tenant_id, redeeming_tenant_id);
