const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// Database configuration
const dbPath = process.env.DB_PATH || path.join(__dirname, '../database/PropertyManagement.db');

console.log('🧪 Testing Notification Insertion...\n');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to database\n');
});

// Test notification insertion
const testNotificationInsertion = () => {
  console.log('📝 Test 1: Inserting test notification...\n');
  
  const testNotification = {
    userId: 1,
    agentId: null,
    adminId: null,
    type: 'test',
    title: 'Test Notification',
    message: 'This is a test notification to verify insertion is working.',
    link: '/dashboard',
    isRead: 0
  };
  
  db.run(
    'INSERT INTO Notifications (UserId, AgentId, AdminId, Type, Title, Message, Link, IsRead) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [testNotification.userId, testNotification.agentId, testNotification.adminId, 
     testNotification.type, testNotification.title, testNotification.message, 
     testNotification.link, testNotification.isRead],
    function(err) {
      if (err) {
        console.error('❌ Error inserting notification:', err.message);
        db.close();
        process.exit(1);
      }
      
      console.log('✅ Test notification inserted successfully!');
      console.log(`   Notification ID: ${this.lastID}\n`);
      
      // Verify insertion
      db.get(
        'SELECT * FROM Notifications WHERE Id = ?',
        [this.lastID],
        (err, row) => {
          if (err) {
            console.error('❌ Error retrieving notification:', err.message);
          } else {
            console.log('📋 Inserted notification details:');
            console.log('   ID:', row.Id);
            console.log('   UserId:', row.UserId);
            console.log('   AgentId:', row.AgentId);
            console.log('   AdminId:', row.AdminId);
            console.log('   Type:', row.Type);
            console.log('   Title:', row.Title);
            console.log('   Message:', row.Message);
            console.log('   Link:', row.Link);
            console.log('   IsRead:', row.IsRead);
            console.log('   CreatedAt:', row.CreatedAt);
            console.log('');
          }
          
          // Count all notifications
          const insertedId = this.lastID;
          db.get('SELECT COUNT(*) as count FROM Notifications', (err, result) => {
            if (err) {
              console.error('❌ Error counting notifications:', err.message);
            } else {
              console.log('📊 Total notifications in database:', result.count);
            }
            
            // Clean up test notification
            db.run('DELETE FROM Notifications WHERE Id = ?', [insertedId], (err) => {
              if (err) {
                console.error('⚠️  Warning: Could not delete test notification');
              } else {
                console.log('🗑️  Test notification deleted (cleanup)\n');
              }
              
              console.log('═══════════════════════════════════════');
              console.log('✅ NOTIFICATION INSERTION TEST PASSED!');
              console.log('═══════════════════════════════════════\n');
              
              console.log('Next steps:');
              console.log('1. Register a new agent to test real notifications');
              console.log('2. Check admin dashboard for notification');
              console.log('3. Approve/reject agent to test agent notifications\n');
              
              db.close((err) => {
                if (err) {
                  console.error('❌ Error closing database:', err.message);
                }
                process.exit(0);
              });
            });
          });
        }
      );
    }
  );
};

// Run the test
testNotificationInsertion();
