require('dotenv').config();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../database/PropertyManagement.db');

// Using external placeholder images that actually work
const AVATARS = {
  user: 'https://ui-avatars.com/api/?name=User&background=3b82f6&color=fff&size=200',
  agent: 'https://ui-avatars.com/api/?name=Agent&background=10b981&color=fff&size=200',
  admin: 'https://ui-avatars.com/api/?name=Admin&background=8b5cf6&color=fff&size=200'
};

const updateAvatars = () => {
  const db = new sqlite3.Database(DB_PATH);
  
  console.log('🔄 UPDATING DEFAULT AVATAR URLs');
  console.log('═'.repeat(80));
  console.log('📁 Database:', DB_PATH);
  console.log('');

  // Update Users table
  db.run(
    `UPDATE Users SET ProfilePic = ? WHERE ProfilePic = '/images/default-avatar.png' OR ProfilePic = '' OR ProfilePic IS NULL`,
    [AVATARS.user],
    function(err) {
      if (err) {
        console.error('❌ Error updating Users:', err);
      } else {
        console.log(`✅ Updated ${this.changes} user avatar(s) to: ${AVATARS.user}`);
      }
    }
  );

  // Update Agents table
  setTimeout(() => {
    db.run(
      `UPDATE Agents SET ProfilePic = ? WHERE ProfilePic = '/images/default-agent-avatar.png' OR ProfilePic = '' OR ProfilePic IS NULL`,
      [AVATARS.agent],
      function(err) {
        if (err) {
          console.error('❌ Error updating Agents:', err);
        } else {
          console.log(`✅ Updated ${this.changes} agent avatar(s) to: ${AVATARS.agent}`);
        }
      }
    );
  }, 100);

  // Update Admins table
  setTimeout(() => {
    db.run(
      `UPDATE Admins SET ProfilePic = ? WHERE ProfilePic = '/images/admin-avatar.png' OR ProfilePic = '' OR ProfilePic IS NULL`,
      [AVATARS.admin],
      function(err) {
        if (err) {
          console.log('⚠️  Admins table does not exist yet (normal if not created)');
        } else {
          console.log(`✅ Updated ${this.changes} admin avatar(s) to: ${AVATARS.admin}`);
        }
        
        // Show final result
        setTimeout(() => {
          console.log('\n📊 Verifying updates...\n');
          
          db.all('SELECT Id, Name, Email, ProfilePic FROM Users LIMIT 5', (err, users) => {
            if (users && users.length > 0) {
              console.log('👥 Sample Users:');
              users.forEach(u => {
                console.log(`   ${u.Name}: ${u.ProfilePic.substring(0, 50)}...`);
              });
            }
          });

          setTimeout(() => {
            db.all('SELECT Id, Name, Email, ProfilePic FROM Agents LIMIT 5', (err, agents) => {
              if (agents && agents.length > 0) {
                console.log('\n🏢 Sample Agents:');
                agents.forEach(a => {
                  console.log(`   ${a.Name}: ${a.ProfilePic.substring(0, 50)}...`);
                });
              }
              
              db.close(() => {
                console.log('\n✅ Avatar URLs updated successfully!');
                console.log('💡 These are working placeholder images from ui-avatars.com');
                console.log('   Users will see colorful avatar images now!\n');
              });
            });
          }, 100);
        }, 200);
      }
    );
  }, 200);
};

updateAvatars();
