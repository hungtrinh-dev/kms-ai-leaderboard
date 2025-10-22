# Firebase Leaderboard Sync - Complete Setup Guide

## Overview

This guide will help you set up automatic syncing of your Google Sheets leaderboard data to Firebase Firestore. Once configured, any changes made to the leaderboard sheet will automatically sync to Firebase in real-time.

## Features

✅ **Automatic Sync**: Changes in Google Sheets automatically sync to Firebase  
✅ **Manual Sync**: Bulk sync all data with one click  
✅ **Custom Menu**: Easy-to-use menu in Google Sheets  
✅ **Error Handling**: Robust error handling and logging  
✅ **Batch Processing**: Handles large datasets efficiently  
✅ **Document ID**: Uses account email as document ID for easy lookup  

## Data Structure

### Google Sheet Columns (A-G)
- Column A: **No** (Entry number)
- Column B: **ID** (User ID)
- Column C: **Full Name**
- Column D: **Function** (Department/Role)
- Column E: **Sub-department (Program)**
- Column F: **Account** (Email address)
- Column G: **Accumulated Points**

### Firebase Firestore Document Structure
```javascript
{
  no: 1,
  id: "2246",
  fullName: "Trinh Vũ Minh Hùng",
  function: "Engineering",
  subDepartment: "LNI teams",
  account: "hungtrinh@kms-technology.com",
  points: 100,
  rank: 1,
  lastUpdated: "2025-10-22T10:30:00.000Z"
}
```

### Collection Name
- Firebase Collection: `individual-leaderboard`
- Document ID: Account email (sanitized, e.g., `hungtrinh_kms-technology_com`)

## Setup Instructions

### Step 1: Update Google Apps Script

1. **Open your Google Sheet**
2. Go to **Extensions** → **Apps Script**
3. Copy the updated `google-apps-script.js` code
4. **Important**: Update the sheet name constant at the top:
   ```javascript
   const LEADERBOARD_SHEET_NAME = 'Leaderboard by Individual';
   ```
   Change `'Leaderboard by Individual'` to match YOUR actual sheet name

5. **Save** the script (Ctrl+S or Cmd+S)

### Step 2: Configure Firebase Security Rules

