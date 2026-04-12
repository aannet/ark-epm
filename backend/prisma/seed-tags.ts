import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get existing dimensions
  const dimensions = await prisma.tagDimension.findMany();
  
  if (dimensions.length === 0) {
    console.error('No tag dimensions found. Please run seed.ts first.');
    process.exit(1);
  }

  const dimensionMap = new Map(dimensions.map(d => [d.name, d.id]));

  console.log(`Found ${dimensions.length} dimensions: ${dimensions.map(d => d.name).join(', ')}`);

  // 1. GEOGRAPHY - Hierarchical structure (3 levels)
  const geoId = dimensionMap.get('Geography');
  if (geoId) {
    const geoValues = [
      // Level 0: Continents
      { path: '/EU', label: 'Europe', parentPath: null },
      { path: '/NA', label: 'North America', parentPath: null },
      { path: '/APAC', label: 'Asia Pacific', parentPath: null },
      { path: '/LATAM', label: 'Latin America', parentPath: null },
      
      // Level 1: Countries
      { path: '/EU/FR', label: 'France', parentPath: '/EU' },
      { path: '/EU/DE', label: 'Germany', parentPath: '/EU' },
      { path: '/EU/UK', label: 'United Kingdom', parentPath: '/EU' },
      { path: '/EU/ES', label: 'Spain', parentPath: '/EU' },
      { path: '/EU/IT', label: 'Italy', parentPath: '/EU' },
      { path: '/EU/NL', label: 'Netherlands', parentPath: '/EU' },
      { path: '/NA/US', label: 'United States', parentPath: '/NA' },
      { path: '/NA/CA', label: 'Canada', parentPath: '/NA' },
      { path: '/NA/MX', label: 'Mexico', parentPath: '/NA' },
      { path: '/APAC/SG', label: 'Singapore', parentPath: '/APAC' },
      { path: '/APAC/JP', label: 'Japan', parentPath: '/APAC' },
      { path: '/APAC/AU', label: 'Australia', parentPath: '/APAC' },
      { path: '/APAC/IN', label: 'India', parentPath: '/APAC' },
      { path: '/LATAM/BR', label: 'Brazil', parentPath: '/LATAM' },
      { path: '/LATAM/AR', label: 'Argentina', parentPath: '/LATAM' },
      
      // Level 2: Cities/Regions
      { path: '/EU/FR/PAR', label: 'Paris', parentPath: '/EU/FR' },
      { path: '/EU/FR/LYS', label: 'Lyon', parentPath: '/EU/FR' },
      { path: '/EU/FR/MRS', label: 'Marseille', parentPath: '/EU/FR' },
      { path: '/EU/DE/BER', label: 'Berlin', parentPath: '/EU/DE' },
      { path: '/EU/DE/MUC', label: 'Munich', parentPath: '/EU/DE' },
      { path: '/EU/DE/HAM', label: 'Hamburg', parentPath: '/EU/DE' },
      { path: '/EU/UK/LON', label: 'London', parentPath: '/EU/UK' },
      { path: '/EU/UK/MAN', label: 'Manchester', parentPath: '/EU/UK' },
      { path: '/NA/US/NYC', label: 'New York', parentPath: '/NA/US' },
      { path: '/NA/US/SFO', label: 'San Francisco', parentPath: '/NA/US' },
      { path: '/NA/US/CHI', label: 'Chicago', parentPath: '/NA/US' },
      { path: '/NA/US/MIA', label: 'Miami', parentPath: '/NA/US' },
      { path: '/NA/CA/TOR', label: 'Toronto', parentPath: '/NA/CA' },
      { path: '/NA/CA/VAN', label: 'Vancouver', parentPath: '/NA/CA' },
      { path: '/APAC/SG/SGC', label: 'Singapore City', parentPath: '/APAC/SG' },
      { path: '/APAC/JP/TKY', label: 'Tokyo', parentPath: '/APAC/JP' },
      { path: '/APAC/JP/OSA', label: 'Osaka', parentPath: '/APAC/JP' },
      { path: '/APAC/AU/SYD', label: 'Sydney', parentPath: '/APAC/AU' },
      { path: '/APAC/AU/MEL', label: 'Melbourne', parentPath: '/APAC/AU' },
      { path: '/APAC/IN/BOM', label: 'Mumbai', parentPath: '/APAC/IN' },
      { path: '/APAC/IN/DEL', label: 'New Delhi', parentPath: '/APAC/IN' },
      { path: '/LATAM/BR/SAO', label: 'São Paulo', parentPath: '/LATAM/BR' },
      { path: '/LATAM/BR/RIO', label: 'Rio de Janeiro', parentPath: '/LATAM/BR' },
      { path: '/LATAM/AR/BUE', label: 'Buenos Aires', parentPath: '/LATAM/AR' },
    ];

    await createTagValues(geoId, geoValues, 'Geography');
  }

  // 2. BRAND - Flat structure with some hierarchy
  const brandId = dimensionMap.get('Brand');
  if (brandId) {
    const brandValues = [
      { path: '/CORP', label: 'Corporate', parentPath: null },
      { path: '/PREM', label: 'Premium', parentPath: null },
      { path: '/VALUE', label: 'Value', parentPath: null },
      { path: '/NICHE', label: 'Niche', parentPath: null },
      { path: '/GLOBAL', label: 'Global', parentPath: null },
      { path: '/LOCAL', label: 'Local', parentPath: null },
      { path: '/CORP/ENTERPRISE', label: 'Enterprise', parentPath: '/CORP' },
      { path: '/CORP/SMB', label: 'SMB Solutions', parentPath: '/CORP' },
      { path: '/PREM/LUXURY', label: 'Luxury', parentPath: '/PREM' },
      { path: '/PREM/EXECUTIVE', label: 'Executive', parentPath: '/PREM' },
      { path: '/NICHE/TECHSTART', label: 'TechStart', parentPath: '/NICHE' },
      { path: '/NICHE/INNOVATE', label: 'InnovateLab', parentPath: '/NICHE' },
      { path: '/NICHE/STARTUP', label: 'StartupHub', parentPath: '/NICHE' },
      { path: '/VALUE/BASIC', label: 'Basic', parentPath: '/VALUE' },
      { path: '/VALUE/STANDARD', label: 'Standard', parentPath: '/VALUE' },
      { path: '/GLOBAL/INTL', label: 'International', parentPath: '/GLOBAL' },
      { path: '/LOCAL/REGIONAL', label: 'Regional', parentPath: '/LOCAL' },
    ];

    await createTagValues(brandId, brandValues, 'Brand');
  }

  // 3. LEGAL ENTITY - Corporate structure (2 levels)
  const legalId = dimensionMap.get('LegalEntity');
  if (legalId) {
    const legalValues = [
      // Level 0: Groups/Holdings
      { path: '/ARK', label: 'ARK Group (Holding)', parentPath: null },
      { path: '/SUBS', label: 'Subsidiaries', parentPath: null },
      { path: '/JV', label: 'Joint Ventures', parentPath: null },
      
      // Level 1: Legal entities
      { path: '/ARK/FR', label: 'ARK France SAS', parentPath: '/ARK' },
      { path: '/ARK/DE', label: 'ARK Germany GmbH', parentPath: '/ARK' },
      { path: '/ARK/UK', label: 'ARK UK Ltd', parentPath: '/ARK' },
      { path: '/ARK/US', label: 'ARK US Inc.', parentPath: '/ARK' },
      { path: '/ARK/IT', label: 'ARK Italy SRL', parentPath: '/ARK' },
      { path: '/ARK/ES', label: 'ARK Spain SL', parentPath: '/ARK' },
      { path: '/ARK/NL', label: 'ARK Netherlands BV', parentPath: '/ARK' },
      { path: '/ARK/SG', label: 'ARK Singapore Pte Ltd', parentPath: '/ARK' },
      { path: '/SUBS/TECH', label: 'TechCorp SA', parentPath: '/SUBS' },
      { path: '/SUBS/DATA', label: 'DataServices LLC', parentPath: '/SUBS' },
      { path: '/SUBS/CLOUD', label: 'CloudOps GmbH', parentPath: '/SUBS' },
      { path: '/SUBS/DEV', label: 'DevStudio Ltd', parentPath: '/SUBS' },
      { path: '/JV/ANALYTICS', label: 'Analytics JV', parentPath: '/JV' },
      { path: '/JV/SECURITY', label: 'CyberSec JV', parentPath: '/JV' },
      { path: '/JV/AI', label: 'AI Innovation JV', parentPath: '/JV' },
    ];

    await createTagValues(legalId, legalValues, 'LegalEntity');
  }

  console.log('\n🎉 Seed tags completed successfully!');
  
  // Summary
  const totalValues = await prisma.tagValue.count();
  console.log(`📊 Total tag values created: ${totalValues}`);
}

