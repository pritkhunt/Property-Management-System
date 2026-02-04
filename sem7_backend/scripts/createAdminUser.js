require('dotenv').config();
const bcrypt = require('bcryptjs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const readline = require('readline');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../database/PropertyManagement.db');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

const createAdminUser = async () => {
  console.log('👨‍💼 CREATE ADMIN USER');
  console.log('═'.repeat(80));
  console.log('📁 Database:', DB_PATH);
  console.log('');

  try {
    // Get admin details
    const username = await question('Enter Admin Username (default: admin): ') || 'admin';
    const email = await question('Enter Admin Email (default: admin@propertymanagement.com): ') || 'admin@propertymanagement.com';
    const mobile = await question('Enter Admin Mobile (default: 9999999999): ') || '9999999999';
    const password = await question('Enter Admin Password (default: admin123): ') || 'admin123';

    console.log('\n🔐 Creating admin user...\n');

    const db = new sqlite3.Database(DB_PATH);

    // Check if Admins table exists
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='Admins'", async (err, table) => {
      if (err || !table) {
        console.log('\n⚠️  Admins table does not exist!');
        console.log('Creating Admins table...\n');
        
        // Create Admins table
        db.run(`
          CREATE TABLE IF NOT EXISTS Admins (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Username VARCHAR(30) NOT NULL,
            Email VARCHAR(30) UNIQUE NOT NULL,
            MobileNo VARCHAR(30) NOT NULL,
            Password VARCHAR(255) NOT NULL,
            ProfilePic VARCHAR(255) DEFAULT '/images/admin-avatar.png',
            PublicUrl VARCHAR(255) DEFAULT '/profile/admin/1',
            Role VARCHAR(30) NOT NULL DEFAULT 'admin',
            IsActive INTEGER NOT NULL DEFAULT 1,
            CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            LastLoginAt DATETIME NULL
          )
        `, (err) => {
          if (err) {
            console.error('❌ Error creating Admins table:', err);
            db.close();
            rl.close();
            return;
          }
          console.log('✅ Admins table created successfully!\n');
          insertAdmin();
        });
      } else {
        insertAdmin();
      }
    });

    async function insertAdmin() {
      // Check if admin already exists
      db.get('SELECT * FROM Admins WHERE Email = ?', [email], async (err, admin) => {
        if (err) {
          console.error('❌ Error checking existing admin:', err);
          rl.close();
          db.close();
          return;
        }

        if (admin) {
          console.log('⚠️  Admin already exists in Admins table!');
          console.log('   Email:', admin.Email);
          console.log('   Username:', admin.Username);
          console.log('   Role:', admin.Role);
          console.log('\nTo update this admin, delete it first or use a different email.\n');
          rl.close();
          db.close();
          return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Default admin avatar - using working placeholder
        const adminAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=8b5cf6&color=fff&size=200`;

        // Insert admin into Admins table
        db.run(
          `INSERT INTO Admins (Username, Email, MobileNo, Password, ProfilePic, PublicUrl, Role, IsActive) 
           VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            username,
            email,
            mobile,
            hashedPassword,
            adminAvatar,
            '/profile/admin/1',
            'admin'
          ],
          function(err) {
            if (err) {
              console.error('❌ Error creating admin:', err);
            } else {
              console.log('✅ Admin created successfully in Admins table!\n');
              console.log('📋 Admin Details:');
              console.log('─'.repeat(80));
              console.log(`   ID: ${this.lastID}`);
              console.log(`   Username: ${username}`);
              console.log(`   Email: ${email}`);
              console.log(`   Mobile: ${mobile}`);
              console.log(`   Password: ${password}`);
              console.log(`   Role: admin`);
              console.log(`   Table: Admins`);
              console.log(`   Login Status: Active`);
              console.log('─'.repeat(80));
              console.log('\n💡 You can now login at: http://localhost:3000/login');
              console.log('   Email:', email);
              console.log('   Password:', password);
              console.log('\n🎯 After login, you will be redirected to: /admin\n');
            }

            db.close(() => {
              rl.close();
            });
          }
        );
      });
    }
  } catch (error) {
    console.error('❌ Error:', error);
    rl.close();
  }
};

createAdminUser();
