require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../database/PropertyManagement.db');

console.log('🔧 Creating Properties table...');
console.log('Database path:', DB_PATH);

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

// SQL to create Properties table
const createPropertiesTableSQL = `
CREATE TABLE IF NOT EXISTS Properties (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Owner Information
  OwnerId INTEGER NOT NULL,
  OwnerName TEXT NOT NULL,
  OwnerUsercode TEXT,
  
  -- Agent Information
  AgentId INTEGER NOT NULL,
  AgentName TEXT,
  
  -- Basic Information
  ListingType TEXT NOT NULL CHECK(ListingType IN ('sale', 'rent')),
  PropertyType TEXT NOT NULL CHECK(PropertyType IN ('apartment', 'house', 'villa', 'flat', 'plot', 'office', 'commercial', 'land')),
  Title TEXT NOT NULL,
  Description TEXT NOT NULL,
  Price DECIMAL(15, 2) NOT NULL,
  Size DECIMAL(10, 2) NOT NULL,
  SizeUnit TEXT DEFAULT 'sqft',
  
  -- Location Details
  Address TEXT NOT NULL,
  City TEXT NOT NULL,
  State TEXT NOT NULL,
  Pincode TEXT,
  Latitude DECIMAL(10, 8),
  Longitude DECIMAL(11, 8),
  
  -- Property Details
  Bedrooms INTEGER,
  Bathrooms INTEGER,
  Balconies INTEGER,
  Floors INTEGER,
  PropertyAge TEXT,
  Facing TEXT CHECK(Facing IN ('north', 'south', 'east', 'west', 'north-east', 'north-west', 'south-east', 'south-west')),
  HouseType TEXT,
  Furnishing TEXT CHECK(Furnishing IN ('furnished', 'semi-furnished', 'unfurnished')),
  
  -- Facilities (stored as JSON string)
  Facilities TEXT,
  
  -- Images (stored as JSON array of paths)
  Images TEXT,
  MainImage TEXT,
  
  -- Status and Metadata
  Status TEXT NOT NULL DEFAULT 'active' CHECK(Status IN ('active', 'pending', 'sold', 'rented', 'inactive', 'draft')),
  IsVerified INTEGER DEFAULT 0,
  IsFeatured INTEGER DEFAULT 0,
  Views INTEGER DEFAULT 0,
  
  -- Timestamps
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PublishedAt DATETIME,
  
  -- Foreign Keys
  FOREIGN KEY (OwnerId) REFERENCES Users(Id) ON DELETE CASCADE,
  FOREIGN KEY (AgentId) REFERENCES Agents(Id) ON DELETE CASCADE
);
`;

// SQL to create PropertyImages table (for multiple images)
const createPropertyImagesTableSQL = `
CREATE TABLE IF NOT EXISTS PropertyImages (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  PropertyId INTEGER NOT NULL,
  ImagePath TEXT NOT NULL,
  ImageType TEXT DEFAULT 'gallery' CHECK(ImageType IN ('main', 'gallery', 'floor_plan', 'location')),
  DisplayOrder INTEGER DEFAULT 0,
  Caption TEXT,
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (PropertyId) REFERENCES Properties(Id) ON DELETE CASCADE
);
`;

// SQL to create PropertyFacilities table (normalized approach)
const createPropertyFacilitiesTableSQL = `
CREATE TABLE IF NOT EXISTS PropertyFacilities (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  PropertyId INTEGER NOT NULL,
  FacilityName TEXT NOT NULL,
  
  FOREIGN KEY (PropertyId) REFERENCES Properties(Id) ON DELETE CASCADE
);
`;

// SQL to create SavedProperties table (for users to save/favorite properties)
const createSavedPropertiesTableSQL = `
CREATE TABLE IF NOT EXISTS SavedProperties (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  UserId INTEGER NOT NULL,
  PropertyId INTEGER NOT NULL,
  SavedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
  FOREIGN KEY (PropertyId) REFERENCES Properties(Id) ON DELETE CASCADE,
  UNIQUE(UserId, PropertyId)
);
`;

