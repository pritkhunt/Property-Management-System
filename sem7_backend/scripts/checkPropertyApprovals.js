require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../database/PropertyManagement.db');

console.log('🔍 Checking Property Approvals Setup...\n');
console.log('Database path:', DB_PATH);

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
    process.exit(1);
  }
  console.log('✅ Connected to database\n');
});

// Check if approval columns exist
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1️⃣  CHECKING DATABASE SCHEMA');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

db.all("PRAGMA table_info(Properties)", (err, columns) => {
  if (err) {
    console.error('❌ Error checking table schema:', err);
    db.close();
    process.exit(1);
  }
  
  const approvalColumns = [
    'OwnerApprovalStatus',
    'OwnerApprovedAt',
    'OwnerRejectionReason',
    'AdminApprovalStatus',
    'AdminApprovedAt',
    'AdminApprovedBy',
    'AdminRejectionReason',
    'ApprovalNotes'
  ];
  
  console.log('Properties Table Columns:');
  columns.forEach(col => {
    console.log(`  - ${col.name} (${col.type})`);
  });
  
  console.log('\n📋 Approval Columns Check:');
  const foundApprovalColumns = [];
  const missingApprovalColumns = [];
  
  approvalColumns.forEach(colName => {
    const exists = columns.some(col => col.name === colName);
    if (exists) {
      console.log(`  ✅ ${colName}`);
      foundApprovalColumns.push(colName);
    } else {
      console.log(`  ❌ ${colName} - MISSING!`);
      missingApprovalColumns.push(colName);
    }
  });
  
  if (missingApprovalColumns.length > 0) {
    console.log('\n⚠️  WARNING: Some approval columns are missing!');
    console.log('   Run: npm run add-property-approval-columns\n');
  } else {
    console.log('\n✅ All approval columns exist!\n');
  }
  
  // Check properties data
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('2️⃣  CHECKING PROPERTIES DATA');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  db.all("SELECT COUNT(*) as total FROM Properties", (err, result) => {
    if (err) {
      console.error('❌ Error counting properties:', err);
    } else {
      console.log(`📊 Total Properties: ${result[0].total}`);
    }
    
    // Check properties with approval status
    const query = missingApprovalColumns.length === 0
      ? `SELECT 
           Id, Title, OwnerId, OwnerName, 
           OwnerApprovalStatus, AdminApprovalStatus, Status,
           CreatedAt
         FROM Properties 
         ORDER BY CreatedAt DESC 
         LIMIT 10`
      : `SELECT Id, Title, OwnerId, OwnerName, Status, CreatedAt 
         FROM Properties 
         ORDER BY CreatedAt DESC 
         LIMIT 10`;
    
    db.all(query, (err, properties) => {
      if (err) {
        console.error('❌ Error fetching properties:', err);
      } else {
        if (properties.length === 0) {
          console.log('\n⚠️  No properties found in database\n');
        } else {
          console.log(`\n📋 Recent Properties (last ${properties.length}):\n`);
          
          properties.forEach((prop, index) => {
            console.log(`${index + 1}. Property ID: ${prop.Id}`);
            console.log(`   Title: ${prop.Title || 'N/A'}`);
            console.log(`   Owner: ${prop.OwnerName} (ID: ${prop.OwnerId})`);
            if (prop.OwnerApprovalStatus) {
              console.log(`   Owner Approval: ${prop.OwnerApprovalStatus}`);
              console.log(`   Admin Approval: ${prop.AdminApprovalStatus}`);
            }
            console.log(`   Status: ${prop.Status}`);
            console.log(`   Created: ${prop.CreatedAt}`);
            console.log('');
          });
        }
      }
      
      // Check pending approvals by owner
      if (missingApprovalColumns.length === 0) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('3️⃣  CHECKING PENDING APPROVALS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        db.all(`
          SELECT OwnerId, OwnerName, COUNT(*) as pending_count
          FROM Properties
          WHERE OwnerApprovalStatus = 'pending'
          GROUP BY OwnerId, OwnerName
        `, (err, ownerStats) => {
          if (err) {
            console.error('❌ Error checking pending approvals:', err);
          } else {
            if (ownerStats.length === 0) {
              console.log('ℹ️  No properties pending owner approval\n');
            } else {
              console.log('📊 Properties Pending Owner Approval:\n');
              ownerStats.forEach(stat => {
                console.log(`  Owner: ${stat.OwnerName} (ID: ${stat.OwnerId})`);
                console.log(`  Pending: ${stat.pending_count} properties\n`);
              });
            }
          }
          
          // Check users
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('4️⃣  CHECKING USERS (SELLERS)');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          
          db.all(`
            SELECT Id, Name, Email, Role 
            FROM Users 
            WHERE Role = 'seller' OR Role = 'both'
            ORDER BY Name
          `, (err, sellers) => {
            if (err) {
              console.error('❌ Error checking sellers:', err);
            } else {
              if (sellers.length === 0) {
                console.log('⚠️  No sellers found in database\n');
              } else {
                console.log(`📊 Total Sellers: ${sellers.length}\n`);
                sellers.forEach(seller => {
                  console.log(`  - ${seller.Name} (ID: ${seller.Id}, Role: ${seller.Role})`);
                  console.log(`    Email: ${seller.Email}`);
                  
                  // Check if this seller has properties
                  db.get(`
                    SELECT COUNT(*) as count 
                    FROM Properties 
                    WHERE OwnerId = ?
                  `, [seller.Id], (err, result) => {
                    if (!err) {
                      console.log(`    Properties: ${result.count}`);
                      
                      if (missingApprovalColumns.length === 0) {
                        db.get(`
                          SELECT COUNT(*) as pending 
                          FROM Properties 
                          WHERE OwnerId = ? AND OwnerApprovalStatus = 'pending'
                        `, [seller.Id], (err, pendingResult) => {
                          if (!err) {
                            console.log(`    Pending Approval: ${pendingResult.pending}`);
                          }
                          console.log('');
                        });
                      } else {
                        console.log('');
                      }
                    }
                  });
                });
              }
            }
            
            // Summary
            setTimeout(() => {
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.log('📋 SUMMARY');
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
              
              if (missingApprovalColumns.length > 0) {
                console.log('❌ ISSUE FOUND:');
                console.log('   Approval columns are missing from the Properties table');
                console.log('\n🔧 FIX:');
                console.log('   Run: npm run add-property-approval-columns\n');
              } else {
                console.log('✅ Database schema is correct');
                console.log('✅ Approval columns exist');
                console.log('\nIf properties still not showing:');
                console.log('  1. Check if properties have OwnerId matching user ID');
                console.log('  2. Check if OwnerApprovalStatus is "pending"');
                console.log('  3. Verify user has role "seller" or "both"');
                console.log('  4. Check backend logs when fetching approvals\n');
              }
              
              db.close((err) => {
                if (err) {
                  console.error('❌ Error closing database:', err);
                } else {
                  console.log('✅ Database connection closed\n');
                }
                process.exit(0);
              });
            }, 1000); // Wait for async queries to complete
          });
        });
      } else {
        db.close((err) => {
          if (err) {
            console.error('❌ Error closing database:', err);
          } else {
            console.log('✅ Database connection closed\n');
          }
          process.exit(0);
        });
      }
    });
  });
});
