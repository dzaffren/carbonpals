# Testing Month-End Points Finalization

This guide shows how to test the monthly points finalization system.

## How Points Work Now

- **During the month**: Points show as "Projected (not final)" — they update live but aren't finalized
- **At month-end**: When a new month starts, the previous month's points are automatically finalized when you view `/baseline/points`
- **Finalization rule**: Points are only awarded if `total_monthly_emissions < baseline_co2_monthly`

## Quick Test Method

### Step 1: Seed Last Month's Data

Call the test endpoint to create expenditures backdated to last month:

```bash
curl -X POST http://localhost:3001/expenditures/test/seed-last-month \
  -H "Authorization: Bearer mock-jwt-token-for-testing"
```

This creates 3 expenditures from last month:
- Fuel: $50 → ~115 kg CO₂
- Groceries: $150 → ~75 kg CO₂  
- Electricity: $80 → ~32 kg CO₂
- **Total: ~222 kg CO₂**

### Step 2: Ensure Baseline is Set

Make sure your baseline is established (requires 1+ days of data in dev mode):

```bash
curl -X POST http://localhost:3001/baseline/calculate \
  -H "Authorization: Bearer mock-jwt-token-for-testing"
```

If baseline is below 222 kg/month, last month's points will be **0**.
If baseline is above 222 kg/month (e.g. 400), you'll earn ~178 points.

### Step 3: Trigger Finalization

Refresh the frontend or call the points endpoint:

```bash
curl http://localhost:3001/baseline/points \
  -H "Authorization: Bearer mock-jwt-token-for-testing"
```

Response shows:
```json
{
  "cumulative_reduction_points": 178,  // finalized from last month
  "eco_swap_points": 0,                 // eco-swaps you've done
  "total_earned_points": 178,
  "projected_reduction_points_this_month": 0  // current month (not final)
}
```

### Step 4: Grow Your Pet with Eco-Swaps

Pet XP now comes from eco-swaps (not emissions):

```bash
# Log a bike trip (15 XP)
curl -X POST http://localhost:3001/eco-swaps \
  -H "Authorization: Bearer mock-jwt-token-for-testing" \
  -H "Content-Type: application/json" \
  -d '{"swap_type": "biking"}'

# Log vegetarian meal (5 XP)
curl -X POST http://localhost:3001/eco-swaps \
  -H "Authorization: Bearer mock-jwt-token-for-testing" \
  -H "Content-Type: application/json" \
  -d '{"swap_type": "vegetarian"}'

# Check pet level (50 XP = 1 level)
curl http://localhost:3001/pets/my-pet \
  -H "Authorization: Bearer mock-jwt-token-for-testing"
```

## Manual Database Method

If using Supabase (not mock):

```sql
-- 1. Backdate existing expenditures to last month
UPDATE expenditures 
SET created_at = NOW() - INTERVAL '35 days'
WHERE user_id = 'your-user-id';

UPDATE carbon_emissions
SET created_at = NOW() - INTERVAL '35 days'
WHERE user_id = 'your-user-id';

-- 2. Then call GET /baseline/points to trigger finalization
```

## What to Look For

✅ **Points finalized**: `cumulative_reduction_points` increases  
✅ **Only if below baseline**: Check that months above baseline award 0 points  
✅ **Pet grows from swaps**: Eco-swaps award XP, emissions don't  
✅ **History shows finalized**: `GET /baseline/history` marks past months as `finalized: true`

## Frontend UI

The sidebar now shows:
- **Total Earned Points** (big number) = all finalized points
- **This Month (projected)** (smaller, blue-ish) = not yet final
- Breakdown of reduction vs eco-swap points
