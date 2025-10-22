# CORS Error Fix Guide for Google Apps Script

## Problem
You're experiencing CORS errors when fetching leaderboard data from Google Sheets via Apps Script. The error shows:
```
Access to fetch at 'https://accounts.google.com/ServiceLogin?service=wise&passi...' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

This happens when the Google Apps Script redirects to a login page instead of returning data, typically due to incorrect deployment settings.

## Root Causes

1. **Incorrect Deployment Permissions**: Script is deployed with "Only myself" access
2. **Outdated Deployment**: Using an old deployment URL that requires authentication
3. **Domain-Restricted URL**: Using `/a/macros/kms-technology.com/` URL which has stricter access controls

## Complete Solution

### Step 1: Redeploy Google Apps Script with Public Access

1. **Open your Google Apps Script project**
   - Go to your Google Sheet with the data
   - Click `Extensions` → `Apps Script`

2. **Verify your doGet function is correct**
   - Your current implementation is already JSONP-compatible ✅
   - It should look like this:
   ```javascript
   function doGet(e) {
     if (e.parameter && e.parameter.action === 'getLeaderboard') {
       const leaderboardData = getLeaderboardData();
       
       if (e.parameter.callback) {
         const jsonpResponse = e.parameter.callback + '(' + JSON.stringify(leaderboardData) + ');';
         return ContentService
           .createTextOutput(jsonpResponse)
           .setMimeType(ContentService.MimeType.JAVASCRIPT);
       }
     }
     // ... rest of the code
   }
   ```

3. **Deploy as Web App**
   - Click the **"Deploy"** button (top right) → **"New deployment"**
   - Click the gear icon ⚙️ next to "Select type"
   - Choose **"Web app"**

4. **Configure Deployment Settings** ⚠️ **CRITICAL STEP**
   - **Description**: "KMS AI Leaderboard API - Public Access"
   - **Execute as**: `Me (your.email@kms-technology.com)`
   - **Who has access**: **"Anyone"** ⬅️ **MUST BE "Anyone", NOT "Anyone within KMS"**

5. **Authorize the Application**
   - Click **"Deploy"**
   - A popup will appear asking for authorization
   - Click **"Authorize access"**
   - Select your Google account
   - Click **"Advanced"** if you see a warning
   - Click **"Go to [Your Project Name] (unsafe)"**
   - Click **"Allow"**

6. **Copy the New Web App URL**
   - After deployment, you'll see a URL like:
   ```
   https://script.google.com/macros/s/AKfycbxXXXXXXXXXXXXXXXXXXXXXXX/exec
   ```
   - **Important**: Use the `/macros/s/` URL, NOT the `/a/macros/` URL
   - Copy this URL

### Step 2: Update Your HTML File

Replace the old Google Apps Script URL with the new one:

```javascript
// OLD (Domain-scoped URL - may require authentication)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/a/macros/kms-technology.com/s/AKfycbyaefNITlvUqSZ4nX5Sc-CyqbTX5_xJ85GTtJEl_YXlGUIbsq9HAiK6gt1YMe5PXjE/exec';

