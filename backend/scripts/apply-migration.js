#!/usr/bin/env node
/**
 * Apply database migration
 * Usage: node scripts/apply-migration.js <migration-file>
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function applyMigration(migrationFile) {
  const migrationPath = path.join(__dirname, '../database/migrations', migrationFile);
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  console.log(`📦 Applying migration: ${migrationFile}`);
  console.log(`📄 SQL:\n${sql}\n`);

  try {
    await pool.query(sql);
    console.log('✅ Migration applied successfully');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    await pool.end();
  }
}

const migrationFile = process.argv[2] || '001_add_clerk_user_id.sql';
applyMigration(migrationFile).catch(err => {
  console.error(err);
  process.exit(1);
});

