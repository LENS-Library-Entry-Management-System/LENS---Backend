# LENS - Library Entry Notation System

**Backend Repository**

An automated ID scanning system designed to efficiently record, store, and manage log records of students and faculty at USTP-CDO Library.

---

## Overview

LENS (Library Entry Notation System) modernizes library access management by automating the entry logging process. The system reduces manual errors, improves operational efficiency, and provides a seamless experience for library users.

### Key Features

- **Automated ID Scanning**: RFID-based entry logging with duplicate detection
- **Real-time Entry Monitoring**: Live tracking of library entries
- **Secure Authentication**: JWT-based admin authentication with role-based access control
- **User Management**: Comprehensive student and faculty record management
- **Audit Logging**: Complete trail of all administrative actions
- **Data Export**: CSV export functionality for reporting
- **MQTT Integration**: Hardware integration support for RFID scanners
- **Self-hosted Database**: Complete data control with PostgreSQL

---

## Technology Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (self-hosted or Docker)
- **ORM**: Sequelize
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Other**: MQTT for hardware integration, CORS enabled

---

## Getting Started

### Prerequisites

- **Node.js** (v18+)
- **PostgreSQL** (v12+) - locally installed or via Docker
- **npm** or **yarn** package manager
- **.env** file with database credentials

### Installation & Setup

```bash
# Clone the repository
git clone https://github.com/6reenhorn/LENS---Backend.git
cd LENS---Backend

# Install dependencies
npm install

# Create .env file with required variables
cp .env.example .env  # (edit with your database credentials)

# Build TypeScript
npm run build

# Create database tables
npm run db:create

# Seed admin accounts (development only)
npm run seed:all

# Start development server
npm run dev

# Start production server
npm start
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lens_system
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# MQTT (optional)
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_TOPIC_SCAN=/rfid/scan
```

### Database Setup (Docker)

If you prefer Docker:

```bash
# Run PostgreSQL in Docker
docker run --name lens-postgres \
  -e POSTGRES_DB=lens_system \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=USTPeLib2025 \
  -p 5432:5432 \
  -d postgres:17

# Then run the setup scripts
npm run db:create
npm run seed:admin
```

---

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Health Check
```
GET /health
```
Returns server status and database connection info.

---

## Authentication Endpoints

### POST /auth/login
**Description**: Admin login with username and password

**Request Body**:
```json
{
  "username": "admin",
  "password": "password"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "admin": {
      "adminId": 1,
      "username": "admin",
      "fullName": "System Administrator",
      "email": "admin@ustp.edu.ph",
      "role": "super_admin"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### POST /auth/logout
**Description**: Logout current admin session

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### POST /auth/refresh
**Description**: Refresh access token using refresh token

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### GET /auth/profile
**Description**: Get current admin profile

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "adminId": 1,
    "username": "admin",
    "fullName": "System Administrator",
    "email": "admin@ustp.edu.ph",
    "role": "super_admin",
    "lastLogin": "2025-11-13T10:30:00.000Z"
  }
}
```

---

### PUT /auth/profile
**Description**: Update admin profile information

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Request Body**:
```json
{
  "fullName": "New Name",
  "email": "newemail@ustp.edu.ph",
  "currentPassword": "password",
  "newPassword": "newpassword123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "adminId": 1,
    "username": "admin",
    "fullName": "New Name",
    "email": "newemail@ustp.edu.ph",
    "role": "super_admin"
  }
}
```

---

## Public Endpoints (No Authentication Required)

### POST /entries/scan
**Description**: Record RFID scan entry with automatic duplicate detection (5-minute window)

**Request Body**:
```json
{
  "rfidTag": "RFID001"
}
```

**Response** (200 OK - Success):
```json
{
  "success": true,
  "message": "Entry recorded successfully",
  "data": {
    "entry": {
      "logId": 6,
      "userId": 1,
      "entryTimestamp": "2025-11-14T10:30:00Z",
      "entryMethod": "rfid",
      "status": "success"
    },
    "user": {
      "idNumber": "2021-0001",
      "fullName": "Juan Dela Cruz",
      "userType": "student",
      "college": "CCS",
      "department": "Computer Science"
    }
  }
}
```

**Response** (200 OK - Duplicate):
```json
{
  "success": false,
  "message": "Duplicate entry detected",
  "status": "duplicate",
  "user": {
    "idNumber": "2021-0001",
    "fullName": "Juan Dela Cruz"
  },
  "lastEntry": "2025-11-14T10:28:00Z"
}
```

