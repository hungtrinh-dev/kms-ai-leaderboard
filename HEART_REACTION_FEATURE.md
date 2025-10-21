# Heart Reaction Feature Documentation

## Overview
The heart reaction feature allows authenticated users to like/unlike playbooks in the AI Playbooks section. The feature includes real-time updates, user authentication checks, and persistent storage in Firebase Firestore.

## Firebase Collection Design

### Collection: `reactions`
Each document in the `reactions` collection represents a single user reaction to a playbook.

**Document Structure:**
```javascript
{
  playbook_id: string,      // ID of the playbook being reacted to
  user_email: string,       // Email of the user who reacted
  reaction_type: string,    // Type of reaction (currently 'heart', expandable for future types)
  created_at: timestamp     // Server timestamp when the reaction was created
}
```

**Example Document:**
```javascript
{
  playbook_id: "RTs02XMENH6g4SqpIZQz",
  user_email: "user@kms-technology.com",
  reaction_type: "heart",
  created_at: Timestamp(seconds=1234567890, nanoseconds=0)
}
```

## Firebase Setup

### 1. Create the Firestore Collection

The `reactions` collection will be automatically created when the first reaction is added. However, you should set up the proper security rules.

### 2. Firestore Security Rules

Add the following rules to your `firestore.rules` file:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Reactions collection rules
    match /reactions/{reactionId} {
      // Allow read access to all authenticated users
      allow read: if request.auth != null;
      
      // Allow users to create reactions only for themselves
      allow create: if request.auth != null 
                    && request.auth.token.email == request.resource.data.user_email
                    && request.resource.data.reaction_type == 'heart'
                    && request.resource.data.playbook_id is string;
      
      // Allow users to delete only their own reactions
      allow delete: if request.auth != null 
                    && request.auth.token.email == resource.data.user_email;
      
      // Disallow updates (reactions are immutable - only create/delete)
      allow update: if false;
    }
  }
}
```

### 3. Create Firestore Indexes (Optional but Recommended)

For better query performance, create composite indexes in Firebase Console:

**Index 1: Query reactions by playbook**
- Collection: `reactions`
- Fields:
  - `playbook_id` (Ascending)
  - `reaction_type` (Ascending)
  - `created_at` (Descending)

**Index 2: Query user's reactions**
- Collection: `reactions`
- Fields:
  - `user_email` (Ascending)
  - `playbook_id` (Ascending)
  - `reaction_type` (Ascending)

**To create these indexes:**
1. Go to Firebase Console → Firestore Database
2. Click on "Indexes" tab
3. Click "Create Index"
4. Add the fields as specified above
5. Select "Ascending" or "Descending" as noted
6. Click "Create"

Alternatively, Firebase will automatically prompt you to create the necessary indexes when you first run queries that need them.

## Feature Implementation

### Key Functions

#### 1. `toggleHeartReaction(playbookId)`
Main function that handles the like/unlike action.
- Checks if user is authenticated
- Determines current reaction state
- Adds or removes reaction accordingly
- Updates UI in real-time

#### 2. `checkUserReaction(playbookId, userEmail)`
Checks if the current user has already reacted to a specific playbook.
- Returns: `Promise<boolean>`
- Used to determine whether to add or remove a reaction

#### 3. `addHeartReaction(playbookId, userEmail)`
Adds a new heart reaction to the database.
- Creates a new document in the `reactions` collection
- Tracks analytics event `playbook_liked`

#### 4. `removeHeartReaction(playbookId, userEmail)`
Removes an existing heart reaction from the database.
- Queries and deletes matching reaction documents
- Tracks analytics event `playbook_unliked`

#### 5. `loadHeartReaction(playbookId)`
Loads and displays the reaction state for a playbook.
- Counts total likes for the playbook
- Determines if current user has reacted
- Updates heart icon (filled/unfilled)
- Updates like count display

### UI States

#### Unreacted State (Default)
- Icon: `<i class="far fa-heart"></i>` (outline heart)
- Color: Default text color
- Like count: Shows total number of likes

#### Reacted State (User has liked)
- Icon: `<i class="fas fa-heart"></i>` (filled heart)
- Color: Red (`text-red-500`)
- Like count: Shows total number of likes (including current user)

### User Flows

#### Flow 1: User Likes a Playbook (Not Previously Liked)
1. User clicks heart icon
2. System checks if user is authenticated
   - If not: Show login modal
   - If yes: Continue
3. System checks if user has already reacted
   - Result: No reaction found
4. System adds new reaction to Firebase
5. System reloads reaction state
6. UI updates:
   - Heart icon becomes filled and red
   - Like count increases by 1
7. Success notification shown

#### Flow 2: User Unlikes a Playbook (Previously Liked)
1. User clicks filled heart icon
2. System checks if user is authenticated (already passed)
3. System checks if user has already reacted
   - Result: Reaction found
4. System removes reaction from Firebase
5. System reloads reaction state
6. UI updates:
   - Heart icon becomes outline
   - Like count decreases by 1
7. Success notification shown

#### Flow 3: Unauthenticated User Attempts to Like
1. User clicks heart icon
2. System detects user is not authenticated
3. Error notification shown: "Please log in to like playbooks"
4. Login modal opens automatically
5. No changes to database or UI state

## Testing the Feature

### Test Case 1: Add Reaction
1. **Setup**: User is logged in, playbook has 0 likes
2. **Action**: Click heart icon
3. **Expected Result**:
   - Heart becomes filled and red
   - Like count shows "1 Like"
   - Notification: "Reaction added!"
   - Firebase collection has new document

### Test Case 2: Remove Reaction
1. **Setup**: User is logged in, user has already liked the playbook
2. **Action**: Click filled heart icon
3. **Expected Result**:
   - Heart becomes outline
   - Like count decreases by 1
   - Notification: "Reaction removed"
   - Firebase document is deleted

### Test Case 3: Multiple Users
1. **Setup**: Multiple users logged in
2. **Action**: Different users like the same playbook
3. **Expected Result**:
   - Each user sees filled heart for playbooks they liked
   - Like count reflects total unique users who liked
   - Each user can only unlike their own reaction

### Test Case 4: Unauthenticated User
1. **Setup**: User is not logged in
2. **Action**: Click heart icon
3. **Expected Result**:
   - Error notification: "Please log in to like playbooks"
   - Login modal opens
   - No database changes
   - UI state remains unchanged

### Test Case 5: Persistence
1. **Setup**: User likes a playbook
2. **Action**: Refresh the page
3. **Expected Result**:
   - Heart remains filled and red
   - Like count persists
   - User's reaction state is maintained

## Performance Considerations

### Query Optimization
- Reactions are loaded individually per playbook (not all at once)
- Queries use indexed fields for fast retrieval
- Like counts are calculated in real-time (not cached in playbook documents)

### Rate Limiting
The current implementation includes a simple rate limit mechanism:
- Heart icon is disabled during API calls
- Prevents double-clicks and rapid toggling
- Re-enabled after operation completes

### Error Handling
All Firebase operations include try-catch blocks:
- Network errors are caught and displayed to user
- Failed operations don't break the UI
- Users can retry actions after errors

## Analytics Tracking

The feature tracks the following events:

1. **playbook_liked**
   - Triggered when: User adds a heart reaction
   - Properties: `playbook_id`

2. **playbook_unliked**
   - Triggered when: User removes a heart reaction
   - Properties: `playbook_id`

These events can be viewed in Firebase Analytics and used for:
- Understanding playbook engagement
- Identifying popular content
- User behavior analysis

## Future Enhancements

### Possible Extensions:
1. **Multiple Reaction Types**
   - Add support for different reactions (love, laugh, celebrate, etc.)
   - Current structure already supports this via `reaction_type` field

2. **Reaction History**
   - Show who liked a playbook
   - Display recent reactions

3. **Reaction Notifications**
   - Notify playbook authors when their content is liked
   - Daily/weekly digest of reactions

4. **Reaction-Based Sorting**
   - Sort playbooks by popularity (most liked)
   - Filter playbooks by user's liked content

5. **Batch Operations**
   - Load reactions for all visible playbooks at once
   - Optimize for better performance

6. **Reaction Aggregation**
   - Store like count in playbook document for faster loading
   - Use Cloud Functions to maintain count accuracy

## Troubleshooting

### Issue: Reactions not saving
**Solution**: Check Firestore security rules and ensure user is authenticated

### Issue: Like count not updating
**Solution**: Verify the `loadHeartReaction()` function is called after add/remove operations

### Issue: Heart icon not changing color
**Solution**: Check that Tailwind CSS classes are properly applied and Font Awesome is loaded

### Issue: "Permission denied" error
**Solution**: Update Firestore security rules to allow authenticated users to read/write reactions

### Issue: Duplicate reactions
**Solution**: Ensure `checkUserReaction()` is called before adding new reactions

## Security Best Practices

1. **Always verify user authentication** before allowing reactions
2. **Validate user email** matches the authenticated user's email
3. **Use security rules** to prevent unauthorized access
4. **Implement rate limiting** on the backend (Cloud Functions) for production
5. **Sanitize user data** before storing in database
6. **Monitor for abuse** patterns in analytics

## Code Maintenance

### Files Modified:
- `index.html` - Added heart reaction HTML, CSS, and JavaScript

### Dependencies:
- Firebase Firestore SDK (v12.4.0)
- Font Awesome (v6.0.0)
- Tailwind CSS

### Key Variables:
- `window.db` - Firestore database instance
- `window.currentUser` - Currently authenticated user
- `reactions` - Firestore collection name

## Support

For issues or questions about the heart reaction feature:
1. Check Firebase Console for error logs
2. Review browser console for JavaScript errors
3. Verify Firestore rules are correctly configured
4. Test with different user accounts
5. Check network tab for failed requests

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Maintained By**: KMS AI Taskforce

