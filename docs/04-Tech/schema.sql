-- =============================================================================
-- ARK DATABASE SCHEMA - Version 1.0
-- Date: Mai 2026
-- Changelog v1.0 :
--   - Ajout des enums PostgreSQL : "CriticalityLevel", "TechnicalFitLevel" (PascalCase),
--     interface_type, interface_frequency (snake_case avec @@map Prisma)
--   - applications : suppression provider_id (remplacé par app_provider_map n:n),
--     ajout description, comment, contrainte UNIQUE(name)
--   - Nouvelle table app_provider_map (relation n:n Application <-> Provider)
--   - business_capabilities : ajout comment, criticality, technical_fit, UNIQUE(name)
--   - interfaces : technical_contact_id UUID → technical_contact VARCHAR(255),
--     suppression latency_ms, ajout description, comment, middleware_app_id,
--     mise à jour des types avec les enums
--   - it_components : ajout description, comment, updated_at NOT NULL, UNIQUE(name)
--   - providers/interfaces/data_objects/it_components : updated_at NOT NULL sans DEFAULT
--     (Prisma @updatedAt gère la valeur au niveau ORM, pas de DEFAULT côté DB)
--   - Ajout trigger audit sur domains
--   - Ajout index idx_interfaces_middleware
-- Changelog v0.9 :
--   - Data Objects : conformité NFR-GOV-005 (description, comment, updated_at)
--   - Ajout contrainte UNIQUE sur data_objects.name
--   - Suppression du CHECK sur data_objects.type (accepte string libre)
-- Changelog v0.8 :
--   - Providers : conformité NFR-GOV-005 (description, comment, updated_at)
--   - Ajout contrainte UNIQUE sur providers.name
-- Changelog v0.7 :
--   - Ajout du système de refresh tokens (table refresh_tokens)
--   - Support de la rotation des refresh tokens
-- Changelog v0.6 :
--   - Migration du système de tags vers modèle relationnel (tag_dimensions, tag_values, entity_tags)
--   - Suppression des colonnes tags TEXT[] sur les tables métier
--   - Ajout des triggers d'audit pour les nouvelles tables de tags
-- =============================================================================

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

---
--- 0. ENUMS
---

-- Noms PascalCase : pas de @@map dans schema.prisma → Prisma crée l'enum avec ce casing
CREATE TYPE "CriticalityLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "TechnicalFitLevel" AS ENUM ('ADEQUATE', 'PARTIAL', 'INADEQUATE', 'LEGACY');
CREATE TYPE interface_type AS ENUM (
    'REST', 'SOAP', 'FTP', 'SFTP', 'DATABASE',
    'MESSAGE_QUEUE', 'BATCH_FILE', 'EVENT_STREAM', 'GRAPHQL', 'GRPC', 'OTHER'
);
CREATE TYPE interface_frequency AS ENUM (
    'REALTIME', 'NEAR_REALTIME', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'ON_DEMAND'
);

---
--- 1. DIMENSION TAGS SYSTEM
---

-- Dimensions de tag (ex: Geography, Brand, BusinessUnit)
CREATE TABLE tag_dimensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7), -- Format hex: #RRGGBB
    icon VARCHAR(50),
    multi_value BOOLEAN DEFAULT true,
    entity_scope TEXT[] DEFAULT '{}', -- Entités concernées: ['domain', 'application', ...]
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Valeurs de tag avec hiérarchie (ex: Europe -> France -> Paris)
CREATE TABLE tag_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dimension_id UUID NOT NULL REFERENCES tag_dimensions(id) ON DELETE CASCADE,
    path VARCHAR(500) NOT NULL, -- Chemin complet: "europe/france/paris"
    label VARCHAR(255) NOT NULL, -- Label affiché: "Paris"
    parent_id UUID REFERENCES tag_values(id) ON DELETE SET NULL,
    depth SMALLINT DEFAULT 0, -- Niveau dans la hiérarchie (0=racine)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (dimension_id, path)
);

-- Association tags <-> entités (domaines, applications, etc.)
CREATE TABLE entity_tags (
    entity_type VARCHAR(50) NOT NULL, -- 'domain', 'application', etc.
    entity_id UUID NOT NULL,
    tag_value_id UUID NOT NULL REFERENCES tag_values(id) ON DELETE CASCADE,
    tagged_at TIMESTAMPTZ DEFAULT NOW(),
    tagged_by UUID,
    PRIMARY KEY (entity_type, entity_id, tag_value_id)
);

CREATE INDEX idx_entity_tags_lookup ON entity_tags(entity_type, entity_id);
CREATE INDEX idx_entity_tags_by_value ON entity_tags(tag_value_id);
CREATE INDEX idx_tag_values_path ON tag_values(dimension_id, path);

---
--- 2. AUTHENTIFICATION & SÉCURITÉ (RBAC)
---

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL, -- ex: 'applications:write'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL, -- ex: 'Architect', 'Admin'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Hash Bcrypt
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role_id UUID REFERENCES roles(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refresh Tokens : Un seul par utilisateur avec rotation
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL, -- Hash bcrypt du token
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

---
--- 3. STRUCTURE & GOUVERNANCE
---

CREATE TABLE domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

---
--- 4. MÉTA-MODÈLE APPLICATIF (P1)
---

-- Business Capabilities : Hiérarchie récursive
CREATE TABLE business_capabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    comment TEXT,
    parent_id UUID REFERENCES business_capabilities(id) ON DELETE SET NULL,
    level SMALLINT,
    domain_id UUID REFERENCES domains(id),
    criticality "CriticalityLevel",
    technical_fit "TechnicalFitLevel",
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    comment TEXT,
    contract_type VARCHAR(100),
    expiry_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL -- géré par Prisma @updatedAt (pas de DEFAULT DB)
);

CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    comment TEXT,
    owner_id UUID REFERENCES users(id),
    domain_id UUID REFERENCES domains(id),
    criticality VARCHAR(50),
    lifecycle_status VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table de liaison Application <-> Provider (n:n)
CREATE TABLE app_provider_map (
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    provider_role VARCHAR(50),
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (application_id, provider_id)
);

-- Table de liaison Application <-> Business Capability
CREATE TABLE app_capability_map (
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    capability_id UUID REFERENCES business_capabilities(id) ON DELETE CASCADE,
    PRIMARY KEY (application_id, capability_id)
);

-- Interfaces : Relation Source -> Cible avec middleware optionnel
CREATE TABLE interfaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),
    description TEXT,
    comment TEXT,
    source_app_id UUID NOT NULL REFERENCES applications(id),
    target_app_id UUID NOT NULL REFERENCES applications(id),
    middleware_app_id UUID REFERENCES applications(id),
    type interface_type NOT NULL,
    frequency interface_frequency,
    criticality "CriticalityLevel",
    technical_contact VARCHAR(255), -- Nom ou email (pas de FK)
    error_rate DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL -- géré par Prisma @updatedAt (pas de DEFAULT DB)
);

CREATE TABLE data_objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    comment TEXT,
    type VARCHAR(100),
    is_source_of_truth BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL -- géré par Prisma @updatedAt (pas de DEFAULT DB)
);

-- Table de liaison Application <-> Data Object (n:n)
CREATE TABLE app_data_object_map (
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    data_object_id UUID REFERENCES data_objects(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'consumer',
    PRIMARY KEY (application_id, data_object_id)
);

CREATE TABLE it_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    comment TEXT,
    technology VARCHAR(255),
    type VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL -- géré par Prisma @updatedAt (pas de DEFAULT DB)
);

-- Table de liaison Application <-> IT Component (n:n)
CREATE TABLE app_it_component_map (
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    it_component_id UUID REFERENCES it_components(id) ON DELETE CASCADE,
    PRIMARY KEY (application_id, it_component_id)
);

---
--- 5. AUDIT & LOGGING
---

CREATE TABLE audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,
    changed_by UUID REFERENCES users(id),
    old_value JSONB,
    new_value JSONB,
    occurred_at TIMESTAMPTZ DEFAULT NOW()
);

---
--- 6. TRIGGERS D'AUDIT
---

CREATE OR REPLACE FUNCTION fn_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_entity_type TEXT;
BEGIN
    BEGIN
        v_user_id := current_setting('ark.current_user_id')::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    v_entity_type := TG_TABLE_NAME;

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_trail (entity_type, entity_id, action, changed_by, new_value)
        VALUES (v_entity_type, NEW.id, 'INSERT', v_user_id, to_jsonb(NEW));

    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_trail (entity_type, entity_id, action, changed_by, old_value, new_value)
        VALUES (v_entity_type, NEW.id, 'UPDATE', v_user_id, to_jsonb(OLD), to_jsonb(NEW));

    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_trail (entity_type, entity_id, action, changed_by, old_value)
        VALUES (v_entity_type, OLD.id, 'DELETE', v_user_id, to_jsonb(OLD));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_domains
    AFTER INSERT OR UPDATE OR DELETE ON domains
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_applications
    AFTER INSERT OR UPDATE OR DELETE ON applications
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_business_capabilities
    AFTER INSERT OR UPDATE OR DELETE ON business_capabilities
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_providers
    AFTER INSERT OR UPDATE OR DELETE ON providers
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_interfaces
    AFTER INSERT OR UPDATE OR DELETE ON interfaces
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_data_objects
    AFTER INSERT OR UPDATE OR DELETE ON data_objects
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_it_components
    AFTER INSERT OR UPDATE OR DELETE ON it_components
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_users
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_tag_dimensions
    AFTER INSERT OR UPDATE OR DELETE ON tag_dimensions
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_tag_values
    AFTER INSERT OR UPDATE OR DELETE ON tag_values
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

---
--- 7. INDEXATION
---

CREATE INDEX idx_bus_cap_parent ON business_capabilities(parent_id);
CREATE INDEX idx_applications_domain ON applications(domain_id);
CREATE INDEX idx_applications_owner ON applications(owner_id);
CREATE INDEX idx_app_provider_map_provider ON app_provider_map(provider_id);
CREATE INDEX idx_interfaces_source ON interfaces(source_app_id);
CREATE INDEX idx_interfaces_target ON interfaces(target_app_id);
CREATE INDEX idx_interfaces_middleware ON interfaces(middleware_app_id);
CREATE INDEX idx_audit_entity ON audit_trail(entity_type, entity_id);
CREATE INDEX idx_audit_occurred ON audit_trail(occurred_at DESC);
