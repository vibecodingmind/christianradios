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

function processStations() {
  console.log('Assigning Adventist World Radios category (cat_awr)...');

  // 1. Update real_stations.json
  let realStations = [];
  if (fs.existsSync(REAL_STATIONS_FILE)) {
    realStations = JSON.parse(fs.readFileSync(REAL_STATIONS_FILE, 'utf-8'));
  }

  let realUpdatedCount = 0;
  realStations = realStations.map(s => {
    const isAwr = s.id.startsWith('awr_') ||
                  (s.name && (s.name.includes('AWR') || s.name.toLowerCase().includes('adventist'))) ||
                  (s.description && s.description.toLowerCase().includes('adventist world radio'));
    if (isAwr) {
      realUpdatedCount++;
      return {
        ...s,
        categoryId: 'cat_awr',
        categoryIds: ['cat_awr', ...(Array.isArray(s.categoryIds) ? s.categoryIds.filter(c => c !== 'cat_awr') : [])],
        category: catAwr
      };
    }
    return s;
  });

  fs.writeFileSync(REAL_STATIONS_FILE, JSON.stringify(realStations, null, 2), 'utf-8');
  console.log(`Updated ${realUpdatedCount} stations in real_stations.json.`);

  // 2. Update db.json
  if (fs.existsSync(DB_FILE)) {
    const dbData = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    
    // Add category to dbData.categories
    if (!Array.isArray(dbData.categories)) {
      dbData.categories = [catAwr];
    } else if (!dbData.categories.some(c => c.id === 'cat_awr')) {
      dbData.categories.unshift(catAwr);
    }

    let dbUpdatedCount = 0;
    dbData.stations = (dbData.stations || []).map(s => {
      const isAwr = s.id.startsWith('awr_') ||
                    (s.name && (s.name.includes('AWR') || s.name.toLowerCase().includes('adventist'))) ||
                    (s.description && s.description.toLowerCase().includes('adventist world radio'));
      if (isAwr) {
        dbUpdatedCount++;
        return {
          ...s,
          categoryId: 'cat_awr',
          categoryIds: ['cat_awr', ...(Array.isArray(s.categoryIds) ? s.categoryIds.filter(c => c !== 'cat_awr') : [])],
          category: catAwr
        };
      }
      return s;
    });

    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
    console.log(`Updated ${dbUpdatedCount} stations and added cat_awr category in db.json.`);
  }
}

processStations();
