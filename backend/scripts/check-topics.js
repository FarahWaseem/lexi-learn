#!/usr/bin/env node
require('dotenv').config();
const { pool } = require('../src/services/db');

async function checkTopics() {
  try {
    console.log('🔍 Checking daily_topics...');
    const result = await pool.query('SELECT COUNT(*) as count FROM daily_topics');
    console.log(`✅ Found ${result.rows[0].count} topics in database`);
    
    if (result.rows[0].count === '0') {
      console.log('\n⚠️  No topics found! Need to run seed-lessons.sql');
      console.log('Run: psql -U <user> -d <database> -f database/seed-lessons.sql');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkTopics();

