import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const SERVER_SEED_FILE = path.join(rootDir, 'server', 'seed.ts');

let seedContent = fs.readFileSync(SERVER_SEED_FILE, 'utf-8');

if (!seedContent.includes("import { ALL_WORLD_COUNTRIES }")) {
  seedContent = `import { ALL_WORLD_COUNTRIES } from './worldCountries.js';\n` + seedContent;
}

const startMarker = '    // 3. Countries (All Worldwide Countries)';
const endMarker = '    data.countries = countries;';

const startIndex = seedContent.indexOf(startMarker);
const endIndex = seedContent.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const newCountriesBlock = `${startMarker}\n    const countries: Country[] = ALL_WORLD_COUNTRIES as any;\n`;
  seedContent = seedContent.slice(0, startIndex) + newCountriesBlock + seedContent.slice(endIndex);
  fs.writeFileSync(SERVER_SEED_FILE, seedContent, 'utf-8');
  console.log('Cleanly updated server/seed.ts with ALL_WORLD_COUNTRIES import.');
}
