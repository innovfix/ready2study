# API Routing Fix for XAMPP

## Problem
The registration API endpoint `/api/register` returns HTML (404 page) instead of JSON when accessed from static HTML files.

## Root Cause
When accessing `student-info.html` directly (not through Laravel), the API routes in `routes/api.php` aren't being processed because Laravel isn't handling the request.

## Solutions Applied

### 1. Added API Routes to `web.php`
- Added `/api/register` and `/api/login` routes to `routes/web.php`
- These routes are now accessible from static HTML files
- Routes use the same `AuthController` as API routes

### 2. Updated `.htaccess`
- Added rules to route `/api/*` requests to Laravel
- Checks for both `public/index.php` and root `index.php`

### 3. Created `api-router.php`
- Fallback router for API requests
- Handles cases where `.htaccess` doesn't work

## Testing

### Option 1: Test if Laravel is Running
1. Open browser and go to: `http://localhost/Ready2Study/`
2. If you see a Laravel page, Laravel is working
3. If you see a 404 or directory listing, Laravel isn't configured

### Option 2: Test API Endpoint Directly
1. Open browser console (F12)
2. Run this in console:
```javascript
fetch('/Ready2Study/api/register', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({name: 'test', college: 'test', course: 'test', year: 1})
}).then(r => r.text()).then(console.log)
```
3. Check what response you get

### Option 3: Use Laravel's Built-in Server
Instead of XAMPP, use Laravel's server:
```bash
cd C:\xampp\htdocs\Ready2Study
php artisan serve
```
Then access: `http://localhost:8000/student-info.html`

## Quick Fix: Create Standalone Registration Endpoint

If Laravel routes still don't work, I can create a standalone PHP file that handles registration without Laravel. Let me know if you want this option.

## Next Steps

1. **Refresh the page** and try registration again
2. **Check browser console** (F12) for any errors
3. **Check Network tab** to see the actual API response
4. **Verify Laravel is running** - try accessing `http://localhost/Ready2Study/`

## Alternative: Use Laravel Blade Views

For best results, use Laravel Blade templates instead of static HTML:
- Convert `student-info.html` to `resources/views/pages/student-info.blade.php`
- Access via: `http://localhost/Ready2Study/student-info`
- This ensures Laravel processes all requests


