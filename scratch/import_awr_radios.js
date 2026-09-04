import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const REAL_STATIONS_FILE = path.join(rootDir, 'data', 'real_stations.json');
const DB_FILE = path.join(rootDir, 'data', 'db.json');
const DEFAULT_AWR_LOGO = 'https://awr.live/awrLiveRadio-white.png';

async function checkLogo(logoUrl) {
  if (!logoUrl || logoUrl === 'AWRdefault.png' || logoUrl === 'Prueba.jpg') {
    return DEFAULT_AWR_LOGO;
  }
  let targetUrl = logoUrl;
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = `https://awr.live/images/${logoUrl}`;
  }
  try {
    const res = await Promise.race([
      fetch(targetUrl, { method: 'HEAD' }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500))
    ]);
    if (res && res.ok) return targetUrl;
  } catch {
    // fallback
  }
  return DEFAULT_AWR_LOGO;
}

async function importAwrStations() {
  console.log('Fetching AWR stations from https://awr.live/stations.php ...');
  
  const response = await fetch('https://awr.live/stations.php', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Referer': 'https://awr.live/',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch AWR stations: HTTP ${response.status}`);
  }

  const data = await response.json();
  const rawList = data.station || [];
  console.log(`Retrieved ${rawList.length} AWR stations.`);

  // Read existing real stations
  let existingStations = [];
  if (fs.existsSync(REAL_STATIONS_FILE)) {
    existingStations = JSON.parse(fs.readFileSync(REAL_STATIONS_FILE, 'utf-8'));
  }

  const existingStreamUrls = new Set(existingStations.map(s => s.streamUrl.trim().toLowerCase()));
  const existingNames = new Set(existingStations.map(s => s.name.trim().toLowerCase()));

  // Process all logos in parallel
  console.log('Validating logos in parallel...');
  const logoPromises = rawList.map(raw => checkLogo(raw.imageURL));
  const validatedLogos = await Promise.all(logoPromises);

  let newCount = 0;

  for (let i = 0; i < rawList.length; i++) {
    const raw = rawList[i];
    
    // Clean stream URL
    let streamUrl = (raw.streamURL || '').trim();
    if (streamUrl.startsWith('hhttps://')) {
      streamUrl = streamUrl.replace('hhttps://', 'https://');
    }
    if (!streamUrl || !streamUrl.startsWith('http')) continue;

    // Deduplicate
    if (existingStreamUrls.has(streamUrl.toLowerCase())) {
      console.log(`Skipping duplicate stream URL: ${raw.name} (${streamUrl})`);
      continue;
    }

    const logoUrl = validatedLogos[i];
    let format = 'mp3';
    if (streamUrl.includes('.m3u8')) format = 'm3u8';
    else if (streamUrl.includes('.aac') || streamUrl.includes('aac')) format = 'aac';

    const stationName = (raw.name || 'AWR Station').trim();
    const language = (raw.stationLoc || 'Global').trim();
    const country = (raw.desc || 'Global').trim();
    const description = (raw.longDesc || `Adventist World Radio station broadcasting in ${language} from ${country}`).trim();

    const stationId = `awr_${Date.now()}_${i}_${stationName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    const newStation = {
      id: stationId,
      name: stationName,
      streamUrl: streamUrl,
      logoUrl: logoUrl,
      categoryId: 'cat_awr',
      categoryIds: ['cat_awr', 'cat_teaching'],
      country: country,
      language: language,
      bitrate: 128,
      format: format,
      status: 'ACTIVE',
      isFeatured: i < 5,
      streamStatus: 'ONLINE',
      listenerCount: Math.floor(Math.random() * 800) + 200,
      description: description,
      ownerId: 'user_1',
      createdAt: new Date().toISOString()
    };

    existingStations.push(newStation);
    existingStreamUrls.add(streamUrl.toLowerCase());
    existingNames.add(stationName.toLowerCase());
    newCount++;
  }

  console.log(`Successfully added ${newCount} new AWR stations. Total stations count: ${existingStations.length}`);

  // Write updated data to real_stations.json
  fs.writeFileSync(REAL_STATIONS_FILE, JSON.stringify(existingStations, null, 2), 'utf-8');

  // Update db.json
  if (fs.existsSync(DB_FILE)) {
    const dbData = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    dbData.stations = existingStations;
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
    console.log('Updated db.json with latest station dataset.');
  }
}

importAwrStations().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
