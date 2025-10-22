# Leaderboard Sync - Quick Start

## 🚀 5-Minute Setup

### 1. Update Apps Script (2 min)
```javascript
// In google-apps-script.js, line 9:
const LEADERBOARD_SHEET_NAME = 'YOUR_SHEET_NAME_HERE';
```
- Replace `'YOUR_SHEET_NAME_HERE'` with your actual sheet name
- Example: `'Leaderboard by Individual'` or `'AI for Everyone'`

### 2. Install Auto-Sync Trigger (1 min)
1. Open Google Sheet
2. **Extensions** → **Apps Script**  
3. Find and run function: `installLeaderboardSyncTrigger`
4. Authorize when prompted
5. See success message ✅

### 3. Initial Sync (2 min)
1. In Google Sheet, click **🔥 Firebase Sync** menu
2. Select **📊 Sync Leaderboard to Firebase**
3. Click **Yes** to confirm
4. Wait for completion message

### 4. Test It! (30 seconds)
1. Edit any points value in your sheet
2. Check Firebase Console → `individual-leaderboard` collection
3. See the updated document ✅

---

## 📋 Available Functions

### Custom Menu (in Google Sheets)
After setup, you'll see **🔥 Firebase Sync** menu with:

- **📊 Sync Leaderboard to Firebase** - Manual full sync
- **🔄 Sync Playbooks to Firebase** - Sync playbooks (existing)
- **🗑️ Clear Firebase Leaderboard** - Delete all (⚠️ careful!)

### Script Functions (in Apps Script)

| Function | Purpose | When to Use |
|----------|---------|-------------|
| `syncAllLeaderboardToFirebase()` | Sync all entries | Initial setup, bulk updates |
| `syncLeaderboardEntryToFirebase(entry)` | Sync single entry | Manual single row sync |
| `onEditLeaderboardSync(e)` | Auto-sync on edit | Triggered automatically |
| `installLeaderboardSyncTrigger()` | Install auto-sync | One-time setup |
| `uninstallLeaderboardSyncTrigger()` | Remove auto-sync | Disable auto-sync |
| `deleteLeaderboardEntryFromFirebase(email)` | Delete entry | Remove specific user |
| `clearFirebaseLeaderboard()` | Clear all data | Start fresh |

---

## 🔄 How Auto-Sync Works

```
User edits Sheet Row → onEdit Trigger Fires → 
Script Detects Change → Syncs to Firebase → 
Document Updated in individual-leaderboard collection
```

**What triggers sync:**
- ✅ Editing columns A-G (No, ID, Name, Function, Sub-dept, Account, Points)
- ✅ Any data row (row 2 and below)
- ❌ Header row (row 1) - ignored
- ❌ Other columns - ignored

---

## 📊 Data Mapping

| Google Sheet Column | Firebase Field | Type |
|---------------------|----------------|------|
| A: No | `no` | Integer |
| B: ID | `id` | String |
| C: Full Name | `fullName` | String |
| D: Function | `function` | String |
| E: Sub-department | `subDepartment` | String |
| F: Account | `account` | String |
| G: Points | `points` | Integer |
| - | `rank` | Integer (auto) |
| - | `lastUpdated` | Timestamp (auto) |

**Document ID:** Account email (sanitized)
- Example: `hungtrinh@kms-technology.com` → `hungtrinh_kms-technology_com`

---

## ✅ Verification Checklist

### After Installation
- [ ] Script updated with correct `LEADERBOARD_SHEET_NAME`
- [ ] Trigger installed (check Apps Script → Triggers)
- [ ] Initial sync completed
- [ ] Test edit syncs to Firebase
- [ ] Custom menu appears in Google Sheets

### Check Sync is Working
1. **Edit a cell** in the leaderboard
2. **Check Firebase Console**: 
   - Go to Firestore Database
   - Open `individual-leaderboard` collection
   - Find document by email (sanitized)
   - Verify `lastUpdated` timestamp is recent
3. **Check Logs**:
   - Apps Script → View → Executions
   - Look for successful `onEditLeaderboardSync` runs

---

