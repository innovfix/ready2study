# API Routing 404 Error - Root Cause and Fix

## Issue
The application was throwing a 404 error when trying to access `/api/csrf-token`:
```
GET http://localhost/api/csrf-token 404 (Not Found)
```

## Root Cause Analysis

### 1. **Apache Configuration Was Already Correct**
- `mod_rewrite` module was already enabled (line 163 in httpd.conf)
- `AllowOverride All` was already set correctly (line 273 in httpd.conf)
- Apache was running properly on port 80

### 2. **The Real Problem: .htaccess Rewrite Condition**
The `.htaccess` file had an incorrect RewriteCond that was checking for files in the wrong location:

**Before (line 14):**
```apache
RewriteCond %{DOCUMENT_ROOT}/api/%1.php -f
```

This evaluated to `C:/xampp/htdocs/api/csrf-token.php`, but the actual file was at `C:/xampp/htdocs/Ready2Study/api/csrf-token.php`.

### 3. **URL Path Issues**
The JavaScript code was using absolute paths (`/api/csrf-token`) which would work if the DocumentRoot was set to the project folder, but since DocumentRoot is `C:/xampp/htdocs`, the correct URL should be relative or include the project folder name.

## Fixes Applied

### Fix 1: Corrected .htaccess RewriteCond
**Changed from:**
```apache
RewriteCond %{DOCUMENT_ROOT}/api/%1.php -f
```

**To:**
```apache
RewriteCond %{REQUEST_FILENAME}.php -f
```

This now correctly checks if the file exists relative to the current directory.

### Fix 2: Updated JavaScript to Use Relative Paths
**student-info.html (line 133):**
```javascript
// Changed from: fetch('/api/csrf-token', ...)
fetch('api/csrf-token', ...)
```

**js/api-service.js (line 4):**
```javascript
// Changed from: const API_BASE_URL = '/api';
const API_BASE_URL = 'api';
```

## Verification

All endpoints now work correctly:

1. ✅ Direct PHP file access: `http://localhost/Ready2Study/api/csrf-token.php`
2. ✅ Rewritten URL: `http://localhost/Ready2Study/api/csrf-token`
3. ✅ JavaScript fetch from student-info.html works properly

## Testing
To test the http://localhost/Ready2Study/student-info.html` in a browser
2. Open the browser console (F12)
3. The CSRF token should be fetched without errors
4. No 404 errors should appear in the console

## Related Files Modified
- `.htaccess` - Fixed RewriteCond for API routing
- `student-info.html` - Changed fetch URL to relative path
- `js/api-service.js` - Changed API_BASE_URL to relative path

## Summary
The issue was a combination of:
1. Incorrect path checking in `.htaccess` that didn't account for the project subdirectory
2. Absolute paths in JavaScript that didn't match the DocumentRoot structure

Both have been fixed, and the API routing now works correctly.


