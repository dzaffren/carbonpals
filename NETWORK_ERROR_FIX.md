# Troubleshooting "NetworkError when attempting to fetch resource"

## Common Cause: Backend Not Running

This error appears when the frontend tries to connect to the backend but it's not responding.

---

## ✅ Quick Fix

### 1. Check if Backend is Running
```bash
curl http://localhost:3001/auth/me
```

**Expected**: `{"message":"Missing authorization header","error":"Unauthorized","statusCode":401}`  
**If you get**: `Connection refused` or `Network error` → Backend is not running!

### 2. Start the Backend

**Option A: Dev Mode (recommended for development)**
```bash
cd backend
npm run start:dev
```
Wait for: `CarbonPals API running on http://localhost:3001`

**Option B: Production Mode**
```bash
cd backend
npm run build
npm run start
```

---

## 🔍 Checking Backend Status

### Method 1: Test endpoint
```bash
curl http://localhost:3001/auth/signup \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass","username":"test"}'
```

### Method 2: Check if port 3001 is in use
```bash
lsof -ti:3001
```
- If it returns a number: Backend is running
- If it returns nothing: Backend is NOT running

### Method 3: Browser
Visit: http://localhost:3001/api/docs
- Should see Swagger API documentation
- If "connection refused": Backend not running

---

## 🐛 Common Issues

### Issue 1: "npm run start:dev" Gets Stuck

**Symptoms**: Command runs but never shows "CarbonPals API running"

**Solution**: Use production mode instead
```bash
npm run build
npm run start
```

### Issue 2: Backend Starts Then Crashes

**Check logs**:
```bash
# If you used npm run start:dev
cat nohup.out

# Or check recent terminal output
```

**Common causes**:
- Port 3001 already in use
- Missing dependencies
- TypeScript compilation errors

**Solution**:
```bash
# Kill any existing backend process
lsof -ti:3001 | xargs kill

# Reinstall dependencies
npm install

# Try again
npm run start
```

### Issue 3: CORS Error (Different from Network Error)

**Symptoms**: Error mentions "CORS" or "Access-Control-Allow-Origin"

**Solution**: Backend's CORS is configured for `http://localhost:3000`  
Make sure frontend is running on that port.

---

## ✨ Current Fix Applied

The backend is now running as a detached background process at:
- **URL**: http://localhost:3001
- **Status**: ✅ Running
- **Endpoints**:
  - POST /auth/signup
  - POST /auth/login
  - GET /auth/me
  - (and all other API endpoints)

---

## 📋 Startup Checklist

Before using the app:

1. **Start Backend**:
   ```bash
   cd backend
   npm run start
   ```
   ✅ Wait for: "CarbonPals API running on http://localhost:3001"

2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
   ✅ Wait for: "ready - started server on 0.0.0.0:3000"

3. **Test Connection**:
   - Visit http://localhost:3000
   - Should redirect to /login (not network error!)

---

## 🔧 If Problem Persists

1. **Clear browser cache**: Hard refresh (Ctrl+Shift+R)
2. **Check browser console**: Press F12, look for actual error message
3. **Verify API base**: Frontend should call `http://localhost:3001/auth/*`
4. **Test with curl**: Confirm backend works before testing frontend

---

## 💡 Development Workflow

**Recommended approach**:

Terminal 1 (Backend):
```bash
cd backend
npm run start
# Leave this running
```

Terminal 2 (Frontend):
```bash
cd frontend  
npm run dev
# Leave this running
```

Both should stay running during development. You can now:
- Visit http://localhost:3000
- Sign up / login
- All API calls will work!

---

## Summary

✅ Backend is now running on http://localhost:3001  
✅ Frontend can connect to it  
✅ Signup/login should work now!

Try creating an account again - the network error should be gone!
