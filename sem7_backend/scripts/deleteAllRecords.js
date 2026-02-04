require('dotenv').config();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const readline = require('readline');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../database/PropertyManagement.db');

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const deleteAllRecords = () => {
  const db = new sqlite3.Database(DB_PATH);
  
  console.log('⚠️  WARNING: DELETE ALL RECORDS');
  console.log('═'.repeat(80));
  console.log('📁 Database:', DB_PATH);
  console.log('');
  console.log('This will DELETE ALL records from:');
  console.log('  ❌ Users table');
  console.log('  ❌ Agents table');
  console.log('  ❌ OTPs table');
  console.log('');
  console.log('⚠️  THIS ACTION CANNOT BE UNDONE!');
  console.log('═'.repeat(80));
  console.log('');

  rl.question('Are you sure you want to delete ALL records? (yes/no): ', (answer) => {
    if (answer.toLowerCase() !== 'yes') {
      console.log('\n✅ Operation cancelled. No records were deleted.');
      rl.close();
      db.close();
      return;
    }

    console.log('\n🗑️  Deleting all records...\n');

    // Delete all OTPs first (no foreign key constraints)
    db.run('DELETE FROM OTPs', (err) => {
      if (err) {
        console.error('❌ Error deleting OTPs:', err);
      } else {
        console.log('✅ Deleted all OTPs');
      }

      // Delete all Users
      db.run('DELETE FROM Users', (err) => {
        if (err) {
          console.error('❌ Error deleting Users:', err);
        } else {
          console.log('✅ Deleted all Users');
        }

        // Delete all Agents
        db.run('DELETE FROM Agents', (err) => {
          if (err) {
            console.error('❌ Error deleting Agents:', err);
          } else {
            console.log('✅ Deleted all Agents');
          }

          // Reset auto-increment counters
          db.run('DELETE FROM sqlite_sequence WHERE name="Users"', (err) => {
            if (err) console.error('⚠️  Could not reset Users ID counter');
          });

          db.run('DELETE FROM sqlite_sequence WHERE name="Agents"', (err) => {
            if (err) console.error('⚠️  Could not reset Agents ID counter');
          });

          db.run('DELETE FROM sqlite_sequence WHERE name="OTPs"', (err) => {
            if (err) console.error('⚠️  Could not reset OTPs ID counter');
          });

          console.log('✅ Reset ID counters');

          // Verify deletion
          db.get('SELECT COUNT(*) as count FROM Users', (err, result) => {
            console.log(`\n📊 Users remaining: ${result.count}`);
          });

          db.get('SELECT COUNT(*) as count FROM Agents', (err, result) => {
            console.log(`📊 Agents remaining: ${result.count}`);
          });

          db.get('SELECT COUNT(*) as count FROM OTPs', (err, result) => {
            console.log(`📊 OTPs remaining: ${result.count}`);
            
            db.close(() => {
              console.log('\n✅ Database cleaned successfully!');
              console.log('💡 You can now create new admin or test users.\n');
              rl.close();
            });
          });
        });
      });
    });
  });
};

deleteAllRecords();
