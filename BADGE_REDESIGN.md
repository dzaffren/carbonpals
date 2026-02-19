# Redesigned Badge System - Reduction-Based

All badges now reward carbon reduction, green actions, and consistency instead of absolute spending.

## Badge Definitions

```typescript
const BADGE_DEFINITIONS = [
  {
    type: 'first_tracker',
    name: 'First Steps',
    description: 'Logged your first expenditure',
    icon: '🌱',
    unlock_condition: 'expenditure_count >= 1',
    tier: 'starter'
  },
  {
    type: 'carbon_cutter',
    name: 'Carbon Cutter',
    description: 'Achieved 10% reduction vs baseline',
    icon: '✂️',
    unlock_condition: 'reduction_percent >= 10',
    tier: 'reduction'
  },
  {
    type: 'planet_saver',
    name: 'Planet Saver',
    description: 'Achieved 25% reduction vs baseline',
    icon: '🌍',
    unlock_condition: 'reduction_percent >= 25',
    tier: 'reduction'
  },
  {
    type: 'eco_warrior',
    name: 'Eco Warrior',
    description: 'Achieved 50% reduction vs baseline',
    icon: '⚔️',
    unlock_condition: 'reduction_percent >= 50',
    tier: 'reduction'
  },
  {
    type: 'green_warrior',
    name: 'Green Warrior',
    description: 'Made 10 eco-friendly swaps',
    icon: '💚',
    unlock_condition: 'eco_swaps_count >= 10',
    tier: 'action'
  },
  {
    type: 'veggie_lover',
    name: 'Veggie Lover',
    description: 'Made 5+ vegetarian meal swaps',
    icon: '🥬',
    unlock_condition: 'swap_type_count[vegetarian] >= 5',
    tier: 'action'
  },
  {
    type: 'transit_master',
    name: 'Transit Master',
    description: 'Made 5+ public transit swaps',
    icon: '🚌',
    unlock_condition: 'swap_type_count[public_transit] >= 5',
    tier: 'action'
  },
  {
    type: 'consistent_hero',
    name: 'Consistent Hero',
    description: 'Maintained 20%+ reduction for 3 consecutive months',
    icon: '🔥',
    unlock_condition: 'consecutive_months_20pct_reduction >= 3',
    tier: 'consistency'
  },
  {
    type: 'collector',
    name: 'Badge Collector',
    description: 'Unlocked 5+ badges',
    icon: '🏅',
    unlock_condition: 'badges_unlocked >= 5',
    tier: 'meta'
  }
];
```

## Badge Tiers

| Tier | Count | Purpose | Unlock Speed |
|------|-------|---------|--------------|
| **Starter** | 1 | Get users started | Immediate (first action) |
| **Reduction** | 4 | Reward carbon reduction | Progressive (10%, 25%, 50%, 75%+) |
| **Action** | 3 | Reward green swaps | Monthly behavior change |
| **Consistency** | 1 | Reward long-term commitment | 3+ month sustained effort |
| **Meta** | 1 | Collect them all | 5+ badges |

## Unlock Conditions (Backend Logic)

### Tier 1: Starter
```
first_tracker: user.expenditure_count >= 1
```
Unlocks immediately on first expenditure logged.

### Tier 2: Reduction (Primary)
```
carbon_cutter: user.reduction_percent >= 10%
planet_saver: user.reduction_percent >= 25%
eco_warrior: user.reduction_percent >= 50%
```
Auto-unlock each month when user hits reduction milestone. 
Checked monthly on 1st of each month.

**Example progression:**
- Month 1: Baseline set (0%)
- Month 2: 15% reduction → Unlocks "Carbon Cutter" ✓
- Month 3: 28% reduction → Unlocks "Planet Saver" ✓
- Month 4: 52% reduction → Unlocks "Eco Warrior" ✓

### Tier 3: Action (Behavioral)
```
green_warrior: sum(all eco_swaps) >= 10
veggie_lover: sum(vegetarian swaps) >= 5
transit_master: sum(public_transit swaps) >= 5
```
Unlocks immediately when swap count reached.
User sees progress: "3/5 vegetarian meals logged - almost there!"

### Tier 4: Consistency (Long-term)
```
consistent_hero: 
  - month[i].reduction_percent >= 20% 
  - month[i+1].reduction_percent >= 20%
  - month[i+2].reduction_percent >= 20%
```
Requires 3 consecutive months maintaining 20%+ reduction.
Checked monthly.

