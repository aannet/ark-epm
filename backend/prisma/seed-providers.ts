import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Sample provider data - 20 test providers with various contract types
  const providers = [
    {
      name: 'Salesforce',
      contractType: 'SaaS',
      expiryDate: '2026-12-31',
      description: 'CRM cloud leader - Sales Cloud, Service Cloud, Marketing Cloud',
    },
    {
      name: 'SAP SE',
      contractType: 'Licence',
      expiryDate: '2027-06-30',
      description: 'ERP S/4HANA - Finance, logistique, production',
    },
    {
      name: 'Microsoft Corporation',
      contractType: 'SaaS',
      expiryDate: '2026-09-30',
      description: 'Microsoft 365, Azure, Power Platform, Dynamics 365',
    },
    {
      name: 'Atlassian',
      contractType: 'SaaS',
      expiryDate: '2026-12-31',
      description: 'Jira Software, Confluence, Bitbucket - Suite développement agile',
    },
    {
      name: 'ServiceNow',
      contractType: 'SaaS',
      expiryDate: '2027-03-31',
      description: 'ITSM, CMDB, GRC - Gestion des services IT',
    },
    {
      name: 'GitLab Inc.',
      contractType: 'SaaS',
      expiryDate: '2026-06-30',
      description: 'DevOps platform - CI/CD, repo Git, security scanning',
    },
    {
      name: 'Amazon Web Services',
      contractType: 'IaaS',
      expiryDate: null,
      description: 'Infrastructure cloud - EC2, S3, RDS, Lambda, plus de 200 services',
    },
    {
      name: 'Snowflake Inc.',
      contractType: 'SaaS',
      expiryDate: '2027-12-31',
      description: 'Data cloud platform - Data warehouse, data lake, analytics',
    },
    {
      name: 'Google Cloud Platform',
      contractType: 'IaaS',
      expiryDate: '2026-08-31',
      description: 'Infrastructure et analytics - BigQuery, Vertex AI, Cloud Run',
    },
    {
      name: 'Oracle Corporation',
      contractType: 'Licence',
      expiryDate: '2027-01-31',
      description: 'Base de données Oracle, Oracle Cloud Applications',
    },
    {
      name: 'IBM',
      contractType: 'Licence',
      expiryDate: '2026-11-30',
      description: 'IBM Cloud, Watson AI, mainframe services',
    },
    {
      name: 'Workday',
      contractType: 'SaaS',
      expiryDate: '2027-04-30',
      description: 'Suite RH et finance - HCM, Financial Management',
    },
    {
      name: 'Adobe',
      contractType: 'SaaS',
      expiryDate: '2026-10-31',
      description: 'Creative Cloud, Experience Cloud, Document Cloud',
    },
    {
      name: 'Databricks',
      contractType: 'SaaS',
      expiryDate: '2027-07-31',
      description: 'Lakehouse platform - Apache Spark, ML, data engineering',
    },
    {
      name: 'Datadog',
      contractType: 'SaaS',
      expiryDate: '2026-05-31',
      description: 'Observability - Monitoring, logs, APM, security',
    },
    {
      name: 'Okta',
      contractType: 'SaaS',
      expiryDate: '2027-02-28',
      description: 'Identity and access management - SSO, MFA, lifecycle',
    },
    {
      name: 'CrowdStrike',
      contractType: 'SaaS',
      expiryDate: '2026-12-31',
      description: 'Cybersecurity - Endpoint protection, threat intelligence',
    },
    {
      name: 'MuleSoft',
      contractType: 'SaaS',
      expiryDate: '2027-09-30',
      description: 'Integration platform - API management, connectivity',
    },
    {
      name: 'Tableau',
      contractType: 'SaaS',
      expiryDate: '2026-07-31',
      description: 'Business intelligence - Data visualization, analytics',
    },
    {
      name: 'Accenture',
      contractType: 'Consulting',
      expiryDate: '2026-12-31',
      description: 'Services de conseil et intégration - Transformation digitale',
    },
  ];

  console.log('Starting provider seeding...');

  for (const provider of providers) {
    try {
      // Check if provider already exists
      const existing = await prisma.provider.findFirst({
        where: { name: provider.name },
      });

      if (existing) {
        console.log(`⚠ Provider "${provider.name}" already exists, skipping`);
        continue;
      }

      // Create provider
      await prisma.provider.create({
        data: {
          name: provider.name,
          description: provider.description,
          contractType: provider.contractType,
          expiryDate: provider.expiryDate ? new Date(provider.expiryDate) : null,
        },
      });

      console.log(`✓ Created provider "${provider.name}" (${provider.contractType})`);
    } catch (error) {
      console.error(`✗ Failed to create "${provider.name}":`, error);
    }
  }

  console.log('Seed providers completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
