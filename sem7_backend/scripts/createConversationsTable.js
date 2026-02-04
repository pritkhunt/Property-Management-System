const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/PropertyManagement.db');
const db = new sqlite3.Database(dbPath);

const createConversationsTable = () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS Conversations (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      User1Id INTEGER NOT NULL,
      User1Type TEXT NOT NULL CHECK(User1Type IN ('user', 'agent')),
      User2Id INTEGER NOT NULL,
      User2Type TEXT NOT NULL CHECK(User2Type IN ('user', 'agent')),
      LastMessageId INTEGER,
      LastMessageTime DATETIME,
      CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(User1Id, User1Type, User2Id, User2Type)
    )
  `;

  db.run(createTableSQL, (err) => {
    if (err) {
      console.error('❌ Error creating Conversations table:', err.message);
    } else {
      console.log('✅ Conversations table created successfully');
    }
    db.close();
  });
};

createConversationsTable();