async function createTagValues(
  dimensionId: string, 
  values: { path: string; label: string; parentPath: string | null }[],
  dimensionName: string
) {
  console.log(`\n📝 Creating ${values.length} values for ${dimensionName}...`);

  // First pass: create parent values (null parentPath)
  const parentValues = values.filter(v => v.parentPath === null);
  const parentIdMap = new Map<string, string>();

  for (const value of parentValues) {
    const existing = await prisma.tagValue.findFirst({
      where: { dimensionId, path: value.path }
    });

    if (!existing) {
      const created = await prisma.tagValue.create({
        data: {
          dimensionId,
          path: value.path,
          label: value.label,
          depth: 0,
        }
      });
      parentIdMap.set(value.path, created.id);
      console.log(`  ✓ [L0] ${value.label}`);
    } else {
      parentIdMap.set(value.path, existing.id);
      console.log(`  ⚠ [L0] ${value.label} (exists)`);
    }
  }

  // Second pass: create child values (with parentPath)
  const childValues = values.filter(v => v.parentPath !== null);
  
  // Sort by depth to ensure parents are created before children
  childValues.sort((a, b) => a.path.split('/').length - b.path.split('/').length);

  for (const value of childValues) {
    const parentId = parentIdMap.get(value.parentPath!);
    if (!parentId) {
      console.log(`  ✗ [L?] ${value.label} - Parent not found: ${value.parentPath}`);
      continue;
    }

    const depth = value.path.split('/').length - 2;

    const existing = await prisma.tagValue.findFirst({
      where: { dimensionId, path: value.path }
    });

    if (!existing) {
      const created = await prisma.tagValue.create({
        data: {
          dimensionId,
          path: value.path,
          label: value.label,
          parentId,
          depth,
        }
      });
      parentIdMap.set(value.path, created.id);
      console.log(`  ✓ [L${depth}] ${value.label}`);
    } else {
      parentIdMap.set(value.path, existing.id);
      console.log(`  ⚠ [L${depth}] ${value.label} (exists)`);
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
