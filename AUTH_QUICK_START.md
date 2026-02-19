# Quick Start Guide - CarbonPals Authentication

## Prerequisites
- Supabase project created at https://supabase.com
- Node.js and npm installed
- Backend server running on `http://localhost:3001`

## Setup Instructions

### 1. Configure Environment Variables

Create `frontend/.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Get these values from your Supabase project:
- Go to Settings → API
- Copy "Project URL" → `NEXT_PUBLIC_SUPABASE_URL`
- Copy "anon public" key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Enable Supabase Auth

In your Supabase project:
1. Go to Authentication → Providers
2. Enable "Email" provider
3. (Optional) Disable email confirmation for testing:
   - Go to Authentication → Settings
   - Uncheck "Enable email confirmations"

### 3. Install Dependencies

```bash
cd frontend
npm install
```

This installs `@supabase/supabase-js` which was added to package.json.

### 4. Start Frontend

```bash
npm run dev
```

Frontend will run on http://localhost:3000

### 5. Start Backend

In a separate terminal:
```bash
cd backend
npm run start:dev
```

Backend will run on http://localhost:3001

## First Time User Flow

1. **Visit the App**: Navigate to http://localhost:3000
   - You'll be automatically redirected to `/login`

2. **Create Account**: Click "Sign up" link
   - Enter username (e.g., "john_eco")
   - Enter email (e.g., "john@example.com")
   - Enter password (min 6 characters)
   - Click "Create Account"
   - You'll be automatically logged in and redirected to dashboard

3. **Explore the App**:
   - Dashboard: Log expenditures, track emissions, manage eco-swaps
   - Community: Share posts, comment, like
   - Rankings: View leaderboard and your rank

4. **Logout/Login**:
   - Click "Logout" in nav bar to sign out
   - Return to `/login` to sign in again with same credentials

## Testing Multiple Users

To test social features (feed, leaderboard), create multiple accounts:

1. Open incognito window → Create User 1
2. Regular window → Create User 2
3. Both users can:
   - Share posts (visible in each other's feed)
   - Compete on leaderboard
   - Comment on each other's posts

## Troubleshooting

### "Failed to load data" error
- ✓ Check backend is running on port 3001
- ✓ Check browser console for network errors
- ✓ Verify Supabase credentials in .env.local

### "Login failed" error
- ✓ Check Supabase Auth is enabled
- ✓ Verify credentials are correct
- ✓ Check Supabase dashboard → Authentication → Users

### Redirects to login immediately after signup
- ✓ Check browser console for errors
- ✓ Verify backend `users` table exists
- ✓ Check that user was created in Supabase Auth dashboard

### Session doesn't persist
- ✓ Check browser localStorage has supabase auth token
- ✓ Verify .env.local has correct Supabase URL

## Backend Integration Notes

The backend must:
1. Accept `Authorization: Bearer <jwt-token>` header
2. Validate JWT using Supabase public key
3. Extract `userId` from token payload (sub claim)
4. Use userId for RLS policies

Current implementation uses `JwtAuthGuard` which handles this automatically.

## What Changed from Mock Auth

**Before:**
```typescript
const MOCK_TOKEN = 'mock-jwt-token-for-testing';
const MOCK_USER_ID = 'test-user-001';
```

**After:**
```typescript
const { user, token } = useAuth(); // Real Supabase auth
```

All API calls now use real JWT tokens that expire and require login.
