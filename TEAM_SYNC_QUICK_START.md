# Team Leaderboard Sync - Quick Start Guide

## 🚀 5-Minute Setup

### 1. Update Sheet Name (1 min)
```javascript
// In google-apps-script.js, line 11:
const TEAM_LEADERBOARD_SHEET_NAME = 'Leaderboard by Account/Department';
```
**Change to match YOUR team sheet name!**

### 2. Deploy Firebase Rules (1 min)
```bash
firebase deploy --only firestore:rules
```

### 3. Deploy Script (1 min)
1. **Extensions** → **Apps Script**
2. Paste updated code
3. **Save**

### 4. Initial Sync (2 min)
1. Click: **🔥 Firebase Sync** → **👥 Team Leaderboard** → **📊 Sync Team to Firebase**
2. Confirm
3. Done! ✅

### 5. Verify (30 sec)
1. Click: **📈 View Team Statistics**
2. Should show: Sheet count = Firebase count ✅

---

## 📋 Quick Reference

### Menu Structure
```
🔥 Firebase Sync
├── 👤 Individual Leaderboard
│   └── ... (individual options)
├── 👥 Team Leaderboard              ← NEW!
│   ├── 📊 Sync Team to Firebase
│   ├── 🧹 Cleanup and Resync Team
│   ├── 📈 View Team Statistics
│   └── 🗑️ Clear Team Data
└── 🔄 Sync Playbooks to Firebase
```

### Common Operations

| Task | Action |
|------|--------|
| Sync all team data | 📊 Sync Team to Firebase |
| Fix duplicates | 🧹 Cleanup and Resync Team |
| Check sync status | 📈 View Team Statistics |
| Delete all team data | 🗑️ Clear Team Data |

---

## 📊 Team Data Structure

### Sheet Columns (A-G)
```
A: No.
B: Function
C: Sub-department (Program)
D: Account
E: Accumulated Points
F: Team size
G: Accumulated Points per Employee
```

### Firebase Document
```json
{
  "no": 1,
  "function": "Engineering",
  "subDepartment": "ABC",
  "account": "team@example.com",
  "accumulatedPoints": 100,
  "teamSize": 10,
  "pointsPerEmployee": 10,
  "rank": 1,
  "uniqueId": "1_Engineering_ABC",
  "lastUpdated": "2025-10-22..."
}
```

### Document ID Format
```
{no}_{function}_{subdepartment}

Examples:
- 1_Engineering_ABC
- 2_BA_Kobiton
- 3_Testing_Def
```

---

## ✅ Verification

### Check Statistics
```
🔥 Firebase Sync → 👥 Team Leaderboard → 📈 View Team Statistics

Expected:
✅ In Sync
📊 Google Sheet: 5 team records
🔥 Firebase: 5 team documents
```

### Check Firebase Console
1. Go to Firebase Console
2. Firestore Database → `team-leaderboard`
3. Should see your team documents

---

## 🔄 Auto-Sync (Optional)

### Enable Auto-Sync
1. **Extensions** → **Apps Script**
2. Run: `installTeamLeaderboardSyncTrigger`
3. Authorize
4. Done! Edits now auto-sync ✅

### Disable Auto-Sync
Run: `uninstallTeamLeaderboardSyncTrigger`

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Menu not showing | Close/reopen sheet |
| Team sheet not found | Update `TEAM_LEADERBOARD_SHEET_NAME` |
| Auto-sync not working | Run `installTeamLeaderboardSyncTrigger` |
| Counts don't match | Run 🧹 Cleanup and Resync Team |

---

## 📝 Key Features

### Unique IDs
- ✅ Each team entry gets unique document ID
- ✅ No overwrites, even for same function
- ✅ Combines: no + function + subdepartment

### Auto-Calculate
- ✅ Points per employee auto-calculated
- ✅ Formula: `accumulatedPoints / teamSize`
- ✅ Only if not already provided in Column G

### Smart Sync
- ✅ Validates data before sync
- ✅ Rate limiting (500ms per 10 entries)
- ✅ Error handling and logging
- ✅ Continues even if some rows fail

---

## 🎯 Daily Usage

### Normal Operations
1. Edit your team sheet as usual
2. Changes auto-sync (if trigger installed)
3. Or use manual sync after bulk changes

### After Bulk Changes
```
🔥 Firebase Sync → 👥 Team Leaderboard → 📊 Sync Team to Firebase
```

### Weekly Check
```
🔥 Firebase Sync → 👥 Team Leaderboard → 📈 View Team Statistics
```

---

## 📚 Full Documentation

- **Complete Guide**: `TEAM_LEADERBOARD_SYNC_GUIDE.md`
- **Individual Sync**: `FIREBASE_LEADERBOARD_SYNC_GUIDE.md`
- **Quick Start**: This file

---

## 💡 Tips

1. **Required fields**: No & Function must be filled
2. **Team size**: Keep accurate for correct per-employee calc
3. **Naming**: Use consistent function & sub-dept names
4. **Cleanup**: Run weekly to ensure data integrity
5. **Statistics**: Check before important presentations

---

## ✅ Success Criteria

After setup, you should have:
- ✅ Team data in Firebase `team-leaderboard` collection
- ✅ Sheet count = Firebase count
- ✅ Documents with unique IDs
- ✅ All team fields present in documents
- ✅ lastUpdated timestamps

---

## 🎉 That's It!

Your team leaderboard now syncs to Firebase automatically!

**Time to setup**: ~5 minutes  
**Result**: All team data in Firebase  
**Maintenance**: Minimal (check stats weekly)

For detailed information, see `TEAM_LEADERBOARD_SYNC_GUIDE.md`