## 🐛 Common Issues & Quick Fixes

### ❌ Menu doesn't appear
**Fix:** Close and reopen sheet, or run `onOpen()` manually

### ❌ Sync doesn't work after edit
**Fix:** 
1. Check if trigger exists (Apps Script → Triggers)
2. Run `installLeaderboardSyncTrigger()` again
3. Check sheet name matches `LEADERBOARD_SHEET_NAME`

### ❌ Permission denied
**Fix:** Re-authorize script (run any function in Apps Script)

### ❌ Document not in Firebase
**Fix:** Run manual sync via **🔥 Firebase Sync** menu

### ❌ Multiple triggers firing
**Fix:** Run `uninstallLeaderboardSyncTrigger()`, then reinstall

---

## 📝 Daily Operations

### Normal Use
- ✅ Just edit your sheet as normal
- ✅ Changes auto-sync to Firebase
- ✅ No additional actions needed

### After Bulk Changes
1. Make all your changes in the sheet
2. Click **🔥 Firebase Sync** → **📊 Sync Leaderboard**
3. Wait for confirmation
4. Done! ✅

### Adding New Entries
1. Add new row in sheet with all required fields
2. Auto-sync triggers on save
3. New document created in Firebase

### Removing Entries
1. Delete row from sheet (or clear data)
2. Manually delete from Firebase:
   - Apps Script: Run `deleteLeaderboardEntryFromFirebase('email@example.com')`
   - Or delete directly in Firebase Console

---

## 🔒 Security

### Firebase Rules (Recommended)
```javascript
match /individual-leaderboard/{docId} {
  allow read: if true; // Public read
  allow write: if true; // Apps Script can write
}
```

### Production Rules (More Secure)
```javascript
match /individual-leaderboard/{docId} {
  allow read: if true;
  allow write: if request.auth != null && 
                  request.auth.token.email.matches('.*@kms-technology.com$');
}
```

---

## 📈 Performance Tips

### For Large Sheets (>500 rows)
- Use manual sync instead of auto-sync for bulk updates
- Increase delay in script (change `Utilities.sleep(500)` to `1000`)
- Consider time-based triggers (hourly) instead of on-edit

### Optimize Sync
- Only auto-sync critical columns (modify `onEditLeaderboardSync`)
- Batch process with Firebase batch API (advanced)
- Cache recently synced documents to avoid duplicates

---

## 🛠️ Maintenance

### Weekly
- Check Apps Script → Executions for errors
- Verify sync counts match sheet row counts

### Monthly
- Review Firebase storage usage
- Clean up orphaned documents (if any)
- Update security rules if needed

### When Issues Occur
1. Check execution logs first
2. Test with `testSync()` function
3. Run manual sync to fix sync gaps
4. Reinstall trigger if needed

---

## 📚 Related Files

- `google-apps-script.js` - Main script file
- `FIREBASE_LEADERBOARD_SYNC_GUIDE.md` - Detailed documentation
- `firestore.rules` - Firebase security rules
- `FIREBASE_SETUP_GUIDE.md` - Firebase initial setup

---

## 🎯 Key Takeaways

✅ **One-time setup** → Automatic forever  
✅ **Edit sheet** → Firebase updates automatically  
✅ **Manual sync available** for bulk operations  
✅ **Custom menu** for easy access  
✅ **Robust** error handling and logging  
✅ **Fast** - syncs in seconds  
✅ **Safe** - Sheet data is always the source of truth  

---

## 🆘 Need Help?

1. **Check logs**: Apps Script → View → Executions
2. **Read full guide**: `FIREBASE_LEADERBOARD_SYNC_GUIDE.md`
3. **Test functions**: Run test functions in Apps Script
4. **Firebase Console**: Check Firestore Database directly

**Most common fix:** Reinstall trigger via `installLeaderboardSyncTrigger()`

---

## 🎉 You're All Set!

Your leaderboard now syncs automatically to Firebase. Just edit your sheet and let the magic happen! ✨

For detailed documentation, see `FIREBASE_LEADERBOARD_SYNC_GUIDE.md`

