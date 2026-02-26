-- =============================================================================
-- ARK DATABASE SCHEMA - Version 0.4
-- Date: Février 2026
-- Changelog v0.4 :
--   - Suppression de la contrainte UNIQUE trop restrictive sur interfaces
--   - Ajout des tables de liaison app_data_object_map et app_it_component_map
--   - Ajout first_name / last_name sur users
--   - Ajout index idx_applications_provider pour navigabilité depuis providers
--   - Ajout colonnes latency_ms et error_rate sur interfaces (indicateurs P1 conservés)
--   - Ajout triggers d'audit trail automatiques (base autonome)
-- =============================================================================

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

---
--- 1. AUTHENTIFICATION & SÉCURITÉ (RBAC)
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

---
--- 2. STRUCTURE & GOUVERNANCE
---

CREATE TABLE domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

---
--- 3. MÉTA-MODÈLE APPLICATIF (P1)
---

-- Business Capabilities : Hiérarchie récursive — max 5 niveaux en MVP
-- Le niveau est calculé applicativement et contrôlé via trigger (voir section 5)
CREATE TABLE business_capabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES business_capabilities(id) ON DELETE SET NULL,
    level SMALLINT NOT NULL CHECK (level BETWEEN 1 AND 5),
    domain_id UUID REFERENCES domains(id),
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    contract_type VARCHAR(100),
    expiry_date DATE,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID REFERENCES users(id),
    provider_id UUID REFERENCES providers(id),
    domain_id UUID REFERENCES domains(id),
    criticality VARCHAR(50) CHECK (criticality IN ('low', 'medium', 'high', 'mission-critical')),
    lifecycle_status VARCHAR(50),
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table de liaison Application <-> Business Capability
CREATE TABLE app_capability_map (
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    capability_id UUID REFERENCES business_capabilities(id) ON DELETE CASCADE,
    PRIMARY KEY (application_id, capability_id)
);

-- Interfaces : Relation unidirectionnelle Source -> Cible
-- Pas de contrainte UNIQUE globale : plusieurs interfaces distinctes peuvent exister
-- entre les mêmes apps (ex : deux API avec SLA différents). L'unicité métier
-- est gérée applicativement si nécessaire.
CREATE TABLE interfaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),
    source_app_id UUID NOT NULL REFERENCES applications(id),
    target_app_id UUID NOT NULL REFERENCES applications(id),
    type VARCHAR(50) NOT NULL CHECK (type IN ('api', 'batch', 'message')),
    frequency VARCHAR(50),
    criticality VARCHAR(50) CHECK (criticality IN ('low', 'medium', 'high', 'mission-critical')),
    technical_contact_id UUID REFERENCES users(id),
    latency_ms INTEGER,         -- indicateur de performance : latence en ms
    error_rate DECIMAL(5,2),    -- indicateur de performance : taux d'erreur en %
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE data_objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) CHECK (type IN ('database', 'dataset', 'file')),
    is_source_of_truth BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table de liaison Application <-> Data Object (n:n)
-- Une application peut consommer plusieurs data objects, un data object peut être
-- consommé par plusieurs applications.
CREATE TABLE app_data_object_map (
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    data_object_id UUID REFERENCES data_objects(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'consumer' CHECK (role IN ('consumer', 'producer', 'owner')),
    PRIMARY KEY (application_id, data_object_id)
);

CREATE TABLE it_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    technology VARCHAR(255),
    type VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table de liaison Application <-> IT Component (n:n)
-- Un composant peut héberger plusieurs applications, une application peut reposer
-- sur plusieurs composants.
CREATE TABLE app_it_component_map (
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    it_component_id UUID REFERENCES it_components(id) ON DELETE CASCADE,
    PRIMARY KEY (application_id, it_component_id)
);

---
--- 4. AUDIT & LOGGING
---

CREATE TABLE audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    changed_by UUID REFERENCES users(id),
    old_value JSONB,
    new_value JSONB,
    occurred_at TIMESTAMPTZ DEFAULT NOW()
);

---
--- 5. TRIGGERS D'AUDIT (base autonome)
---
--- Stratégie : une fonction générique appelée par chaque trigger de table.
--- Le changed_by est passé via une variable de session PostgreSQL (ark.current_user_id)
--- que le backend positionne à chaque connexion : SET LOCAL ark.current_user_id = '<uuid>';
---

CREATE OR REPLACE FUNCTION fn_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_entity_type TEXT;
BEGIN
    -- Récupération de l'utilisateur courant depuis la variable de session
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

-- Trigger sur chaque table métier P1
CREATE TRIGGER trg_audit_applications
    AFTER INSERT OR UPDATE OR DELETE ON applications
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_business_capabilities
    AFTER INSERT OR UPDATE OR DELETE ON business_capabilities
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

CREATE TRIGGER trg_audit_providers
    AFTER INSERT OR UPDATE OR DELETE ON providers
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_users
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

---
--- 6. INDEXATION
---

CREATE INDEX idx_bus_cap_parent ON business_capabilities(parent_id);
CREATE INDEX idx_bus_cap_level  ON business_capabilities(level);
CREATE INDEX idx_interfaces_source ON interfaces(source_app_id);
CREATE INDEX idx_interfaces_target ON interfaces(target_app_id);
CREATE INDEX idx_applications_provider ON applications(provider_id);
CREATE INDEX idx_applications_domain ON applications(domain_id);
CREATE INDEX idx_applications_owner ON applications(owner_id);
CREATE INDEX idx_audit_entity ON audit_trail(entity_type, entity_id);
CREATE INDEX idx_audit_occurred ON audit_trail(occurred_at DESC);