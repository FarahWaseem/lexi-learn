#!/usr/bin/env node
require('dotenv').config();
console.log('📋 Environment check:');
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
console.log('- CLERK_SECRET_KEY:', process.env.CLERK_SECRET_KEY ? '✅ Set' : '❌ Missing');
console.log('- PORT:', process.env.PORT || 3001);
console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');

console.log('\n🔌 Testing database connection...');
const { pool } = require('./src/services/db');
pool.query('SELECT NOW()')
  .then(() => {
    console.log('✅ Database connected');
    pool.end();
    
    console.log('\n🚀 Starting server...');
    require('./server.js');
  })
  .catch(err => {
    console.error('❌ Database error:', err.message);
    process.exit(1);
  });

