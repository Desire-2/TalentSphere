# CV Builder Frontend Testing Guide

## Quick Test Checklist (5 minutes)

### Pre-Test Setup
```bash
# Terminal 1: Start Backend
cd backend
python src/main.py

# Terminal 2: Start Frontend
cd talentsphere-frontend
npm run dev

# Open browser
http://localhost:5173/job-seeker/cv-builder
```

---

## Test 1: Version History (2 min)

### Steps:
1. **Generate First CV**:
   - Select sections: All default (Summary, Work, Education, Skills)
   - Style: Professional
   - Click "Generate CV"
   - ✅ Wait ~20s for generation

2. **Check History Button Appears**:
   - ✅ Look in header for purple "History" button
   - ✅ Button should be visible after CV generates

3. **Open Version History**:
   - Click "History" button
   - ✅ Modal opens with title "CV Version History"
   - ✅ See 1 version in timeline with timestamp

4. **Generate Second CV**:
   - Close modal
   - Change style to "Modern"
   - Click "Generate CV" again
   - ✅ Wait for completion

5. **Verify 2 Versions**:
   - Click "History"
   - ✅ See 2 versions in timeline
   - ✅ Most recent at top

6. **Restore Old Version**:
   - Click "Restore" on first (older) version
   - ✅ Modal closes automatically
   - ✅ CV preview updates to old version
   - ✅ Style changes back to "Professional"

7. **Test Version Persistence**:
   - Refresh browser page (F5)
   - ✅ CV still shows restored version
   - Click "History"
   - ✅ Both versions still present

**Expected Result**: ✅ All 7 steps pass
**If Failed**: Check console for errors, verify sessionStorage in DevTools

---

## Test 2: ATS Score Details (2 min)

### Steps:
1. **Generate CV** (if not already):
   - Use default settings
   - Click "Generate CV"
   - ✅ Wait for completion

2. **Check ATS Button Appears**:
   - ✅ Look in header for green "ATS Score" button
   - ✅ Button visible after CV generates

3. **Open ATS Details**:
   - Click "ATS Score" button
   - ✅ Modal opens with title "Detailed ATS Analysis"

4. **Verify Overall Score**:
   - ✅ See large score display (e.g., "47/100")
   - ✅ See status message (Excellent/Good/Needs Improvement)
   - ✅ See color-coded indicator (green/yellow/red icon)

5. **Check Category Breakdown**:
   - Scroll through modal
   - ✅ See 6 categories:
     - Keywords
     - Formatting
     - Sections
     - Content Quality
     - Length
     - Contact Info
   - ✅ Each has progress bar with color
   - ✅ Each shows score/max_score (e.g., "10/25")

6. **Verify Issues Display**:
   - Look at categories with low scores
   - ✅ See red bullet points with specific issues
   - Example: "Missing 15 relevant keywords"

7. **Check Optimization Tips**:
   - Scroll to bottom
   - ✅ See "Optimization Recommendations" section
   - ✅ See numbered list (1, 2, 3, etc.)
   - ✅ Each tip is specific and actionable

8. **Close Modal**:
   - Click X button or click outside
   - ✅ Modal closes
   - ✅ CV preview still visible

**Expected Result**: ✅ All 8 steps pass
**If Failed**: Check backend logs for ATS calculation, verify API response includes breakdown

---

## Test 3: Error Recovery (1 min)

### Steps:
1. **Trigger Generation Error**:
   - Method A: Disable backend (stop server)
   - Method B: Wait for rate limit (generate 5 CVs quickly)
   - Click "Generate CV"
   - ✅ Wait ~5s

2. **Verify Error Display**:
   - ✅ See red error banner at top
   - ✅ See emoji icon (⏳ or 🌐 or ❌)
   - ✅ See error title (e.g., "⏳ API Rate Limit")
   - ✅ See error message explaining issue
   - ✅ See suggestion with 💡 icon

