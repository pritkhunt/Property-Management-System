const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// Database configuration
const dbPath = process.env.DB_PATH || path.join(__dirname, '../database/PropertyManagement.db');

console.log('🔧 Adding UNIQUE constraint to UserCode columns...\n');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to database\n');
});

// Function to check for duplicate UserCodes
const checkDuplicates = (table) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT UserCode, COUNT(*) as count 
      FROM ${table} 
      WHERE UserCode IS NOT NULL 
      GROUP BY UserCode 
      HAVING count > 1
    `;
    
    db.all(query, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Function to fix duplicate UserCodes
const fixDuplicates = (table) => {
  return new Promise((resolve, reject) => {
    console.log(`\n🔍 Checking for duplicates in ${table}...`);
    
    checkDuplicates(table).then(duplicates => {
      if (duplicates.length === 0) {
        console.log(`✅ No duplicates found in ${table}`);
        resolve();
        return;
      }
      
      console.log(`⚠️  Found ${duplicates.length} duplicate UserCodes in ${table}:`);
      duplicates.forEach(dup => {
        console.log(`   - ${dup.UserCode} (${dup.count} occurrences)`);
      });
      
      console.log(`\n🔧 Fixing duplicates in ${table}...`);
      
      // Get all records with duplicate UserCodes
      const getDuplicatesQuery = `
        SELECT Id, UserCode 
        FROM ${table} 
        WHERE UserCode IN (
          SELECT UserCode 
          FROM ${table} 
          WHERE UserCode IS NOT NULL 
          GROUP BY UserCode 
          HAVING COUNT(*) > 1
        )
        ORDER BY UserCode, Id
      `;
      
      db.all(getDuplicatesQuery, (err, records) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Group records by UserCode
        const grouped = {};
        records.forEach(record => {
          if (!grouped[record.UserCode]) {
            grouped[record.UserCode] = [];
          }
          grouped[record.UserCode].push(record);
        });
        
        // Update duplicates with unique codes
        let updateCount = 0;
        const updates = [];
        
        for (const [userCode, records] of Object.entries(grouped)) {
          // Keep the first record, update the rest
          for (let i = 1; i < records.length; i++) {
            const record = records[i];
            const newCode = `${userCode}-dup${i}-${Date.now()}`;
            
            updates.push(new Promise((res, rej) => {
              db.run(
                `UPDATE ${table} SET UserCode = ? WHERE Id = ?`,
                [newCode, record.Id],
                (err) => {
                  if (err) {
                    rej(err);
                  } else {
                    console.log(`   ✅ Updated ID ${record.Id}: ${userCode} → ${newCode}`);
                    updateCount++;
                    res();
                  }
                }
              );
            }));
          }
        }
        
        Promise.all(updates)
          .then(() => {
            console.log(`✅ Fixed ${updateCount} duplicate UserCodes in ${table}\n`);
            resolve();
          })
          .catch(reject);
      });
    }).catch(reject);
  });
};

// Function to create unique index
const createUniqueIndex = (table) => {
  return new Promise((resolve, reject) => {
    const indexName = `idx_unique_usercode_${table.toLowerCase()}`;
    const createIndexQuery = `CREATE UNIQUE INDEX IF NOT EXISTS ${indexName} ON ${table}(UserCode)`;
    
    console.log(`📋 Creating unique index on ${table}.UserCode...`);
    
    db.run(createIndexQuery, (err) => {
      if (err) {
        console.error(`❌ Error creating index on ${table}:`, err.message);
        reject(err);
      } else {
        console.log(`✅ Unique index created on ${table}.UserCode\n`);
        resolve();
      }
    });
  });
};

// Main execution
const main = async () => {
  try {
    console.log('═══════════════════════════════════════');
    console.log('STEP 1: Fix Duplicate UserCodes');
    console.log('═══════════════════════════════════════\n');
    
    // Fix duplicates in Users table
    await fixDuplicates('Users');
    
    // Fix duplicates in Agents table
    await fixDuplicates('Agents');
    
    console.log('\n═══════════════════════════════════════');
    console.log('STEP 2: Create UNIQUE Indexes');
    console.log('═══════════════════════════════════════\n');
    
    // Create unique indexes
    await createUniqueIndex('Users');
    await createUniqueIndex('Agents');
    
    console.log('═══════════════════════════════════════');
    console.log('STEP 3: Verify Changes');
    console.log('═══════════════════════════════════════\n');
    
    // Verify no duplicates remain
    const userDuplicates = await checkDuplicates('Users');
    const agentDuplicates = await checkDuplicates('Agents');
    
    console.log('📊 Final Status:');
    console.log(`   Users table: ${userDuplicates.length === 0 ? '✅ No duplicates' : `⚠️  ${userDuplicates.length} duplicates remain`}`);
    console.log(`   Agents table: ${agentDuplicates.length === 0 ? '✅ No duplicates' : `⚠️  ${agentDuplicates.length} duplicates remain`}`);
    
    console.log('\n═══════════════════════════════════════');
    console.log('✅ USERCODE UNIQUENESS ENFORCED!');
    console.log('═══════════════════════════════════════\n');
    
    console.log('Benefits:');
    console.log('✅ All duplicate UserCodes have been fixed');
    console.log('✅ UNIQUE constraint added to database');
    console.log('✅ Future duplicates will be prevented');
    console.log('✅ Database integrity maintained\n');
    
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err.message);
      }
      process.exit(0);
    });
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    db.close(() => {
      process.exit(1);
    });
  }
};

// Run the script
main();
