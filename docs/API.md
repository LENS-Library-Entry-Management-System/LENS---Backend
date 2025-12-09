# LENS API Endpoints Reference

**Base URL**: `http://localhost:5000/api`

---

## Table of Contents

1. [Health Check](#health-check)
2. [Authentication Endpoints](#authentication-endpoints)
3. [Admin Management](#admin-management)
4. [Public Endpoints (No Auth)](#public-endpoints-no-auth)
5. [Entry Management](#entry-management)
6. [User Management](#user-management)
7. [Analytics & Dashboard](#analytics--dashboard)
8. [Reports](#reports)
9. [Audit Logging](#audit-logging)

---

## Health Check

### GET `/health`
Check server and database status.

**Authentication**: Not required

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Server is running",
  "database": "Connected"
}
```

---

## Authentication Endpoints

### POST `/auth/login`
Admin login with username and password.

**Authentication**: Not required

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

**Error Response** (401 Unauthorized):
```json
{
  "success": false,
  "message": "Invalid username or password"
}
```

---

### POST `/auth/logout`
Logout current admin session.

**Authentication**: Required

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

### POST `/auth/refresh`
Refresh access token using refresh token.

**Authentication**: Not required

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

**Error Response** (401 Unauthorized):
```json
{
  "success": false,
  "message": "Invalid or expired refresh token"
}
```

---

### GET `/auth/profile`
Get current admin profile.

**Authentication**: Required

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

### PUT `/auth/profile`
Update admin profile information.

**Authentication**: Required

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

## Admin Management

**All endpoints require Super Admin role unless specified**

### GET `/admins`
Get all admin users with pagination.

**Authentication**: Required (Super Admin)

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (default: 50)
- `role` (optional): Filter by role ('super_admin', 'staff')

**Example**: `GET /admins?page=1&limit=50&role=staff`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "admins": [
"date": "2025-11-08",
        "count": 45,
        "label": "Nov 08"
      },
      {
        "date": "2025-11-09",
        "count": 52,
        "label": "Nov 09"
      },
      {
        "date": "2025-11-10",
        "count": 48,
        "label": "Nov 10"
      }
    ],
    "totalEntries": 315
  }
}
```

---

### GET `/analytics/by-college`
Get entry breakdown by college.

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "colleges": [
      {
        "college": "College of Computer Studies",
        "count": 450,
        "percentage": "36.00"
      },
      {
        "college": "College of Engineering",
        "count": 380,
        "percentage": "30.40"
      },
      {
        "college": "College of Business Administration",
        "count": 250,
        "percentage": "20.00"
      },
      {
        "college": "College of Science and Mathematics",
        "count": 170,
        "percentage": "13.60"
      }
    ],
    "totalEntries": 1250
  }
}
```

---

### GET `/analytics/by-department`
Get entry breakdown by department.

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "departments": [
      {
        "department": "Computer Science",
        "college": "College of Computer Studies",
        "count": 280,
        "percentage": "22.40"
      },
      {
        "department": "Information Technology",
        "college": "College of Computer Studies",
        "count": 170,
        "percentage": "13.60"
      },
      {
        "department": "Electrical Engineering",
        "college": "College of Engineering",
        "count": 200,
        "percentage": "16.00"
      },
      {
        "department": "Mechanical Engineering",
        "college": "College of Engineering",
        "count": 180,
        "percentage": "14.40"
      }
    ],
    "totalEntries": 1250
  }
}
```

---

## Reports

**All endpoints require authentication**

### GET `/reports/daily`
Get daily report for current day.

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "reportType": "daily",
    "date": "2025-11-14",
    "stats": {
      "totalEntries": 85,
      "students": 70,
      "faculty": 15,
      "byCollege": {
        "CCS": 45,
        "COE": 30,
        "CBA": 10
      },
      "byHour": {
        "08:00": 15,
        "09:00": 20,
        "10:00": 25,
        "11:00": 15,
        "12:00": 5,
        "13:00": 5
      }
    },
    "entries": [
      {
        "logId": 1,
        "userId": 1,
        "entryTimestamp": "2025-11-14T08:30:00Z",
        "user": {
          "idNumber": "2021-0001",
          "fullName": "Juan Dela Cruz",
          "userType": "student",
          "college": "CCS"
        }
      }
    ]
  }
}
```

---

### GET `/reports/weekly`
Get weekly report for current week.

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "reportType": "weekly",
    "startDate": "2025-11-10",
    "endDate": "2025-11-16",
    "stats": {
      "totalEntries": 520,
      "students": 420,
      "faculty": 100,
      "byCollege": {
        "CCS": 250,
        "COE": 180,
        "CBA": 90
      },
      "byDay": {
        "Monday": 85,
        "Tuesday": 92,
        "Wednesday": 88,
        "Thursday": 95,
        "Friday": 90,
        "Saturday": 40,
        "Sunday": 30
      }
    },
    "entries": [...]
  }
}
```

---

### GET `/reports/monthly`
Get monthly report for current month.

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "reportType": "monthly",
    "month": "November 2025",
    "startDate": "2025-11-01",
    "endDate": "2025-11-30",
    "stats": {
      "totalEntries": 2100,
      "students": 1680,
      "faculty": 420,
      "byCollege": {
        "CCS": 1050,
        "COE": 735,
        "CBA": 315
      },
      "byWeek": {
        "Week 1": 480,
        "Week 2": 520,
        "Week 3": 550,
        "Week 4": 550
      }
    },
    "entries": [...]
  }
}
```

---

### GET `/reports/custom`
Get custom date range report.

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Query Parameters**:
- `startDate` (required): Start date (YYYY-MM-DD)
- `endDate` (required): End date (YYYY-MM-DD)
- `college` (optional): Filter by college
- `department` (optional): Filter by department
- `userType` (optional): Filter by user type

**Example**: `GET /reports/custom?startDate=2025-11-01&endDate=2025-11-15&college=CCS`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "reportType": "custom",
    "startDate": "2025-11-01",
    "endDate": "2025-11-15",
    "filters": {
      "college": "CCS"
    },
    "stats": {
      "totalEntries": 1200,
      "students": 960,
      "faculty": 240,
      "byCollege": {
        "CCS": 1200
      },
      "byDepartment": {
        "Computer Science": 700,
        "Information Technology": 500
      },
      "dailyAverage": 80
    },
    "entries": [...]
  }
}
```

---

### POST `/reports/generate`
Generate and download report as CSV.

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Request Body**:
```json
{
  "reportType": "monthly",
  "startDate": "2025-11-01",
  "endDate": "2025-11-30",
  "format": "csv",
  "college": "CCS",
  "department": "Computer Science",
  "userType": "student"
}
```

**Response** (200 OK - CSV File):
```csv
Content-Type: text/csv
Content-Disposition: attachment; filename=report_monthly_2025-11-14.csv

Log ID,Date,Time,ID Number,Name,User Type,College,Department,Year Level,Entry Method,Status
1,2025-11-01,08:30:00,2021-0001,Juan Dela Cruz,student,CCS,Computer Science,4,rfid,success
2,2025-11-01,08:35:00,2021-0002,Maria Santos,student,CCS,Computer Science,4,rfid,success
3,2025-11-01,09:15:00,2021-0003,Pedro Reyes,student,CCS,Computer Science,3,manual,success
```

---

### GET `/reports/export/:id`
Export specific entry log by ID as CSV.

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Parameters**:
- `id` (path): Entry log ID

**Example**: `GET /reports/export/1`

**Response** (200 OK - CSV File):
```csv
Content-Type: text/csv
Content-Disposition: attachment; filename=entry_1_2025-11-14.csv

Log ID,Date,Time,ID Number,Name,User Type,College,Department,Year Level,Entry Method,Status
1,2025-11-01,08:30:00,2021-0001,Juan Dela Cruz,student,CCS,Computer Science,4,rfid,success
```

---

## Audit Logging

**All endpoints require authentication**

### GET `/audit-logs`
Get all audit logs with pagination and filtering.

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (default: 50)
- `actionType` (optional): Filter by action type
- `targetTable` (optional): Filter by target table
- `adminId` (optional): Filter by admin ID
- `startDate` (optional): Start date filter (YYYY-MM-DD)
- `endDate` (optional): End date filter (YYYY-MM-DD)

**Example**: `GET /audit-logs?page=1&limit=50&actionType=login&startDate=2025-11-01`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "auditId": 1,
        "adminId": 1,
        "actionType": "login",
        "targetTable": null,
        "targetId": null,
        "description": "Admin login",
        "timestamp": "2025-11-14T08:30:00Z",
        "ipAddress": "192.168.1.100",
        "admin": {
          "adminId": 1,
          "username": "admin",
          "fullName": "System Administrator",
          "role": "super_admin"
        }
      },
      {
        "auditId": 2,
        "adminId": 1,
        "actionType": "create",
        "targetTable": "users",
        "targetId": 5,
        "description": "Created new user: 2021-0005",
        "timestamp": "2025-11-14T09:15:00Z",
        "ipAddress": "192.168.1.100",
        "admin": {
          "adminId": 1,
          "username": "admin",
          "fullName": "System Administrator",
          "role": "super_admin"
        }
      },
      {
        "auditId": 3,
        "adminId": 2,
        "actionType": "view",
        "targetTable": "entry_logs",
        "targetId": null,
        "description": "Viewed entry logs",
        "timestamp": "2025-11-14T10:00:00Z",
        "ipAddress": "192.168.1.105",
        "admin": {
          "adminId": 2,
          "username": "staff",
          "fullName": "Staff User",
          "role": "staff"
        }
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 50,
      "totalPages": 3
    }
  }
}
```

---

### GET `/audit-logs/:id`
Get specific audit log by ID.

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Parameters**:
- `id` (path): Audit log ID

**Example**: `GET /audit-logs/1`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "auditId": 1,
    "adminId": 1,
    "actionType": "login",
    "targetTable": null,
    "targetId": null,
    "description": "Admin login",
    "timestamp": "2025-11-14T08:30:00Z",
    "ipAddress": "192.168.1.100",
    "admin": {
      "adminId": 1,
      "username": "admin",
      "fullName": "System Administrator",
      "email": "admin@ustp.edu.ph",
      "role": "super_admin"
    }
  }
}
```

