const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// Database configuration
const dbPath = process.env.DB_PATH || path.join(__dirname, '../database/PropertyManagement.db');

console.log('📊 Creating Notifications Table...');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

// Create Notifications table
const createNotificationsTable = `
CREATE TABLE IF NOT EXISTS Notifications (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  UserId INTEGER,
  AgentId INTEGER,
  AdminId INTEGER,
  Type VARCHAR(50) NOT NULL,
  Title VARCHAR(255) NOT NULL,
  Message TEXT NOT NULL,
  Link VARCHAR(255),
  IsRead INTEGER DEFAULT 0,
  CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
  FOREIGN KEY (AgentId) REFERENCES Agents(Id) ON DELETE CASCADE
)`;

db.run(createNotificationsTable, (err) => {
  if (err) {
    console.error('❌ Error creating Notifications table:', err.message);
    process.exit(1);
  }
  
  console.log('✅ Notifications table created successfully');
  
  // Create indexes for better performance
  db.run('CREATE INDEX IF NOT EXISTS idx_notifications_userid ON Notifications(UserId)', (err) => {
    if (err) console.error('⚠️  Warning: Could not create UserId index');
  });
  
  db.run('CREATE INDEX IF NOT EXISTS idx_notifications_agentid ON Notifications(AgentId)', (err) => {
    if (err) console.error('⚠️  Warning: Could not create AgentId index');
  });
  
  db.run('CREATE INDEX IF NOT EXISTS idx_notifications_adminid ON Notifications(AdminId)', (err) => {
    if (err) console.error('⚠️  Warning: Could not create AdminId index');
  });
  
  db.run('CREATE INDEX IF NOT EXISTS idx_notifications_type ON Notifications(Type)', (err) => {
    if (err) console.error('⚠️  Warning: Could not create Type index');
  });
  
  // Insert sample notifications for testing
  const sampleNotifications = [
    {
      adminId: 1,
      type: 'agent_registration',
      title: 'New Agent Registration',
      message: 'A new agent has registered and is awaiting approval',
      link: '/admin/agents'
    },
    {
      userId: 1,
      type: 'general',
      title: 'Welcome!',
      message: 'Welcome to the Property Management System',
      link: '/dashboard'
    }
  ];
  
  const insertStmt = db.prepare(`
    INSERT INTO Notifications (UserId, AgentId, AdminId, Type, Title, Message, Link, IsRead)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0)
  `);
  
  sampleNotifications.forEach(notif => {
    insertStmt.run(
      notif.userId || null,
      notif.agentId || null,
      notif.adminId || null,
      notif.type,
      notif.title,
      notif.message,
      notif.link
    );
  });
  
  insertStmt.finalize((err) => {
    if (err) {
      console.error('⚠️  Warning: Could not insert sample notifications');
    } else {
      console.log('✅ Sample notifications inserted');
    }
    
    // Close database connection
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err.message);
      } else {
        console.log('✅ Database connection closed');
        console.log('\n🎉 Notifications table setup complete!');
      }
    });
  });
});
