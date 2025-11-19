# LENS - Library Entry Notation System

**Backend Repository**

An automated ID scanning system designed to efficiently record, store, and manage log records of students and faculty at USTP-CDO Library.

---

## Overview

LENS (Library Entry Notation System) modernizes library access management by automating the entry logging process. The system reduces manual errors, improves operational efficiency, and provides a seamless experience for library users.

### Key Features

- **Automated ID Scanning**: RFID-based entry logging with duplicate detection (5-minute window)
- **Real-time Entry Monitoring**: Live tracking of library entries with statistics
- **Secure Authentication**: JWT-based admin authentication with access and refresh tokens
- **Admin Management**: Complete admin user management with role-based permissions (super_admin, staff)
- **User Management**: Comprehensive student and faculty record management (CRUD operations)
- **Audit Logging**: Complete trail of all administrative actions with detailed tracking
- **Analytics & Dashboard**: Real-time statistics, peak hours analysis, entry trends by college/department
- **Reports**: Daily, weekly, monthly, and custom date-range reports with CSV export
- **User Search**: Advanced user search and filtering capabilities
- **Data Export**: CSV export functionality for reporting and individual entry logs
- **System Backup & Restore**: Full system backup with CSV exports for all tables
- **Database Optimization**: Built-in database maintenance and optimization tools
- **MQTT Integration**: Hardware integration support for RFID scanners
- **Redis Caching**: Performance optimization with Redis for session management and rate limiting
- **CSRF Protection**: Token-based CSRF protection for admin routes
- **Rate Limiting**: IP-based and user-based rate limiting with Redis store
- **Self-hosted Database**: Complete data control with PostgreSQL

---

## Technology Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (v12+)
- **ORM**: Sequelize
- **Cache/Session**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Security**: Helmet, CORS, CSRF Protection, Rate Limiting
- **Other**: MQTT for hardware integration, date-fns for date manipulation

---

## Getting Started

### Prerequisites

- **Node.js** (v18+)
- **PostgreSQL** (v12+) - locally installed or via Docker
- **Redis** (optional but recommended for production)
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
npm run db:create-users
npm run db:create-system-backup

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

# Redis (optional but recommended)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=changeme

# Backup Path (optional)
BACKUP_PATH=C:\Users\Public\Documents\LENS_Backups
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

# Run Redis in Docker
docker run --name lens-redis \
  -p 6379:6379 \
  -d redis:latest \
  redis-server --requirepass changeme

# Or use docker-compose
docker-compose up -d

# Then run the setup scripts
npm run db:create
npm run db:create-users
npm run db:create-system-backup
npm run seed:all
```

---

## API Documentation

Complete API documentation is available in the [docs/API.md](docs/API.md) file.

### Base URL
```
http://localhost:5000/api
```

### Quick Reference

#### Public Endpoints (No Authentication)
- `POST /api/entries/scan` - Record RFID scan entry
- `POST /api/entries/manual` - Record manual ID entry
- `GET /api/users/:id` - Get user info by ID/RFID

#### Authentication Endpoints
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/profile` - Get current admin profile
- `PUT /api/auth/profile` - Update admin profile

#### Protected Endpoints (Require Authentication)
- **Admins**: `/api/admins/*` (Super Admin only)
- **Users**: `/api/users/*` (CRUD operations)
- **Entries**: `/api/entries/*` (Entry log management)
- **Analytics**: `/api/analytics/*`, `/api/dashboard/*`
- **Reports**: `/api/reports/*` (Daily, weekly, monthly, custom)
- **Audit Logs**: `/api/audit-logs/*`
- **System**: `/api/system/*` (Backup, restore, maintenance)

For detailed endpoint documentation, see [docs/API.md](docs/API.md).

---

## Database Schema

### Tables Overview

#### `admins`
Admin user accounts with role-based access control.

| Column | Type | Description |
|--------|------|-------------|
| admin_id | SERIAL | Primary key |
| username | VARCHAR(50) | Unique username |
| password_hash | VARCHAR(255) | Bcrypt hashed password |
| full_name | VARCHAR(150) | Admin full name |
| email | VARCHAR(150) | Admin email (unique) |
| role | ENUM | 'super_admin' or 'staff' |
| last_login | TIMESTAMP | Last login timestamp |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Update timestamp |

#### `users`
Student and faculty user records.

| Column | Type | Description |
|--------|------|-------------|
| user_id | SERIAL | Primary key |
| id_number | VARCHAR(20) | Unique ID number |
| rfid_tag | VARCHAR(50) | Unique RFID tag |
| first_name | VARCHAR(100) | User first name |
| last_name | VARCHAR(100) | User last name |
| email | VARCHAR(150) | User email |
| user_type | ENUM | 'student' or 'faculty' |
| college | VARCHAR(100) | College/Department |
| department | VARCHAR(100) | Specific department |
| year_level | VARCHAR(20) | Year level (students only) |
| status | ENUM | 'active' or 'inactive' |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Update timestamp |

#### `entry_logs`
Records all library entry transactions.

| Column | Type | Description |
|--------|------|-------------|
| log_id | SERIAL | Primary key |
| user_id | INTEGER | Foreign key to users |
| entry_timestamp | TIMESTAMP | Entry date and time |
| entry_method | ENUM | 'rfid' or 'manual' |
| status | ENUM | 'success', 'duplicate', or 'error' |
| created_at | TIMESTAMP | Creation timestamp |

