import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const permissions = [
    { name: 'applications:read', description: 'Read applications' },
    { name: 'applications:write', description: 'Create/update/delete applications' },
    { name: 'business-capabilities:read', description: 'Read business capabilities' },
    { name: 'business-capabilities:write', description: 'Create/update/delete business capabilities' },
    { name: 'data-objects:read', description: 'Read data objects' },
    { name: 'data-objects:write', description: 'Create/update/delete data objects' },
    { name: 'interfaces:read', description: 'Read interfaces' },
    { name: 'interfaces:write', description: 'Create/update/delete interfaces' },
    { name: 'it-components:read', description: 'Read IT components' },
    { name: 'it-components:write', description: 'Create/update/delete IT components' },
    { name: 'providers:read', description: 'Read providers' },
    { name: 'providers:write', description: 'Create/update/delete providers' },
    { name: 'domains:read', description: 'Read domains' },
    { name: 'domains:write', description: 'Create/update/delete domains' },
    { name: 'users:read', description: 'Read users' },
    { name: 'users:write', description: 'Create/update/deactivate users' },
    { name: 'roles:read', description: 'Read roles' },
    { name: 'roles:write', description: 'Create/update/delete roles' },
    { name: 'permissions:read', description: 'Read permissions' },
    { name: 'permissions:write', description: 'Create permissions' },
    { name: 'tags:read', description: 'Read tags' },
    { name: 'tags:write', description: 'Create/update tags' },
  ];

  for (const perm of permissions) {
    const existing = await prisma.permission.findUnique({ where: { name: perm.name } });
    if (!existing) {
      await prisma.$executeRaw`INSERT INTO permissions (id, name, description) VALUES (gen_random_uuid(), ${perm.name}, ${perm.description})`;
    }
  }

  const existingRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
  if (!existingRole) {
    await prisma.$executeRaw`INSERT INTO roles (id, name, description) VALUES (gen_random_uuid(), 'Admin', 'Administrator with all permissions')`;
  }

  const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
  if (!adminRole) throw new Error('Admin role not created');

  const allPermissions = await prisma.permission.findMany();
  for (const perm of allPermissions) {
    const existing = await prisma.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
    });
    if (!existing) {
      await prisma.$executeRaw`INSERT INTO role_permissions (role_id, permission_id) VALUES (${adminRole.id}::uuid, ${perm.id}::uuid)`;
    }
  }

  const existingUser = await prisma.user.findUnique({ where: { email: 'admin@ark.io' } });
  if (!existingUser) {
    const passwordHash = await bcrypt.hash('admin123456', 12);
    await prisma.$executeRaw`INSERT INTO users (id, email, password_hash, first_name, last_name, role_id, is_active) 
      VALUES (gen_random_uuid(), ${'admin@ark.io'}::varchar, ${passwordHash}::varchar, ${'Admin'}::varchar, ${'User'}::varchar, ${adminRole.id}::uuid, true)`;
  }

  console.log('Seed completed: Admin user created (admin@ark.io / admin123456)');

  const tagDimensions = [
    { name: 'Geography', color: '#2196F3', icon: 'public', description: 'Geographic dimension for entities', entityScope: ['application', 'domain', 'business-capability', 'data-object', 'interface', 'it-component', 'provider'] },
    { name: 'Brand', color: '#9C27B0', icon: 'label', description: 'Brand dimension for entities', entityScope: ['application', 'domain', 'business-capability', 'data-object', 'interface', 'it-component', 'provider'] },
    { name: 'LegalEntity', color: '#FF9800', icon: 'account_balance', description: 'Legal entity dimension for entities', entityScope: ['application', 'domain', 'business-capability', 'data-object', 'interface', 'it-component', 'provider'] },
  ];

  for (const dim of tagDimensions) {
    const existing = await prisma.tagDimension.findUnique({ where: { name: dim.name } });
    if (!existing) {
      await prisma.$executeRaw`INSERT INTO tag_dimensions (id, name, color, icon, description, multi_value, entity_scope, sort_order)
        VALUES (gen_random_uuid(), ${dim.name}, ${dim.color}, ${dim.icon}, ${dim.description}, true, ${dim.entityScope}, 0)`;
    }
  }

  console.log('Seed completed: Tag dimensions created');

  // Insert sample IT Components if they don't exist
  const sampleItComponents = [
    { name: 'PostgreSQL Primary', type: 'database', technology: 'PostgreSQL 16', description: 'Base de données principale ARK' },
    { name: 'Redis Cache', type: 'cache', technology: 'Redis 7.2', description: 'Cache applicatif et sessions' },
    { name: 'Kafka Cluster', type: 'messaging', technology: 'Apache Kafka 3.6', description: 'Streaming events et bus de messages' },
    { name: 'RabbitMQ', type: 'messaging', technology: 'RabbitMQ 3.12', description: 'Queue messages asynchrones' },
    { name: 'Nginx Reverse Proxy', type: 'web-server', technology: 'Nginx 1.24', description: 'Load balancer et reverse proxy' },
    { name: 'Kubernetes Production', type: 'container-orchestration', technology: 'Kubernetes 1.28', description: 'Orchestration containers production' },
    { name: 'Elasticsearch Logs', type: 'search-engine', technology: 'Elasticsearch 8.11', description: 'Indexation et recherche logs' },
    { name: 'MinIO Object Storage', type: 'storage', technology: 'MinIO', description: 'Stockage objets S3-compatible' },
  ];

  for (const item of sampleItComponents) {
    const existing = await prisma.itComponent.findUnique({ where: { name: item.name } });
    if (!existing) {
      await prisma.$executeRaw`INSERT INTO it_components (id, name, description, type, technology, created_at, updated_at) 
        VALUES (gen_random_uuid(), ${item.name}::varchar, ${item.description}::text, ${item.type}::varchar, ${item.technology}::varchar, NOW(), NOW())`;
      console.log(`✓ Created IT Component: ${item.name}`);
    }
  }
  console.log('Seed IT Components completed');

  // Insert sample providers if they don't exist
  const sampleProviders = [
    { name: 'Salesforce', contractType: 'SaaS', expiryDate: '2026-12-31', description: 'CRM cloud leader' },
    { name: 'SAP', contractType: 'Licence', expiryDate: '2027-06-30', description: 'ERP legacy' },
    { name: 'Microsoft', contractType: 'SaaS', expiryDate: '2026-09-30', description: 'Suite Office 365 et Azure' },
    { name: 'Atlassian', contractType: 'SaaS', expiryDate: '2026-12-31', description: 'Jira, Confluence' },
    { name: 'ServiceNow', contractType: 'SaaS', expiryDate: '2027-03-31', description: 'ITSM et CMDB' },
    { name: 'GitLab', contractType: 'SaaS', expiryDate: '2026-06-30', description: 'DevOps CI/CD' },
    { name: 'AWS', contractType: 'SaaS', expiryDate: null, description: 'Infrastructure cloud' },
    { name: 'Snowflake', contractType: 'SaaS', expiryDate: '2027-12-31', description: 'Data warehouse cloud' },
  ];

  for (const provider of sampleProviders) {
    const existing = await prisma.provider.findUnique({ where: { name: provider.name } });
    if (!existing) {
      await prisma.$executeRaw`INSERT INTO providers (id, name, contract_type, expiry_date, description, updated_at) 
        VALUES (gen_random_uuid(), ${provider.name}::varchar, ${provider.contractType}::varchar, 
        ${provider.expiryDate}::date, ${provider.description}::text, NOW())`;
      console.log(`✓ Created provider: ${provider.name}`);
    }
  }
  console.log('Seed providers completed');

  // Insert sample data objects if they don't exist
  const sampleDataObjects = [
    { name: 'Customer Database', description: 'BD principale contenant les clients — source of truth', comment: 'Production database with master customer records', type: 'database', isSourceOfTruth: true },
    { name: 'Product Catalog Dataset', description: 'Données produits — enrichi de plusieurs sources', comment: 'Aggregated product information from multiple sources', type: 'dataset', isSourceOfTruth: false },
    { name: 'Legacy CRM Files', description: 'Fichiers plats du CRM legacy — en voie de migration', comment: 'Old flat files being phased out', type: 'file', isSourceOfTruth: false },
    { name: 'ERP Master Data', description: 'Données de référence SAP — source officielle', comment: 'Authoritative master data from SAP system', type: 'database', isSourceOfTruth: true },
    { name: 'Analytics Warehouse', description: 'DWH Snowflake — données agrégées', comment: 'Data warehouse for reporting and analytics', type: 'database', isSourceOfTruth: false },
  ];

  for (const dataObject of sampleDataObjects) {
    const existing = await prisma.dataObject.findFirst({ where: { name: dataObject.name } });
    if (!existing) {
      await prisma.$executeRaw`INSERT INTO data_objects (id, name, description, comment, type, is_source_of_truth, created_at, updated_at) 
        VALUES (gen_random_uuid(), ${dataObject.name}::varchar, ${dataObject.description}::text, ${dataObject.comment}::text, ${dataObject.type}::varchar, ${dataObject.isSourceOfTruth}::boolean, NOW(), NOW())`;
      console.log(`✓ Created DataObject: ${dataObject.name}`);
    }
  }
  console.log('Seed DataObjects completed');

  // ─── Business Capabilities (hiérarchie 3 niveaux) ──────────────────────────
  const sampleCapabilities = [
    // Level 0 (roots)
    { name: 'Strategy & Planning', level: 0, parentName: null, domainName: null, description: 'Capacités stratégiques de niveau 0', criticality: 'CRITICAL', technicalFit: 'ADEQUATE' },
    { name: 'Customer Engagement', level: 0, parentName: null, domainName: null, description: 'Capacités client de niveau 0', criticality: 'HIGH', technicalFit: 'PARTIAL' },
    { name: 'Technology Management', level: 0, parentName: null, domainName: null, description: 'Capacités IT de niveau 0', criticality: 'HIGH', technicalFit: 'ADEQUATE' },
    // Level 1
    { name: 'Financial Planning', level: 1, parentName: 'Strategy & Planning', domainName: 'Finance', description: 'Planification financière annuelle', criticality: 'CRITICAL', technicalFit: 'PARTIAL' },
    { name: 'Portfolio Management', level: 1, parentName: 'Strategy & Planning', domainName: 'IT', description: 'Gestion du portefeuille projets', criticality: 'HIGH', technicalFit: 'ADEQUATE' },
    { name: 'Sales Management', level: 1, parentName: 'Customer Engagement', domainName: 'Ventes', description: 'Gestion des ventes et commerciaux', criticality: 'HIGH', technicalFit: 'INADEQUATE' },
    { name: 'Customer Service', level: 1, parentName: 'Customer Engagement', domainName: 'Service Client', description: 'Service client et support', criticality: 'MEDIUM', technicalFit: 'PARTIAL' },
    { name: 'Infrastructure Management', level: 1, parentName: 'Technology Management', domainName: 'IT', description: 'Gestion infrastructure on-premise et cloud', criticality: 'CRITICAL', technicalFit: 'LEGACY' },
    { name: 'Application Development', level: 1, parentName: 'Technology Management', domainName: 'IT', description: 'Développement et maintenance applicative', criticality: 'HIGH', technicalFit: 'PARTIAL' },
    // Level 2
    { name: 'Budget Management', level: 2, parentName: 'Financial Planning', domainName: 'Finance', description: 'Gestion des budgets opérationnels', criticality: 'CRITICAL', technicalFit: 'ADEQUATE' },
    { name: 'Revenue Forecasting', level: 2, parentName: 'Financial Planning', domainName: 'Finance', description: 'Prévisions de revenus', criticality: 'HIGH', technicalFit: 'INADEQUATE' },
    { name: 'Lead Generation', level: 2, parentName: 'Sales Management', domainName: 'Marketing', description: 'Génération de leads', criticality: 'MEDIUM', technicalFit: 'LEGACY' },
  ];

  const getDomainId = async (name: string | null): Promise<string | null> => {
    if (!name) return null;
    const domain = await prisma.domain.findUnique({ where: { name } });
    return domain?.id ?? null;
  };

  const createdCapabilities: Record<string, string> = {};

  for (const cap of sampleCapabilities) {
    const existing = await prisma.businessCapability.findUnique({ where: { name: cap.name } });
    if (!existing) {
      const parentId = cap.parentName ? createdCapabilities[cap.parentName] ?? null : null;
      const domainId = await getDomainId(cap.domainName);
      await prisma.$executeRaw`
        INSERT INTO business_capabilities (id, name, description, comment, parent_id, level, domain_id, criticality, technical_fit, created_at, updated_at)
        VALUES (
          gen_random_uuid(),
          ${cap.name}::varchar,
          ${cap.description}::text,
          null,
          ${parentId}::uuid,
          ${cap.level}::smallint,
          ${domainId}::uuid,
          ${cap.criticality}::"CriticalityLevel",
          ${cap.technicalFit}::"TechnicalFitLevel",
          NOW(),
          NOW()
        )
      `;
      const created = await prisma.businessCapability.findUnique({ where: { name: cap.name } });
      if (created) {
        createdCapabilities[cap.name] = created.id;
        console.log(`✓ Created capability: ${cap.name} (level ${cap.level})`);
      }
    } else {
      createdCapabilities[cap.name] = existing.id;
      console.log(`✓ Capability exists: ${cap.name}`);
    }
  }

  console.log('Seed business capabilities completed');

  // ─── Interfaces (flux inter-applicatifs) ──────────────────────────
  // Récupérer les applications seedées pour créer des interfaces
  const apps = await prisma.application.findMany({
    select: { id: true, name: true },
    take: 5,
  });

  if (apps.length >= 2) {
    const sampleInterfaces = [
      {
        name: 'CRM → ERP Commandes',
        sourceAppId: apps[0].id,
        targetAppId: apps[1].id,
        middlewareAppId: null,
        type: 'DATABASE',
        frequency: 'DAILY',
        criticality: 'HIGH',
        description: 'Flux de commandes clients du CRM vers l\'ERP',
      },
      {
        name: 'Portail → API Gateway',
        sourceAppId: apps[1].id,
        targetAppId: apps.length > 2 ? apps[2].id : apps[0].id,
        middlewareAppId: apps.length > 3 ? apps[3].id : null,
        type: 'REST',
        frequency: 'REALTIME',
        criticality: 'CRITICAL',
        description: 'API REST temps réel via middleware ESB',
      },
    ];

    for (const iface of sampleInterfaces) {
      const existing = await prisma.interface.findFirst({
        where: {
          name: iface.name,
          sourceAppId: iface.sourceAppId,
          targetAppId: iface.targetAppId,
        },
      });
      if (!existing) {
        await prisma.$executeRaw`
          INSERT INTO interfaces (id, name, description, source_app_id, target_app_id, middleware_app_id, type, frequency, criticality, created_at, updated_at)
          VALUES (
            gen_random_uuid(),
            ${iface.name}::varchar,
            ${iface.description}::text,
            ${iface.sourceAppId}::uuid,
            ${iface.targetAppId}::uuid,
            ${iface.middlewareAppId}::uuid,
            ${iface.type}::"interface_type",
            ${iface.frequency}::"interface_frequency",
            ${iface.criticality}::"CriticalityLevel",
            NOW(),
            NOW()
          )
        `;
        console.log(`✓ Created interface: ${iface.name}${iface.middlewareAppId ? ' (with middleware)' : ''}`);
      } else {
        console.log(`✓ Interface exists: ${iface.name}`);
      }
    }
    console.log('Seed interfaces completed');
  } else {
    console.log('⚠ Skipping interfaces seed — fewer than 2 applications found');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
