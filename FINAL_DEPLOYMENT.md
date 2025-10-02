# Final Deployment Guide - Google Apps Script

## 🎯 Current Status
✅ Code is clean and ready
✅ Google Apps Script URL updated
❌ Apps Script needs to be deployed as public web app

## 🚀 Deployment Steps

### Step 1: Open Your Apps Script
1. **Open your Google Sheet** with leaderboard data
2. **Go to Extensions > Apps Script**
3. **You should see your script project**

### Step 2: Update the Code
1. **Select all existing code** (Ctrl/Cmd + A)
2. **Delete it**
3. **Copy all code from `google-apps-script.js`**
4. **Paste it into the editor**
5. **Save** (Ctrl/Cmd + S)

### Step 3: Deploy as Web App
1. **Click "Deploy"** button (top right)
2. **Select "New deployment"**
3. **Click the gear icon** next to "Type"
4. **Choose "Web app"**

### Step 4: Configure Deployment Settings
**IMPORTANT**: These settings are crucial for it to work!

- **Description**: "KMS AI Tips Leaderboard API"
- **Execute as**: **Me** (your email)
- **Who has access**: **Anyone** ⚠️ **Must be "Anyone", not "Anyone with Google account"**

### Step 5: Deploy
1. **Click "Deploy"**
2. **Authorize the script** if prompted
3. **Copy the Web App URL** (starts with `https://script.google.com/macros/s/...`)

### Step 6: Update HTML
1. **Replace the GOOGLE_SCRIPT_URL** in your HTML file
2. **Use the new Web App URL** from step 5

### Step 7: Test
1. **Open the Web App URL** in browser
2. **Should show**: `{"message": "KMS AI Tips API is running!"}`
3. **Test leaderboard endpoint**: Add `?action=getLeaderboard` to URL

## 🧪 Testing URLs

### Basic API Test:
```
https://script.google.com/macros/s/YOUR_NEW_SCRIPT_ID/exec
```

### Leaderboard Data Test:
```
https://script.google.com/macros/s/YOUR_NEW_SCRIPT_ID/exec?action=getLeaderboard
```

## 🔍 Troubleshooting

### If you get "Moved Temporarily" error:
- Apps Script is not deployed as web app
- Check deployment settings (must be "Anyone" access)

### If you get CORS errors:
- Make sure deployment is set to "Anyone" not "Anyone with Google account"
- Try redeploying with correct settings

### If you get empty data:
- Check that your sheet has data in columns A-G
- Verify sheet name matches what the script is looking for

## ✅ Expected Result

Once deployed correctly:
1. **Leaderboard loads real data** from your Google Sheet
2. **Shows Trinh (100 points) and Nhi (20 points)**
3. **Updates in real-time** when you modify the sheet
4. **No CORS errors** in browser console

## 📞 Next Steps

1. **Follow the deployment steps above**
2. **Test the Web App URL**
3. **Update the HTML with new URL**
4. **Refresh your website and test leaderboard**

The leaderboard should then work perfectly with your real Google Sheets data! 🎉
