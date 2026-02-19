# Carbon Reduction Points Formula

## Overview
Points awarded based on reduction vs user's personal baseline, not absolute emissions.

## Baseline Calculation

### When Established
- After user has logged expenditures for 30+ days
- System auto-calculates average monthly CO₂ from all transactions in first month
- Once locked, baseline cannot change (prevents gaming)

### Formula
```
baseline_co2_monthly = sum(all CO₂ from month 1) / days_in_month * 30
```

**Example:**
- User logs 15 days of data in first month: 200 kg CO₂
- Projected to full month: (200 / 15) * 30 = 400 kg CO₂ baseline
- Baseline locked once 30 days reached

## Monthly Points Calculation

### Base Reduction Points
```
reduction_kg = baseline_co2_monthly - actual_co2_monthly
points_awarded = max(0, reduction_kg)
```

**Examples:**
- Baseline: 500 kg/month
- Actual Month 2: 400 kg → 100 kg saved → **+100 points**
- Actual Month 3: 500 kg → 0 kg saved → **+0 points** (no penalty, neutral)
- Actual Month 4: 600 kg → -100 kg (over) → **+0 points** (no penalty, neutral)

### Bonus Points: Eco-Swaps
```
bonus_points = sum(swap_values)
```

Swap types and point values:
| Swap Type | Points | Notes |
|-----------|--------|-------|
| Public transit instead of car | +10 | Per trip (max 50/month) |
| Vegetarian meal instead of meat | +5 | Per meal (max 25/month) |
| Secondhand purchase instead of new | +20 | Per purchase (max 40/month) |
| Biking instead of car | +15 | Per trip (max 75/month) |
| Plant-based meal instead of dairy | +3 | Per meal (max 15/month) |

**Note:** Caps prevent gaming (e.g., logging fake transit swaps)

### Total Monthly Points
```
total_points = reduction_points + bonus_points
```

## Pet Level Progression

```
pet_level = floor(total_cumulative_points / 50)
```

- 0-49 points: Level 0 (egg)
- 50-99 points: Level 1 (cracking egg)
- 100-149 points: Level 2 (chick)
- 150-199 points: Level 3 (duckling)
- 200-249 points: Level 4 (duck)
- 250+ points: Level 5 (owl - final form)

## Reduction Percentage Tracking

Used for badges and leaderboard ranking:
```
reduction_percent = (reduction_kg / baseline_co2_monthly) * 100
```

**Examples:**
- Baseline: 500 kg, Actual: 450 kg → 10% reduction
- Baseline: 500 kg, Actual: 375 kg → 25% reduction
- Baseline: 500 kg, Actual: 250 kg → 50% reduction

## Edge Cases

### First Month (No Baseline Yet)
- No points awarded
- System collecting baseline data
- UI shows: "Establishing your baseline... keep logging to get started"
- Pet remains at level 0 (egg)

### New Year / Period Reset
- Baseline stays the same (locked for entire year)
- Monthly points recalculated against same baseline
- No reset / "easier" baseline allowed

### Extreme Outliers
- If user logs 0 CO₂ for month: reduction = baseline → all points awarded ✓
- If user logs 10x baseline: reduction = 0, no penalty ✓
- If user doesn't log that month: baseline assumed (same as last month)

### Delayed Logging
- If user logs old expenditure from last month → retroactively update that month's points
- If month is "closed" (30+ days past) → update leaderboard rank

## Calculation Timing

- Monthly points calculated: 1st of each month (automatic)
- Eco-swaps points: Immediate when logged
- Pet level: Real-time (cumulative)
- Leaderboard: Updates daily/weekly (batch job)

## API Endpoints

1. **Calculate Baseline**
   - POST `/users/:id/calculate-baseline`
   - Response: { baseline_co2_monthly, baseline_locked, next_review_date }

2. **Get Reduction Stats**
   - GET `/users/:id/reduction-stats`
   - Response: { baseline, current_month_co2, reduction_kg, reduction_percent, points_this_month, total_points, pet_level }

3. **Log Eco-Swap**
   - POST `/eco-swaps`
   - Body: { swap_type, date }
   - Response: { bonus_points, total_points_today }

4. **Get Monthly History**
   - GET `/users/:id/monthly-reduction-history`
   - Response: [ { month, baseline, actual_co2, reduction_kg, points, badges_unlocked } ]

## Example Progression

**Month 1 (Baseline)**
- Log $500/day spending → ~450 kg CO₂/month
- Baseline established: 450 kg CO₂
- Pet level: 0 (egg) - no points yet

**Month 2 (Reduction Starts)**
- Spend $400/day average → 360 kg CO₂
- Reduction: 90 kg below baseline
- Eco-swaps: 3 transit swaps (+30 bonus) = **+120 total points**
- Pet level: 2 (chick)
- Achievement: "Carbon Cutter" badge unlocked (20% reduction)

**Month 3 (Consistency)**
- Spend $350/day average → 315 kg CO₂
- Reduction: 135 kg below baseline (30%)
- Eco-swaps: 5 swaps (+50 bonus) = **+185 total points**
- Cumulative: 120 + 185 = 305 points
- Pet level: 6 (owl - fully evolved!)
- Achievement: "Planet Saver" badge unlocked (30% reduction)

**Month 4**
- Sustain 30% reduction
- +185 points → Cumulative: 490 points
- Pet level: 9 (stays at max 5, but unlocks next tier pet?) 
- Achievement: "Consistent" badge unlocked (3 months sustained)
