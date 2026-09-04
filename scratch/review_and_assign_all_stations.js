import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ALL_WORLD_COUNTRIES } from '../server/worldCountries.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const REAL_STATIONS_FILE = path.join(rootDir, 'data', 'real_stations.json');
const DB_FILE = path.join(rootDir, 'data', 'db.json');

const countryMapByCode = new Map(ALL_WORLD_COUNTRIES.map(c => [c.code.toUpperCase(), c]));

const CITY_COUNTRY_MAP = {
  // US States & Cities
  'united states': 'US', 'usa': 'US', 'us': 'US', 'louisiana': 'US', 'texas': 'US', 'california': 'US',
  'florida': 'US', 'georgia': 'US', 'new york': 'US', 'ohio': 'US', 'tennessee': 'US', 'north carolina': 'US',
  'south carolina': 'US', 'alabama': 'US', 'virginia': 'US', 'pennsylvania': 'US', 'illinois': 'US',
  'michigan': 'US', 'missouri': 'US', 'indiana': 'US', 'washington': 'US', 'colorado': 'US', 'arizona': 'US',
  'oklahoma': 'US', 'arkansas': 'US', 'kentucky': 'US', 'mississippi': 'US', 'oregon': 'US', 'kansas': 'US',
  'hawaii': 'US', 'alaska': 'US', 'minnesota': 'US', 'wisconsin': 'US', 'iowa': 'US', 'nevada': 'US',
  'dallas': 'US', 'houston': 'US', 'atlanta': 'US', 'chicago': 'US', 'los angeles': 'US', 'miami': 'US',
  'nashville': 'US', 'orlando': 'US', 'phoenix': 'US', 'seattle': 'US', 'denver': 'US', 'charlotte': 'US',
  'tampa': 'US', 'detroit': 'US', 'st. louis': 'US', 'baltimore': 'US', 'cleveland': 'US', 'pittsburgh': 'US',

  // UK & Ireland
  'united kingdom': 'GB', 'uk': 'GB', 'england': 'GB', 'london': 'GB', 'manchester': 'GB', 'birmingham': 'GB',
  'glasgow': 'GB', 'edinburgh': 'GB', 'belfast': 'GB', 'cardiff': 'GB', 'ireland': 'IE', 'dublin': 'IE',

  // Canada & Australia
  'canada': 'CA', 'toronto': 'CA', 'vancouver': 'CA', 'montreal': 'CA', 'calgary': 'CA', 'ottawa': 'CA',
  'australia': 'AU', 'sydney': 'AU', 'melbourne': 'AU', 'brisbane': 'AU', 'perth': 'AU', 'adelaide': 'AU',

  // Africa
  'tanzania': 'TZ', 'dar es salaam': 'TZ', 'arusha': 'TZ', 'mwanza': 'TZ', 'zanzibar': 'TZ', 'dodoma': 'TZ',
  'kenya': 'KE', 'nairobi': 'KE', 'mombasa': 'KE', 'kisumu': 'KE', 'nakuru': 'KE', 'eldoret': 'KE',
  'uganda': 'UG', 'kampala': 'UG', 'entebbe': 'UG', 'jinja': 'UG', 'mbarara': 'UG', 'gulu': 'UG',
  'nigeria': 'NG', 'lagos': 'NG', 'abuja': 'NG', 'ibadan': 'NG', 'port harcourt': 'NG', 'enugu': 'NG',
  'south africa': 'ZA', 'johannesburg': 'ZA', 'cape town': 'ZA', 'durban': 'ZA', 'pretoria': 'ZA',
  'ghana': 'GH', 'accra': 'GH', 'kumasi': 'GH', 'takoradi': 'GH', 'tamale': 'GH',
  'rwanda': 'RW', 'kigali': 'RW', 'malawi': 'MW', 'lilongwe': 'MW', 'blantyre': 'MW',
  'zambia': 'ZM', 'lusaka': 'ZM', 'zimbabwe': 'ZW', 'harare': 'ZW',
  'dr congo': 'CD', 'kinshasa': 'CD', 'goma': 'CD', 'congo': 'CG', 'brazzaville': 'CG',
  'cameroon': 'CM', 'douala': 'CM', 'yaounde': 'CM', 'ivory coast': 'CI', "côte d'ivoire": 'CI', 'abidjan': 'CI',
  'senegal': 'SN', 'dakar': 'SN', 'angola': 'AO', 'luanda': 'AO', 'mozambique': 'MZ', 'maputo': 'MZ',
  'ethiopia': 'ET', 'addis ababa': 'ET', 'egypt': 'EG', 'cairo': 'EG', 'morocco': 'MA', 'casablanca': 'MA',
  'madagascar': 'MG', 'antananarivo': 'MG', 'mauritius': 'MU', 'port louis': 'MU', 'burundi': 'BI', 'bujumbura': 'BI',
  'south sudan': 'SS', 'juba': 'SS', 'sudan': 'SD', 'khartoum': 'SD', 'togo': 'TG', 'lome': 'TG', 'gabon': 'GA', 'libreville': 'GA',

  // Americas
  'brazil': 'BR', 'brasil': 'BR', 'são paulo': 'BR', 'rio de janeiro': 'BR', 'brasília': 'BR', 'belo horizonte': 'BR',
  'argentina': 'AR', 'buenos aires': 'AR', 'córdoba': 'AR', 'rosario': 'AR',
  'colombia': 'CO', 'bogotá': 'CO', 'medellín': 'CO', 'cali': 'CO', 'barranquilla': 'CO',
  'chile': 'CL', 'santiago': 'CL', 'peru': 'PE', 'perú': 'PE', 'lima': 'PE', 'arequipa': 'PE',
  'bolivia': 'BO', 'la paz': 'BO', 'santa cruz': 'BO', 'cochabamba': 'BO',
  'ecuador': 'EC', 'quito': 'EC', 'guayaquil': 'EC', 'venezuela': 'VE', 'caracas': 'VE', 'maracaibo': 'VE',
  'guatemala': 'GT', 'guatemala city': 'GT', 'el salvador': 'SV', 'san salvador': 'SV',
  'honduras': 'HN', 'tegucigalpa': 'HN', 'nicaragua': 'NI', 'managua': 'NI',
  'costa rica': 'CR', 'san josé': 'CR', 'panama': 'PA', 'panamá': 'PA',
  'haiti': 'HT', 'haïti': 'HT', 'port-au-prince': 'HT', 'jamaica': 'JM', 'kingston': 'JM',
  'dominican republic': 'DO', 'santo domingo': 'DO', 'puerto rico': 'PR', 'san juan': 'PR',
  'trinidad': 'TT', 'trinidad & tobago': 'TT', 'port of spain': 'TT', 'bahamas': 'BS', 'nassau': 'BS',
  'barbados': 'BB', 'bridgetown': 'BB', 'caribbean netherlands': 'BQ', 'bonaire': 'BQ',

  // Europe
  'france': 'FR', 'paris': 'FR', 'marseille': 'FR', 'lyon': 'FR', 'toulouse': 'FR', 'nice': 'FR',
  'germany': 'DE', 'deutschland': 'DE', 'berlin': 'DE', 'munich': 'DE', 'hamburg': 'DE', 'frankfurt': 'DE', 'cologne': 'DE',
  'italy': 'IT', 'italia': 'IT', 'rome': 'IT', 'roma': 'IT', 'milan': 'IT', 'milano': 'IT', 'naples': 'IT', 'turin': 'IT',
  'spain': 'ES', 'españa': 'ES', 'madrid': 'ES', 'barcelona': 'ES', 'valencia': 'ES', 'seville': 'ES',
  'portugal': 'PT', 'lisbon': 'PT', 'lisboa': 'PT', 'porto': 'PT', 'netherlands': 'NL', 'amsterdam': 'NL',
  'belgium': 'BE', 'brussels': 'BE', 'switzerland': 'CH', 'zurich': 'CH', 'geneva': 'CH',
  'austria': 'AT', 'vienna': 'AT', 'sweden': 'SE', 'stockholm': 'SE', 'norway': 'NO', 'oslo': 'NO',
  'finland': 'FI', 'helsinki': 'FI', 'denmark': 'DK', 'copenhagen': 'DK', 'poland': 'PL', 'warsaw': 'PL',
  'romania': 'RO', 'românia': 'RO', 'bucharest': 'RO', 'ukraine': 'UA', 'kyiv': 'UA', 'kiev': 'UA', 'chernivtsi': 'UA',
  'russia': 'RU', 'moscow': 'RU', 'saint petersburg': 'RU', 'belarus': 'BY', 'minsk': 'BY',
  'greece': 'GR', 'athens': 'GR', 'turkey': 'TR', 'istanbul': 'TR', 'ankara': 'TR',

  // Asia & Oceania
  'india': 'IN', 'new delhi': 'IN', 'mumbai': 'IN', 'bangalore': 'IN', 'chennai': 'IN', 'kolkata': 'IN',
  'philippines': 'PH', 'manila': 'PH', 'cebu': 'PH', 'davao': 'PH', 'quezon city': 'PH',
  'indonesia': 'ID', 'jakarta': 'ID', 'surabaya': 'ID', 'bandung': 'ID', 'manado': 'ID',
  'malaysia': 'MY', 'kuala lumpur': 'MY', 'singapore': 'SG', 'south korea': 'KR', 'seoul': 'KR',
  'japan': 'JP', 'tokyo': 'JP', 'osaka': 'JP', 'lebanon': 'LB', 'beirut': 'LB', 'israel': 'IL', 'jerusalem': 'IL',
  'new zealand': 'NZ', 'auckland': 'NZ', 'fiji': 'FJ', 'suva': 'FJ', 'papua new guinea': 'PG', 'port moresby': 'PG',
  'vanuatu': 'VU', 'port vila': 'VU', 'guam': 'GU', 'hagåtña': 'GU', 'timor-leste': 'TL', 'timor leste': 'TL'
};

