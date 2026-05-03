import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // ─── Phase 1 : récupération des entités nécessaires ──────────────────────
  const allDomains = await prisma.domain.findMany();
  const domainByName = new Map(allDomains.map((d) => [d.name, d]));

  const allProviders = await prisma.provider.findMany();
  const providerByName = new Map(allProviders.map((p) => [p.name, p]));

  const allCapabilities = await prisma.businessCapability.findMany();
  const capabilityByName = new Map(allCapabilities.map((c) => [c.name, c]));

  const allDataObjects = await prisma.dataObject.findMany();
  const dataObjectByName = new Map(allDataObjects.map((o) => [o.name, o]));

  const allItComponents = await prisma.itComponent.findMany();
  const itComponentByName = new Map(allItComponents.map((i) => [i.name, i]));

  const allTagValues = await prisma.tagValue.findMany({ include: { dimension: true } });
  const tagValueByPath = new Map(allTagValues.map((t) => [t.path, t]));

  const users = await prisma.user.findMany({ where: { isActive: true }, take: 5 });

  if (allDomains.length === 0) {
    console.error('No domains found. Please run seed-domains.ts first.');
    process.exit(1);
  }

  console.log(
    `Found ${allDomains.length} domains, ${allProviders.length} providers, ${allCapabilities.length} capabilities, ${allDataObjects.length} dataObjects, ${allItComponents.length} itComponents, ${allTagValues.length} tagValues, ${users.length} users`,
  );

  // ─── Phase 2 : définition des applications + leurs associations ─────────
  const applications: Array<{
    name: string;
    description: string;
    comment: string;
    criticality: string;
    lifecycleStatus: string;
    domainName: string;
    // Associations explicites (Option B — inline)
    providers?: Array<{ providerName: string; role: string }>;
    capabilities?: string[]; // par nom
    dataObjects?: Array<{ dataObjectName: string; role: string }>;
    itComponents?: string[]; // par nom
    tags?: string[]; // path du tagValue
  }> = [
    {
      name: 'ERP SAP S/4HANA',
      description: 'Système de gestion intégré pour la finance et la logistique',
      comment: 'Migration complète prévue Q3 2026',
      criticality: 'mission-critical',
      lifecycleStatus: 'production',
      domainName: 'Finance & Comptabilité',
      providers: [{ providerName: 'SAP SE', role: 'primary' }],
      capabilities: ['Financial Planning', 'Budget Management'],
      dataObjects: [
        { dataObjectName: 'ERP Master Data', role: 'producer' },
      ],
      itComponents: ['PostgreSQL Primary'],
      tags: ['/EU/FR/PAR', '/CORP/ENTERPRISE', '/ARK/FR'],
    },
    {
      name: 'CRM Salesforce',
      description: 'Gestion de la relation client et suivi des opportunités commerciales',
      comment: 'Intégration avec le call center en cours',
      criticality: 'high',
      lifecycleStatus: 'production',
      domainName: 'Ventes & Distribution',
      providers: [{ providerName: 'Salesforce', role: 'primary' }],
      capabilities: ['Sales Management'],
      dataObjects: [
        { dataObjectName: 'Customer Database', role: 'producer' },
      ],
      itComponents: ['Redis Cache'],
      tags: ['/EU/FR/PAR', '/PREM/LUXURY', '/ARK/FR'],
    },
    {
      name: 'Portail RH Workday',
      description: 'Portail des ressources humaines pour les collaborateurs',
      comment: 'Module paie déployé en janvier 2026',
      criticality: 'high',
      lifecycleStatus: 'production',
      domainName: 'Ressources Humaines',
      providers: [{ providerName: 'Workday', role: 'primary' }],
      capabilities: ['Customer Engagement'],
      dataObjects: [{ dataObjectName: 'Product Catalog Dataset', role: 'consumer' }],
      tags: ['/EU/FR/PAR', '/CORP/ENTERPRISE', '/ARK/FR'],
    },
    {
      name: 'Microsoft 365',
      description: 'Suite bureautique collaborative et messagerie',
      comment: 'MFA activé pour tous les utilisateurs',
      criticality: 'mission-critical',
      lifecycleStatus: 'production',
      domainName: 'Information Technology',
      providers: [{ providerName: 'Microsoft Corporation', role: 'primary' }],
      capabilities: ['Portfolio Management'],
      itComponents: ['Nginx Reverse Proxy'],
      tags: ['/EU/FR/PAR', '/CORP/ENTERPRISE', '/ARK/FR'],
    },
    {
      name: 'ServiceNow ITSM',
      description: 'Gestion des tickets IT et des services',
      comment: 'Workflows incident/problème/changement actifs',
      criticality: 'medium',
      lifecycleStatus: 'production',
      domainName: 'Information Technology',
      providers: [{ providerName: 'ServiceNow', role: 'primary' }],
      capabilities: ['Infrastructure Management'],
      itComponents: ['RabbitMQ'],
      tags: ['/EU/FR/PAR', '/CORP/SMB', '/ARK/FR'],
    },
    {
      name: 'Jira Cloud',
      description: 'Outil de gestion de projets et suivi des bugs',
      comment: 'Intégré avec Confluence et Bitbucket',
      criticality: 'medium',
      lifecycleStatus: 'production',
      domainName: 'Information Technology',
      providers: [{ providerName: 'Atlassian', role: 'primary' }],
      capabilities: ['Application Development'],
      tags: ['/EU/FR/PAR', '/NICHE/TECHSTART', '/ARK/FR'],
    },
    {
      name: 'Confluence',
      description: 'Base de connaissances et documentation technique',
      comment: 'Migration vers Cloud terminée en 2025',
      criticality: 'medium',
      lifecycleStatus: 'production',
      domainName: 'Information Technology',
      providers: [{ providerName: 'Atlassian', role: 'primary' }],
      capabilities: ['Application Development'],
      tags: ['/EU/FR/PAR', '/NICHE/TECHSTART', '/ARK/FR'],
    },
    {
      name: 'Snowflake DWH',
      description: 'Data warehouse cloud pour analytics et reporting',
      comment: 'Multi-cluster scaling activé',
      criticality: 'high',
      lifecycleStatus: 'production',
      domainName: 'Information Technology',
      providers: [{ providerName: 'Snowflake Inc.', role: 'primary' }],
      capabilities: ['Technology Management'],
      dataObjects: [
        { dataObjectName: 'Analytics Warehouse', role: 'producer' },
      ],
      itComponents: ['PostgreSQL Primary', 'MinIO Object Storage'],
      tags: ['/EU/FR/PAR', '/PREM/LUXURY', '/ARK/FR'],
    },
    {
      name: 'Tableau Server',
      description: 'Plateforme de visualisation et analytics',
      comment: 'Version 2024.3 avec extract refreshes optimisés',
      criticality: 'medium',
      lifecycleStatus: 'production',
      domainName: 'Information Technology',
      providers: [{ providerName: 'Tableau', role: 'primary' }],
      capabilities: ['Technology Management'],
      dataObjects: [
        { dataObjectName: 'Analytics Warehouse', role: 'consumer' },
      ],
      itComponents: ['MinIO Object Storage'],
      tags: ['/EU/FR/PAR', '/PREM/LUXURY', '/ARK/FR'],
    },
    {
      name: 'ServiceNow CMDB',
      description: 'Configuration Management Database',
      comment: 'Découverte automatique via Service Mapping',
      criticality: 'high',
      lifecycleStatus: 'production',
      domainName: 'Information Technology',
      providers: [{ providerName: 'ServiceNow', role: 'primary' }],
      capabilities: ['Infrastructure Management'],
      itComponents: ['RabbitMQ'],
      tags: ['/EU/FR/PAR', '/CORP/SMB', '/ARK/FR'],
    },
    {
      name: 'CyberArk PAM',
      description: 'Privileged Access Management pour sécurité des accès',
      comment: 'Rotation des credentials automatique',
      criticality: 'mission-critical',
      lifecycleStatus: 'production',
      domainName: 'Information Technology',
      providers: [{ providerName: 'CrowdStrike', role: 'security' }],
      capabilities: ['Infrastructure Management'],
      itComponents: ['RabbitMQ'],
      tags: ['/EU/FR/PAR', '/CORP/ENTERPRISE', '/ARK/FR'],
    },
    {
      name: 'Okta Identity Cloud',
      description: 'Identity and Access Management (IAM)',
      comment: 'SSO configuré pour 150+ applications',
      criticality: 'mission-critical',
      lifecycleStatus: 'production',
      domainName: 'Information Technology',
      providers: [{ providerName: 'Okta', role: 'primary' }],
      capabilities: ['Portfolio Management'],
      itComponents: ['Nginx Reverse Proxy'],
      tags: ['/EU/FR/PAR', '/CORP/ENTERPRISE', '/ARK/FR'],
    },
    {
      name: 'Nexus Repository',
      description: 'Gestionnaire de dépôts binaires et artefacts',
      comment: 'Cleanup policies configurées',
      criticality: 'low',
      lifecycleStatus: 'production',
      domainName: 'Information Technology',
      // Pas de provider — diversité
      capabilities: ['Application Development'],
      itComponents: ['MinIO Object Storage'],
      tags: ['/EU/FR/PAR', '/VALUE/BASIC', '/ARK/FR'],
    },
    {
      name: 'Jenkins CI/CD',
      description: 'Orchestration des pipelines de build et déploiement',
      comment: 'Agents sur Kubernetes avec pod templates',
      criticality: 'high',
      lifecycleStatus: 'production',
      domainName: 'Information Technology',
      providers: [{ providerName: 'GitLab Inc.', role: 'secondary' }],
      capabilities: ['Application Development'],
      itComponents: ['Kubernetes Production'],
      tags: ['/EU/FR/PAR', '/NICHE/TECHSTART', '/ARK/FR'],
    },
    {
      name: 'GitLab Enterprise',
      description: 'Forge logicielle avec CI/CD intégré',
      comment: 'Déploiement GitOps avec ArgoCD',
      criticality: 'high',
      lifecycleStatus: 'production',
      domainName: 'Information Technology',
      providers: [{ providerName: 'GitLab Inc.', role: 'primary' }],
      capabilities: ['Application Development'],
      itComponents: ['Kubernetes Production'],
      tags: ['/EU/FR/PAR', '/CORP/ENTERPRISE', '/ARK/FR'],
    },
    {
      name: 'SonarQube Enterprise',
      description: 'Analyse statique de code et qualité logicielle',
      comment: 'Quality gates intégrés aux pipelines CI',
      criticality: 'medium',
      lifecycleStatus: 'production',
      domainName: 'Information Technology',
      providers: [{ providerName: 'Datadog', role: 'secondary' }],
      capabilities: ['Application Development'],
      itComponents: ['Elasticsearch Logs'],
      tags: ['/EU/FR/PAR', '/VALUE/STANDARD', '/ARK/FR'],
    },
    {
      name: 'Nouveau Portail Client',
      description: 'Portail self-service pour clients B2B',
      comment: 'Phase de beta testing avec 50 utilisateurs pilotes',
      criticality: 'high',
      lifecycleStatus: 'development',
      domainName: 'Service Client',
      providers: [{ providerName: 'MuleSoft', role: 'integration' }],
      capabilities: ['Sales Management'],
      dataObjects: [
        { dataObjectName: 'Customer Database', role: 'consumer' },
      ],
      itComponents: ['Nginx Reverse Proxy', 'Redis Cache'],
      tags: ['/NA/US/NYC', '/PREM/LUXURY', '/ARK/US'],
    },
    {
      name: 'Application Mobile V2',
      description: 'Refonte complète de l\'app mobile iOS/Android',
      comment: 'Flutter avec architecture clean',
      criticality: 'high',
      lifecycleStatus: 'development',
      domainName: 'Marketing & Communication',
      providers: [{ providerName: 'Google Cloud Platform', role: 'hosting' }],
      capabilities: ['Lead Generation'],
      dataObjects: [
        { dataObjectName: 'Customer Database', role: 'consumer' },
      ],
      itComponents: ['Kubernetes Production', 'Redis Cache'],
      tags: ['/NA/US/NYC', '/NICHE/INNOVATE', '/ARK/US'],
    },
    {
      name: 'Legacy AS400',
      description: 'Système historique de gestion des commandes',
      comment: 'Phase de décommissionnement prévue 2027',
      criticality: 'medium',
      lifecycleStatus: 'maintenance',
      domainName: 'Supply Chain & Logistique',
      providers: [{ providerName: 'IBM', role: 'primary' }],
      capabilities: ['Budget Management'],
      dataObjects: [
        { dataObjectName: 'Legacy CRM Files', role: 'producer' },
      ],
      itComponents: ['PostgreSQL Primary'],
      tags: ['/EU/FR/PAR', '/VALUE/BASIC', '/ARK/FR'],
    },
    {
      name: 'Temenos T24',
      description: 'Core banking system pour opérations financières',
      comment: 'Version R22 avec modules payments et lending',
      criticality: 'mission-critical',
      lifecycleStatus: 'production',
      domainName: 'Finance & Comptabilité',
      providers: [{ providerName: 'Oracle Corporation', role: 'primary' }],
      capabilities: ['Financial Planning'],
      dataObjects: [
        { dataObjectName: 'ERP Master Data', role: 'producer' },
      ],
      itComponents: ['PostgreSQL Primary'],
      tags: ['/EU/FR/PAR', '/CORP/ENTERPRISE', '/ARK/FR'],
    },
    {
      name: 'Amadeus GDS',
      description: 'Global Distribution System pour réservations',
      comment: 'APIs REST modernes en parallèle des protocoles legacy',
      criticality: 'high',
      lifecycleStatus: 'production',
      domainName: 'Ventes & Distribution',
      providers: [{ providerName: 'Accenture', role: 'integration' }],
      capabilities: ['Sales Management'],
      dataObjects: [{ dataObjectName: 'Product Catalog Dataset', role: 'consumer' }],
      itComponents: ['Redis Cache'],
      tags: ['/EU/FR/PAR', '/PREM/LUXURY', '/ARK/FR'],
    },
    {
      name: 'Databricks Lakehouse',
      description: 'Plateforme unifiée analytics et ML',
      comment: 'Delta Live Tables pour pipelines streaming',
      criticality: 'high',
      lifecycleStatus: 'production',
      domainName: 'Information Technology',
      providers: [{ providerName: 'Databricks', role: 'primary' }],
      capabilities: ['Technology Management'],
      dataObjects: [
        { dataObjectName: 'Product Catalog Dataset', role: 'consumer' },
      ],
      itComponents: ['Kafka Cluster'],
      tags: ['/EU/FR/PAR', '/PREM/LUXURY', '/ARK/FR'],
    },
    {
      name: 'AWS Cost Explorer',
      description: 'Analyse et optimisation des coûts cloud',
      comment: 'Budgets et alertes configurés par BU',
      criticality: 'low',
      lifecycleStatus: 'production',
      domainName: 'Finance & Comptabilité',
      providers: [{ providerName: 'Amazon Web Services', role: 'primary' }],
      capabilities: ['Financial Planning'],
      dataObjects: [
        { dataObjectName: 'ERP Master Data', role: 'consumer' },
      ],
      tags: ['/EU/FR/PAR', '/VALUE/BASIC', '/ARK/FR'],
    },
    {
      name: 'Elastic Stack',
      description: 'Observabilité avec Elasticsearch, Kibana, Logstash',
      comment: 'Centralisation des logs applicatifs',
      criticality: 'medium',
      lifecycleStatus: 'production',
      domainName: 'Information Technology',
      providers: [{ providerName: 'Datadog', role: 'secondary' }],
      capabilities: ['Technology Management'],
      itComponents: ['Elasticsearch Logs'],
      tags: ['/EU/FR/PAR', '/VALUE/STANDARD', '/ARK/FR'],
    },
    {
      name: 'App PoC IA Générative',
      description: 'Prototype d\'assistant virtuel basé sur LLM',
      comment: 'Evaluation RAG vs fine-tuning en cours',
      criticality: 'low',
      lifecycleStatus: 'pilot',
      domainName: 'Recherche & Développement',
      providers: [{ providerName: 'Google Cloud Platform', role: 'hosting' }],
      capabilities: ['Revenue Forecasting'],
      dataObjects: [{ dataObjectName: 'Legacy CRM Files', role: 'consumer' }],
      itComponents: ['Kafka Cluster'],
      tags: ['/EU/FR/PAR', '/NICHE/TECHSTART', '/ARK/FR'],
    },
  ];

  // ─── Phase 3 : création des applications (passe 1) ───────────────────────
  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@ark.io' },
  });
  const auditUserId = adminUser?.id || users[0]?.id;
  if (!auditUserId) {
    console.error('No user found for audit context');
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;

  for (const app of applications) {
    try {
      const existing = await prisma.application.findFirst({
        where: { name: app.name },
      });

      if (existing) {
        console.log(`⚠️  Skipping "${app.name}" - already exists`);
        skipped++;
        continue;
      }

      const domain = domainByName.get(app.domainName);
      if (!domain) {
        console.warn(`⚠️  Domain "${app.domainName}" not found for "${app.name}", skipping`);
        skipped++;
        continue;
      }

      const owner = users.length > 0
        ? users[Math.floor(Math.random() * users.length)]
        : null;

      await (prisma as any).$executeRawUnsafe(
        `SET LOCAL "ark.current_user_id" = '${auditUserId}'`,
      );

      await prisma.application.create({
        data: {
          name: app.name,
          description: app.description,
          comment: app.comment,
          domainId: domain.id,
          ownerId: owner?.id || null,
          criticality: app.criticality,
          lifecycleStatus: app.lifecycleStatus,
        },
      });

      console.log(`✓ Created "${app.name}" (Domain: ${domain.name})`);
      created++;
    } catch (error: any) {
      console.error(`✗ Failed to create "${app.name}":`, error.message);
    }
  }

  console.log(`\n📊 Applications created: ${created}, skipped: ${skipped}`);

  // ─── Phase 4 : création des associations (passe 2) ───────────────────────
  console.log('\n▶ Creating associations...');

  const allApps = await prisma.application.findMany();
  const appByName = new Map(allApps.map((a) => [a.name, a]));

  let providerMaps = 0;
  let capabilityMaps = 0;
  let dataObjectMaps = 0;
  let itComponentMaps = 0;
  let entityTags = 0;

  for (const app of applications) {
    const appRecord = appByName.get(app.name);
    if (!appRecord) continue;

    const appId = appRecord.id;

    // --- app_provider_map ---
    if (app.providers) {
      for (const { providerName, role } of app.providers) {
        const provider = providerByName.get(providerName);
        if (!provider) {
          console.warn(`  ⚠ Provider "${providerName}" not found for "${app.name}"`);
          continue;
        }
        const existing = await prisma.applicationProviderMap.findUnique({
          where: { applicationId_providerId: { applicationId: appId, providerId: provider.id } },
        });
        if (!existing) {
          await prisma.applicationProviderMap.create({
            data: { applicationId: appId, providerId: provider.id, role },
          });
          providerMaps++;
          console.log(`  ✓ Provider map: ${app.name} ↔ ${providerName} (${role})`);
        }
      }
    }

    // --- app_capability_map ---
    if (app.capabilities) {
      for (const capName of app.capabilities) {
        const cap = capabilityByName.get(capName);
        if (!cap) {
          console.warn(`  ⚠ Capability "${capName}" not found for "${app.name}"`);
          continue;
        }
        const existing = await prisma.appCapabilityMap.findUnique({
          where: { applicationId_capabilityId: { applicationId: appId, capabilityId: cap.id } },
        });
        if (!existing) {
          await prisma.appCapabilityMap.create({
            data: { applicationId: appId, capabilityId: cap.id },
          });
          capabilityMaps++;
          console.log(`  ✓ Capability map: ${app.name} ↔ ${capName}`);
        }
      }
    }

    // --- app_data_object_map ---
    if (app.dataObjects) {
      for (const { dataObjectName, role } of app.dataObjects) {
        const dataObj = dataObjectByName.get(dataObjectName);
        if (!dataObj) {
          console.warn(`  ⚠ DataObject "${dataObjectName}" not found for "${app.name}"`);
          continue;
        }
        const existing = await prisma.appDataObjectMap.findUnique({
          where: { applicationId_dataObjectId: { applicationId: appId, dataObjectId: dataObj.id } },
        });
        if (!existing) {
          await prisma.appDataObjectMap.create({
            data: { applicationId: appId, dataObjectId: dataObj.id, role },
          });
          dataObjectMaps++;
          console.log(`  ✓ DataObject map: ${app.name} ↔ ${dataObjectName} (${role})`);
        }
      }
    }

    // --- app_it_component_map ---
    if (app.itComponents) {
      for (const itName of app.itComponents) {
        const itComp = itComponentByName.get(itName);
        if (!itComp) {
          console.warn(`  ⚠ ITComponent "${itName}" not found for "${app.name}"`);
          continue;
        }
        const existing = await prisma.appItComponentMap.findUnique({
          where: { applicationId_itComponentId: { applicationId: appId, itComponentId: itComp.id } },
        });
        if (!existing) {
          await prisma.appItComponentMap.create({
            data: { applicationId: appId, itComponentId: itComp.id },
          });
          itComponentMaps++;
          console.log(`  ✓ ITComponent map: ${app.name} ↔ ${itName}`);
        }
      }
    }

    // --- entity_tags ---
    if (app.tags) {
      for (const tagPath of app.tags) {
        const tagValue = tagValueByPath.get(tagPath);
        if (!tagValue) {
          console.warn(`  ⚠ TagValue "${tagPath}" not found for "${app.name}"`);
          continue;
        }
        const existing = await prisma.entityTag.findFirst({
          where: {
            entityType: 'application',
            entityId: appId,
            tagValueId: tagValue.id,
          },
        });
        if (!existing) {
          await prisma.entityTag.create({
            data: {
              entityType: 'application',
              entityId: appId,
              tagValueId: tagValue.id,
            },
          });
          entityTags++;
          console.log(`  ✓ Tag: ${app.name} → ${tagPath} (${tagValue.dimension.name})`);
        }
      }
    }
  }

  console.log(
    `\n📊 Associations summary: ${providerMaps} providers, ${capabilityMaps} capabilities, ${dataObjectMaps} dataObjects, ${itComponentMaps} itComponents, ${entityTags} tags`,
  );
  console.log('Seed applications completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
