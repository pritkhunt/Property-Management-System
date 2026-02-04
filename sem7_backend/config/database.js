const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database configuration
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../database/PropertyManagement.db');

// Create database connection
let db;

const connectDB = () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error connecting to database:', err);
        reject(err);
      } else {
        console.log('Connected to SQLite database at:', DB_PATH);
        
        // Set busy timeout to 3 seconds (3000ms)
        db.run('PRAGMA busy_timeout = 3000', (err) => {
          if (err) {
            console.error('Error setting busy timeout:', err);
          }
        });
        
        // Enable WAL mode for better concurrency
        db.run('PRAGMA journal_mode = WAL', (err) => {
          if (err) {
            console.error('Error setting WAL mode:', err);
          }
        });
        
        // Enable foreign keys
        db.run('PRAGMA foreign_keys = ON', (err) => {
          if (err) {
            console.error('Error enabling foreign keys:', err);
            reject(err);
          } else {
            resolve(db);
          }
        });
      }
    });
  });
};

// Get database instance
const getDB = () => {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
};

// Utility function to run queries with promises
const runQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

// Utility function to get a single row
const getOne = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Utility function to get all rows
const getAll = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Close database connection
const closeDB = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database connection closed.');
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
};

module.exports = {
  connectDB,
  getDB,
  runQuery,
  getOne,
  getAll,
  closeDB
};
