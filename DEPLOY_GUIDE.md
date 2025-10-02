# Google Apps Script Deployment Guide

## 🚨 Current Issue
Your Apps Script URL is redirecting to login, which means it's not deployed as a public web app yet.

## ✅ Step-by-Step Deployment

### Step 1: Open Apps Script
1. **Go to your Google Sheet**
2. **Click Extensions > Apps Script**
3. **Replace all code** with the content from `google-apps-script.js`

### Step 2: Deploy as Web App
1. **Click "Deploy" button** (top right)
2. **Choose "New deployment"**
3. **Click gear icon** next to "Type"
4. **Select "Web app"**

### Step 3: Configure Deployment
1. **Description**: "KMS AI Tips Leaderboard API"
2. **Execute as**: Me (your email)
3. **Who has access**: **Anyone** (This is crucial!)
4. **Click "Deploy"**

### Step 4: Copy the Web App URL
1. **Copy the Web App URL** (not the script URL)
2. **It should look like**: `https://script.google.com/macros/s/SCRIPT_ID/exec`
3. **Update the HTML file** with this URL

### Step 5: Test
1. **Open the web app URL** in browser
2. **Should show**: `{"message": "KMS AI Tips API is running!"}`
3. **Test leaderboard**: Add `?action=getLeaderboard` to URL

## 🔧 Alternative: Manual Data Update

If the Apps Script deployment is complex, I can create a simple manual update system where you copy-paste data from your sheet into the code.

## 📞 Need Help?
Let me know if you encounter any issues with the deployment process!
