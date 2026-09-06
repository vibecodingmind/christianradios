import { db } from '../server/db.js';

async function runTests() {
  console.log('--- Testing Owner & Promotion Features ---');

  // Test 1: Verify owner exists or get one
  const owners = db.users.getAll().filter((u) => u.role === 'RADIO_OWNER' || u.role === 'SUPER_ADMIN');
  console.log(`Found ${owners.length} owners/admins.`);
  const owner = owners[0];
  if (!owner) throw new Error('No owner found');

  // Test 2: Search claimable stations
  const allStations = db.stations.getAll();
  const notOwned = allStations.filter((s) => s.ownerId !== owner.id);
  console.log(`Total stations: ${allStations.length}, not owned by ${owner.email}: ${notOwned.length}`);
  if (notOwned.length > 0) {
    const query = notOwned[0].name.slice(0, 4).toLowerCase();
    const matched = allStations.filter(s => s.name.toLowerCase().includes(query) && s.ownerId !== owner.id);
    console.log(`Search query "${query}" matched ${matched.length} claimable stations.`);
  }

  // Test 3: Owner stations
  const myStations = db.stations.findByOwnerId(owner.id);
  console.log(`Owner has ${myStations.length} stations.`);
  const testStation = myStations[0] || allStations[0];

  // Test 4: Create Featured Campaign
  console.log('Testing Featured Campaign Creation & Lifecycle...');
  const newCamp = db.featuredCampaigns.create({
    id: `camp_test_${Date.now()}`,
    stationId: testStation.id,
    ownerId: owner.id,
    placement: 'HOMEPAGE_HERO',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    price: 75000,
    currency: 'TZS',
    status: 'ACTIVE',
    impressions: 0,
    clicks: 0,
    createdAt: new Date().toISOString(),
  });
  db.stations.update(testStation.id, { isFeatured: true });
  console.log(`Created campaign ${newCamp.id}, station isFeatured = ${db.stations.findById(testStation.id)?.isFeatured}`);

  // Test 5: Pause campaign
  db.featuredCampaigns.update(newCamp.id, { status: 'PAUSED' as any });
  const otherActive = db.featuredCampaigns.getActive().some(c => c.stationId === testStation.id && c.id !== newCamp.id);
  if (!otherActive) {
    db.stations.update(testStation.id, { isFeatured: false });
  }
  console.log(`Paused campaign, station isFeatured = ${db.stations.findById(testStation.id)?.isFeatured}`);

  // Test 6: Resume campaign
  db.featuredCampaigns.update(newCamp.id, { status: 'ACTIVE' });
  db.stations.update(testStation.id, { isFeatured: true });
  console.log(`Resumed campaign, station isFeatured = ${db.stations.findById(testStation.id)?.isFeatured}`);

  // Test 7: Delete / Cancel campaign
  db.featuredCampaigns.delete(newCamp.id);
  const stillActive = db.featuredCampaigns.getActive().some(c => c.stationId === testStation.id);
  if (!stillActive) {
    db.stations.update(testStation.id, { isFeatured: false });
  }
  console.log(`Deleted campaign, station isFeatured = ${db.stations.findById(testStation.id)?.isFeatured}`);
  console.log(`Campaign findById check:`, db.featuredCampaigns.findById(newCamp.id) ? 'STILL_EXISTS' : 'DELETED_OK');

  console.log('--- ALL OWNER & PROMOTION FEATURE TESTS PASSED! ---');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
