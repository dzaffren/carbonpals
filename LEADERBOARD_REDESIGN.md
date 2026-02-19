# Leaderboard Redesign - Rank by Carbon Saved (Not Emitted)

## Core Shift
- **Old:** Rank by total CO₂ tracked (big spenders on top)
- **New:** Rank by CO₂ saved vs personal baseline (best reducers on top)

## Ranking Formula

```
user_rank = sort_by(
  reduction_percent DESC,           # Primary: % reduction (25% > 15%)
  reduction_kg DESC,                # Secondary: absolute kg saved (100kg > 50kg)
  consistency_months DESC           # Tertiary: months sustained
)
```

**Why this order:**
1. **% Reduction first** - Percentage matters more (someone reducing 80% is better than someone reducing 100kg)
2. **Absolute reduction second** - Tiebreaker (if both at 25%, bigger saver ranks higher)
3. **Consistency third** - Long-term commitment (3+ months sustained is more impressive)

## Leaderboard Views

### Global Leaderboard
Rank all users worldwide by carbon reduction.

```
Rank | User              | % Reduction | kg Saved | Badges | Streak
-----|-------------------|-------------|----------|--------|--------
  1  | EcoWarrior42      | 50%         | 250 kg   | 7/9    | 4 mo
  2  | GreenThumb_Sam    | 48%         | 240 kg   | 6/9    | 3 mo
  3  | SustainableSarah  | 45%         | 225 kg   | 8/9    | 2 mo
  4  | CarbonCutter1     | 30%         | 180 kg   | 5/9    | 1 mo
  5  | NewToGreen        | 15%         | 75 kg    | 2/9    | < 1 mo
```

### Time Period Filters
- **All-time** - Since account creation
- **This Year** - Jan 1 - Dec 31
- **This Month** - Last 30 days
- **This Week** - Last 7 days

Example: "This Week" view shows users who achieved fastest reduction in last 7 days

```
Rank | User              | % Reduction (7d) | kg Saved | Trending ↑
-----|-------------------|------------------|----------|----------
  1  | QuietLiver        | 35%              | 52 kg    | 📈 +8
  2  | EcoWarrior42      | 28%              | 140 kg   | ▶ +2
  3  | RetailTherapy→Bio | 22%              | 45 kg    | 📈 +15
```

### Category-Specific Leaderboards (Optional)
- **Transit Savers** - Most public transit swaps + lowest transport CO₂
- **Veggie Champions** - Most vegetarian swaps + lowest food CO₂
- **Thrifty Shoppers** - Most secondhand purchases + lowest consumption CO₂

### Friends Leaderboard
Compare against friends' reduction % + absolute kg saved

## Data Shown Per User

```
User Card:
├─ Rank: #1 globally
├─ Username + Avatar
├─ Primary Stats:
│  ├─ % Reduction: 50% ↓ vs baseline
│  ├─ Absolute Saved: 250 kg CO₂
│  ├─ Baseline: 500 kg/month
│  └─ Current: 250 kg/month
├─ Activity:
│  ├─ Badges Earned: 7/9 🌱✂️🌍💚🔥🚌🏅
│  ├─ Streak: 4 consecutive months 25%+
│  └─ Total Points: 4,250 XP
├─ Pet Status:
│  ├─ Pet Level: 5 🦉
│  └─ Next Milestone: "Legendary Pet" (5,000 pts)
└─ [View Profile] [Add Friend]
```

## Monthly Recalculation

Leaderboard updates **monthly on the 1st**:

1. System calculates all users' CO₂ for previous month
2. Compares to their baseline
3. Calculates reduction_percent = (baseline - actual) / baseline * 100
4. Sorts by reduction_percent DESC
5. Assigns ranks #1, #2, #3, etc.
6. Stores in `leaderboard_cache` table

### Example Calculation
- User A: baseline 500 kg, actual 250 kg → 50% reduction → rank varies by others
- User B: baseline 200 kg, actual 100 kg → 50% reduction → same %, rank by kg: B ranks lower (100 < 250)
- User C: baseline 300 kg, actual 175 kg → 42% reduction → ranks below A & B

## Engagement Features