3. **Check Retry Button** (if rate limited):
   - ✅ See "Retry Now" button
   - ✅ Button has refresh icon

4. **Test Version Fallback**:
   - Click "History" button
   - ✅ Still works despite error
   - Click "Restore" on a working version
   - ✅ CV loads successfully
   - ✅ Error banner disappears

5. **Test Retry** (if rate limited):
   - Wait for retry interval
   - Click "Retry Now"
   - ✅ Backend handles retry with 3s interval
   - ✅ On success, error clears and CV generates

**Expected Result**: ✅ All 5 steps pass
**If Failed**: Check error.code in state, verify backend error responses

---

## Test 4: Cache Management (1 min)

### Steps:
1. **Generate CV** (if not already):
   - Default settings
   - Click "Generate CV"
   - ✅ Wait for completion

2. **Refresh Page**:
   - Press F5
   - ✅ Page reloads

3. **Verify Cache Indicator**:
   - ✅ See amber warning banner below title
   - ✅ Text: "⚠️ Showing cached CV from [timestamp]"
   - ✅ Timestamp matches when you generated CV

4. **Check Clear Button**:
   - ✅ See "Clear All" button (gray) in header
   - ✅ Button only appears when cache exists

5. **Test Clear All**:
   - Click "Clear All" button
   - ✅ CV preview disappears
   - ✅ Cache indicator disappears
   - ✅ "Clear All" button disappears
   - ✅ See "No CV Generated Yet" empty state

6. **Verify History Cleared**:
   - Click "Generate CV" to enable History button
   - Wait for completion
   - Click "History"
   - ✅ Only 1 version shown (just generated)
   - ✅ Old versions cleared

7. **Test Session Persistence**:
   - Generate CV
   - Refresh page (F5)
   - ✅ CV still cached
   - Close browser completely
   - Reopen browser
   - Navigate to CV Builder
   - ✅ CV no longer cached (sessionStorage cleared)

**Expected Result**: ✅ All 7 steps pass
**If Failed**: Check sessionStorage in DevTools → Application → Session Storage

---

## Test 5: UI/UX Integration (1 min)

### Steps:
1. **Check Header Buttons**:
   - Before generation:
     - ✅ No History button
     - ✅ No ATS Score button
     - ✅ No Download button
     - ✅ No Clear button
   - After generation:
     - ✅ All 4 buttons appear
     - ✅ Ordered: History, ATS, Download, Clear (if cached)

2. **Test Button States During Generation**:
   - Start CV generation
   - While "Generating..." spinner shows:
     - ✅ All form inputs disabled
     - ✅ Generate button shows spinner
     - ✅ All header buttons disabled/hidden
   - After completion:
     - ✅ Buttons re-enabled
     - ✅ All 4 header buttons appear

3. **Test Modals**:
   - Open History modal
     - ✅ Can scroll content
     - ✅ Background dimmed
     - ✅ X button works
     - ✅ Click outside closes modal
   - Open ATS modal
     - ✅ All same features
     - ✅ Both modals independent

4. **Test Responsiveness**:
   - Resize browser window
   - ✅ Buttons stack on mobile (<768px)
   - ✅ Modals stay centered
   - ✅ Content scrollable

**Expected Result**: ✅ All 4 steps pass
**If Failed**: Check CSS classes, verify Tailwind responsive classes

---

## Test 6: End-to-End Workflow (Optional, 3 min)

### Complete User Journey:
1. **Open CV Builder**: Navigate to page
2. **Enter Job Details** (optional): Custom job or select from applied
3. **Select Sections**: Choose which sections to include
4. **Select Style**: Professional/Modern/Creative/Minimal
5. **Generate**: Click button, watch progress tracker
6. **Review**: See CV preview with ATS score badge
7. **Check ATS**: Click "ATS Score", review breakdown and tips
8. **Apply Tips**: Note improvements needed
9. **Regenerate**: Make changes, generate new version
10. **Compare**: Click "History", compare old vs new
11. **Choose Best**: Restore preferred version or keep new
12. **Download**: Export to PDF
13. **Clear**: Click "Clear All" when done

