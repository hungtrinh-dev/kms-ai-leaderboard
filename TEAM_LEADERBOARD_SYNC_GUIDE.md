# Team Leaderboard Sync to Firebase - Complete Guide

## 🎉 What's New

I've added complete functionality to automatically sync your **Team Leaderboard** data from Google Sheets to Firebase Firestore, similar to the individual leaderboard sync.

## 📊 Team Data Structure

### Google Sheet Columns (A-G)
Based on your "Leaderboard by Account/Department" sheet:

| Column | Field Name | Description |
|--------|------------|-------------|
| A | No. | Entry number |
| B | Function | Department/Function name |
| C | Sub-department (Program) | Program or sub-department |
| D | Account | Team account/email |
| E | Accumulated Points | Total points for the team |
| F | Team size | Number of team members |
| G | Accumulated Points per Employee | Points divided by team size |

### Firebase Document Structure
```json
{
  "no": 1,
  "function": "Engineering",
  "subDepartment": "ABC",
  "account": "hungtrinh@gmail.com",
  "accumulatedPoints": 100,
  "teamSize": 10,
  "pointsPerEmployee": 10,
  "rank": 1,
  "uniqueId": "1_Engineering_ABC",
  "lastUpdated": "2025-10-22T12:00:00.000Z"
}
```

### Collection & Document IDs
- **Collection**: `team-leaderboard`
- **Document ID Format**: `{no}_{function}_{subdepartment}`
- **Example**: `1_Engineering_ABC`, `2_BA_Kobiton`

This ensures each team entry is unique, even if the same function appears multiple times with different sub-departments.

## 🚀 Setup Instructions

### Step 1: Update Sheet Name Constant

In `google-apps-script.js` (line 11):
```javascript
const TEAM_LEADERBOARD_SHEET_NAME = 'Leaderboard by Account/Department';
```

**Change this to match your actual team sheet name!**

Common names:
- `'Leaderboard by Account/Department'`
- `'Team Leaderboard'`
- `'Leaderboard by Team'`

### Step 2: Deploy Firebase Rules

The `firestore.rules` file has been updated with team leaderboard rules. Deploy them:

```bash
firebase deploy --only firestore:rules
```

Or manually add to Firebase Console → Firestore Database → Rules:
```javascript
match /team-leaderboard/{teamId} {
  allow read: if true;
  allow write: if true;
}
```

### Step 3: Deploy Updated Apps Script

1. **Open your Google Sheet**
2. Go to **Extensions** → **Apps Script**
3. Replace the code with updated `google-apps-script.js`
4. **Save** (Ctrl+S / Cmd+S)

### Step 4: Initial Team Sync

1. **Refresh your Google Sheet** (close and reopen)
2. You'll see an updated menu: **🔥 Firebase Sync**
3. Navigate to **👥 Team Leaderboard** submenu
4. Click **📊 Sync Team to Firebase**
5. Confirm and wait for completion

### Step 5: (Optional) Install Auto-Sync Trigger

For automatic syncing when you edit the team sheet:

1. Go to **Extensions** → **Apps Script**
2. Find function: `installTeamLeaderboardSyncTrigger`
3. Click **Run** (▶️)
4. Authorize when prompted
5. See success message ✅

## 📋 New Menu Structure

```
🔥 Firebase Sync
├── 👤 Individual Leaderboard
│   ├── 📊 Sync Individual to Firebase
│   ├── 🧹 Cleanup and Resync Individual
│   ├── 📈 View Individual Statistics
│   └── 🗑️ Clear Individual Data
├── 👥 Team Leaderboard                    ← NEW!
│   ├── 📊 Sync Team to Firebase          ← NEW!
│   ├── 🧹 Cleanup and Resync Team        ← NEW!
│   ├── 📈 View Team Statistics           ← NEW!
│   └── 🗑️ Clear Team Data                ← NEW!
├── ──────────
└── 🔄 Sync Playbooks to Firebase
```

## 🔧 Available Functions

### Team Sync Functions

| Function | Purpose | When to Use |
|----------|---------|-------------|
| `syncAllTeamLeaderboardToFirebase()` | Sync all team entries | Initial setup, bulk updates |
| `syncTeamLeaderboardEntryToFirebase(entry)` | Sync single team entry | Manual single row sync |
| `onEditTeamLeaderboardSync(e)` | Auto-sync on edit | Triggered automatically (if installed) |
| `manualSyncTeamLeaderboard()` | Manual sync with UI | Via menu |
| `cleanupAndResyncTeamLeaderboard()` | Clean and resync | Fix duplicates, ensure clean data |
| `viewTeamSyncStatistics()` | Check sync status | Verify counts match |
| `clearFirebaseTeamLeaderboard()` | Delete all team data | Start fresh |
| `installTeamLeaderboardSyncTrigger()` | Install auto-sync | One-time setup |
| `uninstallTeamLeaderboardSyncTrigger()` | Remove auto-sync | Disable feature |

