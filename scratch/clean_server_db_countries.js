import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const SERVER_DB_FILE = path.join(rootDir, 'server', 'db.ts');

let dbContent = fs.readFileSync(SERVER_DB_FILE, 'utf-8');

// Add import at top if not present
if (!dbContent.includes("import { ALL_WORLD_COUNTRIES }")) {
  dbContent = `import { ALL_WORLD_COUNTRIES } from './worldCountries.js';\n` + dbContent;
}

// Clean countries in getDefaultSchema()
const defaultSchemaStart = dbContent.indexOf('private getDefaultSchema(): DatabaseSchema {');
const defaultSchemaEnd = dbContent.indexOf('settings: {', defaultSchemaStart);

if (defaultSchemaStart !== -1 && defaultSchemaEnd !== -1) {
  const schemaChunk = dbContent.slice(defaultSchemaStart, defaultSchemaEnd);
  const countriesChunkStart = schemaChunk.indexOf('countries: [');
  if (countriesChunkStart !== -1) {
    const countriesChunkEnd = schemaChunk.indexOf('],\n      stations: [', countriesChunkStart);
    if (countriesChunkEnd !== -1) {
      const oldChunk = schemaChunk.slice(countriesChunkStart, countriesChunkEnd + 2);
      const newChunk = 'countries: ALL_WORLD_COUNTRIES,';
      dbContent = dbContent.replace(oldChunk, newChunk);
    }
  }
}

// Clean init() countries check
const checkStart = dbContent.indexOf('if (!Array.isArray(this.data.countries) || this.data.countries.length < 100) {');
if (checkStart !== -1) {
  const checkEnd = dbContent.indexOf('}', checkStart + 50);
  const realJsonStart = dbContent.indexOf('const realJsonPath', checkStart);
  if (realJsonStart !== -1) {
    const oldCheck = dbContent.slice(checkStart, realJsonStart);
    const newCheck = `if (!Array.isArray(this.data.countries) || this.data.countries.length < 100) {\n          this.data.countries = ALL_WORLD_COUNTRIES;\n        }\n\n        `;
    dbContent = dbContent.replace(oldCheck, newCheck);
  }
}

fs.writeFileSync(SERVER_DB_FILE, dbContent, 'utf-8');
console.log('Cleanly updated server/db.ts with ALL_WORLD_COUNTRIES import.');
