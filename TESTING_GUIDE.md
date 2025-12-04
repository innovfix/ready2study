# Ready2Study - Complete Testing Guide 🧪

## ✅ Pre-Testing Checklist

Before you start testing, ensure:
- [x] Apache is running in XAMPP
- [x] MySQL is running in XAMPP
- [x] Browser console is open (F12) for debugging
- [x] You have a PDF file ready to upload

---

## 🧪 Testing Steps

### Test 1: Student Registration ✅

**Steps:**
1. Go to: `http://localhost/Ready2Study/student-info.html`
2. Fill out the form:
   - Name: Enter your name
   - College: Enter college name
   - Course: Enter course name
   - Year: Select a year
3. Click "Continue to Upload"

**Expected Results:**
- ✅ Form submits successfully
- ✅ No 404 errors in console
- ✅ Redirects to `index.html`
- ✅ Console shows: `=== FORM SUBMISSION SUCCESSFUL ===`

**Console Logs to Check:**
```
=== FORM SUBMISSION STARTED ===
✓ Form data collected
→ Calling AuthAPI.register()...
✓ Registration successful
→ Redirecting to index.html...
```

---

### Test 2: PDF Upload ✅

**Steps:**
1. On the upload page (`index.html`)
2. Click upload area or drag & drop a PDF file
3. Wait for file to load (you'll see filename)
4. Click "Generate Questions" button

**Expected Results:**
- ✅ Progress bar shows progress (10% → 100%)
- ✅ PDF text extracted successfully
- ✅ Questions generated (11 questions typical)
- ✅ Questions organized by marks
- ✅ Redirects to dashboard automatically

**Console Logs to Check:**
```
PDF extraction complete. Total text length: 50154 characters
Found 25 paragraphs and 84 mathematical expressions
Generated 11 questions total
PDF Fully Processed - Questions organized by marks: {1 Mark: 3, 2 Marks: 3, 3 Marks: 3, 10 Marks: 2, Total: 11}
→ PDFAPI.upload() called
✓ PDF uploaded successfully
→ QuestionAPI.createBulk() called
✓ Questions saved successfully
```

---

### Test 3: Dashboard Display ✅

**Steps:**
1. Dashboard should load automatically after PDF upload
2. Check if questions appear

**Expected Results:**
- ✅ Questions display immediately
- ✅ "Question 1 of 11" progress indicator visible
- ✅ Previous/Next buttons visible
- ✅ Question text displayed (gray background)
- ✅ Answer displayed below question (green background)
- ✅ Mark badge visible (e.g., "1 Mark")

**Visual Check:**
- Question card should show:
  - Mark badge at top
  - Question text in gray box
  - Green answer box with "✓ Answer:" label
  - Control buttons below answer

**Console Logs to Check:**
```
=== DASHBOARD LOADING QUESTIONS ===
PDF ID from localStorage: 1
→ Found questions in localStorage, displaying immediately...
  Questions count: 11
=== RENDERING QUESTIONS ===
Questions count: 11
✓ Question card appended
  Answer visible: Yes
```

---

### Test 4: Navigation ✅

**Steps:**
1. Click "Next" button
2. Click "Previous" button
3. Use keyboard arrows (← →)

**Expected Results:**
- ✅ Progress updates: "Question 2 of 11"
- ✅ Question and answer update
- ✅ Previous button disabled at first question
- ✅ Next button disabled at last question
- ✅ Keyboard navigation works

---

### Test 5: Filter by Marks ✅

**Steps:**
1. Click "1 Mark" filter in sidebar
2. Click "2 Marks" filter
3. Click "All Questions" filter

**Expected Results:**
- ✅ Only 1-mark questions show when "1 Mark" clicked
- ✅ Progress updates (e.g., "Question 1 of 3")
- ✅ Filter button highlights when active
- ✅ Counts show correctly in buttons

**Console Logs to Check:**
```
Filtering questions by marks: 1
Rendering questions: 3 questions
```

---

### Test 6: Important Questions ✅

**Steps:**
1. Click "Save" button on a question card
2. Click "Important" filter in sidebar

**Expected Results:**
- ✅ Question marked as important (heart icon fills)
- ✅ "Important" filter shows only saved questions
- ✅ Question persists after page refresh

---

### Test 7: Show/Hide Answers ✅

**Steps:**
1. Click "Show All Answers" button in sidebar
2. Click again to hide

**Expected Results:**
- ✅ Button text changes: "Show All Answers" ↔ "Hide All Answers"
- ✅ All answers toggle visibility
- ✅ Individual answers can still be toggled

---

### Test 8: Highlight Feature ✅

**Steps:**
1. Click "Highlight Key Points" in sidebar
2. Select text in an answer
3. Text should highlight

**Expected Results:**
- ✅ Highlight mode activates
- ✅ Selected text highlights in yellow
- ✅ Highlights persist after navigation
- ✅ "Unhighlight Key Points" clears highlights

---

### Test 9: Chat Feature ✅

**Steps:**
1. Click purple chat button (bottom right)
2. Type a question
3. Send message

**Expected Results:**
- ✅ Chat modal opens
- ✅ Messages send successfully
- ✅ AI responds (if API configured)
- ✅ Chat history maintained

---

### Test 10: Calculator ✅

**Steps:**
1. Click green calculator button (middle right)
2. Perform calculations
3. Close calculator

**Expected Results:**
- ✅ Calculator modal opens
- ✅ Basic operations work (+, -, ×, ÷)
- ✅ Parentheses work
- ✅ Clear functions work

---

### Test 11: Translation ✅

**Steps:**
1. Click orange "A/அ" button (top right)
2. Enter English text
3. Click "Translate to Tamil"

**Expected Results:**
- ✅ Translation modal opens
- ✅ Tamil translation appears
- ✅ Copy button works
- ✅ Proper Tamil font rendering

---

### Test 12: View PDF Content ✅

**Steps:**
1. Click "View Full PDF Content" in sidebar
2. PDF content should display in modal

**Expected Results:**
- ✅ Modal opens with PDF content
- ✅ Content is scrollable
- ✅ Close button works
- ✅ Content matches uploaded PDF

---

### Test 13: Export PDF ✅

**Steps:**
1. Click "Export Questions & Answers to PDF" in sidebar
2. PDF should download

**Expected Results:**
- ✅ PDF file downloads
- ✅ Contains all questions and answers
- ✅ Formatted with student info
- ✅ Organized by marks

---

### Test 14: Sources Feature ✅

**Steps:**
1. Click "Sources" button on a question card
2. Sources sidebar should open

**Expected Results:**
- ✅ YouTube links appear
- ✅ Related articles shown
- ✅ Related images displayed
- ✅ Sidebar can be closed

---

### Test 15: Listen Feature ✅

**Steps:**
1. Click "Listen" button on a question card
2. Audio should play

**Expected Results:**
- ✅ Text-to-speech activates
- ✅ Question and answer read aloud
- ✅ "Stop" button appears
- ✅ Audio stops when clicked

---

## 🐛 Common Issues & Solutions

### Issue: 404 Errors
**Solution:** Check Apache is running, verify `.htaccess` is in place

### Issue: Questions Not Showing
**Solution:** Check console for errors, verify PDF ID in localStorage

### Issue: Answers Not Showing
**Solution:** Check database has answer_text populated, verify API response

### Issue: Navigation Not Working
**Solution:** Check console for JavaScript errors, verify questions array is populated

### Issue: Filters Not Working
**Solution:** Check filter buttons have correct data-filter attributes

---

## 📊 Testing Checklist Summary

- [ ] Student Registration
- [ ] PDF Upload
- [ ] Question Generation
- [ ] Dashboard Display
- [ ] Navigation (Previous/Next)
- [ ] Filter by Marks
- [ ] Important Questions
- [ ] Show/Hide Answers
- [ ] Highlight Feature
- [ ] Chat Feature
- [ ] Calculator
- [ ] Translation
- [ ] View PDF Content
- [ ] Export PDF
- [ ] Sources Feature
- [ ] Listen Feature

---

## ✅ Success Criteria

All tests pass if:
- ✅ No console errors
- ✅ All features work as expected
- ✅ Data persists (localStorage + database)
- ✅ UI is responsive and intuitive
- ✅ All buttons functional
- ✅ Navigation smooth

---

## 🎯 Ready to Test!

**Start with Test 1 and work through each test systematically.**

**Remember:** Keep the browser console (F12) open to see detailed logs and catch any errors!

**Good luck testing!** 🚀

