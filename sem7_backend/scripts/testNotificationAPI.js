const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// Database configuration
const dbPath = process.env.DB_PATH || path.join(__dirname, '../database/PropertyManagement.db');

console.log('🧪 Testing Notification API Setup...\n');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to database\n');
});

// Test 1: Check if Notifications table exists
console.log('📋 Test 1: Checking if Notifications table exists...');
db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='Notifications'`, (err, row) => {
  if (err) {
    console.error('❌ Error checking table:', err.message);
  } else if (row) {
    console.log('✅ Notifications table exists\n');
    
    // Test 2: Check table structure
    console.log('📋 Test 2: Checking table structure...');
    db.all(`PRAGMA table_info(Notifications)`, (err, columns) => {
      if (err) {
        console.error('❌ Error getting table info:', err.message);
      } else {
        console.log('✅ Table structure:');
        columns.forEach(col => {
          console.log(`   - ${col.name} (${col.type})`);
        });
        console.log('');
        
        // Test 3: Count notifications
        console.log('📋 Test 3: Counting notifications...');
        db.get(`SELECT COUNT(*) as count FROM Notifications`, (err, result) => {
          if (err) {
            console.error('❌ Error counting notifications:', err.message);
          } else {
            console.log(`✅ Total notifications: ${result.count}\n`);
            
            // Test 4: Show sample notifications
            console.log('📋 Test 4: Showing sample notifications...');
            db.all(`SELECT * FROM Notifications LIMIT 5`, (err, notifications) => {
              if (err) {
                console.error('❌ Error fetching notifications:', err.message);
              } else {
                console.log(`✅ Sample notifications (first 5):`);
                notifications.forEach(notif => {
                  console.log(`\n   ID: ${notif.Id}`);
                  console.log(`   Type: ${notif.Type}`);
                  console.log(`   Title: ${notif.Title}`);
                  console.log(`   Message: ${notif.Message}`);
                  console.log(`   IsRead: ${notif.IsRead ? 'Yes' : 'No'}`);
                  console.log(`   UserId: ${notif.UserId || 'N/A'}`);
                  console.log(`   AgentId: ${notif.AgentId || 'N/A'}`);
                  console.log(`   AdminId: ${notif.AdminId || 'N/A'}`);
                });
                console.log('\n');
                
                // Test 5: Check indexes
                console.log('📋 Test 5: Checking indexes...');
                db.all(`SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='Notifications'`, (err, indexes) => {
                  if (err) {
                    console.error('❌ Error checking indexes:', err.message);
                  } else {
                    console.log('✅ Indexes:');
                    indexes.forEach(idx => {
                      console.log(`   - ${idx.name}`);
                    });
                    console.log('\n');
                    
                    // Summary
                    console.log('═══════════════════════════════════════');
                    console.log('📊 SUMMARY');
                    console.log('═══════════════════════════════════════');
                    console.log('✅ Notifications table: EXISTS');
                    console.log(`✅ Total notifications: ${result.count}`);
                    console.log(`✅ Columns: ${columns.length}`);
                    console.log(`✅ Indexes: ${indexes.length}`);
                    console.log('═══════════════════════════════════════\n');
                    
                    console.log('🎉 All tests passed! Notification API should work now.\n');
                    console.log('Next steps:');
                    console.log('1. Make sure backend server is running: npm run dev');
                    console.log('2. Refresh your dashboard in the browser');
                    console.log('3. Click the notification bell icon');
                    console.log('4. Notifications should load successfully!\n');
                    
                    // Close database
                    db.close((err) => {
                      if (err) {
                        console.error('❌ Error closing database:', err.message);
                      }
                      process.exit(0);
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  } else {
    console.error('❌ Notifications table does NOT exist!');
    console.log('\n⚠️  Run this command to create it:');
    console.log('   npm run create-notifications-table\n');
    db.close();
    process.exit(1);
  }
});