---

### GET `/audit-logs/admin/:adminId`
Get audit logs for specific admin.

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Parameters**:
- `adminId` (path): Admin ID

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (default: 50)
- `actionType` (optional): Filter by action type
- `startDate` (optional): Start date filter (YYYY-MM-DD)
- `endDate` (optional): End date filter (YYYY-MM-DD)

**Example**: `GET /audit-logs/admin/1?page=1&limit=50&actionType=create`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "admin": {
      "adminId": 1,
      "username": "admin",
      "fullName": "System Administrator",
      "role": "super_admin"
    },
    "logs": [
      {
        "auditId": 5,
        "adminId": 1,
        "actionType": "create",
        "targetTable": "users",
        "targetId": 10,
        "description": "Created new user: 2021-0010",
        "timestamp": "2025-11-13T14:30:00Z",
        "ipAddress": "192.168.1.100"
      },
      {
        "auditId": 8,
        "adminId": 1,
        "actionType": "create",
        "targetTable": "admins",
        "targetId": 3,
        "description": "Created new admin: newadmin",
        "timestamp": "2025-11-12T11:20:00Z",
        "ipAddress": "192.168.1.100"
      }
    ],
    "stats": {
      "totalActions": 45,
      "actionBreakdown": [
        {
          "actionType": "login",
          "count": 15
        },
        {
          "actionType": "view",
          "count": 20
        },
        {
          "actionType": "create",
          "count": 5
        },
        {
          "actionType": "edit",
          "count": 3
        },
        {
          "actionType": "delete",
          "count": 2
        }
      ]
    },
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 50,
      "totalPages": 1
    }
  }
}
```

---

### GET `/audit-logs/stats`
Get audit statistics (Super Admin only).

**Authentication**: Required (Super Admin)

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Query Parameters**:
- `startDate` (optional): Start date filter (YYYY-MM-DD)
- `endDate` (optional): End date filter (YYYY-MM-DD)

**Example**: `GET /audit-logs/stats?startDate=2025-11-01&endDate=2025-11-30`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "totalActions": 1250,
    "recentActivity": 45,
    "actionsByType": [
      {
        "actionType": "login",
        "count": 400,
        "percentage": "32.00"
      },
      {
        "actionType": "view",
        "count": 350,
        "percentage": "28.00"
      },
      {
        "actionType": "edit",
        "count": 300,
        "percentage": "24.00"
      },
      {
        "actionType": "create",
        "count": 150,
        "percentage": "12.00"
      },
      {
        "actionType": "delete",
        "count": 50,
        "percentage": "4.00"
      }
    ],
    "actionsByAdmin": [
      {
        "adminId": 1,
        "username": "admin",
        "fullName": "System Administrator",
        "count": 600,
        "percentage": "48.00"
      },
      {
        "adminId": 2,
        "username": "staff",
        "fullName": "Staff User",
        "count": 450,
        "percentage": "36.00"
      },
      {
        "adminId": 3,
        "username": "newadmin",
        "fullName": "New Administrator",
        "count": 200,
        "percentage": "16.00"
      }
    ],
    "actionsByTable": [
      {
        "targetTable": "users",
        "count": 450,
        "percentage": "36.00"
      },
      {
        "targetTable": "entry_logs",
        "count": 350,
        "percentage": "28.00"
      },
      {
        "targetTable": "admins",
        "count": 150,
        "percentage": "12.00"
      },
      {
        "targetTable": null,
        "count": 300,
        "percentage": "24.00"
      }
    ],
    "timelineData": [
      {
        "date": "2025-11-01",
        "count": 45
      },
      {
        "date": "2025-11-02",
        "count": 52
      },
      {
        "date": "2025-11-03",
        "count": 48
      }
    ]
  }
}
```

