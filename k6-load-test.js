import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const cacheHitRate = new Rate('cache_hits');

export const options = {
  // 🚀 Load Test Stages
  stages: [
    { duration: '30s', target: 10 },    // Warm-up: 10 concurrent users
    { duration: '1m', target: 50 },     // Ramp-up: 50 users
    { duration: '2m', target: 100 },    // Peak load: 100 users
    { duration: '2m', target: 200 },    // Stress test: 200 users
    { duration: '1m', target: 50 },     // Scale down
    { duration: '30s', target: 0 },     // Cool down
  ],

  // 🎯 Performance Thresholds (AGGRESSIVE for cached responses!)
  thresholds: {
    'http_req_duration': ['p(95)<100', 'p(99)<200'], // 95% < 100ms, 99% < 200ms
    'http_req_duration{cached:true}': ['p(95)<10', 'p(99)<20'], // Cache: 95% < 10ms!
    'http_req_failed': ['rate<0.01'], // Error rate < 1%
    'errors': ['rate<0.05'], // Custom error rate < 5%
    'cache_hits': ['rate>0.80'], // Cache hit rate > 80% after warm-up
  },

  // 💡 Test Configuration
  noConnectionReuse: false, // Reuse connections untuk performa
  insecureSkipTLSVerify: true,
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3006/api';

// 🔐 Setup: Login dan dapatkan token
export function setup() {
  console.log('🚀 Starting K6 Load Test...');
  console.log(`📍 Target: ${BASE_URL}`);
  
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    username: 'ahda.admin',
    password: 'Password123!',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginRes.status !== 200) {
    throw new Error(`Login failed: ${loginRes.status} ${loginRes.body}`);
  }

  const token = loginRes.json('access_token');
  console.log('✅ Login successful, token obtained');
  
  return { token };
}

// 🎯 Main Load Test Function
export default function (data) {
  const params = {
    headers: {
      'Authorization': `Bearer ${data.token}`,
      'Content-Type': 'application/json',
    },
    tags: { cached: 'false' }, // Will update based on response time
  };

  // ==========================================
  // Test 1: Get All Users (Most Common Query)
  // ==========================================
  let res = http.get(`${BASE_URL}/users`, params);
  
  // Check if response is from cache (fast response = cache hit)
  const isCached = res.timings.duration < 50;
  cacheHitRate.add(isCached);
  
  const usersCheck = check(res, {
    '[Users] Status 200': (r) => r.status === 200,
    '[Users] Fast response (<100ms)': (r) => r.timings.duration < 100,
    '[Users] ULTRA fast (<10ms)': (r) => r.timings.duration < 10, // Cache target!
    '[Users] Has data': (r) => Array.isArray(r.json()),
  }, { cached: isCached ? 'true' : 'false' });
  
  errorRate.add(!usersCheck);

  // ==========================================
  // Test 2: Get Active Users Only (Filtered)
  // ==========================================
  res = http.get(`${BASE_URL}/users?isActive=true`, params);
  
  check(res, {
    '[Active Users] Status 200': (r) => r.status === 200,
    '[Active Users] Fast (<100ms)': (r) => r.timings.duration < 100,
  });

  // ==========================================
  // Test 3: Get User by ID (Detail View)
  // ==========================================
  const userId = Math.floor(Math.random() * 7) + 1; // Random user 1-7
  res = http.get(`${BASE_URL}/users/${userId}`, params);
  
  check(res, {
    '[User Detail] Status 200': (r) => r.status === 200,
    '[User Detail] Fast (<100ms)': (r) => r.timings.duration < 100,
    '[User Detail] Has username': (r) => r.json('username') !== undefined,
  });

  // ==========================================
  // Test 4: Get User Stats (Dashboard)
  // ==========================================
  res = http.get(`${BASE_URL}/users/stats`, params);
  
  check(res, {
    '[Stats] Status 200': (r) => r.status === 200,
    '[Stats] Fast (<100ms)': (r) => r.timings.duration < 100,
    '[Stats] Has total': (r) => r.json('total') !== undefined,
  });

  // ==========================================
  // Test 5: Search Users (Autocomplete)
  // ==========================================
  const searchTerms = ['ahda', 'ammaru', 'admin', 'tu', 'bidang'];
  const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  
  res = http.get(`${BASE_URL}/users/search?q=${searchTerm}`, params);
  
  check(res, {
    '[Search] Status 200': (r) => r.status === 200,
    '[Search] Fast (<100ms)': (r) => r.timings.duration < 100,
  });

  // ==========================================
  // Test 6: Get Users by Role (Dropdown)
  // ==========================================
  const roles = ['admin', 'staf_tu', 'pimpinan', 'staf_bidang'];
  const role = roles[Math.floor(Math.random() * roles.length)];
  
  res = http.get(`${BASE_URL}/users/by-role/${role}`, params);
  
  check(res, {
    '[By Role] Status 200': (r) => r.status === 200,
    '[By Role] Fast (<100ms)': (r) => r.timings.duration < 100,
  });

  // ==========================================
  // Test 7: Auth Me (Session Check)
  // ==========================================
  res = http.get(`${BASE_URL}/auth/me`, params);
  
  check(res, {
    '[Auth Me] Status 200': (r) => r.status === 200,
    '[Auth Me] Fast (<50ms)': (r) => r.timings.duration < 50,
  });

  // ==========================================
  // Test 8: Get Session Info (Redis)
  // ==========================================
  res = http.get(`${BASE_URL}/auth/session`, params);
  
  check(res, {
    '[Session] Status 200': (r) => r.status === 200,
    '[Session] ULTRA fast (<10ms)': (r) => r.timings.duration < 10, // Redis direct!
  });

  // Small delay untuk simulate user think time
  sleep(Math.random() * 0.5 + 0.1); // 0.1-0.6 seconds
}

// 📊 Teardown: Summary
export function teardown(data) {
  console.log('\n');
  console.log('═══════════════════════════════════════');
  console.log('🏁 K6 Load Test Completed!');
  console.log('═══════════════════════════════════════');
  console.log('\n📈 Check the summary above for results');
  console.log('\n💡 Tips:');
  console.log('   - Look for "http_req_duration" p(95) < 100ms');
  console.log('   - Cache hits should be > 80% after warm-up');
  console.log('   - Error rate should be < 1%');
  console.log('\n🔍 Check Redis logs:');
  console.log('   tail -f logs/combined.log | grep CACHE');
  console.log('\n');
}
