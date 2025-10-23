import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 1, // Single user untuk warm-up
  iterations: 1, // Run once
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3006/api';

export function setup() {
  console.log('🔥 Starting Cache Warm-up...');
  console.log(`📍 Target: ${BASE_URL}`);
  
  // Login
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    username: 'ahda.admin',
    password: 'Password123!',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginRes.status !== 200) {
    throw new Error(`Login failed: ${loginRes.status}`);
  }

  const token = loginRes.json('access_token');
  console.log('✅ Login successful');
  
  return { token };
}

export default function (data) {
  const params = {
    headers: {
      'Authorization': `Bearer ${data.token}`,
      'Content-Type': 'application/json',
    },
  };

  console.log('\n🔄 Warming up cache...\n');

  // 1. All users
  console.log('📦 Caching: GET /users');
  http.get(`${BASE_URL}/users`, params);
  sleep(0.1);

  // 2. Active users
  console.log('📦 Caching: GET /users?isActive=true');
  http.get(`${BASE_URL}/users?isActive=true`, params);
  sleep(0.1);

  // 3. Inactive users
  console.log('📦 Caching: GET /users?isActive=false');
  http.get(`${BASE_URL}/users?isActive=false`, params);
  sleep(0.1);

  // 4. User by ID (1-7)
  for (let id = 1; id <= 7; id++) {
    console.log(`📦 Caching: GET /users/${id}`);
    http.get(`${BASE_URL}/users/${id}`, params);
    sleep(0.05);
  }

  // 5. User stats
  console.log('📦 Caching: GET /users/stats');
  http.get(`${BASE_URL}/users/stats`, params);
  sleep(0.1);

  // 6. Search common terms
  const searchTerms = ['ahda', 'ammaru', 'admin', 'tu', 'bidang', 'kholifah', 'mariana'];
  searchTerms.forEach(term => {
    console.log(`📦 Caching: GET /users/search?q=${term}`);
    http.get(`${BASE_URL}/users/search?q=${term}`, params);
    sleep(0.05);
  });

  // 7. By role
  const roles = ['admin', 'staf_tu', 'pimpinan', 'staf_bidang'];
  roles.forEach(role => {
    console.log(`📦 Caching: GET /users/by-role/${role}`);
    http.get(`${BASE_URL}/users/by-role/${role}`, params);
    sleep(0.05);
  });

  // 8. Auth endpoints
  console.log('📦 Caching: GET /auth/me');
  http.get(`${BASE_URL}/auth/me`, params);
  sleep(0.1);

  console.log('📦 Caching: GET /auth/session');
  http.get(`${BASE_URL}/auth/session`, params);
  sleep(0.1);

  console.log('\n✅ Cache warm-up completed!');
  console.log('\n💡 Now run the load test:');
  console.log('   k6 run k6-load-test.js');
  console.log('\n📊 Expected performance:');
  console.log('   - 95% requests < 10ms (from cache)');
  console.log('   - 99% requests < 20ms');
  console.log('   - Error rate < 1%');
  console.log('\n');
}
