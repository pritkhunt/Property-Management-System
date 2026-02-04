# Property Management System - Backend API

A Node.js/Express backend API for the Property Management System with SQLite database.

## Features

- 🔐 JWT-based authentication
- 👥 User management (Buyers & Sellers)
- 🏢 Agent management with approval workflow
- 📧 Email OTP verification
- 📁 File upload for agent documents
- 🔒 Secure password hashing with bcrypt
- 🛡️ Security headers with Helmet
- 📊 Statistics endpoints
- ✅ Input validation

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** SQLite3
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcryptjs
- **File Upload:** Multer
- **Email:** Nodemailer
- **Security:** Helmet, CORS

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Navigate to the backend directory:
```bash
cd sem7_backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Copy `.env` file and update with your settings
   - Set JWT_SECRET to a secure random string
   - Configure email settings for OTP functionality

4. The SQLite database is already created at `./database/PropertyManagement.db`

## Running the Server

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication (`/api/auth`)

- `POST /auth/register-user` - Register a new user (buyer/seller)
- `POST /auth/register-agent` - Register a new agent (with file upload)
- `POST /auth/login` - Login user/agent
- `POST /auth/verify-otp` - Verify OTP
- `POST /auth/resend-otp` - Resend OTP
- `POST /auth/logout` - Logout user (requires auth)
- `GET /auth/profile` - Get current user profile (requires auth)

### Users (`/api/users`)

- `GET /users` - Get all users (requires auth)
- `GET /users/stats` - Get user statistics (requires auth)
- `GET /users/role/:role` - Get users by role (requires auth)
- `GET /users/:id` - Get user by ID (requires auth)
- `PUT /users/:id` - Update user (requires auth)
- `DELETE /users/:id` - Delete user (requires auth)

### Agents (`/api/agents`)

- `GET /agents` - Get all agents (requires auth)
- `GET /agents/stats` - Get agent statistics (requires auth)
- `GET /agents/status/:status` - Get agents by status (requires auth)
- `GET /agents/:id` - Get agent by ID (requires auth)
- `PUT /agents/:id` - Update agent (requires auth)
- `PUT /agents/:id/status` - Update agent status (requires auth)
- `POST /agents/bulk-approve` - Bulk approve agents (requires auth)
- `DELETE /agents/:id` - Delete agent (requires auth)

### Utility

- `GET /api` - API information
- `GET /api/health` - Health check

## Database Schema

### Users Table
- Stores buyers and sellers
- Fields: Id, Name, Email, MobileNo, Password, ProfilePic, PublicUrl, Role, IsLogin, CreatedAt, LastLoginAt

### Agents Table
- Stores property agents
- Fields: Id, Name, Email, MobileNo, Password, ProfilePic, PublicUrl, Role, Age, Gender, City, State, Address, BankName, BankAccountNo, IfscCode, AdharCardFront, PanCard, Status, Date

### OTPs Table
- Stores OTPs for verification
- Fields: Id, Email, Otp, CreatedAt, ExpiresAt, UserId, AgentId, IsUsed

## Authentication Flow

1. User/Agent registers with required details
2. OTP is generated and sent to email
3. User verifies OTP to activate account
4. User can login with email and password
5. JWT token is issued upon successful login
6. Token must be included in Authorization header for protected routes

## File Upload

Agent registration accepts file uploads for:
- Aadhar Card Front
- PAN Card

Files are stored in `./uploads/agent-documents/`

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Security headers with Helmet
- CORS configuration
- Request rate limiting ready
- Input validation
- SQL injection prevention with parameterized queries

## Error Handling

The API uses consistent error response format:
```json
{
  "success": false,
  "message": "Error message"
}
```

## Development

### Project Structure
```
sem7_backend/
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   ├── auth.js              # Authentication middleware
│   ├── upload.js            # File upload middleware
│   └── errorHandler.js      # Error handling middleware
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── users.js             # User management routes
│   └── agents.js            # Agent management routes
├── utils/
│   ├── jwt.js               # JWT utilities
│   ├── otp.js               # OTP utilities
│   └── email.js             # Email utilities
├── database/
│   └── PropertyManagement.db # SQLite database
├── uploads/                  # Uploaded files
├── .env                      # Environment variables
├── package.json              # Dependencies
└── server.js                 # Main server file
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| NODE_ENV | Environment | development |
| DB_PATH | Database file path | ./database/PropertyManagement.db |
| JWT_SECRET | JWT secret key | (required) |
| JWT_EXPIRES_IN | Token expiration | 7d |
| OTP_EXPIRY_MINUTES | OTP validity | 10 |
| EMAIL_HOST | SMTP host | smtp.gmail.com |
| EMAIL_PORT | SMTP port | 587 |
| EMAIL_USER | Email username | (required) |
| EMAIL_PASSWORD | Email password | (required) |
| MAX_FILE_SIZE | Max upload size | 5242880 (5MB) |
| CORS_ORIGIN | Allowed origin | http://localhost:3000 |

## License

ISC
