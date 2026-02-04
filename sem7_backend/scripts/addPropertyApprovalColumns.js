require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../database/PropertyManagement.db');

console.log('🔧 Adding approval columns to Properties table...');
console.log('Database path:', DB_PATH);

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

// SQL to add approval columns
const addColumnsSQL = `
-- Check if columns exist first
ALTER TABLE Properties ADD COLUMN OwnerApprovalStatus TEXT DEFAULT 'pending' CHECK(OwnerApprovalStatus IN ('pending', 'approved', 'rejected'));
ALTER TABLE Properties ADD COLUMN OwnerApprovedAt DATETIME NULL;
ALTER TABLE Properties ADD COLUMN OwnerRejectionReason TEXT NULL;

ALTER TABLE Properties ADD COLUMN AdminApprovalStatus TEXT DEFAULT 'pending' CHECK(AdminApprovalStatus IN ('pending', 'approved', 'rejected'));
ALTER TABLE Properties ADD COLUMN AdminApprovedAt DATETIME NULL;
ALTER TABLE Properties ADD COLUMN AdminApprovedBy INTEGER NULL;
ALTER TABLE Properties ADD COLUMN AdminRejectionReason TEXT NULL;

ALTER TABLE Properties ADD COLUMN ApprovalNotes TEXT NULL;
`;

// Execute SQL statements one by one
db.serialize(() => {
  const columns = [
    { sql: "ALTER TABLE Properties ADD COLUMN OwnerApprovalStatus TEXT DEFAULT 'pending' CHECK(OwnerApprovalStatus IN ('pending', 'approved', 'rejected'))", name: 'OwnerApprovalStatus' },
    { sql: "ALTER TABLE Properties ADD COLUMN OwnerApprovedAt DATETIME NULL", name: 'OwnerApprovedAt' },
    { sql: "ALTER TABLE Properties ADD COLUMN OwnerRejectionReason TEXT NULL", name: 'OwnerRejectionReason' },
    { sql: "ALTER TABLE Properties ADD COLUMN AdminApprovalStatus TEXT DEFAULT 'pending' CHECK(AdminApprovalStatus IN ('pending', 'approved', 'rejected'))", name: 'AdminApprovalStatus' },
    { sql: "ALTER TABLE Properties ADD COLUMN AdminApprovedAt DATETIME NULL", name: 'AdminApprovedAt' },
    { sql: "ALTER TABLE Properties ADD COLUMN AdminApprovedBy INTEGER NULL", name: 'AdminApprovedBy' },
    { sql: "ALTER TABLE Properties ADD COLUMN AdminRejectionReason TEXT NULL", name: 'AdminRejectionReason' },
    { sql: "ALTER TABLE Properties ADD COLUMN ApprovalNotes TEXT NULL", name: 'ApprovalNotes' }
  ];

  let successCount = 0;
  let totalColumns = columns.length;

  columns.forEach((column, index) => {
    db.run(column.sql, (err) => {
      if (err) {
        if (err.message.includes('duplicate column name')) {
          console.log(`⚠️  Column ${column.name} already exists, skipping...`);
          successCount++;
        } else {
          console.error(`❌ Error adding column ${column.name}:`, err.message);
        }
      } else {
        console.log(`✅ Column ${column.name} added successfully`);
        successCount++;
      }

      // Close database after all columns are processed
      if (index === totalColumns - 1) {
        setTimeout(() => {
          db.close((err) => {
            if (err) {
              console.error('❌ Error closing database:', err);
              process.exit(1);
            } else {
              console.log('\n🎉 Approval columns migration complete!');
              console.log(`\n📊 Summary:`);
              console.log(`   Total columns: ${totalColumns}`);
              console.log(`   Successfully processed: ${successCount}`);
              console.log('\n✅ Properties table now supports approval workflow:');
              console.log('   • Owner Approval (pending → approved/rejected)');
              console.log('   • Admin Approval (pending → approved/rejected)');
              console.log('   • Timestamps and rejection reasons');
              console.log('   • Status field determines visibility');
              process.exit(0);
            }
          });
        }, 100);
      }
    });
  });
});
