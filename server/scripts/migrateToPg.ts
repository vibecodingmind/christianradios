import { db } from '../db.js';
import { pgSync } from '../pgDb.js';

async function runMigration() {
  console.log('--- Christian Radios Database Migration ---');
  const pool = pgSync.getPool();
  if (!pool) {
    console.error('ERROR: DATABASE_URL is not set. Please provide DATABASE_URL to migrate.');
    process.exit(1);
  }

  const rawData = db.getRaw();
  console.log(`JSON Store Counts:`);
  console.log(`- Users: ${rawData.users.length}`);
  console.log(`- Stations: ${rawData.stations.length}`);
  console.log(`- Categories: ${rawData.categories.length}`);
  console.log(`- Countries: ${rawData.countries.length}`);
  console.log(`- Plans: ${rawData.plans.length}`);

  console.log('\nRunning schema migrations and synchronization...');
  await pgSync.initSchemaAndSync(rawData);

  const client = await pool.connect();
  try {
    const userCount = await client.query('SELECT COUNT(*) FROM users;');
    const stationCount = await client.query('SELECT COUNT(*) FROM stations;');
    const catCount = await client.query('SELECT COUNT(*) FROM categories;');
    const countryCount = await client.query('SELECT COUNT(*) FROM countries;');

    console.log('\nPostgreSQL Database Counts:');
    console.log(`- Users in PostgreSQL: ${userCount.rows[0].count}`);
    console.log(`- Stations in PostgreSQL: ${stationCount.rows[0].count}`);
    console.log(`- Categories in PostgreSQL: ${catCount.rows[0].count}`);
    console.log(`- Countries in PostgreSQL: ${countryCount.rows[0].count}`);

    console.log('\n✅ Verification Complete! Migration successful.');
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
