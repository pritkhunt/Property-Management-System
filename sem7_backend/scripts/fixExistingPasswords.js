require('dotenv').config();
const bcrypt = require('bcryptjs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../database/PropertyManagement.db');

// Default password for existing records
const DEFAULT_PASSWORD = 'password123';

const fixPasswords = async () => {
  const db = new sqlite3.Database(DB_PATH);
  
  try {
    console.log('🔧 Fixing passwords for existing database records...\n');

    // Hash the default password
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    console.log('✅ Generated bcrypt hash for default password');

    // Update all Users with invalid passwords
    db.all('SELECT * FROM Users', async (err, users) => {
      if (err) {
        console.error('Error fetching users:', err);
        return;
      }

      console.log(`\n📋 Found ${users.length} users in database`);
      
      for (const user of users) {
        // Check if password is not a valid bcrypt hash (bcrypt hashes start with $2a$ or $2b$)
        const isValidBcrypt = user.Password && (user.Password.startsWith('$2a$') || user.Password.startsWith('$2b$'));
        
        if (!isValidBcrypt) {
          db.run(
            'UPDATE Users SET Password = ? WHERE Id = ?',
            [hashedPassword, user.Id],
            (err) => {
              if (err) {
                console.error(`   ❌ Failed to update user ${user.Email}:`, err);
              } else {
                console.log(`   ✅ Updated password for user: ${user.Email} (ID: ${user.Id})`);
              }
            }
          );
        } else {
          console.log(`   ⏭️  Skipped user: ${user.Email} (already has valid bcrypt hash)`);
        }
      }
    });

    // Update all Agents with invalid passwords
    setTimeout(() => {
      db.all('SELECT * FROM Agents', async (err, agents) => {
        if (err) {
          console.error('Error fetching agents:', err);
          return;
        }

        console.log(`\n📋 Found ${agents.length} agents in database`);
        
        for (const agent of agents) {
          // Check if password is not a valid bcrypt hash
          const isValidBcrypt = agent.Password && (agent.Password.startsWith('$2a$') || agent.Password.startsWith('$2b$'));
          
          if (!isValidBcrypt) {
            db.run(
              'UPDATE Agents SET Password = ? WHERE Id = ?',
              [hashedPassword, agent.Id],
              (err) => {
                if (err) {
                  console.error(`   ❌ Failed to update agent ${agent.Email}:`, err);
                } else {
                  console.log(`   ✅ Updated password for agent: ${agent.Email} (ID: ${agent.Id})`);
                }
              }
            );
          } else {
            console.log(`   ⏭️  Skipped agent: ${agent.Email} (already has valid bcrypt hash)`);
          }
        }

        // Close database after all updates
        setTimeout(() => {
          db.close((err) => {
            if (err) {
              console.error('\n❌ Error closing database:', err);
            } else {
              console.log('\n✅ Database connection closed');
              console.log('\n🎉 Password fix complete!');
              console.log('\n📝 Default password for existing records: password123');
              console.log('   Use this password to login with existing users/agents.\n');
            }
          });
        }, 500);
      });
    }, 500);

  } catch (error) {
    console.error('Error:', error);
    db.close();
  }
};

// Run the fix
console.log('🚀 Starting password fix process...');
console.log('📁 Database:', DB_PATH);
console.log('🔑 Default password will be: password123\n');

fixPasswords();
