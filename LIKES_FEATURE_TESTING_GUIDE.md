# Likes Modal Feature - Testing Guide

## Quick Test Steps

### Prerequisites
1. Open the website in a browser
2. Make sure you're logged in with Google account
3. Navigate to the AI Playbooks section

### Test 1: Like a Playbook
1. Find any playbook post
2. Click the **heart icon** (❤️) to like it
3. ✅ **Expected**: 
   - Heart turns red and fills
   - Like count increases by 1
   - Success notification appears

### Test 2: View Likes Modal (Single User)
1. Click on the **likes count text** (e.g., "1 Like")
2. ✅ **Expected**:
   - Modal opens with smooth animation
   - Shows your profile with:
     - Your Google profile photo (or initial circle)
     - Your display name
     - Your email address
     - A red heart icon on the right

### Test 3: Unlike a Playbook
1. Click the **heart icon** again (should be red/filled)
2. ✅ **Expected**:
   - Heart becomes outline/empty
   - Like count decreases by 1
   - "Reaction removed" notification appears

### Test 4: View Empty Likes Modal
1. Make sure a playbook has 0 likes
2. Click on "0 Likes"
3. ✅ **Expected**:logout
   - Modal opens
   - Shows empty state with heart icon
   - Message: "No likes yet"
   - Subtext: "Be the first to like this playbook!"

### Test 5: Multiple Users (Requires 2+ Accounts)
1. Like a playbook with Account 1
2. Switch to Account 2 (different browser/incognito)
3. Like the same playbook
4. Switch back to Account 1
5. Click the likes count (should show "2 Likes")
6. ✅ **Expected**:
   - Modal shows both users
   - Users are sorted by most recent first
   - Each user shows:
     - Avatar or initial circle
     - Display name
     - Email
     - Heart icon

### Test 6: Modal Close Actions
Test each closing method:

**A. Close Button**
1. Open likes modal
2. Click the X button in top-right
3. ✅ **Expected**: Modal closes smoothly

**B. Outside Click**
1. Open likes modal
2. Click anywhere on the dark backdrop (outside modal)
3. ✅ **Expected**: Modal closes smoothly

**C. ESC Key**
1. Open likes modal
2. Press ESC key on keyboard
3. ✅ **Expected**: Modal closes smoothly

### Test 7: Hover Effects
1. Hover over likes count
2. ✅ **Expected**:
   - Text underlines
   - Color changes to red
   - Cursor becomes pointer

### Test 8: Avatar Fallback
1. Find a user whose Google avatar fails to load
2. Open likes modal
3. ✅ **Expected**:
   - Shows colored circle with user's first initial
   - Gradient background (red to pink)
   - Initial is white and centered

### Test 9: Mobile Responsive
1. Open website on mobile device (or resize browser to mobile width)
2. Like a playbook
3. Click on likes count
4. ✅ **Expected**:
   - Modal fits screen properly
   - All elements are readable
   - Touch targets are large enough
   - Scrolling works if many likes
   - Close button is accessible

### Test 10: Many Likes (Stress Test)
1. Get 10+ likes on a playbook (if possible)
2. Click likes count
3. ✅ **Expected**:
   - Modal scrolls properly
   - All users load correctly
   - No performance issues
   - Scroll is smooth

## Edge Cases to Test

### Edge Case 1: Network Error
1. Turn off internet/Wi-Fi
2. Click likes count
3. ✅ **Expected**:
   - Loading spinner shows
   - After timeout, error message displays
   - Message: "Error loading likes"
   - Subtext: "Please try again later"

### Edge Case 2: Not Logged In
1. Log out of Google account
2. Try to click likes count
3. ✅ **Expected**:
   - Should still show modal with likes
   - If trying to like: Login prompt appears

### Edge Case 3: Long Email/Name
1. Find user with very long email address
2. View in likes modal
3. ✅ **Expected**:
   - Text truncates with "..."
   - Doesn't break layout
   - Tooltip shows full text on hover (optional)

### Edge Case 4: No Avatar URL
1. Find user without Google profile photo
2. View in likes modal
3. ✅ **Expected**:
   - Shows initial circle fallback
   - Initial is first letter of name/email
   - No broken image icon

## Visual Checks

### Modal Appearance Checklist
- [ ] Modal is centered on screen
- [ ] Background is semi-transparent dark overlay
- [ ] Modal has rounded corners
- [ ] Modal has shadow/elevation
- [ ] Header has border at bottom
- [ ] Title has heart icon
- [ ] Close button is visible and styled
- [ ] Content area is scrollable
- [ ] User cards have proper spacing
- [ ] Avatars are circular
- [ ] Text is readable and properly aligned
- [ ] Heart icons on right are consistent

### Animation Checklist
- [ ] Modal fades in smoothly
- [ ] Modal fades out smoothly
- [ ] Hover effects are smooth
- [ ] Loading spinner rotates
- [ ] No jarring transitions

## Browser Testing Matrix

| Browser | Version | Desktop | Mobile | Status |
|---------|---------|---------|--------|--------|
| Chrome | Latest | ✅ | ✅ | |
| Firefox | Latest | ✅ | ✅ | |
| Safari | Latest | ✅ | ✅ | |
| Edge | Latest | ✅ | N/A | |

## Performance Checks

1. **Load Time**: Modal should open within 1-2 seconds
2. **Smooth Scrolling**: No lag when scrolling user list
3. **Memory**: No memory leaks after multiple opens/closes
4. **Network**: Efficient Firebase queries (single query per open)

## Common Issues & Solutions

### Issue: Modal doesn't open
- **Check**: Console for JavaScript errors
- **Check**: User is logged in
- **Check**: Firebase connection is working

### Issue: Avatars don't show
- **Check**: User has Google profile photo
- **Check**: Fallback initials are working
- **Check**: Avatar URLs are valid

### Issue: Wrong user count
- **Check**: Firebase sync is complete
- **Check**: Refresh the page
- **Check**: Check Firebase console for data

### Issue: Modal won't close
- **Check**: Close button has onclick handler
- **Check**: ESC key listener is active
- **Check**: Outside click is properly detected

## Success Criteria

All tests pass when:
- ✅ Like count is clickable and opens modal
- ✅ Modal displays all users with correct data
- ✅ Avatars display or fallback properly
- ✅ Modal can be closed via all methods
- ✅ Responsive on all screen sizes
- ✅ No console errors
- ✅ Smooth animations and transitions
- ✅ Proper error handling for edge cases

---

**Last Updated**: October 21, 2025  
**Feature Status**: Ready for Testing  
**Test Duration**: ~15-20 minutes for full suite

