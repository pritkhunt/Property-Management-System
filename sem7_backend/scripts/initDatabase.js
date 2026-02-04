require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../database/PropertyManagement.db');
const SQL_FILE = path.join(__dirname, '../../CreateTables.sql');

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('Created database directory:', dbDir);
}

// Initialize database with schema
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      
      console.log('Connected to database:', DB_PATH);
      
      // Check if SQL file exists
      if (!fs.existsSync(SQL_FILE)) {
        console.log('SQL file not found. Database already exists.');
        db.close();
        resolve();
        return;
      }
      
      // Read SQL file
      const sql = fs.readFileSync(SQL_FILE, 'utf8');
      
      // Execute SQL statements
      db.exec(sql, (err) => {
        if (err) {
          console.error('Error executing SQL:', err);
          db.close();
          reject(err);
          return;
        }
        
        console.log('Database initialized successfully!');
        console.log('Tables created:');
        console.log('  - Users');
        console.log('  - Agents');
        console.log('  - OTPs');
        
        db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
            reject(err);
          } else {
            console.log('Database connection closed.');
            resolve();
          }
        });
      });
    });
  });
};

// Run initialization
initDatabase()
  .then(() => {
    console.log('\n✅ Database initialization complete!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Database initialization failed:', err);
    process.exit(1);
  });
