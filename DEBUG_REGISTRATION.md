# Debug Registration Issue

## Current Error
"Registration failed: Registration failed"

## Steps to Debug

### 1. Test Database Connection
Open in browser: `http://localhost/Ready2Study/api/test-db.php`

**Expected**: JSON response showing database connection status
**If fails**: MySQL is not running or not accessible

### 2. Test API Endpoint Directly
Open browser console (F12) and run:
```javascript
fetch('api/register.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        name: 'Test User',
        college: 'Test College',
        course: 'Test Course',
        year: 1
    })
})
.then(r => r.text())
.then(console.log)
.catch(console.error)
```

### 3. Check Browser Console
1. Open `student-info.html`
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Try to register
5. Check for any error messages

### 4. Check Network Tab
1. Open Developer Tools (F12)
2. Go to Network tab
3. Try to register
4. Look for the API call
5. Click on it to see:
   - Request URL
   - Request Method
   - Response Status
   - Response Body

### 5. Check XAMPP MySQL
1. Open XAMPP Control Panel
2. Check if MySQL is running (green)
3. If not running, click "Start"
4. If it fails to start, check error logs

### 6. Manual Database Test
Open phpMyAdmin: `http://localhost/phpmyadmin`
- Try to connect
- Check if database `ready2study` exists
- If not, create it manually

## Common Issues

### Issue: MySQL Not Running
**Solution**: Start MySQL in XAMPP Control Panel

### Issue: Database Doesn't Exist
**Solution**: 
- Run: `http://localhost/Ready2Study/api/test-db.php`
- Or create manually in phpMyAdmin

### Issue: Permission Denied
**Solution**: 
- Check MySQL username/password
- Default XAMPP: root, no password

### Issue: File Not Found (404)
**Solution**: 
- Check file exists: `api/register.php`
- Check URL path is correct
- Try: `http://localhost/Ready2Study/api/register.php` directly

## Next Steps

1. Run the test endpoints above
2. Check browser console for actual error
3. Share the error message you see
4. Check Network tab to see what's being called