Update your `firestore.rules` to allow the leaderboard collection:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Existing playbooks rules
    match /playbooks/{docId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // NEW: Individual leaderboard rules
    match /individual-leaderboard/{docId} {
      allow read: if true; // Anyone can read leaderboard
      allow write: if true; // Allow Google Apps Script to write
      // In production, you may want to restrict write access
    }
  }
}
```

### Step 3: Deploy Firebase Rules

```bash
firebase deploy --only firestore:rules
```

### Step 4: Initial Setup in Google Sheets

1. **Refresh your Google Sheet** (close and reopen)
2. You should see a new menu: **🔥 Firebase Sync**
3. If you don't see it, go to **Extensions** → **Apps Script** and run the `onOpen` function manually

### Step 5: Install Automatic Sync Trigger

**Option A: Using the Script Editor (Recommended)**

1. Go to **Extensions** → **Apps Script**
2. Find the function `installLeaderboardSyncTrigger`
3. Click **Run** (▶️ button)
4. **Authorize** the script when prompted
5. You should see a success message

**Option B: Using the Apps Script Triggers UI**

1. In Apps Script editor, click the **clock icon** (Triggers) on the left sidebar
2. Click **+ Add Trigger**
3. Configure:
   - Choose function: `onEditLeaderboardSync`
   - Choose deployment: Head
   - Event source: From spreadsheet
   - Event type: On edit
4. Click **Save**

### Step 6: Perform Initial Bulk Sync

1. In your Google Sheet, click **🔥 Firebase Sync** menu
2. Select **📊 Sync Leaderboard to Firebase**
3. Click **Yes** to confirm
4. Wait for the sync to complete (you'll see a success message)

## Usage

### Automatic Sync (After Setup)

Once the trigger is installed, any edit to the leaderboard sheet will automatically sync to Firebase:

1. Edit any cell in columns A-G (data columns)
2. The script automatically detects the change
3. The edited row syncs to Firebase within seconds
4. Check **View** → **Executions** in Apps Script to see logs

### Manual Sync

Use manual sync when you:
- Make bulk changes
- Want to ensure everything is synced
- Need to resync after errors

**Steps:**
1. Click **🔥 Firebase Sync** → **📊 Sync Leaderboard to Firebase**
2. Confirm the dialog
3. Wait for completion message

### Clear Firebase Leaderboard

⚠️ **Warning**: This deletes ALL leaderboard data from Firebase!

1. Click **🔥 Firebase Sync** → **🗑️ Clear Firebase Leaderboard**
2. Confirm (this action cannot be undone)
3. Data in Google Sheets remains unchanged

## Verification

### Check if Sync is Working

1. **Make a test edit** in your leaderboard sheet
2. **Open Firebase Console**: https://console.firebase.google.com
3. Navigate to **Firestore Database**
4. Check the `individual-leaderboard` collection
5. You should see a document with the account email as the ID

### Check Logs

1. Go to **Extensions** → **Apps Script**
2. Click **View** → **Executions**
3. Look for recent executions of `onEditLeaderboardSync`
4. Check for errors or success messages

### Test Sync Manually

Run this in Apps Script to test a single entry:

```javascript
function testSync() {
  const testEntry = {
    no: 999,
    id: "9999",
    fullName: "Test User",
    function: "Engineering",
    subDepartment: "Test Team",
    account: "test@kms-technology.com",
    points: 100,
    rank: 1
  };
  
  const result = syncLeaderboardEntryToFirebase(testEntry);
  Logger.log(result);
}
```

## Troubleshooting

### Issue: Menu doesn't appear

**Solution:**
1. Close and reopen the Google Sheet
2. Or manually run `onOpen` function in Apps Script

### Issue: Trigger doesn't work

**Solution:**
1. Check **Apps Script** → **Triggers** (clock icon)
2. Ensure `onEditLeaderboardSync` trigger exists
3. Delete and reinstall using `installLeaderboardSyncTrigger`

### Issue: Sync fails with permission error

**Solution:**
1. Check Firebase rules allow write access
2. Verify `FIREBASE_PROJECT_ID` is correct in the script
3. Re-authorize the script: **Extensions** → **Apps Script** → Run any function

### Issue: Document not found in Firebase

**Solution:**
1. Run manual sync: **🔥 Firebase Sync** → **📊 Sync Leaderboard to Firebase**
2. Check Firestore security rules
3. Verify collection name is `individual-leaderboard`

### Issue: Rate limiting / Too many requests

**Solution:**
- The script has built-in delays (500ms per 10 requests)
- For very large sheets (>1000 rows), consider batching
- Check **Apps Script** → **Executions** for errors

### Issue: Wrong sheet is being synced

**Solution:**
1. Update `LEADERBOARD_SHEET_NAME` constant in the script
2. Make sure it matches your actual sheet name exactly
3. Redeploy the script

## Advanced Configuration

### Change Collection Name

In `google-apps-script.js`:
```javascript
const FIRESTORE_COLLECTION_INDIVIDUAL_LEADERBOARD = 'your-collection-name';
```

### Customize Document ID Format

Modify the `syncLeaderboardEntryToFirebase` function:
```javascript
// Current: Uses sanitized email
const documentId = entry.account.replace(/[^a-zA-Z0-9_-]/g, '_');

// Alternative: Use employee ID
const documentId = entry.id.toString();

// Alternative: Use custom format
const documentId = `user_${entry.id}_${entry.account.split('@')[0]}`;
```

### Add Additional Fields

In `syncLeaderboardEntryToFirebase`, add fields to `firestoreData`:
```javascript
const firestoreData = {
  fields: {
    // ... existing fields ...
    customField: { stringValue: entry.customValue },
    createdAt: { timestampValue: new Date().toISOString() },
    updatedBy: { stringValue: Session.getActiveUser().getEmail() }
  }
};
```

### Sync Only Specific Columns

Modify the condition in `onEditLeaderboardSync`:
```javascript
// Current: Syncs columns A-G
if (editedRow <= 1 || editedCol > 7) return;

