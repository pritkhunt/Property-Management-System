const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../database/PropertyManagement.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

const createMessagesTable = `
  CREATE TABLE IF NOT EXISTS Messages (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    SenderId INTEGER NOT NULL,
    ReceiverId INTEGER NOT NULL,
    Message TEXT NOT NULL,
    IsRead INTEGER DEFAULT 0,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    SenderType TEXT NOT NULL CHECK(SenderType IN ('user', 'agent', 'admin')),
    ReceiverType TEXT NOT NULL CHECK(ReceiverType IN ('user', 'agent', 'admin')),
    FOREIGN KEY (SenderId) REFERENCES Users(Id),
    FOREIGN KEY (ReceiverId) REFERENCES Agents(Id)
  )
`;

// Note: Foreign keys are tricky with mixed types (User/Agent), so we might relax strict FKs 
// or rely on application logic if SenderId can be either User or Agent table.
// For now, let's keep it simple without strict FK constraints on the table definition 
// because SenderId could refer to Users table OR Agents table depending on SenderType.
// SQLite doesn't support conditional foreign keys.

const createMessagesTableFlexible = `
  CREATE TABLE IF NOT EXISTS Messages (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    SenderId INTEGER NOT NULL,
    ReceiverId INTEGER NOT NULL,
    Message TEXT NOT NULL,
    IsRead INTEGER DEFAULT 0,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    SenderType TEXT NOT NULL CHECK(SenderType IN ('user', 'agent', 'admin')),
    ReceiverType TEXT NOT NULL CHECK(ReceiverType IN ('user', 'agent', 'admin'))
  )
`;

db.serialize(() => {
  db.run(createMessagesTableFlexible, (err) => {
    if (err) {
      console.error('Error creating Messages table:', err.message);
    } else {
      console.log('Messages table created successfully.');
    }
  });
  
  // Create indexes for faster querying
  db.run(`CREATE INDEX IF NOT EXISTS idx_messages_sender ON Messages(SenderId, SenderType)`, (err) => {
    if (err) console.error('Error creating sender index:', err);
  });
  
  db.run(`CREATE INDEX IF NOT EXISTS idx_messages_receiver ON Messages(ReceiverId, ReceiverType)`, (err) => {
    if (err) console.error('Error creating receiver index:', err);
  });
});

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  } else {
    console.log('Database connection closed.');
  }
});