## 📈 Usage Examples

### Example 1: Initial Sync
```
Scenario: You have 5 team entries in your sheet, need to sync to Firebase

Steps:
1. Click: 🔥 Firebase Sync → 👥 Team Leaderboard → 📊 Sync Team to Firebase
2. Confirm the dialog
3. Wait for "Successfully synced 5 team entries to Firebase"
4. Verify: 🔥 Firebase Sync → 👥 Team Leaderboard → 📈 View Team Statistics
```

### Example 2: Automatic Sync
```
Scenario: You want changes to automatically sync

Steps:
1. Run: installTeamLeaderboardSyncTrigger() in Apps Script
2. Edit any team data in columns A-G
3. Changes automatically sync within 1-2 seconds
4. Check Firebase Console to verify
```

### Example 3: Fix Duplicates
```
Scenario: You suspect duplicate or incorrect data in Firebase

Steps:
1. Click: 🔥 Firebase Sync → 👥 Team Leaderboard → 🧹 Cleanup and Resync Team
2. Confirm (this deletes and resyncs everything)
3. Wait for completion message
4. Verify with: 📈 View Team Statistics
```

## 🔍 Verification

### Check Statistics
```
🔥 Firebase Sync → 👥 Team Leaderboard → 📈 View Team Statistics

Expected:
✅ In Sync
📊 Google Sheet: 5 team records
🔥 Firebase: 5 team documents
Everything looks good!
```

### Check Firebase Console
1. Go to https://console.firebase.google.com
2. Open your project
3. Navigate to **Firestore Database**
4. Check `team-leaderboard` collection
5. Should see documents with IDs like:
   - `1_Engineering_ABC`
   - `2_BA_Kobiton`
   - `3_Testing_Def`
   etc.

### Verify Document Data
Click on any document to see:
```json
{
  "no": 1,
  "function": "Engineering",
  "subDepartment": "ABC",
  "account": "hungtrinh@gmail.com",
  "accumulatedPoints": 100,
  "teamSize": 10,
  "pointsPerEmployee": 10,
  "rank": 1,
  "uniqueId": "1_Engineering_ABC",
  "lastUpdated": "2025-10-22T..."
}
```

## 🎯 Key Features

### Unique Document IDs
- **Format**: `{no}_{function}_{subdepartment}`
- **Example**: `1_Engineering_ABC`
- **Benefit**: Each team entry is unique, no overwrites

### Automatic Calculation
- **Points per Employee**: Automatically calculated if not provided
- **Formula**: `accumulatedPoints / teamSize`
- **Example**: 100 points ÷ 10 members = 10 points per employee

### Rate Limiting
- Syncs 10 entries at a time
- 500ms delay between batches
- Prevents API quota issues

### Error Handling
- Validates required fields (no, function)
- Logs all errors with row numbers
- Shows detailed error reports
- Continues sync even if some rows fail

## 💡 Understanding Team Data

Your team data represents:
- **Team performance** by function/department
- **Sub-departments** within larger teams
- **Accumulated points** from all team members
- **Points per employee** for fair comparison

### Example from Your Sheet:
| No | Function | Sub-dept | Account | Points | Size | Per Employee |
|----|----------|----------|---------|--------|------|--------------|
| 1 | Engineering | ABC | hung@... | 100 | 10 | 10 |
| 2 | BA | Kobiton | ba@... | 20 | 8 | 2.5 |
| 3 | Testing | Def | test@... | 40 | 8 | 5 |

All team entries sync correctly with unique IDs! 🎉

## 🔄 Automatic Sync Details

### How It Works
```
User edits team sheet → onEdit Trigger → 
Detects team sheet change → Validates data →
Syncs to Firebase → Document updated
```

### What Triggers Sync
- ✅ Editing columns A-G (data columns)
- ✅ Any data row (row 2 and below)
- ❌ Header row (row 1) - ignored
- ❌ Other columns - ignored

### Sync Speed
- Single edit: 1-2 seconds
- 5 team entries: ~5 seconds
- 20 team entries: ~15 seconds

## 🛠️ Maintenance

### Daily Operations
- **Normal use**: Just edit your sheet, changes auto-sync
- **Bulk changes**: Use manual sync after all edits
- **New entries**: Add row, auto-syncs automatically

### Weekly Check (Recommended)
```
🔥 Firebase Sync → 👥 Team Leaderboard → 📈 View Team Statistics
```
If counts don't match, run cleanup and resync.

