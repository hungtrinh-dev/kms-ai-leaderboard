# KMS AI Tips - Google Sheets Integration Setup

## 🚀 Quick Setup Guide

### Step 1: Prepare Your Google Sheet

Your Google Sheet should have these columns (as shown in your screenshot):
- **A**: NO (Auto-increment number)
- **B**: Fullname
- **C**: Email  
- **D**: Department
- **E**: Submission Types
- **F**: Title
- **G**: Description
- **H**: Tags
- **I**: Attachments

You can add additional columns for:
- **J**: Timestamp
- **K**: Status (Pending/Approved/Rejected)
- **L**: Points
- **M**: Reviewer
- **N**: Review Date
- **O**: Notes

### Step 2: Set Up Google Apps Script

1. **Open your Google Sheet**
2. **Go to Extensions > Apps Script**
3. **Delete the default code** in Code.gs
4. **Copy and paste** the entire content from `google-apps-script.js` file
5. **Save the project** (Ctrl/Cmd + S)
6. **Name your project** (e.g., "KMS AI Tips API")

### Step 3: Deploy as Web App

1. **Click "Deploy" > "New deployment"**
2. **Choose type**: Web app
3. **Execute as**: Me (your email)
4. **Who has access**: Anyone (or Anyone with Google account for more security)
5. **Click "Deploy"**
6. **Copy the Web App URL** (it will look like: `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec`)

### Step 4: Update the HTML File

1. **Open index.html**
2. **Find this line** (around line 1250):
   ```javascript
   const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';
   ```
3. **Replace** `YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE` with your actual Web App URL

### Step 5: Test the Integration

1. **Open your website** (index.html)
2. **Fill out the form** with test data
3. **Submit the form**
4. **Check your Google Sheet** - you should see the new row added!

## 🔧 Features Implemented

### ✅ Form Submission
- **Real-time submission** to Google Sheets
- **Client-side validation** (required fields, email format)
- **Server-side validation** in Google Apps Script
- **Loading states** with spinner animation
- **Error handling** with user-friendly messages

### ✅ User Experience
- **Success notifications** with slide-in animation
- **Error notifications** for failed submissions
- **Form reset** after successful submission
- **Auto-scroll** to form top after submission
- **Professional loading states**

### ✅ Data Management
- **Auto-increment** submission numbers
- **Timestamp** tracking
- **Status tracking** (Pending by default)
- **Data sanitization** and validation
- **Proper error logging**

## 🛠️ Customization Options

### Modify Departments
Update the department options in the HTML form:
```html
<option value="your-department">Your Department</option>
```

### Modify Submission Types
Update the submission type options:
```html
<option value="your-type">Your Type</option>
```

### Change Validation Rules
Edit the Google Apps Script to add custom validation rules.

## 🔒 Security Features

- **Input sanitization** prevents malicious data
- **Email validation** ensures proper format
- **Required field validation** prevents incomplete submissions
- **Error handling** doesn't expose sensitive information
- **Rate limiting** can be added if needed

## 📊 Future Enhancements

1. **File Upload Support**: Add Google Drive integration for attachments
2. **Email Notifications**: Send emails when submissions are received
3. **Admin Dashboard**: Create an admin interface for reviewing submissions
4. **Points Calculation**: Automatic point assignment based on submission type
5. **Leaderboard Updates**: Real-time leaderboard data from Google Sheets

## 🆘 Troubleshooting

### Common Issues:

1. **"Script not found" error**
   - Make sure the Web App URL is correct
   - Check that the script is deployed as a web app

2. **CORS errors**
   - Ensure the script is deployed with "Anyone" access
   - Check browser console for detailed error messages

3. **Form not submitting**
   - Check browser console for JavaScript errors
   - Verify all required fields have `name` attributes

4. **Data not appearing in sheet**
   - Check the Apps Script execution log
   - Verify sheet permissions
   - Make sure the script has access to the spreadsheet

## 📞 Support

If you encounter any issues, check:
1. Browser console for JavaScript errors
2. Apps Script execution log for server errors
3. Google Sheets permissions
4. Network connectivity

---

**Ready to go live!** 🎉 Once you complete these steps, your AI Tips submission form will be fully functional and connected to Google Sheets!
