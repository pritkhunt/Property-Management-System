require('dotenv').config();
const bcrypt = require('bcryptjs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../database/PropertyManagement.db');

const createTestUser = async () => {
  const db = new sqlite3.Database(DB_PATH);
  
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Check if user exists
    db.get('SELECT * FROM Users WHERE Email = ?', ['khuntprit205@gmail.com'], (err, user) => {
      if (err) {
        console.error('Error:', err);
        db.close();
        return;
      }
      
      if (user) {
        console.log('✅ User already exists!');
        console.log('Email:', user.Email);
        console.log('Role:', user.Role);
        console.log('IsLogin:', user.IsLogin);
        db.close();
        return;
      }
      
      // Create user with working avatar
      const userAvatar = 'https://ui-avatars.com/api/?name=Prit+Khunt&background=3b82f6&color=fff&size=200';
      
      db.run(
        `INSERT INTO Users (Name, Email, MobileNo, Password, ProfilePic, PublicUrl, Role, IsLogin) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        ['Prit Khunt', 'khuntprit205@gmail.com', '9999999999', hashedPassword, 
         userAvatar, '/profile/user/1', 'buyer'],
        function(err) {
          if (err) {
            console.error('Error creating user:', err);
          } else {
            console.log('✅ Test user created successfully!');
            console.log('Email: khuntprit205@gmail.com');
            console.log('Password: admin123');
            console.log('Role: buyer');
            console.log('ID:', this.lastID);
            console.log('\nYou can now login with these credentials!');
          }
          db.close();
        }
      );
    });
  } catch (error) {
    console.error('Error:', error);
    db.close();
  }
};

createTestUser();
