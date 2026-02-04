require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../database/PropertyManagement.db');

console.log('🔧 Creating PropertyLikes table...');
console.log('Database path:', DB_PATH);

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

const createPropertyLikesTableSQL = `
CREATE TABLE IF NOT EXISTS PropertyLikes (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  UserId INTEGER NOT NULL,
  PropertyId INTEGER NOT NULL,
  CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
  FOREIGN KEY (PropertyId) REFERENCES Properties(Id) ON DELETE CASCADE,
  UNIQUE(UserId, PropertyId)
);
`;

const createIndexesSQL = `
CREATE INDEX IF NOT EXISTS IX_PropertyLikes_UserId ON PropertyLikes(UserId);
CREATE INDEX IF NOT EXISTS IX_PropertyLikes_PropertyId ON PropertyLikes(PropertyId);
`;

db.serialize(() => {
  db.run(createPropertyLikesTableSQL, (err) => {
    if (err) {
      console.error('❌ Error creating PropertyLikes table:', err);
      process.exit(1);
    } else {
      console.log('✅ PropertyLikes table created successfully');
    }
  });

  db.exec(createIndexesSQL, (err) => {
    if (err) {
      console.error('❌ Error creating indexes:', err);
    } else {
      console.log('✅ Indexes created successfully');
    }
  });

  db.close((err) => {
    if (err) {
      console.error('❌ Error closing database:', err);
    } else {
      console.log('🎉 Done!');
    }
  });
});