// NEW (Public URL - no authentication required)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_NEW_DEPLOYMENT_ID/exec';
```

### Step 3: Test the Deployment

1. **Test directly in browser**
   - Open the deployment URL in a new tab:
   ```
   https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=getLeaderboard
   ```
   - You should see JSON data, NOT a login page

2. **Test JSONP callback**
   - Open this URL:
   ```
   https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=getLeaderboard&callback=testCallback
   ```
   - You should see: `testCallback({...data...});`

### Step 4: Alternative Solution - Add Retry Logic with Better Error Handling

If you still experience intermittent CORS issues, update your JavaScript with enhanced retry logic:

```javascript
function loadLeaderboardData(retryCount = 0) {
    const MAX_RETRIES = 3;
    
    try {
        // Show loading state
        const individualBoard = document.getElementById('individualLeaderboard');
        renderPodium({ first: null, second: null, third: null });

        const loadingHtml = `
            <!-- Loading state HTML -->
            <div class="text-center py-16 bg-gray-50/30">
                <i class="fas fa-spinner fa-spin text-4xl mb-4 text-[#27aae1]"></i>
                <div class="font-semibold text-gray-600">Loading leaderboard data...</div>
                ${retryCount > 0 ? `<div class="text-sm text-gray-500 mt-2">Retry attempt ${retryCount}/${MAX_RETRIES}</div>` : ''}
            </div>
        `;
        individualBoard.innerHTML = loadingHtml;

        const callbackName = 'leaderboardCallback_' + Date.now();
        const script = document.createElement('script');
        let callbackExecuted = false;

        // Create global callback function
        window[callbackName] = function (result) {
            if (callbackExecuted) return;
            callbackExecuted = true;

            if (result.success) {
                // Cache both individual and team data
                cachedLeaderboardData.individual = result.individual || [];
                cachedLeaderboardData.team = result.team || [];

                // Display appropriate data
                const teamBoard = document.getElementById('teamLeaderboard');
                if (teamBoard.classList.contains('hidden')) {
                    displayLeaderboardData(cachedLeaderboardData.individual, false);
                } else {
                    displayLeaderboardData(cachedLeaderboardData.team, true);
                }
                
                // Show success notification on retry
                if (retryCount > 0) {
                    showNotification('success', 'Leaderboard loaded successfully!');
                }
            } else {
                tryCSVFallback();
            }

            // Cleanup
            if (script.parentNode) {
                document.body.removeChild(script);
            }
            delete window[callbackName];
        };

        script.onerror = function () {
            if (callbackExecuted) return;
            callbackExecuted = true;

            console.error('Script load error, retry count:', retryCount);
            
            // Retry logic
            if (retryCount < MAX_RETRIES) {
                console.log(`Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
                setTimeout(() => {
                    loadLeaderboardData(retryCount + 1);
                }, 2000 * (retryCount + 1)); // Exponential backoff
            } else {
                console.error('Max retries reached, falling back to CSV');
                tryCSVFallback();
            }

            // Cleanup
            if (script.parentNode) {
                document.body.removeChild(script);
            }
            delete window[callbackName];
        };

        // Add cache-busting parameter to prevent caching issues
        const cacheBuster = '&t=' + Date.now();
        script.src = LEADERBOARD_API_URL + '&callback=' + callbackName + cacheBuster;
        document.body.appendChild(script);

        // Timeout fallback with retry
        setTimeout(() => {
            if (!callbackExecuted) {
                callbackExecuted = true;
                console.error('Request timeout, retry count:', retryCount);
                
                if (retryCount < MAX_RETRIES) {
                    console.log(`Retrying after timeout... (${retryCount + 1}/${MAX_RETRIES})`);
                    setTimeout(() => {
                        loadLeaderboardData(retryCount + 1);
                    }, 2000 * (retryCount + 1));
                } else {
                    tryCSVFallback();
                }

                if (script.parentNode) {
                    document.body.removeChild(script);
                }
                delete window[callbackName];
            }
        }, 10000); // 10 second timeout

    } catch (error) {
        console.error('Error loading leaderboard data:', error);
        if (retryCount < MAX_RETRIES) {
            setTimeout(() => {
                loadLeaderboardData(retryCount + 1);
            }, 2000 * (retryCount + 1));
        } else {
            displayEmptyLeaderboard();
        }
    }
}
```

## Why This Happens

### URL Type Differences

1. **Domain-scoped URL** (your current URL):
   ```
   https://script.google.com/a/macros/kms-technology.com/s/.../exec
   ```
   - Requires users to be in the KMS Technology domain
   - May enforce additional authentication
   - Can cause CORS issues for public access

2. **Public URL** (recommended):
   ```
   https://script.google.com/macros/s/.../exec
   ```
   - Fully public access when deployed as "Anyone"
   - No domain restrictions
   - No CORS issues with JSONP

## Verification Checklist

- [ ] Redeployed Apps Script with "Anyone" access (not "Anyone within KMS")
- [ ] Using `/macros/s/` URL (not `/a/macros/`)
- [ ] Tested URL directly in browser - shows data, not login page
- [ ] Tested JSONP callback - returns `callback({...})`
- [ ] Updated `GOOGLE_SCRIPT_URL` in index.html
- [ ] Cleared browser cache and tested
- [ ] Tested in incognito/private browsing mode

## Troubleshooting

### Still seeing login page?
1. Make sure you deployed with **"Anyone"** access, not "Anyone within KMS Technology"
2. Try creating a completely new deployment (not updating existing)
3. Use the `/macros/s/` URL format

### JSONP not working?
1. Verify `doGet` function returns JSONP when callback parameter is present
2. Check Apps Script logs for errors: View → Execution log
3. Make sure `ContentService.MimeType.JAVASCRIPT` is used for JSONP responses

### Intermittent failures?
1. Add retry logic (see Step 4 above)
2. Check if Google Sheets API quotas are being hit
3. Add caching to reduce API calls

## Best Practices

1. **Cache responses**: Store successful responses in `localStorage`
2. **Add fallback**: Your CSV fallback is already implemented ✅
3. **Monitor errors**: Log all failures to help diagnose issues
4. **Rate limiting**: Don't call the API too frequently
5. **User feedback**: Show clear error messages and retry options

## Security Note

Deploying with "Anyone" access is safe because:
- Your script only returns read-only data (leaderboard)
- No sensitive information is exposed
- Users cannot modify your Google Sheet through this endpoint
- The script controls what data is returned

## Need Help?

If issues persist after following this guide:
1. Check Apps Script execution logs for errors
2. Verify your Google Sheet permissions
3. Test with a simple "Hello World" Apps Script first
4. Contact your Google Workspace admin if domain policies are blocking

---

## Quick Fix Summary

**Immediate action:**
1. Redeploy script with "Anyone" access
2. Use `/macros/s/` URL (not `/a/macros/`)
3. Update `GOOGLE_SCRIPT_URL` in your code
4. Test in browser before deploying

This should completely eliminate CORS errors! 🎉

