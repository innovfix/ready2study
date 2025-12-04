# Debugging Logs - Student Info Form Submission

## Overview
Comprehensive logging has been added to track the entire student registration and redirect flow. This helps identify exactly where any issues occur.

## How to View Logs

1. Open your browser (Chrome, Firefox, Edge, etc.)
2. Navigate to `http://localhost/Ready2Study/student-info.html`
3. Press **F12** to open Developer Tools
4. Click on the **Console** tab
5. Fill out the form and click "Continue to Upload"
6. Watch the console logs in real-time

## Log Flow

### Step 1: Form Submission (student-info.html)
When you click "Continue to Upload", you'll see:

```
=== FORM SUBMISSION STARTED ===
Timestamp: 2025-12-04T...
✓ Form data collected: {name: "...", college: "...", course: "...", year: 1}
→ Calling AuthAPI.register()...
```

### Step 2: API Registration Attempts (js/api-service.js)
The system tries multiple API endpoints:

```
→ AuthAPI.register() called with data: {...}
→ Attempting registration via standalone PHP endpoints...
  Attempt 1/6: api/register-simple.php
  ✓ SUCCESS via api/register-simple.php
✓ Registration response: {message: "...", user: {...}}
```

Or if there are issues:
```
  Attempt 1/6: api/register-simple.php
  ✗ Request failed for api/register-simple.php: Failed to fetch
  Attempt 2/6: api/register.php
  ...
```

### Step 3: Data Storage
After successful registration:

```
✓ API Response received: {message: "...", user: {...}}
→ Storing user data in localStorage...
✓ Data stored in localStorage
  - User data: {id: 1, name: "...", ...}
  - PDF ID: null
```

### Step 4: Redirect
Just before redirect:

```
→ Redirecting to index.html...
=== FORM SUBMISSION SUCCESSFUL ===
```

### Step 5: Index Page Load (index.html)
When index.html loads:

```
=== INDEX.HTML PAGE LOAD ===
Timestamp: 2025-12-04T...
→ Checking localStorage for user data...
✓ User data found in localStorage
✓ User data parsed successfully: {id: 1, name: "...", ...}
=== USER AUTHENTICATED - CONTINUING TO UPLOAD PAGE ===
```

## Error Scenarios

### Scenario 1: API Endpoint Not Reachable
```
  Attempt 1/6: api/register-simple.php
  ✗ Request failed for api/register-simple.php: Failed to fetch
  ...
✗ All standalone endpoints failed, trying Laravel route
✗ Laravel route also failed: ...
=== REGISTRATION COMPLETELY FAILED ===
```

**Solution**: Check if Apache is running in XAMPP

### Scenario 2: Database Connection Failed
```
✓ SUCCESS via api/register-simple.php
✗ Registration response: {error: "Database error", message: "Cannot connect to MySQL..."}
=== FORM SUBMISSION FAILED ===
```

**Solution**: Start MySQL in XAMPP Control Panel

### Scenario 3: Invalid JSON Response
```
  Attempt 1/6: api/register-simple.php
  ✗ Invalid JSON response from api/register-simple.php
```

**Solution**: Check PHP error logs at `C:\xampp\apache\logs\error.log`

### Scenario 4: No User Data in localStorage (on index.html)
```
=== INDEX.HTML PAGE LOAD ===
→ Checking localStorage for user data...
✗ No user data found in localStorage
→ Redirecting to student-info.html...
```

**Solution**: This means registration didn't complete successfully or localStorage was cleared

## Checking localStorage Manually

You can check what's stored in localStorage using the Console:

```javascript
// View all localStorage data
console.log(localStorage.getItem('ready2study_user'));

// Clear localStorage (for testing)
localStorage.clear();

// Check all keys
Object.keys(localStorage);
```

## Log Symbols Explained

- `===` Section header
- `→` Action being performed
- `✓` Success
- `✗` Failure/Error
- `  ` Indented items (sub-steps or details)

## Tips for Debugging

1. **Clear localStorage before testing**: Run `localStorage.clear()` in console
2. **Check Network tab**: See actual HTTP requests and responses
3. **Keep console open**: Don't refresh after seeing an error, read all logs first
4. **Copy logs**: Right-click in console and "Save as..." to save logs
5. **Check timestamps**: Verify events happen in expected order

## Files with Logging

1. **student-info.html** (lines 156-189) - Form submission and redirect
2. **index.html** (lines 80-101) - Page load and authentication check  
3. **js/api-service.js** (lines 72-140) - API registration attempts

## Common Success Flow

```
=== FORM SUBMISSION STARTED ===
✓ Form data collected
→ Calling AuthAPI.register()...
→ AuthAPI.register() called with data
→ Attempting registration via standalone PHP endpoints...
  Attempt 1/6: api/register-simple.php
  ✓ SUCCESS via api/register-simple.php
✓ Registration response
✓ API Response received
→ Storing user data in localStorage...
✓ Data stored in localStorage
→ Redirecting to index.html...
=== FORM SUBMISSION SUCCESSFUL ===

[Page redirects to index.html]

=== INDEX.HTML PAGE LOAD ===
→ Checking localStorage for user data...
✓ User data found in localStorage
✓ User data parsed successfully
=== USER AUTHENTICATED - CONTINUING TO UPLOAD PAGE ===
```

## Reporting Issues

When reporting issues, please include:
1. Full console log output (copy all text)
2. What you entered in the form
3. Browser name and version
4. Whether MySQL and Apache are running in XAMPP


