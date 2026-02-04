require('dotenv').config();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../database/PropertyManagement.db');

const viewRecords = () => {
  const db = new sqlite3.Database(DB_PATH);
  
  console.log('📊 DATABASE RECORDS VIEW');
  console.log('📁 Database:', DB_PATH);
  console.log('=' .repeat(80));

  // View Admins
  db.all('SELECT * FROM Admins', (err, admins) => {
    if (err) {
      console.log('\n⚠️  Admins table does not exist yet.');
    } else {
      console.log('\n👨‍💼 ADMINS TABLE:');
      console.log('─'.repeat(80));
      
      if (admins.length === 0) {
        console.log('   No admins found in database.');
      } else {
        admins.forEach((admin, index) => {
          console.log(`\n${index + 1}. Admin ID: ${admin.Id}`);
          console.log(`   Name: ${admin.Name}`);
          console.log(`   Email: ${admin.Email}`);
          console.log(`   Mobile: ${admin.MobileNo}`);
          console.log(`   Role: ${admin.Role}`);
          console.log(`   Password Hash: ${admin.Password.substring(0, 30)}...`);
          console.log(`   Valid Bcrypt: ${admin.Password.startsWith('$2a$') || admin.Password.startsWith('$2b$') ? '✅ Yes' : '❌ No'}`);
          console.log(`   IsLogin: ${admin.IsLogin ? 'Yes' : 'No'}`);
          console.log(`   Created: ${admin.CreatedAt}`);
        });
        console.log(`\n   Total Admins: ${admins.length}`);
      }
    }
  });

  // View Users
  setTimeout(() => {
    db.all('SELECT * FROM Users', (err, users) => {
    if (err) {
      console.error('Error fetching users:', err);
      return;
    }

    console.log('\n👥 USERS TABLE:');
    console.log('─'.repeat(80));
    
    if (users.length === 0) {
      console.log('   No users found in database.');
    } else {
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. User ID: ${user.Id}`);
        console.log(`   Name: ${user.Name}`);
        console.log(`   Email: ${user.Email}`);
        console.log(`   Mobile: ${user.MobileNo}`);
        console.log(`   Role: ${user.Role}`);
        console.log(`   Password Hash: ${user.Password.substring(0, 30)}...`);
        console.log(`   Valid Bcrypt: ${user.Password.startsWith('$2a$') || user.Password.startsWith('$2b$') ? '✅ Yes' : '❌ No'}`);
        console.log(`   IsLogin: ${user.IsLogin ? 'Yes' : 'No'}`);
        console.log(`   Created: ${user.CreatedAt}`);
      });
      console.log(`\n   Total Users: ${users.length}`);
    }
    });
  }, 200);

  // View Agents
  setTimeout(() => {
    db.all('SELECT * FROM Agents', (err, agents) => {
      if (err) {
        console.error('Error fetching agents:', err);
        return;
      }

      console.log('\n\n🏢 AGENTS TABLE:');
      console.log('─'.repeat(80));
      
      if (agents.length === 0) {
        console.log('   No agents found in database.');
      } else {
        agents.forEach((agent, index) => {
          console.log(`\n${index + 1}. Agent ID: ${agent.Id}`);
          console.log(`   Name: ${agent.Name}`);
          console.log(`   Email: ${agent.Email}`);
          console.log(`   Mobile: ${agent.MobileNo}`);
          console.log(`   Role: ${agent.Role}`);
          console.log(`   Status: ${agent.Status}`);
          console.log(`   Password Hash: ${agent.Password.substring(0, 30)}...`);
          console.log(`   Valid Bcrypt: ${agent.Password.startsWith('$2a$') || agent.Password.startsWith('$2b$') ? '✅ Yes' : '❌ No'}`);
          console.log(`   City: ${agent.City}, ${agent.State}`);
          console.log(`   Bank: ${agent.BankName} (${agent.BankAccountNo})`);
          console.log(`   Created: ${agent.Date}`);
        });
        console.log(`\n   Total Agents: ${agents.length}`);
      }

      // View OTPs
      setTimeout(() => {
        db.all('SELECT * FROM OTPs ORDER BY CreatedAt DESC LIMIT 10', (err, otps) => {
          if (err) {
            console.error('Error fetching OTPs:', err);
            return;
          }

          console.log('\n\n📧 RECENT OTPs (Last 10):');
          console.log('─'.repeat(80));
          
          if (otps.length === 0) {
            console.log('   No OTPs found in database.');
          } else {
            otps.forEach((otp, index) => {
              console.log(`\n${index + 1}. OTP ID: ${otp.Id}`);
              console.log(`   Email: ${otp.Email}`);
              console.log(`   OTP: ${otp.Otp}`);
              console.log(`   Used: ${otp.IsUsed ? 'Yes ✅' : 'No ❌'}`);
              console.log(`   Created: ${otp.CreatedAt}`);
              console.log(`   Expires: ${otp.ExpiresAt}`);
              
              const now = new Date();
              const expires = new Date(otp.ExpiresAt);
              const isExpired = now > expires;
              console.log(`   Status: ${isExpired ? 'Expired ⏰' : 'Valid ✅'}`);
            });
          }

          db.close(() => {
            console.log('\n' + '='.repeat(80));
            console.log('✅ Database view complete!\n');
          });
        });
      }, 200);
    });
  }, 200);
};

viewRecords();