**Expected Result**: ✅ Smooth flow with no errors
**If Failed**: Identify which step failed, check relevant test above

---

## Common Issues & Solutions

### Issue: History button not appearing
**Solution**: 
- Verify CV actually generated (check for success message)
- Check console for JS errors
- Verify state.cvContent is not null

### Issue: ATS modal shows no data
**Solution**:
- Check backend response includes ats_breakdown
- Verify API endpoint: `/api/cv-builder/generate` returns all fields
- Check backend logs for ATS calculation errors

### Issue: Restore version fails
**Solution**:
- Open DevTools → Console → Check for "Failed to restore" error
- DevTools → Application → Session Storage → Verify data exists
- Try exporting version as JSON, check if data valid

### Issue: Clear All doesn't work
**Solution**:
- F12 → Console → Run: `sessionStorage.clear()`
- Hard refresh: Ctrl+Shift+R
- Check if you're in incognito mode (may block storage)

### Issue: Refresh loses everything
**Solution**:
- This is expected if you close browser (sessionStorage)
- If refresh loses data, check browser storage settings
- Verify not in private/incognito mode

---

## Success Metrics

### All Tests Pass = Ready for Production ✅

**Minimum Requirements**:
- ✅ Version history works (Test 1)
- ✅ ATS details display (Test 2)
- ✅ Error recovery works (Test 3)
- ✅ Cache management works (Test 4)
- ✅ UI/UX smooth (Test 5)

**Optional**:
- ✅ End-to-end workflow smooth (Test 6)

---

## Performance Benchmarks

### Expected Timings:
- Page load: <1s
- Version restore: <100ms (instant)
- Modal open: <50ms (instant)
- CV generation: 15-30s (normal)
- Cache load: <500ms

### Storage Checks:
```javascript
// Check storage usage
// Open Console (F12) and run:
Object.keys(sessionStorage).forEach(key => {
  console.log(key, sessionStorage.getItem(key).length, 'bytes');
});

// Expected output:
// cv_version_v5_xxx: ~50000 bytes
// cv_version_v5_yyy: ~50000 bytes
// (up to 5 versions)
```

---

## Automated Testing (Future)

### Playwright Test Script:
```javascript
// test/cv-builder.spec.js
test('CV Builder full workflow', async ({ page }) => {
  await page.goto('/job-seeker/cv-builder');
  
  // Generate CV
  await page.click('button:has-text("Generate CV")');
  await page.waitForSelector('button:has-text("History")');
  
  // Check history
  await page.click('button:has-text("History")');
  await expect(page.locator('.version-item')).toHaveCount(1);
  
  // Check ATS
  await page.click('button:has-text("ATS Score")');
  await expect(page.locator('.ats-modal')).toBeVisible();
  
  // Download
  await page.click('button:has-text("Download PDF")');
});
```

---

## Report Template

```markdown
## CV Builder Frontend Test Report

**Date**: [Date]
**Tester**: [Name]
**Environment**: Dev/Staging/Prod
**Browser**: Chrome/Firefox/Safari

### Test Results:
- [ ] Test 1: Version History - PASS/FAIL
- [ ] Test 2: ATS Score Details - PASS/FAIL
- [ ] Test 3: Error Recovery - PASS/FAIL
- [ ] Test 4: Cache Management - PASS/FAIL
- [ ] Test 5: UI/UX Integration - PASS/FAIL
- [ ] Test 6: End-to-End Workflow - PASS/FAIL

### Issues Found:
1. [Description]
2. [Description]

### Screenshots:
[Attach screenshots of issues]

### Recommendation:
✅ Ready for production
⚠️ Minor issues, can deploy with monitoring
❌ Critical issues, do not deploy
```

---

**Happy Testing!** 🚀
