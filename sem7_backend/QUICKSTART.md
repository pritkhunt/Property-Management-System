# Quick Start Guide

## 🚀 Getting Started in 3 Steps

### Step 1: Install Dependencies
```bash
cd sem7_backend
npm install
```

### Step 2: Configure Environment (Optional)
The `.env` file is already set up with default values. Update if needed:
- **JWT_SECRET**: Change to a secure random string for production
- **EMAIL_* settings**: Configure for OTP email functionality
- **CORS_ORIGIN**: Update if frontend runs on different port

### Step 3: Start the Server
```bash
# Development mode (with auto-reload)
npm run dev

# OR Production mode
npm start
```

The server will start at: **http://localhost:5000**

---

## ✅ Verify Installation

1. **Check API Health:**
   Open browser: http://localhost:5000/api/health

2. **View API Documentation:**
   Open browser: http://localhost:5000/api

---

## 🔗 Connect Frontend

The frontend is already configured to connect to the backend at `http://localhost:5000/api`

Just start both servers:
1. Backend: `cd sem7_backend && npm run dev`
2. Frontend: `cd sem7_project && npm start`

---

## 📊 Database

The SQLite database is located at: `./database/PropertyManagement.db`

It already contains the following tables:
- **Users** - Buyers and Sellers
- **Agents** - Property Agents
- **OTPs** - Email verification codes

---

## 🧪 Test the API

### Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register-user \
  -H "Content-Type: application/json" \
  -d '{
    "Name": "John Doe",
    "Email": "john@example.com",
    "MobileNo": "9876543210",
    "Password": "password123",
    "Role": "buyer"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "Email": "john@example.com",
    "Password": "password123"
  }'
```

---

## 📝 Important Notes

1. **OTP Emails**: If email settings are not configured, OTPs will be logged to console
2. **File Uploads**: Agent documents are saved to `./uploads/agent-documents/`
3. **Authentication**: Most endpoints require a valid JWT token in the Authorization header
4. **Database**: The SQLite database file is included and ready to use

---

## 🆘 Troubleshooting

### Port Already in Use
Change the PORT in `.env` file:
```
PORT=5001
```

### Database Issues
Reinitialize the database:
```bash
npm run init-db
```

### Module Not Found
Reinstall dependencies:
```bash
rm -rf node_modules
npm install
```

---

## 📚 Next Steps

- Review the [README.md](README.md) for detailed API documentation
- Check the [database schema](../CreateTables.sql)
- Start integrating with the frontend!

Happy Coding! 🎉