### Tier 5: Meta
```
collector: badges_unlocked >= 5
```
Auto-unlock when user reaches 5 badges.

## Badge Progression Example

**User Journey Over 4 Months:**

Month 1: Baseline Establishment
- Log 15 days → 250 kg CO₂ (projected 500 kg/month)
- Baseline locked: 500 kg CO₂
- Badges: None yet
- Progress: "Baseline set! Try to reduce next month"

Month 2: First Reduction
- Spend less → 425 kg CO₂
- Reduction: 75 kg (15% below baseline)
- Eco-swaps: 3 transit + 2 vegetarian = 5 swaps
- **Unlocked:** 🌱 First Steps, ✂️ Carbon Cutter
- Points: 75 (reduction) + 25 (swaps) = 100 total
- Pet level: 2

Month 3: Acceleration
- Further reduce → 375 kg CO₂
- Reduction: 125 kg (25% below baseline)
- Eco-swaps: 6 more = 11 total
- **Unlocked:** 🌍 Planet Saver, 💚 Green Warrior
- Points: 125 + 60 = 185 (cumulative: 285)
- Pet level: 5

Month 4: Consistency Maintained
- Sustain → 380 kg CO₂
- Reduction: 120 kg (24% below baseline)
- Eco-swaps: 5 more = 16 total
- **Unlocked:** 🔥 Consistent Hero (3 months maintained)
- Points: 120 + 25 = 145 (cumulative: 430)
- Pet level: 8+ (maxes at 5, but unlocks "Legendary" pet form?)

Month 5: Elite Status
- Push harder → 250 kg CO₂
- Reduction: 250 kg (50% below baseline!)
- Eco-swaps: 10 more = 26 total
- **Unlocked:** ⚔️ Eco Warrior, 🚌 Transit Master, 🏅 Badge Collector
- Points: 250 + 50 = 300 (cumulative: 730)
- Pet level: 14+ 
- Status: "Elite Eco Champion" 🌟

## Display in Frontend

### Compact View (Home Page)
```
Badges Earned: 8/9
🌱 ✂️ 🌍 💚 🔥 🚌 🏅 ⚔️
Progress to next: 🎯 (1 more badge until "Collector")
```

### Expanded View (Badges Page)
```
EARNED (8)
✂️ Carbon Cutter
   Achieved 10% reduction vs baseline
   Unlocked: Feb 19, 2026

🌍 Planet Saver
   Achieved 25% reduction vs baseline
   Unlocked: Mar 15, 2026
   (repeatable: next tier is 50%)

LOCKED (1)
⭕ Eco Warrior (50% reduction needed)
   Current: 25% reduction
   Progress: ████░░░░░░░░░░░░ (need 25% more)
```

### Progress Indicators
- Reduction badges: Show progress bar (10%/25%/50%)
- Action badges: Show counter (5/5 swaps, 3/5 vegetarian)
- Consistency: Show months completed (2/3 months maintained)

## API Endpoints

```
GET /badges/definitions
  → [ { type, name, description, icon, tier, unlock_condition } ]

GET /users/:id/badges
  → { 
      earned: [ { type, name, unlocked_at, ... } ],
      locked: [ { type, name, progress_percent, ... } ]
    }

POST /badges/check
  → Manually trigger badge check (normally auto on monthly calc)
  → Response: { newly_unlocked: [ 'badge_type_1', ... ] }

GET /users/:id/progress/:badge_type
  → { 
      type, 
      current_value, 
      required_value, 
      percent_complete,
      estimate_days_to_unlock
    }
```

## Rewards (Optional Future)

Once badges are unlocked, consider adding:
- **Profile badge display** - Show earned badges on user profile
- **Community features** - See friends' badges, "race" for badges
- **Special perks** - Unlock pet skins for certain badges
- **Leaderboard boost** - Extra visibility for rare badges
- **Email celebration** - "You unlocked Planet Saver! 🎉"

## Success Criteria

✅ Users naturally earn badges as they reduce emissions
✅ Badges provide clear, visible milestones
✅ No badge can be "gamed" (all tied to real behavior change)
✅ Each badge tier feels meaningful (not too easy, not impossible)
✅ Users can see progress toward locked badges
