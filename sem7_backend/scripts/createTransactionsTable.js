const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/PropertyManagement.db');
const db = new sqlite3.Database(dbPath);

const createTransactionsTable = () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS Transactions (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      UserId INTEGER NOT NULL,
      PropertyId INTEGER NOT NULL,
      AgentId INTEGER,
      Amount REAL NOT NULL,
      Currency TEXT DEFAULT 'INR',
      RazorpayOrderId TEXT UNIQUE,
      RazorpayPaymentId TEXT,
      RazorpaySignature TEXT,
      Status TEXT DEFAULT 'pending' CHECK(Status IN ('pending', 'completed', 'failed', 'cancelled')),
      PaymentMethod TEXT,
      CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (UserId) REFERENCES Users(Id),
      FOREIGN KEY (PropertyId) REFERENCES Properties(Id),
      FOREIGN KEY (AgentId) REFERENCES Agents(Id)
    )
  `;

  db.run(createTableSQL, (err) => {
    if (err) {
      console.error('❌ Error creating Transactions table:', err.message);
    } else {
      console.log('✅ Transactions table created successfully');
    }
    db.close();
  });
};

createTransactionsTable();