---

## Common Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "Resource already exists",
  "details": "Username 'admin' is already taken"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Detailed error message (development only)"
}
```

---

## Action Types for Audit Logs

Available action types for filtering audit logs:

- `login` - Admin login
- `logout` - Admin logout
- `view` - Viewing records
- `create` - Creating new records
- `edit` - Editing existing records
- `update` - Updating records
- `delete` - Deleting records
- `export` - Exporting data
- `import` - Importing data

---

## Notes

1. **Timestamps**: All timestamps are in ISO 8601 format (UTC)
2. **Pagination**: Default page size is 50, maximum is 100
3. **Authentication**: Access tokens expire after 1 hour, refresh tokens after 7 days
4. **Duplicate Detection**: Entry scanning has a 5-minute sliding window
5. **CSV Exports**: All CSV files use UTF-8 encoding
6. **Rate Limiting**: API requests are rate-limited per IP address
7. **CORS**: Configured for allowed origins only
        "adminId": 1,
        "username": "admin",
        "fullName": "System Administrator",
        "email": "admin@ustp.edu.ph",
        "role": "super_admin",
        "lastLogin": "2025-11-13T10:30:00.000Z",
        "createdAt": "2025-01-01T00:00:00Z",
        "updatedAt": "2025-01-01T00:00:00Z"
      },
      {
        "adminId": 2,
        "username": "staff",
        "fullName": "Staff User",
        "email": "staff@ustp.edu.ph",
        "role": "staff",
        "lastLogin": "2025-11-12T14:20:00.000Z",
        "createdAt": "2025-01-01T00:00:00Z",
        "updatedAt": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 2,
      "page": 1,
      "limit": 50,
      "totalPages": 1
    }
  }
}
```

