const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// Database configuration
const dbPath = process.env.DB_PATH || path.join(__dirname, '../database/PropertyManagement.db');

console.log('📊 Adding UserCode Column to Users and Agents Tables...');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

// Function to check if column exists
const columnExists = (tableName, columnName) => {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const exists = rows.some(row => row.name === columnName);
        resolve(exists);
      }
    });
  });
};

// Function to add column
const addColumn = (tableName, columnName, columnType) => {
  return new Promise((resolve, reject) => {
    db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Function to generate user code
const generateUserCode = (role, index) => {
  const rolePrefixes = {
    'buyer': 'buy',
    'seller': 'sel',
    'both': 'bot',
    'agent': 'age'
  };
  
  const prefix = rolePrefixes[role.toLowerCase()] || 'usr';
  return `${prefix}-${1001 + index}`;
};

// Main execution
const addUserCodeColumns = async () => {
  try {
    // Check and add UserCode to Users table
    const userCodeExistsInUsers = await columnExists('Users', 'UserCode');
    
    if (!userCodeExistsInUsers) {
      console.log('Adding UserCode column to Users table...');
      await addColumn('Users', 'UserCode', 'VARCHAR(20) UNIQUE');
      console.log('✅ UserCode column added to Users table');
    } else {
      console.log('ℹ️  UserCode column already exists in Users table');
    }
    
    // Check and add UserCode to Agents table
    const userCodeExistsInAgents = await columnExists('Agents', 'UserCode');
    
    if (!userCodeExistsInAgents) {
      console.log('Adding UserCode column to Agents table...');
      await addColumn('Agents', 'UserCode', 'VARCHAR(20) UNIQUE');
      console.log('✅ UserCode column added to Agents table');
    } else {
      console.log('ℹ️  UserCode column already exists in Agents table');
    }
    
    // Generate UserCodes for existing Users
    console.log('\n📝 Generating UserCodes for existing Users...');
    
    db.all('SELECT Id, Role FROM Users WHERE UserCode IS NULL ORDER BY Id', (err, users) => {
      if (err) {
        console.error('❌ Error fetching users:', err);
        return;
      }
      
      if (users.length === 0) {
        console.log('ℹ️  No users without UserCode found');
      } else {
        console.log(`Found ${users.length} users without UserCode`);
        
        // Group users by role and assign codes
        const roleCounters = { buyer: 0, seller: 0, both: 0 };
        
        users.forEach((user, index) => {
          const role = user.Role.toLowerCase();
          const userCode = generateUserCode(role, roleCounters[role] || 0);
          
          if (roleCounters[role] !== undefined) {
            roleCounters[role]++;
          }
          
          db.run('UPDATE Users SET UserCode = ? WHERE Id = ?', [userCode, user.Id], (err) => {
            if (err) {
              console.error(`❌ Error updating user ${user.Id}:`, err.message);
            } else {
              console.log(`✅ User ${user.Id} assigned UserCode: ${userCode}`);
            }
          });
        });
      }
    });
    
    // Generate UserCodes for existing Agents
    console.log('\n📝 Generating UserCodes for existing Agents...');
    
    db.all('SELECT Id FROM Agents WHERE UserCode IS NULL ORDER BY Id', (err, agents) => {
      if (err) {
        console.error('❌ Error fetching agents:', err);
        return;
      }
      
      if (agents.length === 0) {
        console.log('ℹ️  No agents without UserCode found');
      } else {
        console.log(`Found ${agents.length} agents without UserCode`);
        
        agents.forEach((agent, index) => {
          const userCode = generateUserCode('agent', index);
          
          db.run('UPDATE Agents SET UserCode = ? WHERE Id = ?', [userCode, agent.Id], (err) => {
            if (err) {
              console.error(`❌ Error updating agent ${agent.Id}:`, err.message);
            } else {
              console.log(`✅ Agent ${agent.Id} assigned UserCode: ${userCode}`);
            }
            
            // Close database after last agent
            if (index === agents.length - 1) {
              setTimeout(() => {
                db.close((err) => {
                  if (err) {
                    console.error('❌ Error closing database:', err.message);
                  } else {
                    console.log('\n✅ Database connection closed');
                    console.log('🎉 UserCode column setup complete!');
                  }
                });
              }, 1000); // Wait 1 second for all updates to complete
            }
          });
        });
      }
      
      // If no agents, close database
      if (agents.length === 0) {
        setTimeout(() => {
          db.close((err) => {
            if (err) {
              console.error('❌ Error closing database:', err.message);
            } else {
              console.log('\n✅ Database connection closed');
              console.log('🎉 UserCode column setup complete!');
            }
          });
        }, 1000);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    db.close();
    process.exit(1);
  }
};

// Run the script
addUserCodeColumns();