**Response** (404 Not Found):
```json
{
  "success": false,
  "message": "RFID tag not found or user is inactive"
}
```

---

### POST /entries/manual
**Description**: Record manual ID number entry

**Request Body**:
```json
{
  "idNumber": "2021-0002"
}
```

**Response**: Same structure as `/entries/scan`

---

### GET /entries/validate/:rfid
**Description**: Pre-validate RFID tag before scanning (checks for duplicates)

**Parameters**:
- `rfid` (path): RFID tag to validate

**Example**: `GET /entries/validate/RFID001`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "idNumber": "2021-0001",
      "fullName": "Juan Dela Cruz",
      "userType": "student",
      "status": "active"
    },
    "isDuplicate": false,
    "lastEntry": null
  }
}
```

**Response** (Duplicate Detected):
```json
{
  "success": true,
  "data": {
    "user": {
      "idNumber": "2021-0001",
      "fullName": "Juan Dela Cruz"
    },
    "isDuplicate": true,
    "lastEntry": "2025-11-14T10:28:00Z"
  }
}
```

---

### GET /users/:id
**Description**: Retrieve user information by ID number or RFID tag

**Parameters**:
- `id` (path): ID number (e.g., "2021-0001") or RFID tag (e.g., "RFID001")

**Example**: `GET /users/2021-0001` or `GET /users/RFID001`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "idNumber": "2021-0001",
    "rfidTag": "RFID001",
    "fullName": "Juan Dela Cruz",
    "email": "juan.delacruz@ustp.edu.ph",
    "userType": "student",
    "college": "CCS",
    "department": "Computer Science",
    "yearLevel": "4",
    "status": "active",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

---

## Entry Management Endpoints (Protected)

All endpoints require authentication header:
```
Authorization: Bearer <accessToken>
```

### GET /entries
**Description**: Get all entry logs with pagination

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (default: 50)

**Example**: `GET /entries?page=1&limit=50`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "logId": 1,
        "userId": 1,
        "entryTimestamp": "2025-11-14T10:30:00Z",
        "entryMethod": "rfid",
        "status": "success",
        "user": {
          "idNumber": "2021-0001",
          "fullName": "Juan Dela Cruz",
          "userType": "student"
        }
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 50,
      "totalPages": 2
    }
  }
}
```

---

### GET /entries/:id
**Description**: Get specific entry log by ID

**Parameters**:
- `id` (path): Entry log ID

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "logId": 1,
    "userId": 1,
    "entryTimestamp": "2025-11-14T10:30:00Z",
    "entryMethod": "rfid",
    "status": "success",
    "user": {
      "idNumber": "2021-0001",
      "fullName": "Juan Dela Cruz",
      "email": "juan.delacruz@ustp.edu.ph",
      "userType": "student",
      "college": "CCS"
    }
  }
}
```

---

### GET /entries/active
**Description**: Get real-time active entries (last 5 minutes) with statistics

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "logId": 15,
        "userId": 3,
        "entryTimestamp": "2025-11-14T10:28:00Z",
        "user": {
          "fullName": "Pedro Reyes",
          "idNumber": "2022-0001"
        }
      }
    ],
    "stats": {
      "totalToday": 150,
      "students": 120,
      "faculty": 30,
      "lastHour": 25
    }
  }
}
```

---

### POST /entries/filter
**Description**: Filter/search entry logs by multiple criteria

**Request Body**:
```json
{
  "college": "College of Engineering",
  "userType": "student",
  "startDate": "2025-01-01",
  "endDate": "2025-01-31",
  "searchQuery": "John",
  "page": 1,
  "limit": 50
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "entries": [...],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 50,
      "totalPages": 1
    }
  }
}
```

---

### GET /entries/export
**Description**: Export entry logs to CSV format

**Query Parameters**:
- `format` (optional): Export format (default: "csv")
- `startDate` (optional): Start date filter
- `endDate` (optional): End date filter
- `college` (optional): College filter
- `userType` (optional): User type filter

**Example**: `GET /entries/export?format=csv&startDate=2025-01-01&endDate=2025-01-31`

**Response** (200 OK):
```
Content-Type: text/csv
Content-Disposition: attachment; filename="entry_logs_2025-11-14.csv"

Log ID,User ID,ID Number,Full Name,Entry Time,Method,Status,User Type,College
1,1,2021-0001,Juan Dela Cruz,2025-11-14 10:30:00,rfid,success,student,CCS
2,2,2021-0002,Maria Santos,2025-11-14 10:31:00,manual,success,student,CCS
```

