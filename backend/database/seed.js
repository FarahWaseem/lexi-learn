// Database seeding script
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  console.log('Seeding database...');
  // Add seeding logic here
  await pool.end();
}

seed().catch(console.error);
