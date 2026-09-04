import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const DB_FILE = path.join(rootDir, 'data', 'db.json');
const SERVER_DB_FILE = path.join(rootDir, 'server', 'db.ts');

const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
const countries = db.countries;

let dbContent = fs.readFileSync(SERVER_DB_FILE, 'utf-8');

// Replace countries: [] in getDefaultSchema()
dbContent = dbContent.replace(
  'categories: [],\n      countries: [],',
  `categories: [],\n      countries: ${JSON.stringify(countries, null, 8)},`
);

// Replace if (!Array.isArray(this.data.countries) ...
const checkTarget = `if (!Array.isArray(this.data.countries) || this.data.countries.length < 100) {\n          this.data.countries = defaults.countries;\n        }`;
const checkReplacement = `if (!Array.isArray(this.data.countries) || this.data.countries.length < 100) {\n          this.data.countries = ${JSON.stringify(countries, null, 10)};\n        }`;

if (dbContent.includes(checkTarget)) {
  dbContent = dbContent.replace(checkTarget, checkReplacement);
}

fs.writeFileSync(SERVER_DB_FILE, dbContent, 'utf-8');
console.log(`Updated server/db.ts with ${countries.length} countries in getDefaultSchema.`);