---

### PUT /entries/:id
**Description**: Update entry log status or details

**Parameters**:
- `id` (path): Entry log ID

**Request Body**:
```json
{
  "entryTimestamp": "2025-01-01T10:00:00Z",
  "entryMethod": "rfid",
  "status": "success"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Entry updated successfully",
  "data": {
    "logId": 1,
    "entryTimestamp": "2025-01-01T10:00:00Z",
    "entryMethod": "rfid",
    "status": "success"
  }
}
```

---

### DELETE /entries/:id
**Description**: Delete entry log

**Parameters**:
- `id` (path): Entry log ID

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Entry deleted successfully"
}
```

---

## Database Schema

### Tables

#### `admins`
Stores admin user information with role-based access control.

| Column | Type | Description |
|--------|------|-------------|
| admin_id | INTEGER | Primary key |
| username | VARCHAR(50) | Unique username |
| password_hash | VARCHAR(255) | Bcrypt hashed password |
| full_name | VARCHAR(100) | Admin full name |
| email | VARCHAR(100) | Admin email |
| role | ENUM | 'super_admin' or 'staff' |
| last_login | TIMESTAMP | Last login timestamp |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Update timestamp |

#### `users`
Stores student and faculty user records.

| Column | Type | Description |
|--------|------|-------------|
| user_id | INTEGER | Primary key |
| id_number | VARCHAR(20) | Unique ID number |
| rfid_tag | VARCHAR(50) | Unique RFID tag |
| full_name | VARCHAR(100) | User full name |
| email | VARCHAR(100) | User email |
| user_type | ENUM | 'student', 'faculty', or 'staff' |
| college | VARCHAR(100) | College/Department |
| department | VARCHAR(100) | Specific department |
| year_level | VARCHAR(10) | Year level (students) |
| status | ENUM | 'active' or 'inactive' |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Update timestamp |

#### `entry_logs`
Records all library entry transactions.

| Column | Type | Description |
|--------|------|-------------|
| log_id | INTEGER | Primary key |
| user_id | INTEGER | Foreign key to users |
| entry_timestamp | TIMESTAMP | Entry date and time |
| entry_method | ENUM | 'rfid' or 'manual' |
| status | ENUM | 'success', 'duplicate', or 'error' |
| created_at | TIMESTAMP | Creation timestamp |

#### `audit_logs`
Tracks all administrative actions for accountability.

| Column | Type | Description |
|--------|------|-------------|
| audit_id | INTEGER | Primary key |
| admin_id | INTEGER | Foreign key to admins |
| action_type | ENUM | Action performed |
| target_table | VARCHAR(50) | Affected table |
| target_id | INTEGER | Affected record ID |
| description | TEXT | Action description |
| timestamp | TIMESTAMP | Action timestamp |
| ip_address | VARCHAR(45) | Admin IP address |

---

## NPM Scripts

```bash
# Development
npm run dev              # Start dev server with auto-reload

# Build & Production
npm run build            # Compile TypeScript to dist/
npm start                # Run production server

# Database
npm run db:create        # Create admin and audit tables
npm run db:create-users  # Create user and entry log tables
npm run db:sync          # Sync all database models
npm run seed:admin       # Seed admin accounts (dev only)
npm run seed:users       # Seed user accounts (dev only)
npm run seed:all         # Seed all data (admin + users)

