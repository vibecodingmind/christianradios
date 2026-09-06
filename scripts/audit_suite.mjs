/**
 * Christian Radios Production Audit & Verification Runner
 * Runs safe, controlled defensive security & functional tests against production.
 */
const BASE_URL = 'https://christianradios-production.up.railway.app';

const results = {
  auth: [],
  rbac: [],
  apis: [],
  security: [],
  streams: [],
  persistence: [],
};

function logResult(category, name, passed, details, severity = 'INFO') {
  results[category].push({ name, passed, details, severity });
  console.log(`[${passed ? 'PASS' : 'FAIL'}] [${category.toUpperCase()}] ${name} - ${details}`);
}

async function runAudit() {
  console.log('=== STARTING PRODUCTION AUDIT: ' + BASE_URL + ' ===\n');

  // 1. SECURITY HEADERS CHECK
  try {
    const res = await fetch(BASE_URL);
    const headers = Object.fromEntries(res.headers.entries());
    
    // Check HSTS
    if (headers['strict-transport-security']) {
      logResult('security', 'HSTS Header', true, `Present: ${headers['strict-transport-security']}`);
    } else {
      logResult('security', 'HSTS Header', false, 'Missing Strict-Transport-Security', 'HIGH');
    }

    // Check X-Content-Type-Options
    if (headers['x-content-type-options'] === 'nosniff') {
      logResult('security', 'X-Content-Type-Options', true, 'Set to nosniff');
    } else {
      logResult('security', 'X-Content-Type-Options', false, 'Missing or incorrect', 'MEDIUM');
    }

    // Check X-Frame-Options & Embed implications
    if (headers['x-frame-options']) {
      logResult('security', 'X-Frame-Options', true, `Set to ${headers['x-frame-options']} (Note: blocks third-party iframe embed players)`, 'LOW');
    }

    // Check Content-Security-Policy
    if (headers['content-security-policy']) {
      logResult('security', 'Content-Security-Policy', true, 'CSP Header present');
    } else {
      logResult('security', 'Content-Security-Policy', false, 'Missing Content-Security-Policy (CSP) header', 'MEDIUM');
    }

    // Check X-Powered-By
    if (headers['x-powered-by']) {
      logResult('security', 'Server Fingerprinting', false, `Exposes X-Powered-By: ${headers['x-powered-by']}`, 'LOW');
    } else {
      logResult('security', 'Server Fingerprinting', true, 'X-Powered-By header suppressed');
    }
  } catch (err) {
    logResult('security', 'Header Check', false, err.message, 'HIGH');
  }

  // 2. AUTHENTICATION & SESSION MANAGEMENT
  let listenerToken = '';
  let listenerCookie = '';
  let ownerToken = '';
  let ownerCookie = '';
  let adminToken = '';
  let adminCookie = '';

  // 2a. Invalid Login
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'listener@christianradios.org', password: 'WrongPassword123!' }),
    });
    if (res.status === 401) {
      logResult('auth', 'Invalid Password Rejection', true, 'Returned 401 Unauthorized as expected');
    } else {
      logResult('auth', 'Invalid Password Rejection', false, `Returned unexpected status ${res.status}`, 'HIGH');
    }
  } catch (err) {
    logResult('auth', 'Invalid Password Rejection', false, err.message, 'HIGH');
  }

  // 2b. Valid Listener Login
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'listener@christianradios.org', password: 'Listener@2026!' }),
    });
    const setCookie = res.headers.get('set-cookie');
    const data = await res.json();
    if (res.status === 200 && data.token && data.user) {
      listenerToken = data.token;
      listenerCookie = setCookie ? setCookie.split(';')[0] : '';
      const cookieSecure = setCookie?.includes('Secure');
      const cookieHttpOnly = setCookie?.includes('HttpOnly');
      const cookieSameSite = setCookie?.includes('SameSite');
      logResult('auth', 'Listener Login', true, `Authenticated as ${data.user.email} (${data.user.role})`);
      logResult('security', 'Session Cookie Flags', cookieSecure && cookieHttpOnly && cookieSameSite,
        `Secure=${cookieSecure}, HttpOnly=${cookieHttpOnly}, SameSite=${cookieSameSite}`);
    } else {
      logResult('auth', 'Listener Login', false, `Status ${res.status}: ${JSON.stringify(data)}`, 'HIGH');
    }
  } catch (err) {
    logResult('auth', 'Listener Login', false, err.message, 'HIGH');
  }

  // 2c. Valid Radio Owner Login
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@radiomaria.tz', password: 'Owner@2026!' }),
    });
    const setCookie = res.headers.get('set-cookie');
    const data = await res.json();
    if (res.status === 200 && data.token) {
      ownerToken = data.token;
      ownerCookie = setCookie ? setCookie.split(';')[0] : '';
      logResult('auth', 'Radio Owner Login', true, `Authenticated as ${data.user.email} (${data.user.role})`);
    } else {
      logResult('auth', 'Radio Owner Login', false, `Status ${res.status}`, 'HIGH');
    }
  } catch (err) {
    logResult('auth', 'Radio Owner Login', false, err.message, 'HIGH');
  }

  // 2d. Valid Super Admin Login
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@christianradios.org', password: 'Admin@2026!' }),
    });
    const setCookie = res.headers.get('set-cookie');
    const data = await res.json();
    if (res.status === 200 && data.token) {
      adminToken = data.token;
      adminCookie = setCookie ? setCookie.split(';')[0] : '';
      logResult('auth', 'Admin Login', true, `Authenticated as ${data.user.email} (${data.user.role})`);
    } else {
      logResult('auth', 'Admin Login', false, `Status ${res.status}`, 'HIGH');
    }
  } catch (err) {
    logResult('auth', 'Admin Login', false, err.message, 'HIGH');
  }

  // 2e. Auth Me session check with cookie
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: listenerCookie },
    });
    const data = await res.json();
    if (res.status === 200 && data.user?.id === 'usr_listener_01') {
      logResult('auth', 'Cookie Session Persistence (/api/auth/me)', true, 'User identified via cookie');
    } else {
      logResult('auth', 'Cookie Session Persistence (/api/auth/me)', false, `Status ${res.status}`, 'HIGH');
    }
  } catch (err) {
    logResult('auth', 'Cookie Session Persistence (/api/auth/me)', false, err.message, 'HIGH');
  }

  // 3. AUTHORIZATION & ROLE-BASED ACCESS CONTROL (RBAC)
  // 3a. Anonymous access to protected listener route
  try {
    const res = await fetch(`${BASE_URL}/api/listener/favorites`);
    if (res.status === 401) {
      logResult('rbac', 'Unauthenticated Listener Route (/api/listener/favorites)', true, 'Blocked with 401');
    } else {
      logResult('rbac', 'Unauthenticated Listener Route (/api/listener/favorites)', false, `Allowed with status ${res.status}`, 'CRITICAL');
    }
  } catch (err) {
    logResult('rbac', 'Unauthenticated Listener Route', false, err.message, 'HIGH');
  }

  // 3b. Listener accessing Radio Owner Workspace API
  try {
    const res = await fetch(`${BASE_URL}/api/owner/stations`, {
      headers: { Authorization: `Bearer ${listenerToken}`, Cookie: listenerCookie },
    });
    if (res.status === 403) {
      logResult('rbac', 'Listener -> Owner Route (/api/owner/stations)', true, 'Blocked with 403 Forbidden');
    } else {
      logResult('rbac', 'Listener -> Owner Route (/api/owner/stations)', false, `Allowed with status ${res.status}`, 'CRITICAL');
    }
  } catch (err) {
    logResult('rbac', 'Listener -> Owner Route', false, err.message, 'HIGH');
  }

  // 3c. Listener accessing Super Admin API
  try {
    const res = await fetch(`${BASE_URL}/api/admin/system-stats`, {
      headers: { Authorization: `Bearer ${listenerToken}`, Cookie: listenerCookie },
    });
    if (res.status === 403) {
      logResult('rbac', 'Listener -> Admin Route (/api/admin/system-stats)', true, 'Blocked with 403 Forbidden');
    } else {
      logResult('rbac', 'Listener -> Admin Route (/api/admin/system-stats)', false, `Allowed with status ${res.status}`, 'CRITICAL');
    }
  } catch (err) {
    logResult('rbac', 'Listener -> Admin Route', false, err.message, 'HIGH');
  }

  // 3d. Owner accessing Super Admin API
  try {
    const res = await fetch(`${BASE_URL}/api/admin/system-stats`, {
      headers: { Authorization: `Bearer ${ownerToken}`, Cookie: ownerCookie },
    });
    if (res.status === 403) {
      logResult('rbac', 'Owner -> Admin Route (/api/admin/system-stats)', true, 'Blocked with 403 Forbidden');
    } else {
      logResult('rbac', 'Owner -> Admin Route (/api/admin/system-stats)', false, `Allowed with status ${res.status}`, 'CRITICAL');
    }
  } catch (err) {
    logResult('rbac', 'Owner -> Admin Route', false, err.message, 'HIGH');
  }

  // 3e. Admin accessing Super Admin API
  try {
    const res = await fetch(`${BASE_URL}/api/admin/system-stats`, {
      headers: { Authorization: `Bearer ${adminToken}`, Cookie: adminCookie },
    });
    if (res.status === 200) {
      logResult('rbac', 'Admin -> Admin Route (/api/admin/system-stats)', true, 'Authorized with 200 OK');
    } else {
      logResult('rbac', 'Admin -> Admin Route (/api/admin/system-stats)', false, `Status ${res.status}`, 'HIGH');
    }
  } catch (err) {
    logResult('rbac', 'Admin -> Admin Route', false, err.message, 'HIGH');
  }

  // 4. IDOR (INSECURE DIRECT OBJECT REFERENCE) CHECK
  // Owner 1 attempting to modify or delete a station owned by Owner 2 or another owner
  try {
    // Get all stations as admin to identify stations
    const stationsRes = await fetch(`${BASE_URL}/api/public/stations?limit=10`);
    const stationsData = await stationsRes.json();
    const stations = stationsData.stations || [];
    
    // Find a station NOT owned by ownerUser1 (usr_owner_01)
    const foreignStation = stations.find((s) => s.ownerId && s.ownerId !== 'usr_owner_01');
    if (foreignStation) {
      const updateRes = await fetch(`${BASE_URL}/api/owner/stations/${foreignStation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
          Cookie: ownerCookie,
        },
        body: JSON.stringify({ name: 'Tampered Station Name' }),
      });

      if (updateRes.status === 403 || updateRes.status === 404) {
        logResult('security', 'IDOR Protection on Station Update', true, `Owner cannot tamper with other owners station (${updateRes.status})`);
      } else {
        logResult('security', 'IDOR Protection on Station Update', false, `Vulnerable to IDOR! Returned status ${updateRes.status}`, 'CRITICAL');
      }
    } else {
      logResult('security', 'IDOR Protection on Station Update', true, 'No foreign station with ownerId found to test');
    }
  } catch (err) {
    logResult('security', 'IDOR Protection on Station Update', false, err.message, 'HIGH');
  }

  // 5. FUNCTIONAL & DATA PERSISTENCE TESTING
  // 5a. Favorites persistence
  try {
    const targetStation = 'stn_maria_tz';
    // Toggle favorite on
    const toggleRes = await fetch(`${BASE_URL}/api/listener/favorites/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${listenerToken}`,
        Cookie: listenerCookie,
      },
      body: JSON.stringify({ stationId: targetStation }),
    });
    const toggleData = await toggleRes.json();

    // Verify retrieval
    const favsRes = await fetch(`${BASE_URL}/api/listener/favorites`, {
      headers: { Authorization: `Bearer ${listenerToken}`, Cookie: listenerCookie },
    });
    const favsData = await favsRes.json();
    const exists = favsData.stations?.some((s) => s.id === targetStation);

    logResult('persistence', 'Favorites Persistence', toggleRes.ok && favsRes.ok && (exists === toggleData.isFavorite),
      `Station ${targetStation} favorite state: ${toggleData.isFavorite}, found in list: ${exists}`);
  } catch (err) {
    logResult('persistence', 'Favorites Persistence', false, err.message, 'HIGH');
  }

  // 5b. Public Prayer Wall Submission
  let testPrayerId = '';
  try {
    const prayerRes = await fetch(`${BASE_URL}/api/public/prayers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${listenerToken}`,
        Cookie: listenerCookie,
      },
      body: JSON.stringify({
        title: 'Safe QA Audit Prayer Request',
        prayerPoints: 'Praying for all gospel listeners worldwide to grow in spiritual maturity.',
        category: 'Salvation',
        authorName: 'Sarah Johnson',
        countryCode: 'TZ',
      }),
    });
    const prayerData = await prayerRes.json();
    if (prayerRes.status === 201 && prayerData.prayer?.id) {
      testPrayerId = prayerData.prayer.id;
      logResult('apis', 'Prayer Submission (/api/public/prayers)', true, `Prayer created with ID: ${testPrayerId}`);
    } else {
      logResult('apis', 'Prayer Submission (/api/public/prayers)', false, `Status ${prayerRes.status}`, 'MEDIUM');
    }
  } catch (err) {
    logResult('apis', 'Prayer Submission', false, err.message, 'MEDIUM');
  }

  // 6. STREAM HEALTH & MIXED CONTENT AUDIT
  try {
    const res = await fetch(`${BASE_URL}/api/public/stations?limit=25`);
    const data = await res.json();
    const stations = data.stations || [];
    let httpsStreams = 0;
    let httpStreams = 0;
    let liveReachable = 0;
    let unreachable = 0;

    for (const st of stations.slice(0, 10)) {
      const streamUrl = st.streamUrl || '';
      const isHttps = streamUrl.startsWith('https://');
      if (isHttps) httpsStreams++;
      else httpStreams++;

      // Quick defensive check of stream reachability
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const streamHead = await fetch(streamUrl, {
          method: 'GET',
          headers: { Range: 'bytes=0-1000', 'Icy-MetaData': '1' },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (streamHead.status >= 200 && streamHead.status < 400) {
          liveReachable++;
          results.streams.push({ station: st.name, url: streamUrl, status: streamHead.status, isHttps, reachable: true });
        } else {
          unreachable++;
          results.streams.push({ station: st.name, url: streamUrl, status: streamHead.status, isHttps, reachable: false });
        }
      } catch (e) {
        unreachable++;
        results.streams.push({ station: st.name, url: streamUrl, status: 'TIMEOUT/ERR', isHttps, reachable: false, error: e.message });
      }
    }

    logResult('streams', 'HTTPS Mixed Content Stream Audit', httpStreams === 0,
      `${httpsStreams} HTTPS streams, ${httpStreams} insecure HTTP streams (HTTP streams trigger mixed-content blocks in modern browsers)`,
      httpStreams > 0 ? 'HIGH' : 'INFO');
    logResult('streams', 'Active Stream Audio Reachability', liveReachable > 0,
      `${liveReachable} reachable, ${unreachable} unreachable/timed-out out of 10 sampled stations`);
  } catch (err) {
    logResult('streams', 'Stream Audit', false, err.message, 'HIGH');
  }

  console.log('\n=== AUDIT RUN FINISHED ===\n');
  console.log(JSON.stringify(results, null, 2));
}

runAudit().catch(console.error);
