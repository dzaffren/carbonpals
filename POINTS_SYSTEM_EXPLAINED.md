# Points System Explained

## Overview
The points system has **two types** of points that work differently:

1. **Eco-Swap Points** - Awarded instantly when you log eco-friendly actions
2. **Reduction Points** - Awarded monthly IF you reduce emissions below your baseline

---

## 📊 Points Card Breakdown

The Points card on the dashboard shows 4 numbers:

### 1. Total Earned Points (Big number at top)
```
Total Earned Points: 50
finalized across all months
```
This is the sum of:
- All finalized reduction points from past months
- All eco-swap points (all time)

**Updates**: After eco-swap is logged, this should increase immediately

---

### 2. Reduction (past months)
```
Reduction (past months): 30
```
- Only points from **completed months** where you were below baseline
- Finalized at month-end
- **Does NOT include current month**

**Updates**: Only at month-end when baseline service finalizes the month

---

### 3. Eco-Swap Points
```
Eco-Swap Points: 20
```
- Total of ALL eco-swaps you've ever logged
- Biking = 15 pts
- Secondhand = 20 pts
- Public transit = 10 pts
- Vegetarian = 5 pts
- Plant-based = 3 pts

**Updates**: Immediately when you log a swap

---

### 4. This Month (projected)
```
This Month (projected): 25
awarded at month-end if below baseline
```
- Estimated points for current month
- **Only shows IF current_co2 < baseline_co2**
- Formula: `floor(baseline_kg - actual_kg)` when below threshold
- **NOT finalized** until month ends

**Updates**: After logging expenditures (changes your current month CO₂)

---

## ⚡ When Data Updates

### After Logging an Eco-Swap:
✅ Should update **immediately**:
- Total Earned Points (+15, +20, etc.)
- Eco-Swap Points (+15, +20, etc.)
- Pet XP (same as points)

The dashboard calls `fetchData()` after successful eco-swap, which:
1. Fetches `/baseline/points` (includes eco-swap points)
2. Fetches `/eco-swaps` (recent swaps list)
3. Fetches `/pets/my-pet` (pet XP updated)

### After Logging an Expenditure:
✅ Should update:
- Recent Expenditures list
- Current month CO₂ total
- This Month (projected) points
- Reduction % and kg

### At Month-End:
✅ Backend automatically finalizes:
- Past month's reduction points locked in
- New record in `monthly_points` table
- Reduction points move from "projected" to "earned"

---

## 🐛 Known Issue Found

**Problem**: Eco-swap points not updating immediately after logging

**Root Cause**: Missing `.async()` in database query
```typescript
// BEFORE (broken):
const { data } = await this.dbService.db
  .from('eco_swaps')
  .select('points_awarded')
  .eq('user_id', userId);

// AFTER (fixed):
const { data } = await this.dbService.db
  .from('eco_swaps')
  .select('points_awarded')
  .eq('user_id', userId)
  .async();  // ← Added this!
```

**Fix Applied**: Updated `baseline.service.ts` line 236

---

## 🔄 Data Flow After Eco-Swap

1. **User clicks eco-swap** (e.g., "Bike to work")
2. **Frontend** calls `POST /eco-swaps` with `swapType: "biking"`
3. **Backend** (`eco-swaps.service.ts`):
   - Inserts record in `eco_swaps` table with `points_awarded: 15`
   - Calls `petsService.addExperience(userId, 15)`
4. **Frontend** calls `fetchData()` to refresh
5. **Backend** (`/baseline/points`):
   - Queries `eco_swaps` table: `SELECT SUM(points_awarded) WHERE user_id = ?`
   - Returns updated totals
6. **Frontend** updates UI with new points

**Expected Time**: < 1 second

---

## 🧪 Testing the Fix

### Before Fix:
```
1. Current points: 0
2. Log eco-swap (biking = 15 pts)
3. Points still show: 0 ❌
4. Refresh page → Points now: 15
```

### After Fix:
```
1. Current points: 0
2. Log eco-swap (biking = 15 pts)
3. Points immediately show: 15 ✅
```

---

## 💡 Why Two Types of Points?

**Design Goal**: Don't incentivize more emissions!

**Old Bad System**:
- Award points for every kg of CO₂ tracked
- Problem: Users might log MORE to get MORE points

**New Good System**:
- Eco-swap points: Reward good actions immediately
- Reduction points: Only reward REDUCING emissions vs baseline
- If `actual_co2 >= baseline_co2`: Zero reduction points
- Threshold creates incentive to stay below baseline

---

## 📈 Example Month Lifecycle

### Month 1 (January):
- User logs expenditures totaling 500 kg CO₂
- Baseline locks at 500 kg/month
- User logs 3 eco-swaps: +40 pts
- **End of Month**: 0 reduction pts (no baseline to compare)
- **Total**: 40 pts

### Month 2 (February):
- Baseline: 500 kg
- User logs expenditures: 400 kg CO₂ (100 kg below!)
- User logs 2 eco-swaps: +25 pts
- **During Month** - Points card shows:
  - Reduction (past): 0
  - Eco-Swap: 65 (40 + 25)
  - Total Earned: 65
  - Projected: 100 (500 - 400)
- **End of Month** - Finalization runs:
  - February locked in: +100 reduction pts
  - **New Total**: 165 pts (65 + 100)

### Month 3 (March):
- Baseline: 500 kg
- User logs expenditures: 550 kg CO₂ (50 kg OVER!)
- User logs 1 eco-swap: +15 pts
- **During Month** - Points card shows:
  - Reduction (past): 100
  - Eco-Swap: 80
  - Total Earned: 180
  - Projected: 0 (above baseline!)
- **End of Month**:
  - March: 0 reduction pts (failed threshold)
  - **Total**: 180 pts (no change)

---

## 🔧 Backend Restart Required

After the fix, you need to restart the backend:

```bash
# Kill backend
ps aux | grep "node.*nest" | grep -v grep | awk '{print $2}' | xargs kill

# Restart
cd backend
npm run start:dev
```

Frontend will automatically refresh data on next eco-swap.

---

## Summary

**Eco-swap points should now update immediately** after the fix. If they still don't:

1. Check browser console for errors
2. Verify backend is running (http://localhost:3001)
3. Check backend logs for errors
4. Try hard refresh (Ctrl+Shift+R)

The monthly reduction points will continue to update at month-end as designed.
