import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Sample domain data - 10 test domains
  const domains = [
    {
      name: 'Finance & Comptabilité',
      description: 'Gestion financière, comptabilité, trésorerie et reporting réglementaire',
      comment: 'Inclut la consolidation des états financiers et la gestion des clôtures mensuelles',
    },
    {
      name: 'Ressources Humaines',
      description: 'Gestion des collaborateurs, recrutement, paie et développement des compétences',
      comment: 'Couvre le cycle complet de vie des employés de l\'onboarding au offboarding',
    },
    {
      name: 'Information Technology',
      description: 'Infrastructure IT, support technique, cybersécurité et développement logiciel',
      comment: 'Responsable de la DSI et des projets de transformation digitale',
    },
    {
      name: 'Marketing & Communication',
      description: 'Stratégie marketing, communication externe, brand management et digital marketing',
      comment: 'Inclut la gestion des campagnes multicanales et l\'analyse de performance',
    },
    {
      name: 'Ventes & Distribution',
      description: 'Force de vente, gestion des clients, contrats et réseau de distribution',
      comment: 'Couvre les ventes B2B et B2C ainsi que la gestion des partenaires commerciaux',
    },
    {
      name: 'Supply Chain & Logistique',
      description: 'Achats, gestion des stocks, approvisionnement et distribution physique',
      comment: 'Optimisation des flux et gestion des fournisseurs stratégiques',
    },
    {
      name: 'Production & Operations',
      description: 'Gestion de la production, maintenance industrielle et qualité',
      comment: 'Inclut la planification de la production et la gestion des équipements',
    },
    {
      name: 'Recherche & Développement',
      description: 'Innovation, développement de nouveaux produits et gestion des brevets',
      comment: 'Laboratoires R&D et gestion du portefeuille de projets d\'innovation',
    },
    {
      name: 'Juridique & Conformité',
      description: 'Conseil juridique, gestion des contrats et conformité réglementaire',
      comment: 'Veille réglementaire et gestion des litiges',
    },
    {
      name: 'Service Client',
      description: 'Support client, service après-vente et gestion de la satisfaction',
      comment: 'Centre de relation client multicanal (téléphone, email, chat)',
    },
  ];

  console.log('Starting domain seeding...');

  for (const domain of domains) {
    try {
      // Check if domain already exists
      const existing = await prisma.domain.findFirst({
        where: { name: domain.name },
      });

      if (existing) {
        console.log(`⚠ Domain "${domain.name}" already exists, skipping`);
        continue;
      }

      // Create domain
      await prisma.domain.create({
        data: {
          name: domain.name,
          description: domain.description,
          comment: domain.comment,
        },
      });

      console.log(`✓ Created domain "${domain.name}"`);
    } catch (error) {
      console.error(`✗ Failed to create "${domain.name}":`, error);
    }
  }

  console.log('Seed domains completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