// SQL to create PropertyInquiries table
const createPropertyInquiriesTableSQL = `
CREATE TABLE IF NOT EXISTS PropertyInquiries (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  PropertyId INTEGER NOT NULL,
  UserId INTEGER,
  Name TEXT NOT NULL,
  Email TEXT NOT NULL,
  MobileNo TEXT NOT NULL,
  Message TEXT,
  Status TEXT DEFAULT 'new' CHECK(Status IN ('new', 'contacted', 'closed')),
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (PropertyId) REFERENCES Properties(Id) ON DELETE CASCADE,
  FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE SET NULL
);
`;

// Indexes for better performance
const createIndexesSQL = `
CREATE INDEX IF NOT EXISTS IX_Properties_OwnerId ON Properties(OwnerId);
CREATE INDEX IF NOT EXISTS IX_Properties_AgentId ON Properties(AgentId);
CREATE INDEX IF NOT EXISTS IX_Properties_ListingType ON Properties(ListingType);
CREATE INDEX IF NOT EXISTS IX_Properties_PropertyType ON Properties(PropertyType);
CREATE INDEX IF NOT EXISTS IX_Properties_City ON Properties(City);
CREATE INDEX IF NOT EXISTS IX_Properties_Status ON Properties(Status);
CREATE INDEX IF NOT EXISTS IX_Properties_Price ON Properties(Price);
CREATE INDEX IF NOT EXISTS IX_PropertyImages_PropertyId ON PropertyImages(PropertyId);
CREATE INDEX IF NOT EXISTS IX_PropertyFacilities_PropertyId ON PropertyFacilities(PropertyId);
CREATE INDEX IF NOT EXISTS IX_SavedProperties_UserId ON SavedProperties(UserId);
CREATE INDEX IF NOT EXISTS IX_SavedProperties_PropertyId ON SavedProperties(PropertyId);
CREATE INDEX IF NOT EXISTS IX_PropertyInquiries_PropertyId ON PropertyInquiries(PropertyId);
`;

// Execute all SQL statements
db.serialize(() => {
  // Create Properties table
  db.run(createPropertiesTableSQL, (err) => {
    if (err) {
      console.error('❌ Error creating Properties table:', err);
    } else {
      console.log('✅ Properties table created successfully');
    }
  });

  // Create PropertyImages table
  db.run(createPropertyImagesTableSQL, (err) => {
    if (err) {
      console.error('❌ Error creating PropertyImages table:', err);
    } else {
      console.log('✅ PropertyImages table created successfully');
    }
  });

  // Create PropertyFacilities table
  db.run(createPropertyFacilitiesTableSQL, (err) => {
    if (err) {
      console.error('❌ Error creating PropertyFacilities table:', err);
    } else {
      console.log('✅ PropertyFacilities table created successfully');
    }
  });

  // Create SavedProperties table
  db.run(createSavedPropertiesTableSQL, (err) => {
    if (err) {
      console.error('❌ Error creating SavedProperties table:', err);
    } else {
      console.log('✅ SavedProperties table created successfully');
    }
  });

  // Create PropertyInquiries table
  db.run(createPropertyInquiriesTableSQL, (err) => {
    if (err) {
      console.error('❌ Error creating PropertyInquiries table:', err);
    } else {
      console.log('✅ PropertyInquiries table created successfully');
    }
  });

  // Create indexes
  db.exec(createIndexesSQL, (err) => {
    if (err) {
      console.error('❌ Error creating indexes:', err);
    } else {
      console.log('✅ Indexes created successfully');
    }
  });

  // Close database connection
  db.close((err) => {
    if (err) {
      console.error('❌ Error closing database:', err);
      process.exit(1);
    } else {
      console.log('\n🎉 All property tables created successfully!');
      console.log('\nTables created:');
      console.log('  ✅ Properties - Main property data');
      console.log('  ✅ PropertyImages - Multiple images per property');
      console.log('  ✅ PropertyFacilities - Property amenities');
      console.log('  ✅ SavedProperties - User favorites');
      console.log('  ✅ PropertyInquiries - Buyer inquiries');
      console.log('\n📊 Indexes created for optimal query performance');
      process.exit(0);
    }
  });
});
