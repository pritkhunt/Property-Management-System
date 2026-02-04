-- The Users table already has a Status column
-- No need to add a new column
-- Status values can be: 'active', 'inactive', 'suspended'

-- If Status column doesn't exist, add it:
-- ALTER TABLE Users ADD COLUMN Status VARCHAR(20) DEFAULT 'inactive';

-- Update existing users to have a status if NULL
UPDATE Users SET Status = 'inactive' WHERE Status IS NULL OR Status = '';
