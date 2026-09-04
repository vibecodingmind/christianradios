import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const REAL_STATIONS_FILE = path.join(rootDir, 'data', 'real_stations.json');
const DB_FILE = path.join(rootDir, 'data', 'db.json');

const catAwr = {
  id: 'cat_awr',
  name: 'Adventist World Radios',
  slug: 'adventist-world-radios',
  iconName: 'Globe',
  description: 'Official Adventist World Radio (AWR) multi-lingual international broadcasts and stations.',
  displayOrder: 0,
  isActive: true
};

const COUNTRY_CODE_MAP = {
  'el salvador': 'SV',
  'guatemala': 'GT',
  'venezuela': 'VE',
  'peru': 'PE',
  'chile': 'CL',
  'bolivia': 'BO',
  'brazil': 'BR',
  'togo': 'TG',
  'garbon': 'GA',
  'gabon': 'GA',
  'italy': 'IT',
  'united kingdom': 'GB',
  'uk': 'GB',
  'centurion, pretoria, south africa': 'ZA',
  'south africa': 'ZA',
  'timor leste': 'TL',
  'australia': 'AU',
  'papua new guinea': 'PG',
  'angola': 'AO',
  'israel': 'IL',
  'colombia': 'CO',
  'bosnia and herzegovina': 'BA',
  'awr bulgaria': 'BG',
  'bulgaria': 'BG',
  'guam': 'GU',
  'indonesia': 'ID',
  'philippines': 'PH',
  'fiji': 'FJ',
  'uganda': 'UG',
  'caribbean netherlands': 'BQ',
  'moldova': 'MD',
  'spain': 'ES',
  'portugal': 'PT',
  'france': 'FR',
  'românia': 'RO',
  'romania': 'RO',
  'vanuatu, bislama': 'VU',
  'vanuatu': 'VU',
  'чернівці україна': 'UA',
  'ukraine': 'UA',
  'usa': 'US',
  'united states': 'US',
  'россия': 'RU',
  'russia': 'RU'
};

function getCountryCode(desc) {
  if (!desc) return 'US';
  const lower = desc.toLowerCase().trim();
  for (const [key, code] of Object.entries(COUNTRY_CODE_MAP)) {
    if (lower.includes(key)) return code;
  }
  return 'US';
}

function processStations() {
  console.log('Assigning Adventist World Radios category (cat_awr) and country codes...');

  let realStations = [];
  if (fs.existsSync(REAL_STATIONS_FILE)) {
    realStations = JSON.parse(fs.readFileSync(REAL_STATIONS_FILE, 'utf-8'));
  }

  let updatedCount = 0;
  realStations = realStations.map(s => {
    const isAwr = s.id.startsWith('awr_') ||
                  (s.name && (s.name.includes('AWR') || s.name.toLowerCase().includes('adventist'))) ||
                  (s.description && s.description.toLowerCase().includes('adventist world radio'));
    if (isAwr) {
      updatedCount++;
      const countryCode = getCountryCode(s.country || s.description);
      return {
        ...s,
        countryCode: countryCode,
        genre: s.genre || 'teaching',
        language: s.language || 'English',
        categoryId: 'cat_awr',
        categoryIds: ['cat_awr', ...(Array.isArray(s.categoryIds) ? s.categoryIds.filter(c => c !== 'cat_awr') : [])],
        category: catAwr
      };
    }
    return s;
  });

  fs.writeFileSync(REAL_STATIONS_FILE, JSON.stringify(realStations, null, 2), 'utf-8');
  console.log(`Updated ${updatedCount} stations in real_stations.json.`);

  if (fs.existsSync(DB_FILE)) {
    const dbData = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    
    if (!Array.isArray(dbData.categories)) {
      dbData.categories = [catAwr];
    } else if (!dbData.categories.some(c => c.id === 'cat_awr')) {
      dbData.categories.unshift(catAwr);
    }

    dbData.stations = realStations;

    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
    console.log(`Updated db.json with ${realStations.length} total stations.`);
  }
}

processStations();
