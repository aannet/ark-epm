-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "role_id" UUID,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domains" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    CONSTRAINT "domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_capabilities" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "parent_id" UUID,
    "level" SMALLINT NOT NULL,
    "domain_id" UUID,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "business_capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "providers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "comment" TEXT,
    "contract_type" VARCHAR(100),
    "expiry_date" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "comment" TEXT,
    "owner_id" UUID,
    "domain_id" UUID,
    "criticality" VARCHAR(50),
    "lifecycle_status" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_provider_map" (
    "application_id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "provider_role" VARCHAR(50),
    "added_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "app_provider_map_pkey" PRIMARY KEY ("application_id","provider_id")
);

-- CreateTable
CREATE TABLE "app_capability_map" (
    "application_id" UUID NOT NULL,
    "capability_id" UUID NOT NULL,
    CONSTRAINT "app_capability_map_pkey" PRIMARY KEY ("application_id","capability_id")
);

-- CreateTable
CREATE TABLE "interfaces" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255),
    "source_app_id" UUID NOT NULL,
    "target_app_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "frequency" VARCHAR(50),
    "criticality" VARCHAR(50),
    "technical_contact_id" UUID,
    "latency_ms" INTEGER,
    "error_rate" DECIMAL(5,2),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "interfaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_objects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "comment" TEXT,
    "type" VARCHAR(100),
    "is_source_of_truth" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "data_objects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_data_object_map" (
    "application_id" UUID NOT NULL,
    "data_object_id" UUID NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'consumer',
    CONSTRAINT "app_data_object_map_pkey" PRIMARY KEY ("application_id","data_object_id")
);

-- CreateTable
CREATE TABLE "it_components" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "comment" TEXT,
    "technology" VARCHAR(255),
    "type" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "it_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_it_component_map" (
    "application_id" UUID NOT NULL,
    "it_component_id" UUID NOT NULL,
    CONSTRAINT "app_it_component_map_pkey" PRIMARY KEY ("application_id","it_component_id")
);

