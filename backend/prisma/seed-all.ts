import { execSync } from 'child_process';
import * as path from 'path';

const seeds = [
  'seed.ts',
  'seed-domains.ts',
  'seed-providers.ts',
  'seed-tags.ts',
  'seed-data-objects.ts',
  'seed-applications.ts',
  'seed-interfaces.ts',
];

for (const file of seeds) {
  const filePath = path.join(__dirname, file);
  console.log(`\n▶ Running ${file}...`);
  execSync(`npx ts-node ${filePath}`, { stdio: 'inherit' });
}

console.log('\n✅ All seeds completed.');
