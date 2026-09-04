import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const DB_FILE = path.join(rootDir, 'data', 'db.json');
const SEED_FILE = path.join(rootDir, 'server', 'seed.ts');

const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
const countries = db.countries;

let seedContent = fs.readFileSync(SEED_FILE, 'utf-8');

const startMarker = '    // 3. Countries (All Worldwide Countries)';
const endMarker = '    data.countries = countries;';

const startIndex = seedContent.indexOf(startMarker);
const endIndex = seedContent.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const newCountriesBlock = `${startMarker}\n    const countries: Country[] = ${JSON.stringify(countries, null, 6)};\n`;
  seedContent = seedContent.slice(0, startIndex) + newCountriesBlock + seedContent.slice(endIndex);
  fs.writeFileSync(SEED_FILE, seedContent, 'utf-8');
  console.log(`Updated server/seed.ts with ${countries.length} countries.`);
} else {
  console.error('Could not find markers in server/seed.ts');
}