function resolveCountry(station) {
  let foundCode = null;

  if (station.countryCode && station.countryCode.length === 2 && station.countryCode !== 'GL') {
    foundCode = station.countryCode.toUpperCase();
  }

  if (!foundCode && station.country && typeof station.country === 'string') {
    const lower = station.country.toLowerCase().trim();
    if (CITY_COUNTRY_MAP[lower]) foundCode = CITY_COUNTRY_MAP[lower];
  }

  if (!foundCode) {
    const textBlob = [station.country || '', station.city || '', station.region || '', station.tagline || '', station.description || '', station.name || ''].join(' ').toLowerCase();
    for (const [key, code] of Object.entries(CITY_COUNTRY_MAP)) {
      if (textBlob.includes(key)) {
        foundCode = code;
        break;
      }
    }
  }

  if (!foundCode) {
    foundCode = 'US';
  }

  return countryMapByCode.get(foundCode) || countryMapByCode.get('US');
}

function processAllStations() {
  console.log('Reviewing and assigning country objects to all 1062 stations...');

  let real = [];
  if (fs.existsSync(REAL_STATIONS_FILE)) {
    real = JSON.parse(fs.readFileSync(REAL_STATIONS_FILE, 'utf-8'));
  }

  const dbData = fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')) : {};
  const categoriesMap = new Map((dbData.categories || []).map(cat => [cat.id, cat]));

  const updatedStations = real.map(station => {
    const countryObj = resolveCountry(station);
    const categoryId = station.categoryId || 'cat_gospel';
    const categoryObj = categoriesMap.get(categoryId) || {
      id: categoryId,
      name: 'Gospel Music',
      slug: 'gospel-music',
      iconName: 'Disc',
      description: 'Uplifting Gospel music',
      displayOrder: 1,
      isActive: true
    };

    return {
      ...station,
      countryCode: countryObj.code,
      country: countryObj,
      categoryId: categoryId,
      categoryIds: station.categoryIds || [categoryId],
      category: categoryObj
    };
  });

  // Write back to real_stations.json
  fs.writeFileSync(REAL_STATIONS_FILE, JSON.stringify(updatedStations, null, 2), 'utf-8');
  console.log(`Updated real_stations.json with ${updatedStations.length} stations.`);

  // Write back to db.json
  if (fs.existsSync(DB_FILE)) {
    dbData.stations = updatedStations;
    dbData.countries = ALL_WORLD_COUNTRIES;
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
    console.log('Updated db.json with clean stations & 249 countries dataset.');
  }
}

processAllStations();
