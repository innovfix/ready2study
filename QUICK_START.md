# Quick Start Guide - Running Ready2Study

## Current Status
✅ Frontend files are ready and can be viewed in browser
⚠️ Backend API requires Laravel server to be running

## Option 1: View Frontend Only (Current)
The HTML files are accessible via XAMPP:
- **Student Info**: http://localhost/Ready2Study/student-info.html
- **Home/Upload**: http://localhost/Ready2Study/index.html
- **Dashboard**: http://localhost/Ready2Study/dashboard.html
- **Test**: http://localhost/Ready2Study/test.html

**Note**: API calls will fail until Laravel backend is set up.

## Option 2: Full Setup with Backend (Recommended)

### Step 1: Ensure XAMPP Services Running
- Start **Apache** and **MySQL** from XAMPP Control Panel

### Step 2: Create Database
1. Open phpMyAdmin: http://localhost/phpmyadmin
2. Create database: `ready2study`
3. Character set: `utf8mb4_unicode_ci`

### Step 3: Configure .env File
Create/update `.env` file in project root:
```env
APP_NAME=Ready2Study
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost/Ready2Study

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ready2study
DB_USERNAME=root
DB_PASSWORD=

FILESYSTEM_DISK=public
```

### Step 4: Generate Application Key
```bash
cd c:\xampp\htdocs\Ready2Study
C:\xampp\php\php.exe artisan key:generate
```

### Step 5: Run Migrations
```bash
C:\xampp\php\php.exe artisan migrate
```

### Step 6: Create Storage Link
```bash
C:\xampp\php\php.exe artisan storage:link
```

### Step 7: Start Laravel Server (Optional - for API)
If you want to use Laravel's built-in server instead of Apache:
```bash
C:\xampp\php\php.exe artisan serve
```
Then access: http://localhost:8000

## Current Access URLs

**Via XAMPP Apache:**
- http://localhost/Ready2Study/student-info.html
- http://localhost/Ready2Study/index.html
- http://localhost/Ready2Study/dashboard.html

**Via Laravel (if artisan serve is running):**
- http://localhost:8000/
- http://localhost:8000/student-info
- http://localhost:8000/dashboard

## Troubleshooting

### API Calls Failing?
- Ensure Laravel routes are accessible
- Check browser console for errors
- Verify database connection in .env
- Make sure migrations have run

### Files Not Loading?
- Check XAMPP Apache is running
- Verify file paths are correct
- Check browser console for 404 errors

### Database Errors?
- Ensure MySQL is running in XAMPP
- Verify database exists
- Check .env credentials
- Run migrations: `php artisan migrate`