#### `audit_logs`
Tracks all administrative actions for accountability.

| Column | Type | Description |
|--------|------|-------------|
| audit_id | SERIAL | Primary key |
| admin_id | INTEGER | Foreign key to admins |
| action_type | ENUM | 'view', 'edit', 'delete', 'export', 'login', 'logout' |
| target_table | VARCHAR(50) | Affected table |
| target_id | INTEGER | Affected record ID |
| description | TEXT | Action description |
| timestamp | TIMESTAMP | Action timestamp |
| ip_address | VARCHAR(45) | Admin IP address |

#### `system_backups`
System backup metadata and tracking.

| Column | Type | Description |
|--------|------|-------------|
| backup_id | SERIAL | Primary key |
| created_by | INTEGER | Foreign key to admins |
| backup_date | TIMESTAMP | Backup creation date |
| file_path | VARCHAR(500) | Backup file location |
| size_mb | DECIMAL(10,2) | Backup size in MB |
| status | ENUM | 'completed' or 'failed' |
| backup_type | ENUM | 'full', 'users', 'entries', 'admins' |
| description | TEXT | Backup description |
| deleted_at | TIMESTAMP | Soft delete timestamp |
| restore_at | TIMESTAMP | Restore timestamp |

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
npm run db:create-system-backup  # Create system backup table
npm run db:sync          # Sync all database models
npm run seed:admin       # Seed admin accounts (dev only)
npm run seed:users       # Seed user accounts (dev only)
npm run seed:analytics   # Seed analytics data (dev only)
npm run seed:all         # Seed all data (admin + users + analytics)

# Quality
npm run lint             # Run ESLint
npm run lint:fix         # Run ESLint with auto-fix
npm run type-check       # Run TypeScript compiler check
npm run test             # Run Jest tests with coverage
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
- **RFID001** → Juan Dela Cruz (2021-0001) - Student, CCS
- **RFID002** → Maria Santos (2021-0002) - Student, COE
- **RFID003** → Pedro Reyes (2022-0001) - Student, CCS
- **RFID_FAC001** → Dr. Ana Garcia (FAC-001) - Faculty, CCS
- **RFID_FAC002** → Engr. Carlos Mendoza (FAC-002) - Faculty, COE

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
- **Token Management**: Automatic token expiration and refresh token rotation
- **Role-Based Access Control**: Super admin and staff roles with permission checks
- **Audit Trail**: Complete logging of administrative actions with IP tracking
- **CSRF Protection**: Token-based CSRF protection for state-changing operations
- **Rate Limiting**: IP-based and user-based rate limiting with Redis store
  - Auth endpoints: 100 requests per 15 minutes
  - Refresh token: 10 requests per 15 minutes
  - API endpoints: 100 requests per 15 minutes
  - Read operations: 200 requests per minute
- **Duplicate Prevention**: 5-minute sliding window for entry detection
- **Input Validation**: All inputs validated and sanitized using express-validator
- **Request Size Limiting**: 1MB for regular requests, 10MB for file uploads
- **Helmet Security Headers**: XSS protection, content security policy
- **CORS Configuration**: Configurable allowed origins

---

## System Features

### Backup & Restore
- **Full System Backup**: Backup all tables (users, entries, admins, audit logs)
- **Selective Backup**: Individual table backups
- **CSV Export Format**: Easy to restore and portable
- **Backup Management**: List, view, and track all backups
- **Metadata Tracking**: Backup size, date, creator, type, status
- **Restore Functionality**: Guided restore process with manual import

### System Maintenance
- **Database Optimization**: VACUUM ANALYZE for PostgreSQL
- **System Health Check**: Monitor database, Redis, backup directory
- **System Logs**: View audit logs and system activity
- **Performance Monitoring**: Memory usage and uptime tracking

### Analytics & Reporting
- **Dashboard Statistics**: Total entries, unique students, daily averages
- **Peak Hours Analysis**: Hourly entry patterns
- **Entry Trends**: Daily, weekly, monthly trends visualization
- **College/Department Breakdown**: Entry distribution by academic unit
- **Custom Reports**: Date range, college, department, user type filters
- **CSV Export**: Generate downloadable reports

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
- **409 Conflict**: Duplicate entry or constraint violation
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

---

## Project Status

🚧 **In Development**

### Completed Features
- ✅ JWT Authentication System with Refresh Tokens
- ✅ Admin User Management with RBAC
- ✅ Public Entry Endpoints (RFID/Manual)
- ✅ Entry Log Management with CRUD operations
- ✅ Duplicate Detection (5-minute window)
- ✅ CSV Export functionality
- ✅ Audit Logging with detailed tracking
- ✅ Real-time Active Entries monitoring
- ✅ Advanced Filtering and Search
- ✅ Analytics & Dashboard (Statistics, Peak Hours, Trends)
- ✅ Reports (Daily, Weekly, Monthly, Custom)
- ✅ User Management (CRUD operations)
- ✅ User Search & Filtering
- ✅ Redis Caching Integration with Rate Limiting
- ✅ CSRF Protection for admin routes
- ✅ System Backup & Restore functionality
- ✅ Database Optimization tools
- ✅ System Health Monitoring


## License

This project is proprietary software for USTP-CDO Library.

## Contributors

- **Development Team**: USTP-CDO
