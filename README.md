# LENS - Library Entry Notation System

**Backend Repository**

An automated ID scanning system designed to efficiently record, store, and manage log records of students and faculty at USTP-CDO Library.

---

## Overview

LENS (Library Entry Notation System) modernizes library access management by automating the entry logging process. The system reduces manual errors, improves operational efficiency, and provides a seamless experience for library users.

### Key Features

- Automated ID scanning and validation
- Real-time entry logging
- Secure record storage and retrieval
- User management for students and faculty
- Self-hosted SQL database for complete data control

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

## Team Members

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/DnJstr">
        <img src="https://github.com/DnJstr.png" width="100px;" alt="DnJstr"/>
        <br />
        <sub><b>DnJstr</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/Gshadow2005">
        <img src="https://github.com/Gshadow2005.png" width="100px;" alt="Gshadow2005"/>
        <br />
        <sub><b>Gshadow2005</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/6reenhorn">
        <img src="https://github.com/6reenhorn.png" width="100px;" alt="6reenhorn"/>
        <br />
        <sub><b>6reenhorn (_Nu1L)</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/KokoMinaj">
        <img src="https://github.com/KokoMinaj.png" width="100px;" alt="KokoMinaj"/>
        <br />
        <sub><b>KokoMinaj</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/piaamarie">
        <img src="https://github.com/piaamarie.png" width="100px;" alt="piaamarie"/>
        <br />
        <sub><b>Marie</b></sub>
      </a>
    </td>
  </tr>
</table>

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

## API Endpoints

### Base URL
```
http://localhost:5000/api
```

### Health Check
```
GET /health
```
Returns server status and database connection info.

### Authentication Endpoints

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}

Response:
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
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

#### Logout
```
POST /auth/logout
Authorization: Bearer <accessToken>

Response:
{
  "success": true,
  "message": "Logout successful"
}
```

#### Refresh Token
```
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}

Response:
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

#### Get Profile
```
GET /auth/profile
Authorization: Bearer <accessToken>

Response:
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

#### Update Profile
```
PUT /auth/profile
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "fullName": "New Name",
  "email": "newemail@ustp.edu.ph",
  "currentPassword": "password",
  "newPassword": "newpassword123"  // optional
}

Response:
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

### Entry Management Endpoints

#### Get All Entries
```
GET /entries?page=1&limit=50
Authorization: Bearer <accessToken>

Response:
{
  "success": true,
  "data": {
    "entries": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 50,
      "totalPages": 2
    }
  }
}
```

#### Get Entry by ID
```
GET /entries/:id
Authorization: Bearer <accessToken>

Response:
{
  "success": true,
  "data": { ...entry object... }
}
```

#### Update Entry
```
PUT /entries/:id
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "entryTimestamp": "2025-01-01T10:00:00Z",
  "entryMethod": "rfid",
  "status": "success"
}

Response:
{
  "success": true,
  "message": "Entry updated successfully",
  "data": { ...updated entry... }
}
```

#### Delete Entry
```
DELETE /entries/:id
Authorization: Bearer <accessToken>

Response:
{
  "success": true,
  "message": "Entry deleted successfully"
}
```

#### Get Active Entries (Real-time Monitoring)
```
GET /entries/active
Authorization: Bearer <accessToken>

Response:
{
  "success": true,
  "data": {
    "entries": [...],
    "stats": {
      "totalToday": 150,
      "students": 120,
      "faculty": 30,
      "lastHour": 25
    }
  }
}
```

#### Filter/Search Entries
```
POST /entries/filter
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "college": "College of Engineering",
  "userType": "student",
  "startDate": "2025-01-01",
  "endDate": "2025-01-31",
  "searchQuery": "John",
  "page": 1,
  "limit": 50
}

Response:
{
  "success": true,
  "data": {
    "entries": [...],
    "pagination": { ... }
  }
}
```

#### Export Entries
```
GET /entries/export?format=csv&startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer <accessToken>

Response: CSV file download
```

---

## Scripts

```bash
# Development
npm run dev              # Start dev server with auto-reload

# Build & Production
npm run build            # Compile TypeScript to dist/
npm start                # Run production server

# Database
npm run db:create        # Create database tables
npm run db:create-users  # Create user-related tables
npm run db:sync          # Sync database models
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
│   │   │   └── mqtt.ts               # MQTT broker config
|   |   |   └── syncDatabase.ts
│   │   ├── controllers/              # Route handlers
│   │   │   ├── authController.ts     # Auth operations
│   │   │   ├── entryController.ts    # Entry logging
│   │   │   ├── rfidController.ts     # RFID scanning
│   │   │   └── userController.ts     # User management
│   │   ├── middleware/               # Express middleware
│   │   │   ├── auth.ts               # JWT authentication
│   │   │   ├── errorHandler.ts       # Error handling
│   │   │   ├── rateLimiter.ts        # Rate limiting
│   │   │   └── validator.ts          # Input validation
│   │   ├── models/                   # Sequelize models
│   │   │   ├── Admin.ts              # Admin user model
│   │   │   ├── AuditLog.ts           
│   │   │   ├── EntryLog.ts           # Entry log model
│   │   │   └── User.ts               
│   │   ├── routes/                   # API routes
│   │   │   ├── authRoutes.ts         # Auth endpoints
│   │   │   ├── entryRoutes.ts        # Entry endpoints
│   │   ├── services/                 # Business logic
|   |   |   ├── auditService.ts
│   │   │   ├── hardwareService.ts    # RFID hardware control
│   │   │   ├── notificationService.ts # Notifications
│   │   │   └── reportService.ts      # Reporting
│   │   ├── utils/                    # Utility functions
│   │   │   ├── helpers.ts            # Helper functions
|   |   |   ├── jwt.ts
│   │   │   ├── logger.ts             # Logging
│   │   │   └── response.ts           # Response formatting
│   │   └── app.ts                    # Express app setup
│   ├── scripts/                      # Utility scripts
│   │   ├── createTables.ts           # Database table creation
|   |   ├── createUserTables.ts
│   │   ├── seedAdmin.ts              # Admin account seeding
|   |   ├── seedUsers.ts
│   │   └── syncDatabase.ts           # Database sync
│   └── test/                         # Test files
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
└── .env                              # Environment variables
```

---

## Contributing

New contributors should review the detailed workflow, tooling, and review expectations in [`AGENTS.md`](AGENTS.md). Follow that guide before opening a PR so your branch naming, lint/test checks, and database scripts align with team standards.

---

## Default Credentials (Development Only)

After running `npm run seed:admin`:

| Role | Username | Password | Email |
|------|----------|----------|-------|
| Super Admin | `admin` | `password` | `admin@ustp.edu.ph` |
| Staff | `staff` | `password123` | `staff@ustp.edu.ph` |

**⚠️ IMPORTANT**: Change these credentials immediately in production!

---

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <accessToken>
```

Tokens expire after 1 hour. Use the refresh token endpoint to get a new access token.

---

## Error Handling

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (development only)"
}
```

Common status codes:
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Project Status

🚧 **In Development** - Initial setup phase

---

## Institution

**University of Science and Technology of Southern Philippines**  
Cagayan de Oro Campus