# Quality
npm run lint             # Run ESLint
npm run lint:fix         # Run ESLint with auto-fix
npm run type-check       # Run TypeScript compiler check
npm run test             # Run Jest tests with coverage
```

---

## Project Structure

```
LENS---Backend/
├── server.ts                          # Main entry point
├── rfid-entry-backend/
│   ├── src/
│   │   ├── config/                   # Configuration files
│   │   │   ├── database.ts           # Sequelize & PostgreSQL setup
│   │   │   ├── env.ts                # Environment variables
│   │   │   ├── mqtt.ts               # MQTT broker config
│   │   │   └── syncDatabase.ts       # Database sync utility
│   │   ├── controllers/              # Route handlers
│   │   │   ├── authController.ts     # Auth operations
│   │   │   ├── entryController.ts    # Entry logging
│   │   │   ├── publicController.ts   # Public RFID endpoints
│   │   │   ├── rfidController.ts     # RFID scanning
│   │   │   └── userController.ts     # User management
│   │   ├── middleware/               # Express middleware
│   │   │   ├── auth.ts               # JWT authentication
│   │   │   ├── errorHandler.ts       # Error handling
│   │   │   ├── rateLimiter.ts        # Rate limiting
│   │   │   └── validator.ts          # Input validation
│   │   ├── models/                   # Sequelize models
│   │   │   ├── Admin.ts              # Admin user model
│   │   │   ├── AuditLog.ts           # Audit trail model
│   │   │   ├── EntryLog.ts           # Entry log model
│   │   │   └── User.ts               # User model
│   │   ├── routes/                   # API routes
│   │   │   ├── authRoutes.ts         # Auth endpoints
│   │   │   ├── entryRoutes.ts        # Entry endpoints
│   │   │   └── publicRoutes.ts       # Public endpoints
│   │   ├── services/                 # Business logic
│   │   │   ├── auditService.ts       # Audit logging
│   │   │   ├── hardwareService.ts    # RFID hardware control
│   │   │   ├── notificationService.ts # Notifications
│   │   │   └── reportService.ts      # Reporting
│   │   ├── utils/                    # Utility functions
│   │   │   ├── helpers.ts            # Helper functions
│   │   │   ├── jwt.ts                # JWT utilities
│   │   │   ├── logger.ts             # Logging
│   │   │   └── response.ts           # Response formatting
│   │   └── app.ts                    # Express app setup
│   ├── scripts/                      # Utility scripts
│   │   ├── createTables.ts           # Database table creation
│   │   ├── createUserTables.ts       # User tables creation
│   │   ├── seedAdmin.ts              # Admin account seeding
│   │   ├── seedUsers.ts              # User data seeding
│   │   └── syncDatabase.ts           # Database sync
│   └── test/                         # Test files
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
└── .env                              # Environment variables
```

---

## Testing

### Default Test Credentials

**Admin Accounts** (after running `npm run seed:admin`):

| Role | Username | Password | Email |
|------|----------|----------|-------|
| Super Admin | `admin` | `password` | `admin@ustp.edu.ph` |
| Staff | `staff` | `password123` | `staff@ustp.edu.ph` |

⚠️ **IMPORTANT**: Change these credentials immediately in production!

**Test Users** (after running `npm run seed:users`):
- **RFID001** → Juan Dela Cruz (2021-0001)
- **RFID002** → Maria Santos (2021-0002)
- **RFID003** → Pedro Reyes (2022-0001)
- **RFID_FAC001** → Dr. Ana Garcia (FAC-001)
- **RFID_FAC002** → Engr. Carlos Mendoza (FAC-002)

### Manual Testing with cURL

**Login**:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

**RFID Scan**:
```bash
curl -X POST http://localhost:5000/api/entries/scan \
  -H "Content-Type: application/json" \
  -d '{"rfidTag":"RFID001"}'
```

**Manual Entry**:
```bash
curl -X POST http://localhost:5000/api/entries/manual \
  -H "Content-Type: application/json" \
  -d '{"idNumber":"2021-0002"}'
```

**Validate RFID**:
```bash
curl -X GET http://localhost:5000/api/entries/validate/RFID001
```

**Get User Info**:
```bash
curl -X GET http://localhost:5000/api/users/2021-0001
# or
curl -X GET http://localhost:5000/api/users/RFID001
```

**Get Entry Logs** (Protected):
```bash
curl -X GET http://localhost:5000/api/entries \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Security Features

- **Password Hashing**: bcrypt with 10 salt rounds
- **JWT Authentication**: Stateless authentication with access and refresh tokens
- **Role-Based Access Control**: Super admin and staff roles
- **Audit Trail**: Complete logging of administrative actions
- **IP Logging**: Security monitoring with IP address tracking
- **Duplicate Prevention**: 5-minute sliding window for entry detection
- **Rate Limiting**: Protection against abuse
- **Input Validation**: All inputs validated and sanitized

---

## Error Handling

All API endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (development only)"
}
```

### Common HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required or failed
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

---

## Project Status

🚧 **In Development**

### Completed Features
- ✅ JWT Authentication System
- ✅ Admin User Management
- ✅ Public Entry Endpoints (RFID/Manual)
- ✅ Entry Log Management with CRUD operations
- ✅ Duplicate Detection (5-minute window)
- ✅ CSV Export functionality
- ✅ Audit Logging
- ✅ Real-time Active Entries monitoring
- ✅ Advanced Filtering and Search

### Upcoming Features
- 🔄 User Management Dashboard
- 🔄 Advanced Analytics and Reports
- 🔄 Email Notifications
- 🔄 Mobile Application Support
- 🔄 WebSocket for Real-time Updates

---
