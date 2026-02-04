require('dotenv').config();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../database/PropertyManagement.db');

const addProfileFields = () => {
  const db = new sqlite3.Database(DB_PATH);
  
  console.log('🔧 ADDING PROFILE FIELDS TO TABLES');
  console.log('═'.repeat(80));
  console.log('📁 Database:', DB_PATH);
  console.log('');
  console.log('Adding fields: City, State, Address, Bio');
  console.log('');

  // Function to check if column exists
  const checkColumn = (tableName, columnName, callback) => {
    db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
      if (err) {
        callback(err, false);
        return;
      }
      const exists = columns.some(col => col.name === columnName);
      callback(null, exists);
    });
  };

  // Add fields to Users table
  console.log('📋 Updating Users table...');
  
  checkColumn('Users', 'City', (err, exists) => {
    if (!exists) {
      db.run(`ALTER TABLE Users ADD COLUMN City VARCHAR(50) DEFAULT ''`, (err) => {
        if (err) console.error('❌ Error adding City to Users:', err.message);
        else console.log('  ✅ Added City column');
      });
    } else {
      console.log('  ⏭️  City column already exists');
    }
  });

  setTimeout(() => {
    checkColumn('Users', 'State', (err, exists) => {
      if (!exists) {
        db.run(`ALTER TABLE Users ADD COLUMN State VARCHAR(50) DEFAULT ''`, (err) => {
          if (err) console.error('❌ Error adding State to Users:', err.message);
          else console.log('  ✅ Added State column');
        });
      } else {
        console.log('  ⏭️  State column already exists');
      }
    });
  }, 100);

  setTimeout(() => {
    checkColumn('Users', 'Address', (err, exists) => {
      if (!exists) {
        db.run(`ALTER TABLE Users ADD COLUMN Address VARCHAR(255) DEFAULT ''`, (err) => {
          if (err) console.error('❌ Error adding Address to Users:', err.message);
          else console.log('  ✅ Added Address column');
        });
      } else {
        console.log('  ⏭️  Address column already exists');
      }
    });
  }, 200);

  setTimeout(() => {
    checkColumn('Users', 'Bio', (err, exists) => {
      if (!exists) {
        db.run(`ALTER TABLE Users ADD COLUMN Bio TEXT DEFAULT ''`, (err) => {
          if (err) console.error('❌ Error adding Bio to Users:', err.message);
          else console.log('  ✅ Added Bio column');
        });
      } else {
        console.log('  ⏭️  Bio column already exists');
      }
    });
  }, 300);

  // Add fields to Admins table (if exists)
  setTimeout(() => {
    console.log('\n📋 Updating Admins table (if exists)...');
    
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='Admins'", (err, table) => {
      if (!table) {
        console.log('  ⚠️  Admins table does not exist, skipping...');
        return;
      }

      checkColumn('Admins', 'City', (err, exists) => {
        if (!exists) {
          db.run(`ALTER TABLE Admins ADD COLUMN City VARCHAR(50) DEFAULT ''`, (err) => {
            if (err) console.error('❌ Error adding City to Admins:', err.message);
            else console.log('  ✅ Added City column');
          });
        } else {
          console.log('  ⏭️  City column already exists');
        }
      });

      setTimeout(() => {
        checkColumn('Admins', 'State', (err, exists) => {
          if (!exists) {
            db.run(`ALTER TABLE Admins ADD COLUMN State VARCHAR(50) DEFAULT ''`, (err) => {
              if (err) console.error('❌ Error adding State to Admins:', err.message);
              else console.log('  ✅ Added State column');
            });
          } else {
            console.log('  ⏭️  State column already exists');
          }
        });
      }, 100);

      setTimeout(() => {
        checkColumn('Admins', 'Address', (err, exists) => {
          if (!exists) {
            db.run(`ALTER TABLE Admins ADD COLUMN Address VARCHAR(255) DEFAULT ''`, (err) => {
              if (err) console.error('❌ Error adding Address to Admins:', err.message);
              else console.log('  ✅ Added Address column');
            });
          } else {
            console.log('  ⏭️  Address column already exists');
          }
        });
      }, 200);

      setTimeout(() => {
        checkColumn('Admins', 'Bio', (err, exists) => {
          if (!exists) {
            db.run(`ALTER TABLE Admins ADD COLUMN Bio TEXT DEFAULT ''`, (err) => {
              if (err) console.error('❌ Error adding Bio to Admins:', err.message);
              else console.log('  ✅ Added Bio column');
            });
          } else {
            console.log('  ⏭️  Bio column already exists');
          }
        });
      }, 300);
    });
  }, 500);

  // Verify and close
  setTimeout(() => {
    console.log('\n📊 Verifying changes...\n');
    
    db.all('PRAGMA table_info(Users)', (err, columns) => {
      if (!err) {
        console.log('Users table columns:');
        columns.forEach(col => {
          if (['City', 'State', 'Address', 'Bio'].includes(col.name)) {
            console.log(`  ✅ ${col.name} (${col.type})`);
          }
        });
      }
      
      console.log('\n✅ Profile fields added successfully!');
      console.log('💡 Users can now update their City, State, Address, and Bio.\n');
      
      db.close();
    });
  }, 1500);
};

addProfileFields();
