# 🔧 Ready2Study Troubleshooting Guide

## Registration 500 Error - Quick Fix

You're seeing `500 Internal Server Error` when trying to register. Here's how to fix it:

### Step 1: Run Diagnostic Tools

Open these diagnostic pages in your browser:

1. **Connection Test**: http://localhost/Ready2Study/test-registration.html
   - This will automatically test your database connection
   - Shows exactly what's wrong
   - Tests all registration endpoints

2. **View Error Logs**: http://localhost/Ready2Study/view-errors.php
   - Shows detailed PHP errors
   - Helps identify the exact problem

### Step 2: Common Issues & Fixes

#### ❌ Issue 1: MySQL Not Running

**Symptoms:**
- "Cannot connect to MySQL server"
- "Connection refused"
- "Connection timed out"

**Fix:**
1. Open XAMPP Control Panel
2. Make sure MySQL shows "Running" in green
3. If not, click "Start" next to MySQL
4. Wait for it to turn green
5. Refresh test-registration.html

#### ❌ Issue 2: Database Doesn't Exist

**Symptoms:**
- "Unknown database 'ready2study'"
- "Database not found"

**Fix (Automatic):**
The scripts should create the database automatically. If not:

**Fix (Manual):**
1. Open http://localhost/phpmyadmin
2. Click "New" on the left sidebar
3. Database name: `ready2study`
4. Collation: `utf8mb4_unicode_ci`
5. Click "Create"

#### ❌ Issue 3: Apache Not Running

**Symptoms:**
- Page doesn't load at all
- "This site can't be reached"

**Fix:**
1. Open XAMPP Control Panel
2. Make sure Apache shows "Running"
3. If not, click "Start" next to Apache

#### ❌ Issue 4: Wrong URL/Path

**Symptoms:**
- 404 Not Found errors
- Page shows but registration fails with 404

**Fix:**
Make sure you're accessing:
```
http://localhost/Ready2Study/student-info.html
```

NOT:
- ~~http://localhost/student-info.html~~ (missing folder)
- ~~file:///C:/xampp/htdocs/...~~ (wrong protocol)

### Step 3: Test Registration

Once the connection test passes:

1. Go to http://localhost/Ready2Study/test-registration.html
2. Click "Test Registration"
3. Look for green checkmarks ✅
4. If all tests pass, try the actual registration page

### Step 4: Use the App

If all tests pass, the registration should now work:

1. Open http://localhost/Ready2Study/student-info.html
2. Fill in your details
3. Click "Continue to Upload"
4. Should redirect to the main page

---

## Detailed Diagnostic Information

### Understanding the Error Logs

The diagnostic tools provide detailed information:

#### Connection Test Results

```json
{
  "tests": {
    "mysql_connection": {
      "status": "success|failed",
      "message": "..."
    },
    "database_exists": {
      "status": "success|warning|failed",
      "message": "..."
    },
    "database_connection": {
      "status": "success|failed",
      "message": "..."
    },
    "users_table": {
      "status": "success|warning|failed",
      "message": "...",
      "user_count": 0
    }
  }
}
```

**Status Meanings:**
- ✅ **success**: Working perfectly
- ⚠️ **warning**: Working but needs attention
- ❌ **failed**: Not working, needs fixing

### Manual Database Setup

If automatic setup fails, create the database and table manually:

#### 1. Create Database

```sql
CREATE DATABASE IF NOT EXISTS `ready2study` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

#### 2. Create Users Table

```sql
USE ready2study;

CREATE TABLE IF NOT EXISTS `users` (
    `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(255) NOT NULL,
    `email` varchar(255) DEFAULT NULL,
    `password` varchar(255) DEFAULT NULL,
    `college` varchar(255) NOT NULL,
    `course` varchar(255) NOT NULL,
    `year` int(11) NOT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Run these queries in phpMyAdmin:
1. Open http://localhost/phpmyadmin
2. Click "SQL" tab
3. Paste the queries
4. Click "Go"

---

## Advanced Troubleshooting

### Check PHP Configuration

1. Open http://localhost/Ready2Study/view-errors.php
2. Check "PHP Configuration" section
3. Verify:
   - PHP Version: 7.4+ or 8.x
   - PDO Drivers: Should include "mysql"
   - Error Reporting: Should be enabled

### Check .htaccess

The `.htaccess` file should allow API files to run:

```apache
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
```

These lines ensure that existing files (like `api/register-simple.php`) are NOT rewritten.

### Test Individual Endpoints

Use the test page to see which endpoints work:

```
http://localhost/Ready2Study/test-registration.html
```

Click "Test Registration Endpoints" to see:
- ✅ Which endpoints return success
- ❌ Which endpoints fail
- 📋 Detailed error messages for each

### Check Error Logs

View detailed PHP errors:

```
http://localhost/Ready2Study/view-errors.php
```

Look for:
- **Database connection errors**: MySQL not running
- **PDO errors**: Wrong credentials or database doesn't exist
- **PHP syntax errors**: Code errors (unlikely)
- **Timeout errors**: MySQL taking too long to respond

---

## Still Having Issues?

### Quick Checklist

- [ ] XAMPP Control Panel shows MySQL is Running (green)
- [ ] XAMPP Control Panel shows Apache is Running (green)
- [ ] Can access http://localhost/phpmyadmin
- [ ] Database `ready2study` exists (check in phpMyAdmin)
- [ ] Using correct URL: http://localhost/Ready2Study/student-info.html
- [ ] Connection test passes: http://localhost/Ready2Study/test-registration.html
- [ ] No errors in: http://localhost/Ready2Study/view-errors.php

### Get Detailed Error Information

1. Open http://localhost/Ready2Study/test-registration.html
2. Open browser console (F12)
3. Click "Test Registration"
4. Copy any error messages from the console
5. Check http://localhost/Ready2Study/view-errors.php for PHP errors

### Test with Debug Endpoint

The debug endpoint provides extremely detailed error information:

```javascript
fetch('api/register-debug.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        name: 'Test User',
        college: 'Test College',
        course: 'Test Course',
        year: 1
    })
})
.then(r => r.json())
.then(console.log);
```

Run this in the browser console (F12) and look at the output.

---

## Summary

**Most Common Fix:**
1. Open XAMPP Control Panel
2. Start MySQL if not running
3. Refresh http://localhost/Ready2Study/test-registration.html
4. All tests should pass ✅
5. Try registration again

**If that doesn't work:**
1. Check http://localhost/Ready2Study/view-errors.php
2. Look for specific error messages
3. Follow the relevant fix above

**Still stuck?**
- Check all services are running in XAMPP
- Create database manually in phpMyAdmin
- Review error logs for specific issues


