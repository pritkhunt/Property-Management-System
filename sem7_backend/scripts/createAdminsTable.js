require('dotenv').config();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../database/PropertyManagement.db');
const SQL_FILE = path.join(__dirname, '../database/CreateAdminsTable.sql');

const createAdminsTable = () => {
  const db = new sqlite3.Database(DB_PATH);
  
  console.log('📋 CREATE ADMINS TABLE');
  console.log('═'.repeat(80));
  console.log('📁 Database:', DB_PATH);
  console.log('📄 SQL File:', SQL_FILE);
  console.log('');

  // Read SQL file
  const sql = fs.readFileSync(SQL_FILE, 'utf8');
  
  // Execute SQL
  db.exec(sql, (err) => {
    if (err) {
      console.error('❌ Error creating Admins table:', err);
      db.close();
      return;
    }

    console.log('✅ Admins table created successfully!');
    
    // Verify table was created
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='Admins'", (err, row) => {
      if (err) {
        console.error('❌ Error verifying table:', err);
      } else if (row) {
        console.log('✅ Verified: Admins table exists in database');
        console.log('');
        console.log('📋 Table Structure:');
        console.log('─'.repeat(80));
        console.log('   - Id (Primary Key)');
        console.log('   - Name');
        console.log('   - Email (Unique)');
        console.log('   - MobileNo');
        console.log('   - Password');
        console.log('   - ProfilePic');
        console.log('   - PublicUrl');
        console.log('   - Role (default: admin)');
        console.log('   - IsLogin');
        console.log('   - CreatedAt');
        console.log('   - LastLoginAt');
        console.log('─'.repeat(80));
        console.log('');
        console.log('💡 Next step: Create admin user with:');
        console.log('   npm run create-admin');
        console.log('');
      } else {
        console.log('⚠️  Warning: Could not verify table creation');
      }
      
      db.close();
    });
  });
};

createAdminsTable();
