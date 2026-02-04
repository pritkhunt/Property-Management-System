require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../database/PropertyManagement.db');

console.log('🔧 Adding RelatedId column to Notifications table...');
console.log('Database path:', DB_PATH);

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
    process.exit(1);
  }
  console.log('✅ Connected to database\n');
});

// Check if column exists first
db.all("PRAGMA table_info(Notifications)", (err, columns) => {
  if (err) {
    console.error('❌ Error checking table schema:', err);
    db.close();
    process.exit(1);
  }
  
  const hasRelatedId = columns.some(col => col.name === 'RelatedId');
  
  if (hasRelatedId) {
    console.log('ℹ️  RelatedId column already exists');
    db.close(() => {
      console.log('✅ Database connection closed');
      process.exit(0);
    });
    return;
  }
  
  console.log('📝 Current Notifications table columns:');
  columns.forEach(col => {
    console.log(`   - ${col.name} (${col.type})`);
  });
  
  console.log('\n🔨 Adding RelatedId column...');
  
  // Add RelatedId column
  db.run(`ALTER TABLE Notifications ADD COLUMN RelatedId INTEGER`, (err) => {
    if (err) {
      console.error('❌ Error adding RelatedId column:', err);
      db.close();
      process.exit(1);
    }
    
    console.log('✅ RelatedId column added successfully');
    
    // Create index for better performance
    db.run('CREATE INDEX IF NOT EXISTS idx_notifications_relatedid ON Notifications(RelatedId)', (err) => {
      if (err) {
        console.error('⚠️  Warning: Could not create RelatedId index:', err.message);
      } else {
        console.log('✅ Index created on RelatedId column');
      }
      
      // Verify the change
      db.all("PRAGMA table_info(Notifications)", (err, updatedColumns) => {
        if (err) {
          console.error('❌ Error verifying changes:', err);
        } else {
          console.log('\n📊 Updated Notifications table columns:');
          updatedColumns.forEach(col => {
            const marker = col.name === 'RelatedId' ? ' ← NEW' : '';
            console.log(`   - ${col.name} (${col.type})${marker}`);
          });
        }
        
        // Close database connection
        db.close((err) => {
          if (err) {
            console.error('❌ Error closing database:', err);
            process.exit(1);
          } else {
            console.log('\n✅ Database connection closed');
            console.log('🎉 Migration completed successfully!\n');
            console.log('📝 Summary:');
            console.log('   - Added RelatedId column to Notifications table');
            console.log('   - Created index on RelatedId for better performance');
            console.log('   - Ready to handle property approvals and notifications\n');
            process.exit(0);
          }
        });
      });
    });
  });
});