---

### POST `/admins`
Create a new admin user.

**Authentication**: Required (Super Admin)

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Request Body**:
```json
{
  "username": "newadmin",
  "password": "securepassword123",
  "fullName": "New Administrator",
  "email": "newadmin@ustp.edu.ph",
  "role": "staff"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Admin created successfully",
  "data": {
    "adminId": 3,
    "username": "newadmin",
    "fullName": "New Administrator",
    "email": "newadmin@ustp.edu.ph",
    "role": "staff",
    "createdAt": "2025-11-14T10:30:00Z",
    "updatedAt": "2025-11-14T10:30:00Z"
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "Username already exists"
}
```

---

### GET `/admins/:id`
Get admin details by ID.

**Authentication**: Required (Super Admin or self)

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Parameters**:
- `id` (path): Admin ID

**Example**: `GET /admins/1`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "admin": {
      "adminId": 1,
      "username": "admin",
      "fullName": "System Administrator",
      "email": "admin@ustp.edu.ph",
      "role": "super_admin",
      "lastLogin": "2025-11-13T10:30:00.000Z",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    },
    "stats": {
      "totalActions": 150,
      "actionsToday": 5
    }
  }
}
```

---

### PUT `/admins/:id`
Update admin information.

**Authentication**: Required (Super Admin or self)

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Parameters**:
- `id` (path): Admin ID

**Request Body**:
```json
{
  "fullName": "Updated Administrator",
  "email": "updated@ustp.edu.ph",
  "role": "super_admin"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Admin updated successfully",
  "data": {
    "adminId": 1,
    "username": "admin",
    "fullName": "Updated Administrator",
    "email": "updated@ustp.edu.ph",
    "role": "super_admin",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-11-14T10:30:00Z"
  }
}
```

---

### DELETE `/admins/:id`
Delete an admin user.

**Authentication**: Required (Super Admin)

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Parameters**:
- `id` (path): Admin ID

**Example**: `DELETE /admins/3`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Admin deleted successfully"
}
```

