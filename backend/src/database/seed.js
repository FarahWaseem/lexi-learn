const { query, connectDB } = require('../config/database');
const fs = require('fs');
const path = require('path');

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Read and execute seed file
    const seedFilePath = path.join(__dirname, 'seed-lessons.sql');
    const seedSQL = fs.readFileSync(seedFilePath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = seedSQL.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        await query(statement);
      }
    }
    
    console.log('✅ Database seeded successfully!');
    console.log('📊 Sample data added:');
    console.log('   - 10 lessons');
    console.log('   - 80 vocabulary words');
    console.log('   - 60 practice questions');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
