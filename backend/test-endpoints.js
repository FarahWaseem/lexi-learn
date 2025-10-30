#!/usr/bin/env node
// Quick test script to verify endpoints are working

const http = require('http');

function testEndpoint(path, description) {
  return new Promise((resolve) => {
    console.log(`\n🔍 Testing: ${description}`);
    console.log(`   Path: ${path}`);
    
    const req = http.get(`http://localhost:3001${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`   ✅ Status: ${res.statusCode}`);
        console.log(`   Response: ${data.substring(0, 100)}${data.length > 100 ? '...' : ''}`);
        resolve();
      });
    });
    
    req.on('error', (err) => {
      console.log(`   ❌ Error: ${err.message}`);
      resolve();
    });
    
    req.setTimeout(5000, () => {
      console.log('   ⏱️  Timeout');
      req.destroy();
      resolve();
    });
  });
}

async function runTests() {
  console.log('🚀 Testing LexiLearn Backend Endpoints\n');
  console.log('=' .repeat(50));
  
  await testEndpoint('/', 'Root endpoint');
  await testEndpoint('/api/me', 'User endpoint (no auth - should fail)');
  
  console.log('\n' + '='.repeat(50));
  console.log('\n✅ Test complete!');
  console.log('\nNote: /api/me requires Clerk authentication, so 401 is expected.');
  console.log('Frontend should handle authentication automatically.\n');
}

runTests();

