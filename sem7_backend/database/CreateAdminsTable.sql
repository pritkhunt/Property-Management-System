-- Admins Table (for System Administrators)
CREATE TABLE IF NOT EXISTS Admins (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Username VARCHAR(30) NOT NULL,
    Email VARCHAR(30) UNIQUE NOT NULL,
    MobileNo VARCHAR(30) NOT NULL,
    Password VARCHAR(255) NOT NULL,
    ProfilePic VARCHAR(255) DEFAULT '/images/admin-avatar.png',
    PublicUrl VARCHAR(255) DEFAULT '/profile/admin/1',
    Role VARCHAR(30) NOT NULL DEFAULT 'admin',
    IsActive INTEGER NOT NULL DEFAULT 1,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    LastLoginAt DATETIME NULL
);

-- Index for better performance
CREATE INDEX IF NOT EXISTS IX_Admins_Email ON Admins(Email);
