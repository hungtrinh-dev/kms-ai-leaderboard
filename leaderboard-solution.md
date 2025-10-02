# Simple Google Sheets Leaderboard Solution

## 🚨 The CORS Problem
Google Apps Script has CORS restrictions that prevent direct API calls from web browsers. Here are 3 simple solutions:

## ✅ Solution 1: Public Google Sheets CSV (Recommended - Easiest)

### Step 1: Make Your Sheet Public
1. **Open your Google Sheet**
2. **Click "Share" button** (top right)
3. **Change to "Anyone with the link"**
4. **Set permission to "Viewer"**
5. **Copy the sheet URL**

### Step 2: Get CSV Export URL
Your sheet URL looks like:
```
https://docs.google.com/spreadsheets/d/SHEET_ID/edit#gid=0
```

Convert to CSV export URL:
```
https://docs.google.com/spreadsheets/d/SHEET_ID/export?format=csv&gid=0
```

### Step 3: Update the Code
Replace `SHEET_ID` in the HTML with your actual sheet ID.

## ✅ Solution 2: Manual Data Update (Simplest)

### Create a simple JavaScript array with your data:
```javascript
const LEADERBOARD_DATA = [
    {
        function: 'Engineering',
        account: 'hungtrinh@kms-technology.com',
        fullName: 'Trinh Vu Minh Hung',
        points: 100,
        pointsPerTeamSize: 10.0
    },
    {
        function: 'HR',
        account: 'nhingo@kms-technology.com', 
        fullName: 'Nhi Ngo',
        points: 20,
        pointsPerTeamSize: 2.0
    }
    // Add more entries as needed
];
```

## ✅ Solution 3: Google Sheets API with API Key

### Step 1: Enable Google Sheets API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Sheets API
4. Create API key

### Step 2: Use API Key
```javascript
const API_KEY = 'YOUR_API_KEY';
const SHEET_ID = 'YOUR_SHEET_ID';
const RANGE = 'A:G'; // Columns A to G
const API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
```

## 🎯 Quick Fix for Your Current Issue

I'll implement Solution 1 (CSV export) which is the most reliable and doesn't require API keys or complex setup.

### What you need to do:
1. **Make your sheet public** (Anyone with link can view)
2. **Get your sheet ID** from the URL
3. **Update the code** with your sheet ID

This will work immediately without any CORS issues!
