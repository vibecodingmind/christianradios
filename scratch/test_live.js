async function testLive() {
  const url = 'https://christianradios-production.up.railway.app/api/public/stations?category=adventist-world-radios';
  console.log('Fetching:', url);
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' }
  });
  console.log('Status:', res.status, 'Content-Type:', res.headers.get('content-type'));
  const text = await res.text();
  console.log('Body length:', text.length);
  if (text.startsWith('{')) {
    const json = JSON.parse(text);
    console.log('Stations count:', json.stations ? json.stations.length : 0);
    console.log('Total pagination:', json.pagination);
  } else {
    console.log('Body preview:', text.slice(0, 300));
  }
}

testLive();
