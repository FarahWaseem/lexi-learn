const { query, connectDB } = require('../config/database');
const fs = require('fs');
const path = require('path');

const runMigrations = async () => {
  try {
    console.log('🔄 Starting database migrations...');
    
    // Connect to database
    await connectDB();
    
    // Get migration files
    const migrationsDir = path.join(__dirname, '../../database/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`📁 Found ${migrationFiles.length} migration files`);
    
    // Create migrations table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Get already executed migrations
    const executedMigrations = await query('SELECT filename FROM migrations');
    const executedFilenames = executedMigrations.rows.map(row => row.filename);
    
    // Run pending migrations
    for (const filename of migrationFiles) {
      if (!executedFilenames.includes(filename)) {
        console.log(`🔄 Running migration: ${filename}`);
        
        const migrationSQL = fs.readFileSync(
          path.join(migrationsDir, filename), 
          'utf8'
        );
        
        await query(migrationSQL);
        
        // Record migration as executed
        await query(
          'INSERT INTO migrations (filename) VALUES ($1)',
          [filename]
        );
        
        console.log(`✅ Migration ${filename} completed`);
      } else {
        console.log(`⏭️  Migration ${filename} already executed`);
      }
    }
    
    console.log('🎉 All migrations completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };

