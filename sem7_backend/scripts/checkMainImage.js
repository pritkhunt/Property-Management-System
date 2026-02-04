const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/PropertyManagement.db');

console.log('=== Checking MainImage Field ===\n');

// Check Properties table schema
db.all('PRAGMA table_info(Properties)', (err, columns) => {
  if (err) {
    console.error('Error getting schema:', err);
    return;
  }
  
  console.log('Properties Table Columns:');
  columns.forEach(col => {
    if (col.name.toLowerCase().includes('image')) {
      console.log(`  ✅ ${col.name} (${col.type})`);
    }
  });
  
  // Check sample property data
  db.all('SELECT Id, Title, MainImage FROM Properties WHERE Id = 2', (err, rows) => {
    if (err) {
      console.error('Error getting property:', err);
      return;
    }
    
    console.log('\n=== Property ID 2 ===');
    console.log(JSON.stringify(rows, null, 2));
    
    // Check gallery images
    db.all('SELECT * FROM PropertyImages WHERE PropertyId = 2', (err, images) => {
      if (err) {
        console.error('Error getting images:', err);
      } else {
        console.log('\n=== Gallery Images for Property 2 ===');
        console.log(JSON.stringify(images, null, 2));
      }
      
      db.close();
    });
  });
});
