const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/PropertyManagement.db');
const db = new sqlite3.Database(dbPath);

console.log('\n🔍 Checking Agent Status...\n');

// First, show current agent status
db.all('SELECT Id, Name, Email, Status FROM Agents ORDER BY Id', [], (err, agents) => {
  if (err) {
    console.error('❌ Error:', err);
    return;
  }
  
  console.log('📋 Current Agents:');
  console.table(agents);
  
  // Now approve agent ID 10
  db.run('UPDATE Agents SET Status = ? WHERE Id = ?', ['approved', 10], function(err) {
    if (err) {
      console.error('❌ Error approving agent:', err);
      db.close();
      return;
    }
    
    console.log(`\n✅ Agent ID 10 has been approved!`);
    console.log(`   Rows affected: ${this.changes}`);
    
    // Show updated status
    db.all('SELECT Id, Name, Email, Status FROM Agents ORDER BY Id', [], (err, updatedAgents) => {
      if (err) {
        console.error('❌ Error:', err);
        db.close();
        return;
      }
      
      console.log('\n📋 Updated Agents:');
      console.table(updatedAgents);
      
      db.close();
      console.log('\n✅ Done! Agent ID 10 is now approved and can login.\n');
    });
  });
});
