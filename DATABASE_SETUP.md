# 🗄️ MySQL Database Setup Guide

## 📋 Table of Contents
1. [Hostinger MySQL Setup](#hostinger-mysql-setup)
2. [Manual Table Creation](#manual-table-creation)
3. [Environment Configuration](#environment-configuration)
4. [Database Seeding](#database-seeding)
5. [Testing Connection](#testing-connection)

## 🌐 Hostinger MySQL Setup

### Step 1: Access Your Hostinger Control Panel
1. Log in to your Hostinger account
2. Go to **Hosting** → **Manage**
3. Find **Databases** section
4. Click **MySQL Databases**

### Step 2: Create Database
1. Click **Create Database**
2. Enter database name: `timetracker_db`
3. Set username: `timetracker_user`
4. Generate a strong password
5. Click **Create**

### Step 3: Get Connection Details
After creating the database, note down:
- **Host**: Usually `localhost` or `mysql.hostinger.com`
- **Port**: `3306` (default)
- **Database Name**: `timetracker_db`
- **Username**: `timetracker_user`
- **Password**: Your generated password

## 🛠️ Manual Table Creation

If you need to create tables manually, use these SQL commands:

### 1. Users Table
```sql
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_checked_in BOOLEAN DEFAULT FALSE,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
  total_working_time INT DEFAULT 0,
  INDEX idx_username (username),
  INDEX idx_role (role),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. Activity Logs Table
```sql
CREATE TABLE IF NOT EXISTS activity_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type ENUM('check-in', 'check-out', 'idle-start', 'idle-end', 'activity') NOT NULL,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSON,
  INDEX idx_user_id (user_id),
  INDEX idx_timestamp (timestamp),
  INDEX idx_type (type),
  INDEX idx_user_timestamp (user_id, timestamp),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3. Work Sessions Table
```sql
CREATE TABLE IF NOT EXISTS work_sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  check_in_time DATETIME NOT NULL,
  check_out_time DATETIME NULL,
  total_active_time INT DEFAULT 0,
  idle_time INT DEFAULT 0,
  activity_count INT DEFAULT 0,
  date DATE NOT NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_date (date),
  INDEX idx_user_date (user_id, date),
  INDEX idx_check_in_time (check_in_time),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## ⚙️ Environment Configuration

Create a `.env` file in your project root:

```env
# Hostinger MySQL Database Configuration
DB_HOST=your-hostinger-mysql-host.com
DB_PORT=3306
DB_NAME=timetracker_db
DB_USER=timetracker_user
DB_PASSWORD=your_secure_password

# For development (if using local MySQL)
# DB_HOST=localhost
# DB_PORT=3306
# DB_NAME=timetracker_local
# DB_USER=root
# DB_PASSWORD=your_local_password
```

## 🌱 Database Seeding

The application automatically seeds the database with:

### Default Admin Account
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: Administrator

### Sample User Accounts
All users have password: `user123`

1. **john.doe** - John Doe (40 hours worked)
2. **jane.smith** - Jane Smith (30 hours worked)
3. **mike.wilson** - Mike Wilson (60 hours worked)
4. **sarah.johnson** - Sarah Johnson (20 hours worked)
5. **david.brown** - David Brown (48 hours worked)
6. **lisa.davis** - Lisa Davis (36 hours worked)

### Manual Seeding (if needed)
If automatic seeding fails, you can manually insert the admin user:

```sql
INSERT INTO users (id, username, name, password, role, created_at, last_activity, total_working_time)
VALUES (
  'admin_001',
  'admin',
  'System Administrator',
  'YWRtaW4xMjN0aW1ldHJhY2tlcl9zYWx0XzIwMjQ=',
  'admin',
  NOW(),
  NOW(),
  0
);
```

## 🧪 Testing Connection

### Method 1: Application Logs
1. Start your application
2. Check browser console for:
   - ✅ Database connected successfully
   - ✅ Database tables created successfully
   - ✅ Database seeded successfully

### Method 2: Manual Test Query
Run this in your MySQL client:
```sql
SELECT COUNT(*) as user_count FROM users;
SELECT username, name, role FROM users WHERE role = 'admin';
```

### Method 3: Login Test
Try logging in with:
- **Admin**: username `admin`, password `admin123`
- **User**: username `john.doe`, password `user123`

## 🚨 Troubleshooting

### Connection Issues
1. **Check credentials** in `.env` file
2. **Verify database exists** in Hostinger panel
3. **Check firewall settings** (Hostinger usually handles this)
4. **Ensure SSL/TLS** if required by your host

### Permission Issues
```sql
GRANT ALL PRIVILEGES ON timetracker_db.* TO 'timetracker_user'@'%';
FLUSH PRIVILEGES;
```

### Character Set Issues
```sql
ALTER DATABASE timetracker_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 📊 Database Schema Overview

```
users
├── id (VARCHAR(36), PRIMARY KEY)
├── username (VARCHAR(255), UNIQUE)
├── name (VARCHAR(255))
├── password (VARCHAR(255))
├── role (ENUM: 'user', 'admin')
├── created_at (DATETIME)
├── is_checked_in (BOOLEAN)
├── last_activity (DATETIME)
└── total_working_time (INT, minutes)

activity_logs
├── id (VARCHAR(36), PRIMARY KEY)
├── user_id (VARCHAR(36), FOREIGN KEY)
├── type (ENUM: 'check-in', 'check-out', 'idle-start', 'idle-end', 'activity')
├── timestamp (DATETIME)
└── metadata (JSON)

work_sessions
├── id (VARCHAR(36), PRIMARY KEY)
├── user_id (VARCHAR(36), FOREIGN KEY)
├── check_in_time (DATETIME)
├── check_out_time (DATETIME, NULL)
├── total_active_time (INT, minutes)
├── idle_time (INT, minutes)
├── activity_count (INT)
└── date (DATE)
```

## ✅ Verification Checklist

- [ ] Database created in Hostinger
- [ ] `.env` file configured with correct credentials
- [ ] Application starts without database errors
- [ ] Admin login works (`admin`/`admin123`)
- [ ] User login works (`john.doe`/`user123`)
- [ ] Tables are created automatically
- [ ] Sample data is seeded
- [ ] Check-in/check-out functionality works
- [ ] Activity tracking is functional