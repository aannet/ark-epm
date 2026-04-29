import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get existing entities to link with applications
  const allDomains = await prisma.domain.findMany();
  const domainByName = new Map(allDomains.map(d => [d.name, d]));
  const providers = await prisma.provider.findMany({ take: 10 });
  const users = await prisma.user.findMany({ where: { isActive: true }, take: 5 });

  if (allDomains.length === 0) {
    console.error('No domains found. Please run seed-domains.ts first.');
    process.exit(1);
  }

  console.log(`Found ${allDomains.length} domains, ${providers.length} providers, ${users.length} users`);

  // Sample application data - 25 applications with explicit domain assignment
  const applications: Array<{
    name: string;
    description: string;
    comment: string;
    criticality: string;
    lifecycleStatus: string;
    domainName: string;
  }> = [
    {
      name: 'ERP SAP S/4HANA',
      description: 'Système de gestion intégré pour la finance et la logistique',
      comment: 'Migration complète prévue Q3 2026',
      criticality: 'mission-critical',
      lifecycleStatus: 'production',
      domainName: 'Finance & Comptabilité',
    },
    {
      name: 'CRM Salesforce',
      description: 'Gestion de la relation client et suivi des opportunités commerciales',
      comment: 'Intégration avec le call center en cours',
      criticality: 'high',
      lifecycleStatus: 'production',
      domainName: 'Ventes & Distribution',
    },
    {
      name: 'Portail RH Workday',
      description: 'Portail des ressources humaines pour les collaborateurs',
      comment: 'Module paie déployé en janvier 2026',
      criticality: 'high',
      lifecycleStatus: 'production',
      domainName: 'Ressources Humaines',
    },
    {
      name: 'Microsoft 365',
      description: 'Suite bureautique collaborative et messagerie',
      comment: 'MFA activé pour tous les utilisateurs',
      criticality: 'mission-critical',
      lifecycleStatus: 'production',
      domainName: 'Information Technology',
    },
    {
      name: 'ServiceNow ITSM',
      description: 'Gestion des tickets IT et des services',
      comment: 'Workflows incident/problème/changement actifs',
      criticality: 'medium',
      lifecycleStatus: 'production',
      domainName: 'Information Technology',
    },
    {
      name: 'Jira Cloud',
      description: 'Outil de gestion de projets et suivi des bugs',
      comment: 'Intégré avec Confluence et Bitbucket',
      criticality: 'medium',
      lifecycleStatus: 'production',
      domainName: 'Information Technology',
    },
    {
      name: 'Confluence',
      description: 'Base de connaissances et documentation technique',
      comment: 'Migration vers Cloud terminée en 2025',
      criticality: 'medium',
      lifecycleStatus: 'production',
      domainName: 'Information Technology',
    },
    {
      name: 'Snowflake DWH',
      description: 'Data warehouse cloud pour analytics et reporting',
      comment: 'Multi-cluster scaling activé',
      criticality: 'high',
      lifecycleStatus: 'production',
      domainName: 'Information Technology',
    },
    {
      name: 'Tableau Server',
      description: 'Plateforme de visualisation et analytics',
      comment: 'Version 2024.3 avec extract refreshes optimisés',
      criticality: 'medium',
      lifecycleStatus: 'production',
      domainName: 'Information Technology',
    },
    {
      name: 'ServiceNow CMDB',
      description: 'Configuration Management Database',
      comment: 'Découverte automatique via Service Mapping',
      criticality: 'high',
      lifecycleStatus: 'production',
      domainName: 'Information Technology',
    },
    {
      name: 'CyberArk PAM',
      description: 'Privileged Access Management pour sécurité des accès',
      comment: 'Rotation des credentials automatique',
      criticality: 'mission-critical',
      lifecycleStatus: 'production',
      domainName: 'Information Technology',
    },
    {
      name: 'Okta Identity Cloud',
      description: 'Identity and Access Management (IAM)',
      comment: 'SSO configuré pour 150+ applications',
      criticality: 'mission-critical',
      lifecycleStatus: 'production',
      domainName: 'Information Technology',
    },
    {
      name: 'Nexus Repository',
      description: 'Gestionnaire de dépôts binaires et artefacts',
      comment: 'Cleanup policies configurées',
      criticality: 'low',
      lifecycleStatus: 'production',
      domainName: 'Information Technology',
    },
    {
      name: 'Jenkins CI/CD',
      description: 'Orchestration des pipelines de build et déploiement',
      comment: 'Agents sur Kubernetes avec pod templates',
      criticality: 'high',
      lifecycleStatus: 'production',
      domainName: 'Information Technology',
    },
    {
      name: 'GitLab Enterprise',
      description: 'Forge logicielle avec CI/CD intégré',
      comment: 'Déploiement GitOps avec ArgoCD',
      criticality: 'high',
      lifecycleStatus: 'production',
      domainName: 'Information Technology',
    },
    {
      name: 'SonarQube Enterprise',
      description: 'Analyse statique de code et qualité logicielle',
      comment: 'Quality gates intégrés aux pipelines CI',
      criticality: 'medium',
      lifecycleStatus: 'production',
      domainName: 'Information Technology',
    },
    {
      name: 'Nouveau Portail Client',
      description: 'Portail self-service pour clients B2B',
      comment: 'Phase de beta testing avec 50 utilisateurs pilotes',
      criticality: 'high',
      lifecycleStatus: 'development',
      domainName: 'Service Client',
    },
    {
      name: 'Application Mobile V2',
      description: 'Refonte complète de l\'app mobile iOS/Android',
      comment: 'Flutter avec architecture clean',
      criticality: 'high',
      lifecycleStatus: 'development',
      domainName: 'Marketing & Communication',
    },
    {
      name: 'Legacy AS400',
      description: 'Système historique de gestion des commandes',
      comment: 'Phase de décommissionnement prévue 2027',
      criticality: 'medium',
      lifecycleStatus: 'maintenance',
      domainName: 'Supply Chain & Logistique',
    },
    {
      name: 'Temenos T24',
      description: 'Core banking system pour opérations financières',
      comment: 'Version R22 avec modules payments et lending',
      criticality: 'mission-critical',
      lifecycleStatus: 'production',
      domainName: 'Finance & Comptabilité',
    },
    {
      name: 'Amadeus GDS',
      description: 'Global Distribution System pour réservations',
      comment: 'APIs REST modernes en parallèle des protocoles legacy',
      criticality: 'high',
      lifecycleStatus: 'production',
      domainName: 'Ventes & Distribution',
    },
    {
      name: 'Databricks Lakehouse',
      description: 'Plateforme unifiée analytics et ML',
      comment: 'Delta Live Tables pour pipelines streaming',
      criticality: 'high',
      lifecycleStatus: 'production',
      domainName: 'Information Technology',
    },
    {
      name: 'AWS Cost Explorer',
      description: 'Analyse et optimisation des coûts cloud',
      comment: 'Budgets et alertes configurés par BU',
      criticality: 'low',
      lifecycleStatus: 'production',
      domainName: 'Finance & Comptabilité',
    },
    {
      name: 'Elastic Stack',
      description: 'Observabilité avec Elasticsearch, Kibana, Logstash',
      comment: 'Centralisation des logs applicatifs',
      criticality: 'medium',
      lifecycleStatus: 'production',
      domainName: 'Information Technology',
    },
    {
      name: 'App PoC IA Générative',
      description: 'Prototype d\'assistant virtuel basé sur LLM',
      comment: 'Evaluation RAG vs fine-tuning en cours',
      criticality: 'low',
      lifecycleStatus: 'pilot',
      domainName: 'Recherche & Développement',
    },
  ];

  // Get admin user for audit context
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
      // Check if application already exists
      const existing = await prisma.application.findFirst({
        where: { name: app.name },
      });

      if (existing) {
        console.log(`⚠️  Skipping "${app.name}" - already exists`);
        skipped++;
        continue;
      }

      // Assign domain by name, random provider and owner
      const domain = domainByName.get(app.domainName);
      if (!domain) {
        console.warn(`⚠️  Domain "${app.domainName}" not found for "${app.name}", skipping`);
        skipped++;
        continue;
      }
      const _provider = providers.length > 0
        ? providers[Math.floor(Math.random() * providers.length)]
        : null;
      const owner = users.length > 0
        ? users[Math.floor(Math.random() * users.length)]
        : null;

      // Set audit context before creating using correct Prisma syntax
      // Using unsafe version to bypass type checking issues
      await (prisma as any).$executeRawUnsafe(`SET LOCAL "ark.current_user_id" = '${auditUserId}'`);

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

  console.log(`\n📊 Summary: ${created} created, ${skipped} skipped`);
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
