-- Add additional profile fields to Users table
-- Run this SQL to add City, State, Address, and Bio fields

-- For SQLite (PropertyManagement.db)
ALTER TABLE Users ADD COLUMN City VARCHAR(50) DEFAULT '';
ALTER TABLE Users ADD COLUMN State VARCHAR(50) DEFAULT '';
ALTER TABLE Users ADD COLUMN Address VARCHAR(255) DEFAULT '';
ALTER TABLE Users ADD COLUMN Bio TEXT DEFAULT '';

-- Verify the changes
-- SELECT * FROM Users LIMIT 1;
