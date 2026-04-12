import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDataObjects() {
  const dataObjects = [
    {
      name: 'Customer Database',
      description: 'BD principale contenant les clients — source of truth',
      comment: 'Production database with master customer records',
      type: 'database',
      isSourceOfTruth: true,
    },
    {
      name: 'Product Catalog Dataset',
      description: 'Données produits — enrichi de plusieurs sources',
      comment: 'Aggregated product information from multiple sources',
      type: 'dataset',
      isSourceOfTruth: false,
    },
    {
      name: 'Legacy CRM Files',
      description: 'Fichiers plats du CRM legacy — en voie de migration',
      comment: 'Old flat files being phased out',
      type: 'file',
      isSourceOfTruth: false,
    },
    {
      name: 'ERP Master Data',
      description: 'Données de référence SAP — source officielle',
      comment: 'Authoritative master data from SAP system',
      type: 'database',
      isSourceOfTruth: true,
    },
    {
      name: 'Analytics Warehouse',
      description: 'DWH Snowflake — données agrégées',
      comment: 'Data warehouse for reporting and analytics',
      type: 'database',
      isSourceOfTruth: false,
    },
  ];

  console.log('Seeding DataObjects...');

  for (const dataObject of dataObjects) {
    const existing = await prisma.dataObject.findFirst({
      where: { name: dataObject.name },
    });

    if (existing) {
      console.log(`⚠  DataObject "${dataObject.name}" already exists, skipping`);
      continue;
    }

    const created = await prisma.dataObject.create({
      data: dataObject,
    });

    console.log(`✓ Created DataObject: ${created.name}`);
  }
}

async function main() {
  try {
    await seedDataObjects();
    console.log('✓ DataObjects seed completed');
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