### Badges on Leaderboard
Show user's earned badges as visual indicators:
- 🌱 First Steps
- ✂️ Carbon Cutter (10%+)
- 🌍 Planet Saver (25%+)
- ⚔️ Eco Warrior (50%+)
- 💚 Green Warrior (10 swaps)
- 🥬 Veggie Lover (5+ veg swaps)
- 🚌 Transit Master (5+ transit swaps)
- 🔥 Consistent Hero (3+ months 20%+)
- 🏅 Badge Collector (5+ badges)

### Trend Indicators
Show if user is trending up/down in ranks:
- 📈 Up 5 spots this week (user gained 5 positions)
- 📉 Down 2 spots this week (lost 2 positions)
- ▶ Stable (no change)

### Streak Tracking
- "4 consecutive months at 20%+ reduction" 🔥
- "Haven't missed a day of logging" ✅
- "5 green swaps this week" 💚

## User Journey on Leaderboard

### Month 1: Baseline
- User establishes baseline: 500 kg CO₂
- Doesn't appear on leaderboard yet
- Message: "Leaderboard unlocks once you establish your baseline"

### Month 2: First Reduction
- Emits 400 kg → 20% reduction
- Leaderboard rank: #5,234 globally (out of ~50,000)
- Card shows: "↑ 20% reduction from baseline"
- Sees top users: "EcoWarrior42 (50%), GreenThumb_Sam (48%)"
- Motivation: "Let's keep going!"

### Month 3: Progress
- Emits 300 kg → 40% reduction
- Leaderboard rank: #892 (moved up 4,342 spots!)
- Streak badge appears: "2 consecutive months 20%+"
- New badge unlocked: "Planet Saver"
- Motivation: "I'm in top 2% now!"

### Month 4: Elite
- Emits 250 kg → 50% reduction
- Leaderboard rank: #47
- Multiple badges visible, streak shows "4 months"
- Friends section shows: "You beat Sarah! You're ranked higher now"
- Motivation: "Almost top 10!"

## Database Schema

### leaderboard_cache Table (Updated)
```sql
CREATE TABLE leaderboard_cache (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Reduction metrics
  reduction_percent DECIMAL(5, 2),      -- 50.00 for 50%
  reduction_kg DECIMAL(10, 4),          -- 250.1234 kg saved
  baseline_co2_monthly DECIMAL(10, 4),
  actual_co2_monthly DECIMAL(10, 4),
  
  -- Activity
  badges_earned INT DEFAULT 0,          -- Count of badges
  consecutive_months_20pct INT DEFAULT 0,
  eco_swaps_count INT DEFAULT 0,
  
  -- Ranking
  rank INT,                             -- #1, #2, #3, etc
  period TEXT DEFAULT 'all_time',       -- 'all_time', 'this_year', 'this_month', 'this_week'
  
  updated_at TIMESTAMP,
  
  UNIQUE(user_id, period)
);
```

## API Endpoints

```
GET /leaderboard
  ?period=all_time|this_year|this_month|this_week
  ?limit=100&offset=0
  ?category=global|transit|veggie|thrifty|friends
  
  Response:
  {
    period: "all_time",
    total_users: 50234,
    your_rank: 892,
    leaders: [
      {
        rank: 1,
        user_id: "xxx",
        username: "EcoWarrior42",
        avatar_url: "...",
        reduction_percent: 50.5,
        reduction_kg: 252.5,
        badges: ["first_tracker", "carbon_cutter", "planet_saver"],
        streak_months: 4,
        trending: "up 5"
      },
      ...
    ]
  }

GET /leaderboard/categories
  Response: ["global", "transit", "veggie", "thrifty"]

GET /users/:id/leaderboard-position
  Response: {
    rank: 892,
    period: "all_time",
    reduction_percent: 40.2,
    reduction_kg: 201.0,
    ahead_of: "50,000 users",
    behind_by: "2 ranks to top 100"
  }

POST /leaderboard/recalculate
  (Admin endpoint to manually trigger monthly recalculation)
```

## Success Criteria

✅ Users see themselves ranked by reduction % (not spending)
✅ Leaderboard motivates competition (race to reduce more)
✅ Clear path to top (understand what it takes to rank up)
✅ Visible badges show behavioral changes earned
✅ Trends show momentum (climbing or falling)
✅ No "pay to win" - purely effort/behavior based
