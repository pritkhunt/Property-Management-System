-- Create PropertyLikes table for storing property likes/favorites

CREATE TABLE IF NOT EXISTS PropertyLikes (
  Id INT PRIMARY KEY AUTO_INCREMENT,
  UserId INT NOT NULL,
  PropertyId INT NOT NULL,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
  FOREIGN KEY (PropertyId) REFERENCES Properties(Id) ON DELETE CASCADE,
  
  -- Ensure a user can only like a property once
  UNIQUE KEY unique_user_property (UserId, PropertyId),
  
  -- Indexes for better query performance
  INDEX idx_user (UserId),
  INDEX idx_property (PropertyId),
  INDEX idx_created (CreatedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comment to table
ALTER TABLE PropertyLikes COMMENT = 'Stores user likes/favorites for properties';