**Error Response** (403 Forbidden):
```json
{
  "success": false,
  "message": "Cannot delete your own account"
}
```

---

## Public Endpoints (No Auth)

### POST `/entries/scan`
Record RFID scan entry with automatic validation and duplicate detection.

**Authentication**: Not required

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

**Response** (409 Conflict - Duplicate):
```json
{
  "success": false,
  "message": "Duplicate entry detected",
  "status": "duplicate",
  "data": {
    "user": {
      "idNumber": "2021-0001",
      "fullName": "Juan Dela Cruz",
      "userType": "student",
      "college": "CCS",
      "department": "Computer Science"
    },
    "lastEntry": "2025-11-14T10:28:00Z",
    "waitTime": 120
  }
}
```

**Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "RFID tag is required"
}
```

**Error Response** (404 Not Found):
```json
{
  "success": false,
  "message": "User not found or inactive"
}
```

---

### POST `/entries/manual`
Record manual ID number entry.

**Authentication**: Not required

**Request Body**:
```json
{
  "idNumber": "2021-0002"
}
```

**Response** (200 OK - Success):
```json
{
  "success": true,
  "message": "Entry recorded successfully",
  "data": {
    "entry": {
      "logId": 7,
      "userId": 2,
      "entryTimestamp": "2025-11-14T10:31:00Z",
      "entryMethod": "manual",
      "status": "success"
    },
    "user": {
      "idNumber": "2021-0002",
      "fullName": "Maria Santos",
      "userType": "student",
      "college": "CCS",
      "department": "Information Technology"
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
    "idNumber": "2021-0002",
    "fullName": "Maria Santos"
  },
  "lastEntry": "2025-11-14T10:29:00Z"
}
```

**Response** (200 OK - Duplicate):
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

**Error Response** (404 Not Found):
```json
{
  "success": false,
  "message": "RFID tag not found"
}
```

---

### GET `/users/:id`
Retrieve user by ID number or RFID tag.

**Authentication**: Not required

**Parameters**:
- `id` (path): ID number or RFID tag

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

**Error Response** (404 Not Found):
```json
{
  "success": false,
  "message": "User not found"
}
```

---

## Entry Management

**All endpoints require authentication**

### GET `/entries`
Get all entry logs with pagination.

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <accessToken>
```

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
      },
      {
        "logId": 2,
        "userId": 2,
        "entryTimestamp": "2025-11-14T10:31:00Z",
        "entryMethod": "manual",
        "status": "success",
        "user": {
          "idNumber": "2021-0002",
          "fullName": "Maria Santos",
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

### GET `/entries/:id`
Get specific entry log by ID.

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Parameters**:
- `id` (path): Entry log ID

**Example**: `GET /entries/1`

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

### GET `/entries/active`
Get real-time active entries (last 5 minutes).

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <accessToken>
```

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
      },
      {
        "logId": 16,
        "userId": 1,
        "entryTimestamp": "2025-11-14T10:29:00Z",
        "user": {
          "fullName": "Juan Dela Cruz",
          "idNumber": "2021-0001"
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

### POST `/entries/filter`
Filter/search entry logs.

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <accessToken>
```

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
    "entries": [
      {
        "logId": 5,
        "userId": 3,
        "entryTimestamp": "2025-01-15T09:30:00Z",
        "entryMethod": "rfid",
        "status": "success",
        "user": {
          "idNumber": "2022-0001",
          "fullName": "John Doe",
          "userType": "student",
          "college": "College of Engineering"
        }
      }
    ],
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

### GET `/entries/export`
Export entry logs to CSV.

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Query Parameters**:
- `format` (optional): Export format (default: "csv")
- `startDate` (optional): Start date filter
- `endDate` (optional): End date filter
- `college` (optional): College filter
- `userType` (optional): User type filter

**Example**: `GET /entries/export?format=csv&startDate=2025-01-01&endDate=2025-01-31`

**Response** (200 OK):
```csv
Content-Type: text/csv
Content-Disposition: attachment; filename="entry_logs_2025-11-14.csv"

Log ID,User ID,ID Number,Full Name,Entry Time,Method,Status,User Type,College
1,1,2021-0001,Juan Dela Cruz,2025-11-14 10:30:00,rfid,success,student,CCS
2,2,2021-0002,Maria Santos,2025-11-14 10:31:00,manual,success,student,CCS
```

---

### PUT `/entries/:id`
Update entry log.

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <accessToken>
```

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

### DELETE `/entries/:id`
Delete entry log.

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Parameters**:
- `id` (path): Entry log ID

**Example**: `DELETE /entries/1`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Entry deleted successfully"
}
```

---

## User Management

**All endpoints require authentication**

### GET `/users`
Get all users with pagination.

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (default: 50)
- `userType` (optional): Filter by user type
- `status` (optional): Filter by status

**Example**: `GET /users?page=1&limit=50&userType=student&status=active`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "userId": 1,
        "idNumber": "2021-0001",
        "rfidTag": "RFID001",
        "firstName": "Juan",
        "lastName": "Dela Cruz",
        "email": "juan.delacruz@ustp.edu.ph",
        "userType": "student",
        "college": "CCS",
        "department": "Computer Science",
        "yearLevel": "4",
        "status": "active",
        "createdAt": "2025-01-01T00:00:00Z",
        "updatedAt": "2025-01-01T00:00:00Z"
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

### POST `/users`
Create a new user.

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Request Body**:
```json
{
  "idNumber": "2021-0003",
  "rfidTag": "RFID003",
  "firstName": "Pedro",
  "lastName": "Reyes",
  "email": "pedro.reyes@ustp.edu.ph",
  "userType": "student",
  "college": "College of Engineering",
  "department": "Electrical Engineering",
  "yearLevel": "3",
  "status": "active"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "userId": 3,
    "idNumber": "2021-0003",
    "rfidTag": "RFID003",
    "firstName": "Pedro",
    "lastName": "Reyes",
    "email": "pedro.reyes@ustp.edu.ph",
    "userType": "student",
    "college": "College of Engineering",
    "department": "Electrical Engineering",
    "yearLevel": "3",
    "status": "active",
    "createdAt": "2025-11-14T10:30:00Z",
    "updatedAt": "2025-11-14T10:30:00Z"
  }
}
```

---

### GET `/users/:id`
Get user details by ID.

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Parameters**:
- `id` (path): User ID

**Example**: `GET /users/1`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "userId": 1,
      "idNumber": "2021-0001",
      "rfidTag": "RFID001",
      "firstName": "Juan",
      "lastName": "Dela Cruz",
      "email": "juan.delacruz@ustp.edu.ph",
      "userType": "student",
      "college": "CCS",
      "department": "Computer Science",
      "yearLevel": "4",
      "status": "active",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    },
    "stats": {
      "totalEntries": 25,
      "entriesToday": 1
    }
  }
}
```

---

### PUT `/users/:id`
Update user information.

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Parameters**:
- `id` (path): User ID

**Request Body**:
```json
{
  "firstName": "Juan Carlos",
  "email": "juancarlos.delacruz@ustp.edu.ph",
  "department": "Information Technology",
  "yearLevel": "4"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "userId": 1,
    "idNumber": "2021-0001",
    "rfidTag": "RFID001",
    "firstName": "Juan Carlos",
    "lastName": "Dela Cruz",
    "email": "juancarlos.delacruz@ustp.edu.ph",
    "userType": "student",
    "college": "CCS",
    "department": "Information Technology",
    "yearLevel": "4",
    "status": "active",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-11-14T10:30:00Z"
  }
}
```

---

### DELETE `/users/:id`
Delete a user.

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Parameters**:
- `id` (path): User ID

**Example**: `DELETE /users/3`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

### GET `/users/search`
Search users by criteria.

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Query Parameters**:
- `q` (required): Search query
- `userType` (optional): Filter by user type
- `college` (optional): Filter by college
- `department` (optional): Filter by department
- `status` (optional): Filter by status
- `page` (optional): Page number
- `limit` (optional): Records per page

**Example**: `GET /users/search?q=Juan&userType=student&page=1&limit=20`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "userId": 1,
        "idNumber": "2021-0001",
        "rfidTag": "RFID001",
        "firstName": "Juan",
        "lastName": "Dela Cruz",
        "email": "juan.delacruz@ustp.edu.ph",
        "userType": "student",
        "college": "CCS",
        "department": "Computer Science",
        "yearLevel": "4",
        "status": "active",
        "createdAt": "2025-01-01T00:00:00Z",
        "updatedAt": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

---

## Analytics & Dashboard

**All endpoints require authentication**

### GET `/dashboard/stats`
Get overall dashboard statistics.

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "totalEntries": 1250,
    "uniqueStudents": 450,
    "todayEntries": 85,
    "averageEntriesPerDay": 42
  }
}
```

---

### GET `/analytics/peak-hours`
Get peak hours analysis.

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "peakHours": [
      {
        "hour": 8,
        "count": 120,
        "label": "08:00"
      },
      {
        "hour": 9,
        "count": 150,
        "label": "09:00"
      },
      {
        "hour": 10,
        "count": 140,
        "label": "10:00"
      }
    ],
    "peakHour": {
      "hour": 9,
      "count": 150,
      "label": "09:00"
    }
  }
}
```

---

### GET `/analytics/trends`
Get entry trends over time.

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Query Parameters**:
- `period` (optional): Time period ('7d', '30d', '90d') - default: '30d'

**Example**: `GET /analytics/trends?period=7d`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "period": "7d",
    "trends": [
      {
        "date": "2025-11-08",
        "count": 45,
        "label": "Nov 08"
      },
      {
        "date": "2025-11-09",
        "count": 52,
        "label": "Nov 09"
      },
      {
        "date": "2025-11-10",
        "count": 48,
        "label": "Nov 10"
      }
    ],
    "totalEntries": 315
  }
}
```
