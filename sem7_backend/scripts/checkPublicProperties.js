require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../database/PropertyManagement.db');

console.log('🔍 Checking Public Properties Visibility...\n');
console.log('Database path:', DB_PATH);
console.log('='.repeat(60));

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
    process.exit(1);
  }
});

// Check all properties
console.log('\n📊 ALL PROPERTIES IN DATABASE:');
db.all(`
  SELECT 
    Id, Title, Status, 
    OwnerApprovalStatus, AdminApprovalStatus,
    City, State, Price
  FROM Properties
  ORDER BY Id
`, (err, allProperties) => {
  if (err) {
    console.error('❌ Error:', err);
  } else {
    console.log(`Total properties: ${allProperties.length}\n`);
    allProperties.forEach(prop => {
      console.log(`ID ${prop.Id}: ${prop.Title}`);
      console.log(`  Location: ${prop.City}, ${prop.State}`);
      console.log(`  Price: ₹${prop.Price?.toLocaleString('en-IN')}`);
      console.log(`  Status: ${prop.Status}`);
      console.log(`  Owner Approval: ${prop.OwnerApprovalStatus}`);
      console.log(`  Admin Approval: ${prop.AdminApprovalStatus}`);
      
      // Check if it should be visible
      const isVisible = prop.Status === 'active' && 
                       prop.OwnerApprovalStatus === 'approved' && 
                       prop.AdminApprovalStatus === 'approved';
      console.log(`  ${isVisible ? '✅ VISIBLE ON PUBLIC SITE' : '❌ NOT VISIBLE'}`);
      console.log('');
    });
  }
  
  // Check what the public API query returns
  console.log('\n🌐 PROPERTIES VISIBLE TO PUBLIC (API Query):');
  db.all(`
    SELECT 
      p.Id, p.Title, p.City, p.State, p.Price,
      p.Status, p.OwnerApprovalStatus, p.AdminApprovalStatus,
      u.Name as OwnerName, a.Name as AgentName
    FROM Properties p
    LEFT JOIN Users u ON p.OwnerId = u.Id
    LEFT JOIN Agents a ON p.AgentId = a.Id
    WHERE p.Status = 'active' 
      AND p.OwnerApprovalStatus = 'approved'
      AND p.AdminApprovalStatus = 'approved'
    ORDER BY p.CreatedAt DESC
  `, (err, publicProperties) => {
    if (err) {
      console.error('❌ Error:', err);
    } else {
      console.log(`Properties returned by public API: ${publicProperties.length}\n`);
      
      if (publicProperties.length === 0) {
        console.log('⚠️  NO PROPERTIES VISIBLE TO PUBLIC!');
        console.log('\nPossible reasons:');
        console.log('1. No properties have Status = "active"');
        console.log('2. No properties have OwnerApprovalStatus = "approved"');
        console.log('3. No properties have AdminApprovalStatus = "approved"');
        console.log('4. Properties need ALL THREE conditions to be visible\n');
      } else {
        publicProperties.forEach(prop => {
          console.log(`✅ ID ${prop.Id}: ${prop.Title}`);
          console.log(`   Location: ${prop.City}, ${prop.State}`);
          console.log(`   Price: ₹${prop.Price?.toLocaleString('en-IN')}`);
          console.log(`   Owner: ${prop.OwnerName || 'Unknown'}`);
          console.log(`   Agent: ${prop.AgentName || 'Unknown'}`);
          console.log('');
        });
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 SUMMARY:');
    console.log(`Total Properties: ${allProperties.length}`);
    console.log(`Visible to Public: ${publicProperties.length}`);
    console.log(`Hidden from Public: ${allProperties.length - publicProperties.length}`);
    
    if (publicProperties.length === 0 && allProperties.length > 0) {
      console.log('\n⚠️  ISSUE DETECTED:');
      console.log('You have properties in the database but none are visible to the public.');
      console.log('\nTo make properties visible, ensure:');
      console.log('1. Property Status = "active"');
      console.log('2. OwnerApprovalStatus = "approved"');
      console.log('3. AdminApprovalStatus = "approved"');
      console.log('\nCheck the property approval workflow in the dashboards.');
    }
    
    console.log('='.repeat(60));
    db.close();
  });
});
