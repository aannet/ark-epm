import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const allApps = await prisma.application.findMany();
  if (allApps.length === 0) {
    console.error('No applications found. Please run seed-applications.ts first.');
    process.exit(1);
  }

  const appByName = new Map(allApps.map((a) => [a.name, a]));
  console.log(`Found ${allApps.length} applications`);

  const adminUser = await prisma.user.findFirst({ where: { email: 'admin@ark.io' } });
  if (!adminUser) {
    console.error('No admin user found. Please run seed.ts first.');
    process.exit(1);
  }

  const interfaces: Array<{
    name: string;
    description: string;
    comment: string;
    sourceName: string;
    targetName: string;
    middlewareName?: string;
    type: string;
    frequency: string;
    criticality: string;
    technicalContact?: string;
    errorRate?: number;
  }> = [
    {
      name: 'CRM → ERP Commandes',
      description: 'Synchronisation des opportunités et commandes depuis Salesforce vers SAP',
      comment: 'Flux quotidien déclenché à 02h00 UTC',
      sourceName: 'CRM Salesforce',
      targetName: 'ERP SAP S/4HANA',
      type: 'REST',
      frequency: 'DAILY',
      criticality: 'HIGH',
      technicalContact: 'integration@ark.io',
      errorRate: 0.5,
    },
    {
      name: 'ERP → DWH Reporting',
      description: 'Export quotidien des données financières et logistiques vers le Data Warehouse',
      comment: 'Extraction via Fivetran, chargement Delta Lake',
      sourceName: 'ERP SAP S/4HANA',
      targetName: 'Snowflake DWH',
      type: 'DATABASE',
      frequency: 'DAILY',
      criticality: 'HIGH',
      technicalContact: 'data-team@ark.io',
      errorRate: 0.2,
    },
    {
      name: 'Workday → Okta Provisioning',
      description: 'Provisioning et dé-provisioning automatique des comptes utilisateurs',
      comment: 'SCIM 2.0 — déclenché à chaque mouvement RH',
      sourceName: 'Portail RH Workday',
      targetName: 'Okta Identity Cloud',
      type: 'REST',
      frequency: 'REALTIME',
      criticality: 'CRITICAL',
      technicalContact: 'iam@ark.io',
      errorRate: 0.1,
    },
    {
      name: 'Okta → M365 SSO',
      description: 'Federation SAML/OIDC pour le SSO Microsoft 365',
      comment: 'SAML 2.0 avec MFA obligatoire',
      sourceName: 'Okta Identity Cloud',
      targetName: 'Microsoft 365',
      type: 'REST',
      frequency: 'REALTIME',
      criticality: 'CRITICAL',
      technicalContact: 'iam@ark.io',
      errorRate: 0.05,
    },
    {
      name: 'GitLab → Jenkins Webhooks',
      description: 'Déclenchement des pipelines CI à chaque push ou merge request',
      comment: "Webhook HTTPS avec token d'authentification",
      sourceName: 'GitLab Enterprise',
      targetName: 'Jenkins CI/CD',
      type: 'REST',
      frequency: 'REALTIME',
      criticality: 'HIGH',
      technicalContact: 'devops@ark.io',
      errorRate: 1.2,
    },
    {
      name: 'Jenkins → Nexus Artefacts',
      description: 'Publication des artefacts de build dans le repository Nexus',
      comment: 'Maven, npm et Docker images',
      sourceName: 'Jenkins CI/CD',
      targetName: 'Nexus Repository',
      type: 'REST',
      frequency: 'REALTIME',
      criticality: 'MEDIUM',
      technicalContact: 'devops@ark.io',
      errorRate: 0.8,
    },
    {
      name: 'SonarQube → GitLab Quality Gates',
      description: "Retour des résultats d'analyse statique sur les merge requests",
      comment: 'Bloquant si quality gate failed',
      sourceName: 'SonarQube Enterprise',
      targetName: 'GitLab Enterprise',
      type: 'REST',
      frequency: 'REALTIME',
      criticality: 'MEDIUM',
      technicalContact: 'devops@ark.io',
      errorRate: 0.3,
    },
    {
      name: 'DWH → Tableau Analytics',
      description: 'Alimentation des extracts Tableau depuis Snowflake',
      comment: 'Refresh toutes les heures, full extract hebdomadaire',
      sourceName: 'Snowflake DWH',
      targetName: 'Tableau Server',
      type: 'DATABASE',
      frequency: 'HOURLY',
      criticality: 'HIGH',
      technicalContact: 'bi@ark.io',
      errorRate: 0.4,
    },
    {
      name: 'ERP → AS400 Commandes Legacy',
      description: "Export des nouvelles commandes vers le système AS400 pour traitement legacy",
      comment: 'Fichier EDIFACT déposé sur SFTP à 23h00',
      sourceName: 'ERP SAP S/4HANA',
      targetName: 'Legacy AS400',
      type: 'BATCH_FILE',
      frequency: 'DAILY',
      criticality: 'MEDIUM',
      technicalContact: 'legacy-team@ark.io',
      errorRate: 2.1,
    },
    {
      name: 'AS400 → ERP Stock',
      description: "Remontée des niveaux de stock et mouvements depuis l'AS400",
      comment: "Fichier CSV sur SFTP — décommissionnement prévu 2027",
      sourceName: 'Legacy AS400',
      targetName: 'ERP SAP S/4HANA',
      type: 'BATCH_FILE',
      frequency: 'DAILY',
      criticality: 'MEDIUM',
      technicalContact: 'legacy-team@ark.io',
      errorRate: 2.8,
    },
    {
      name: 'T24 → ERP Transactions Financières',
      description: 'Flux temps réel des transactions bancaires vers SAP FI',
      comment: 'JMS via ActiveMQ — SLA 30 secondes',
      sourceName: 'Temenos T24',
      targetName: 'ERP SAP S/4HANA',
      type: 'MESSAGE_QUEUE',
      frequency: 'REALTIME',
      criticality: 'CRITICAL',
      technicalContact: 'finance-integration@ark.io',
      errorRate: 0.05,
    },
    {
      name: 'CRM → Portail Client Données',
      description: "Alimentation du portail B2B avec les données client et historique d'achats",
      comment: 'API REST avec cache Redis côté portail',
      sourceName: 'CRM Salesforce',
      targetName: 'Nouveau Portail Client',
      type: 'REST',
      frequency: 'REALTIME',
      criticality: 'HIGH',
      technicalContact: 'integration@ark.io',
      errorRate: 0.7,
    },
    {
      name: 'ITSM → CMDB Discovery',
      description: 'Synchronisation des CIs découverts automatiquement vers la CMDB',
      comment: 'Service Mapping actif sur 3 domaines réseau',
      sourceName: 'ServiceNow ITSM',
      targetName: 'ServiceNow CMDB',
      type: 'DATABASE',
      frequency: 'REALTIME',
      criticality: 'HIGH',
      technicalContact: 'cmdb@ark.io',
      errorRate: 0.3,
    },
    {
      name: 'App Mobile → CRM Leads',
      description: "Envoi des leads et interactions utilisateurs depuis l'app mobile vers le CRM",
      comment: 'Batch toutes les 15 minutes avec retry',
      sourceName: 'Application Mobile V2',
      targetName: 'CRM Salesforce',
      type: 'REST',
      frequency: 'NEAR_REALTIME',
      criticality: 'HIGH',
      technicalContact: 'mobile-team@ark.io',
      errorRate: 1.5,
    },
    {
      name: 'Amadeus → ERP Réservations',
      description: 'Import des réservations et billets confirmés dans SAP SD',
      comment: 'API Amadeus REST v3 — polling horaire',
      sourceName: 'Amadeus GDS',
      targetName: 'ERP SAP S/4HANA',
      type: 'REST',
      frequency: 'HOURLY',
      criticality: 'HIGH',
      technicalContact: 'travel-integration@ark.io',
      errorRate: 0.9,
    },
    {
      name: 'Elastic → ITSM Alertes',
      description: "Création automatique de tickets d'incident depuis les alertes Kibana",
      comment: 'Seuils configurés par application, webhook vers ITSM',
      sourceName: 'Elastic Stack',
      targetName: 'ServiceNow ITSM',
      type: 'REST',
      frequency: 'REALTIME',
      criticality: 'HIGH',
      technicalContact: 'monitoring@ark.io',
      errorRate: 0.6,
    },
    {
      name: 'DWH → Databricks Features',
      description: 'Alimentation des pipelines ML depuis les tables curated Snowflake',
      comment: 'Delta Sharing pour transfert zero-copy',
      sourceName: 'Snowflake DWH',
      targetName: 'Databricks Lakehouse',
      type: 'DATABASE',
      frequency: 'DAILY',
      criticality: 'HIGH',
      technicalContact: 'data-science@ark.io',
      errorRate: 0.2,
    },
    {
      name: 'Databricks → DWH Résultats ML',
      description: 'Export des scores et prédictions ML vers Snowflake pour exploitation BI',
      comment: 'Tables Databricks → Snowflake via connector natif',
      sourceName: 'Databricks Lakehouse',
      targetName: 'Snowflake DWH',
      type: 'DATABASE',
      frequency: 'DAILY',
      criticality: 'MEDIUM',
      technicalContact: 'data-science@ark.io',
      errorRate: 0.3,
    },
    {
      name: 'PoC IA → DWH Données RAG',
      description: 'Requêtes ad-hoc vers Snowflake pour alimenter le contexte RAG du LLM',
      comment: 'PoC uniquement — volumes limités',
      sourceName: 'App PoC IA Générative',
      targetName: 'Snowflake DWH',
      type: 'REST',
      frequency: 'ON_DEMAND',
      criticality: 'LOW',
      technicalContact: 'rd@ark.io',
      errorRate: 3.5,
    },
    {
      name: 'GitLab → ITSM via Elastic (Events)',
      description: "Événements CI/CD envoyés à Elastic puis routés comme alertes ITSM",
      comment: "Pipeline event streaming — Elastic comme middleware d'observabilité",
      sourceName: 'GitLab Enterprise',
      targetName: 'ServiceNow ITSM',
      middlewareName: 'Elastic Stack',
      type: 'EVENT_STREAM',
      frequency: 'REALTIME',
      criticality: 'MEDIUM',
      technicalContact: 'devops@ark.io',
      errorRate: 0.8,
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const iface of interfaces) {
    try {
      const existing = await prisma.interface.findFirst({
        where: { name: iface.name },
      });

      if (existing) {
        console.log(`⚠️  Skipping "${iface.name}" - already exists`);
        skipped++;
        continue;
      }

      const sourceApp = appByName.get(iface.sourceName);
      const targetApp = appByName.get(iface.targetName);
      const middlewareApp = iface.middlewareName ? appByName.get(iface.middlewareName) : null;

      if (!sourceApp) {
        console.warn(`⚠️  Source app "${iface.sourceName}" not found, skipping "${iface.name}"`);
        skipped++;
        continue;
      }
      if (!targetApp) {
        console.warn(`⚠️  Target app "${iface.targetName}" not found, skipping "${iface.name}"`);
        skipped++;
        continue;
      }
      if (iface.middlewareName && !middlewareApp) {
        console.warn(`⚠️  Middleware app "${iface.middlewareName}" not found, skipping "${iface.name}"`);
        skipped++;
        continue;
      }

      await (prisma as any).$executeRawUnsafe(
        `SET LOCAL "ark.current_user_id" = '${adminUser.id}'`,
      );

      await prisma.interface.create({
        data: {
          name: iface.name,
          description: iface.description,
          comment: iface.comment,
          sourceAppId: sourceApp.id,
          targetAppId: targetApp.id,
          middlewareAppId: middlewareApp?.id ?? null,
          type: iface.type as any,
          frequency: iface.frequency as any,
          criticality: iface.criticality as any,
          technicalContact: iface.technicalContact ?? null,
          errorRate: iface.errorRate ?? null,
        },
      });

      const middlewareLabel = middlewareApp ? ` [via ${iface.middlewareName}]` : '';
      console.log(`✓ Created "${iface.name}" (${iface.sourceName}${middlewareLabel} → ${iface.targetName})`);
      created++;
    } catch (error: any) {
      console.error(`✗ Failed to create "${iface.name}":`, error.message);
    }
  }

  console.log(`\n📊 Summary: ${created} created, ${skipped} skipped`);
  console.log('Seed interfaces completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