// Only sync points column (column G = 7)
if (editedCol !== 7) return;
```

## Performance Optimization

### For Large Datasets (>500 rows)

1. **Increase sleep interval**:
   ```javascript
   if ((index + 1) % 10 === 0) {
     Utilities.sleep(1000); // Increase from 500ms to 1000ms
   }
   ```

2. **Batch updates**: Use Firestore batch operations (requires custom implementation)

3. **Schedule sync**: Instead of real-time, sync on a schedule:
   - Apps Script → Triggers → Add time-driven trigger
   - Run every hour/day instead of on every edit

### Reduce API Calls

- Only sync when points column changes
- Cache recent syncs to avoid duplicates
- Use Firebase batch writes

## Monitoring

### Check Sync Status

Add this function to see last sync time:
```javascript
function getLastSyncStatus() {
  const ui = SpreadsheetApp.getUi();
  const props = PropertiesService.getScriptProperties();
  const lastSync = props.getProperty('lastSyncTime') || 'Never';
  ui.alert('Last Sync', `Last successful sync: ${lastSync}`, ui.ButtonSet.OK);
}
```

### Log All Changes

```javascript
function logSyncActivity(entry, success) {
  const logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sync Log');
  if (!logSheet) return;
  
  logSheet.appendRow([
    new Date(),
    entry.account,
    entry.points,
    success ? 'Success' : 'Failed'
  ]);
}
```

## Security Best Practices

### Production Security Rules

For production, restrict write access to your Apps Script:

```javascript
match /individual-leaderboard/{docId} {
  allow read: if true;
  allow write: if request.auth != null && 
                  request.auth.token.email.matches('.*@kms-technology.com$');
}
```

### Use Service Account (Advanced)

For better security, use a service account with limited permissions:
1. Create a service account in Firebase Console
2. Download the JSON key
3. Store credentials in Script Properties
4. Use OAuth2 for authentication

## Uninstalling

### Remove Automatic Sync

**Option 1: Using Function**
1. Go to **Extensions** → **Apps Script**
2. Run `uninstallLeaderboardSyncTrigger` function

**Option 2: Using Triggers UI**
1. Apps Script → Click clock icon (Triggers)
2. Find `onEditLeaderboardSync` trigger
3. Click ⋮ (three dots) → Delete

### Keep Manual Sync Only

- Uninstall the trigger (see above)
- Keep the custom menu for manual syncing
- This gives you more control over when data syncs

## FAQ

**Q: Will this slow down my Google Sheet?**  
A: No, the sync happens asynchronously and doesn't block sheet operations.

**Q: What happens if I edit multiple rows at once?**  
A: Each edit triggers separately. For bulk changes, use manual sync instead.

**Q: Can I sync to multiple Firebase projects?**  
A: Yes, but you'll need separate scripts for each project or modify the script to handle multiple projects.

**Q: Does this work with team leaderboard too?**  
A: This guide focuses on individual leaderboard. You can create similar functions for team leaderboard using the same pattern.

**Q: What if Firebase is down?**  
A: The script will log errors but won't affect your Google Sheet. Data remains safe in Sheets.

**Q: Can I undo a sync?**  
A: No automatic undo. You'll need to manually update Firebase or re-sync from backup.

## Summary

After completing this setup:

✅ Your leaderboard data automatically syncs to Firebase on every edit  
✅ You have a custom menu for manual operations  
✅ Data structure matches both Google Sheets and Firebase  
✅ Robust error handling and logging  
✅ Easy to monitor and troubleshoot  

**Next Steps:**
1. Update your web application to read from Firebase instead of Google Sheets API
2. Enjoy real-time leaderboard updates
3. Monitor the sync logs regularly

Need help? Check the Apps Script execution logs or Firebase Console for details!