-- CreateTable
CREATE TABLE "audit_trail" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "action" VARCHAR(20) NOT NULL,
    "changed_by" UUID,
    "old_value" JSONB,
    "new_value" JSONB,
    "occurred_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_trail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag_dimensions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "color" VARCHAR(7),
    "icon" VARCHAR(50),
    "multi_value" BOOLEAN NOT NULL DEFAULT true,
    "entity_scope" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tag_dimensions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag_values" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "dimension_id" UUID NOT NULL,
    "path" VARCHAR(500) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "parent_id" UUID,
    "depth" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tag_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity_tags" (
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "tag_value_id" UUID NOT NULL,
    "tagged_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tagged_by" UUID,
    CONSTRAINT "entity_tags_pkey" PRIMARY KEY ("entity_type","entity_id","tag_value_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "refresh_tokens_user_id_key" ON "refresh_tokens"("user_id");
CREATE INDEX "idx_refresh_tokens_hash" ON "refresh_tokens"("token_hash");
CREATE INDEX "idx_refresh_tokens_user" ON "refresh_tokens"("user_id");
CREATE UNIQUE INDEX "domains_name_key" ON "domains"("name");
CREATE INDEX "idx_bus_cap_parent" ON "business_capabilities"("parent_id");
CREATE UNIQUE INDEX "providers_name_key" ON "providers"("name");
CREATE UNIQUE INDEX "applications_name_key" ON "applications"("name");
CREATE INDEX "idx_applications_domain" ON "applications"("domain_id");
CREATE INDEX "idx_applications_owner" ON "applications"("owner_id");
CREATE INDEX "app_provider_map_provider_id_idx" ON "app_provider_map"("provider_id");
CREATE INDEX "idx_interfaces_source" ON "interfaces"("source_app_id");
CREATE INDEX "idx_interfaces_target" ON "interfaces"("target_app_id");
CREATE UNIQUE INDEX "data_objects_name_key" ON "data_objects"("name");
CREATE UNIQUE INDEX "it_components_name_key" ON "it_components"("name");
CREATE INDEX "idx_audit_entity" ON "audit_trail"("entity_type", "entity_id");
CREATE INDEX "idx_audit_occurred" ON "audit_trail"("occurred_at" DESC);
CREATE UNIQUE INDEX "tag_dimensions_name_key" ON "tag_dimensions"("name");
CREATE INDEX "idx_tag_values_path_prefix" ON "tag_values"("dimension_id", "path");
CREATE UNIQUE INDEX "tag_values_dimension_id_path_key" ON "tag_values"("dimension_id", "path");
CREATE INDEX "idx_entity_tags_lookup" ON "entity_tags"("entity_type", "entity_id");
CREATE INDEX "idx_entity_tags_by_value" ON "entity_tags"("tag_value_id");

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "business_capabilities" ADD CONSTRAINT "business_capabilities_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "domains"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "business_capabilities" ADD CONSTRAINT "business_capabilities_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "business_capabilities"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "applications" ADD CONSTRAINT "applications_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "domains"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "applications" ADD CONSTRAINT "applications_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "app_provider_map" ADD CONSTRAINT "app_provider_map_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "app_provider_map" ADD CONSTRAINT "app_provider_map_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "app_capability_map" ADD CONSTRAINT "app_capability_map_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "app_capability_map" ADD CONSTRAINT "app_capability_map_capability_id_fkey" FOREIGN KEY ("capability_id") REFERENCES "business_capabilities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "interfaces" ADD CONSTRAINT "interfaces_source_app_id_fkey" FOREIGN KEY ("source_app_id") REFERENCES "applications"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "interfaces" ADD CONSTRAINT "interfaces_target_app_id_fkey" FOREIGN KEY ("target_app_id") REFERENCES "applications"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "interfaces" ADD CONSTRAINT "interfaces_technical_contact_id_fkey" FOREIGN KEY ("technical_contact_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "app_data_object_map" ADD CONSTRAINT "app_data_object_map_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "app_data_object_map" ADD CONSTRAINT "app_data_object_map_data_object_id_fkey" FOREIGN KEY ("data_object_id") REFERENCES "data_objects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "app_it_component_map" ADD CONSTRAINT "app_it_component_map_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "app_it_component_map" ADD CONSTRAINT "app_it_component_map_it_component_id_fkey" FOREIGN KEY ("it_component_id") REFERENCES "it_components"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "audit_trail" ADD CONSTRAINT "audit_trail_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "tag_values" ADD CONSTRAINT "tag_values_dimension_id_fkey" FOREIGN KEY ("dimension_id") REFERENCES "tag_dimensions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tag_values" ADD CONSTRAINT "tag_values_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "tag_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "entity_tags" ADD CONSTRAINT "entity_tags_tag_value_id_fkey" FOREIGN KEY ("tag_value_id") REFERENCES "tag_values"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Audit trigger function
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

-- Audit triggers
CREATE TRIGGER trg_audit_domains AFTER INSERT OR UPDATE OR DELETE ON domains FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();
CREATE TRIGGER trg_audit_applications AFTER INSERT OR UPDATE OR DELETE ON applications FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();
CREATE TRIGGER trg_audit_business_capabilities AFTER INSERT OR UPDATE OR DELETE ON business_capabilities FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();
CREATE TRIGGER trg_audit_providers AFTER INSERT OR UPDATE OR DELETE ON providers FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();
CREATE TRIGGER trg_audit_interfaces AFTER INSERT OR UPDATE OR DELETE ON interfaces FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();
CREATE TRIGGER trg_audit_data_objects AFTER INSERT OR UPDATE OR DELETE ON data_objects FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();
CREATE TRIGGER trg_audit_it_components AFTER INSERT OR UPDATE OR DELETE ON it_components FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();
CREATE TRIGGER trg_audit_users AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();
CREATE TRIGGER trg_audit_tag_dimensions AFTER INSERT OR UPDATE OR DELETE ON tag_dimensions FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();
CREATE TRIGGER trg_audit_tag_values AFTER INSERT OR UPDATE OR DELETE ON tag_values FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();
