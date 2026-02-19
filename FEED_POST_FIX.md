# Community Feed Post Content Fix

## Issue
When creating a post on the community/feed page, only the bold text (title) was showing, but the content below it wasn't being displayed for new posts.

## Root Cause
The create post form only had one textarea field that was being used to set the `title` field. The `content` field was never being populated, so new posts only had titles with no content.

The mock/example posts in the code had both title and content:
```typescript
{
  title: '🌱 Just logged my first expenditure!',
  content: 'Started tracking my carbon footprint today. Excited to see where I stand!',
  ...
}
```

But the form handler (`handleCreatePost`) only set:
```typescript
{
  title: newPost,  // Single textarea value
  // content was never set!
}
```

## Solution

### Updated Form (frontend/app/feed/page.tsx)

Changed from a single textarea to two separate fields:

1. **Title field** (required) - Text input for the post headline
2. **Content field** (optional) - Textarea for additional details

### Changes Made

1. **State structure**:
   - Before: `const [newPost, setNewPost] = useState('');`
   - After: `const [newPost, setNewPost] = useState({ title: '', content: '' });`

2. **Form UI**:
   - Added labeled title input field
   - Added labeled content textarea (marked as optional)
   - Better placeholders with examples

3. **Post creation**:
   - Now sets both `title` and `content` fields
   - Content is optional (can be empty)

## Testing

To test the fix:

1. Navigate to `/feed` page
2. Enter a title like "🎉 Achieved my first milestone!"
3. Enter content like "I reduced my carbon footprint by 20% this month!"
4. Click "Post"
5. Verify both the bold title and content text appear below it

## Example Post Structure

```typescript
{
  title: '🌱 Just logged my first expenditure!',           // Bold text
  content: 'Started tracking my carbon footprint today...',  // Text below
  user: { username: 'You', avatar_url: '👤' },
  likes_count: 0,
  created_at: '2026-02-19T...'
}
```

## Files Changed

- `frontend/app/feed/page.tsx` - Updated form to have title and content fields