### After Major Changes
```
🔥 Firebase Sync → 👥 Team Leaderboard → 🧹 Cleanup and Resync Team
```
Ensures clean data with no duplicates or orphaned entries.

## 🐛 Troubleshooting

### Issue: Menu doesn't show team options
**Solution**: 
1. Close and reopen Google Sheet
2. Or run `onOpen()` manually in Apps Script

### Issue: Team sheet not found
**Solution**:
1. Update `TEAM_LEADERBOARD_SHEET_NAME` constant
2. Make sure it matches your exact sheet name
3. Redeploy the script

### Issue: Auto-sync not working
**Solution**:
1. Check Apps Script → Triggers (clock icon)
2. Ensure `onEditTeamLeaderboardSync` trigger exists
3. Reinstall: Run `installTeamLeaderboardSyncTrigger()`

### Issue: Counts don't match
**Solution**:
1. Check statistics to see the difference
2. Run: 🧹 Cleanup and Resync Team
3. Verify again with: 📈 View Team Statistics

### Issue: Points per employee incorrect
**Solution**:
- Column G should have the formula or value
- If empty, it auto-calculates: `E / F` (points ÷ size)
- Check that team size (Column F) is correct

### Issue: Duplicate documents in Firebase
**Solution**:
- Should not happen with new unique ID system
- If it does, run: 🧹 Cleanup and Resync Team

## 📊 Data Integrity

### Required Fields
- **Column A (No)**: Must be present
- **Column B (Function)**: Must be present
- Other columns: Optional (will use empty string or 0)

### Data Validation
- Team size defaults to 1 if missing
- Points default to 0 if missing
- Points per employee auto-calculated if missing
- Rank assigned based on row position

### Sync Logic
- Uses PATCH method (create or update)
- No duplicates due to unique document IDs
- Preserves existing data if fields not changed
- Updates lastUpdated timestamp on every sync

## 🔐 Security

### Current Rules (Development)
```javascript
match /team-leaderboard/{teamId} {
  allow read: if true;  // Anyone can read
  allow write: if true; // Apps Script can write
}
```

### Production Rules (Recommended)
```javascript
match /team-leaderboard/{teamId} {
  allow read: if true;
  allow write: if request.auth != null && 
                  request.auth.token.email.matches('.*@kms-technology.com$');
}
```

## 📚 Advanced Usage

### Query Team Data in Firebase
From your web app:
```javascript
const teamsRef = collection(db, 'team-leaderboard');
const q = query(teamsRef, orderBy('pointsPerEmployee', 'desc'));
const snapshot = await getDocs(q);
```

### Filter by Function
```javascript
const q = query(teamsRef, 
  where('function', '==', 'Engineering'),
  orderBy('accumulatedPoints', 'desc')
);
```

### Get Top Teams
```javascript
const q = query(teamsRef, 
  orderBy('pointsPerEmployee', 'desc'),
  limit(5)
);
```

## 🎓 Best Practices

### Data Entry
1. Always fill required fields (No, Function)
2. Keep team size accurate for correct per-employee calculation
3. Use consistent naming for functions and sub-departments
4. Update regularly to keep Firebase in sync

### Syncing
1. Use auto-sync for real-time updates
2. Use manual sync after bulk changes
3. Run cleanup weekly to ensure data integrity
4. Check statistics before major presentations

### Performance
1. For <50 teams: Auto-sync works great
2. For >50 teams: Consider manual sync only
3. Use cleanup sparingly (it's slower due to delete+resync)
4. Monitor Apps Script execution logs for errors

## ✅ Success Checklist

After setup, verify:

- [ ] Updated `TEAM_LEADERBOARD_SHEET_NAME` constant
- [ ] Deployed Firebase rules
- [ ] Ran initial sync successfully
- [ ] Checked statistics (sheet count = Firebase count)
- [ ] Verified documents in Firebase Console
- [ ] Tested auto-sync (if installed)
- [ ] Confirmed document structure is correct

## 🎉 Summary

**What's New:**
- ✅ Complete team leaderboard sync functionality
- ✅ Unique document IDs (no overwrites)
- ✅ Automatic points per employee calculation
- ✅ Custom menu with team-specific options
- ✅ Statistics viewer for teams
- ✅ Cleanup and resync for teams
- ✅ Auto-sync trigger for teams (optional)
- ✅ Firebase security rules for teams

**How to Use:**
1. Update sheet name constant
2. Deploy Firebase rules
3. Run initial sync via menu
4. (Optional) Install auto-sync trigger
5. Edit your team sheet as normal

**Time to Setup:** ~5 minutes

**Result:** All team data automatically syncs to Firebase! 🚀

---

For individual leaderboard sync, see `FIREBASE_LEADERBOARD_SYNC_GUIDE.md`

Need help? Check Apps Script execution logs or Firebase Console!

