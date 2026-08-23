-- ============================================================
-- Açaí da Rose — Schema Supabase / PostgreSQL
-- Arquitetura Franqueadora Multi-Loja & PDV Balcão com QR Code
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------
-- 1. Tabela de Lojas / Franquias (Tenants)
-- -------------------------
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    nif VARCHAR(50),
    address TEXT,
    phone VARCHAR(50),
    mbway_phone VARCHAR(50),
    currency VARCHAR(10) DEFAULT 'EUR',
    is_headquarters BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_deleted_at ON tenants(deleted_at);

-- -------------------------
-- 2. Tabela de Utilizadores & Acessos
-- -------------------------
-- Roles: SUPER_ADMIN (Açaí da Rose - Franqueadora), TENANT_ADMIN (Gerente de Loja), CASHIER (Operador de Caixa - máx 3 por loja)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'CASHIER' NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- -------------------------
-- 3. Catálogo de Recipientes (Copos / Taças)
-- -------------------------
CREATE TABLE IF NOT EXISTS product_containers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    preco_base NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    limite_bases INTEGER NOT NULL DEFAULT 1,
    limite_complementos_gratis INTEGER NOT NULL DEFAULT 0,
    emoji VARCHAR(50) DEFAULT '🍨',
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_containers_tenant ON product_containers(tenant_id);

-- -------------------------
-- 4. Catálogo de Bases e Sorbets
-- -------------------------
CREATE TABLE IF NOT EXISTS product_bases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_bases_tenant ON product_bases(tenant_id);

-- -------------------------
-- 5. Catálogo de Toppings / Acompanhamentos
-- -------------------------
CREATE TABLE IF NOT EXISTS product_toppings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- Frutas, Cereais, Doces, Premium
    is_premium BOOLEAN DEFAULT FALSE,
    preco_extra NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    emoji VARCHAR(50) DEFAULT '✨',
    display_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_toppings_tenant_cat ON product_toppings(tenant_id, category);

-- -------------------------
-- 6. Tabela de Pedidos / Comandas (Orders)
-- -------------------------
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    cashier_id UUID REFERENCES users(id) ON DELETE SET NULL,
    cashier_name VARCHAR(255),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    order_number INTEGER NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'PAID' NOT NULL, -- PAID, CANCELLED
    payment_method VARCHAR(50) NOT NULL,
    payment_reference TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancel_reason TEXT,
    cancelled_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    cancelled_by_name VARCHAR(255),
    items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_orders_tenant_date ON orders(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- -------------------------
-- 7. Tabela de Auditoria (Logs)
-- -------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);

-- -------------------------
-- SEED INICIAL (Torres Novas & Aveiro)
-- -------------------------
INSERT INTO tenants (id, name, slug, address, phone, mbway_phone, is_headquarters, active)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Açaí da Rose — Matriz (Torres Novas)', 'torres-novas', 'Praça 5 de Outubro 12, Torres Novas, Portugal', '+351 912 100 200', '+351 912 100 200', TRUE, TRUE),
    ('22222222-2222-2222-2222-222222222222', 'Açaí da Rose — Filial Aveiro', 'aveiro', 'Avenida Dr. Lourenço Peixinho 85, Aveiro, Portugal', '+351 913 300 400', '+351 913 300 400', FALSE, TRUE)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO users (id, tenant_id, email, name, password_hash, role, active)
VALUES 
    -- 1. Franqueadora Multi-Loja
    ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'franqueadora@acairose.pt', 'Açaí da Rose (Franqueadora)', '123456', 'SUPER_ADMIN', TRUE),
    -- 2. Gerente Matriz Torres Novas
    ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'torresnovas@acairose.pt', 'Gerente Torres Novas', '123456', 'TENANT_ADMIN', TRUE),
    -- 3. Gerente Filial Aveiro
    ('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'aveiro@acairose.pt', 'Gerente Aveiro', '123456', 'TENANT_ADMIN', TRUE)
ON CONFLICT (email) DO NOTHING;
