# CarbonPals Testing Guide - Reduction-Based Gamification System

This document provides comprehensive information about the test suite for the CarbonPals reduction-based gamification system.

## Overview

The test suite covers three critical components of the gamification system:
1. **Baseline Service** - CO2 baseline establishment and reduction calculation
2. **Eco-Swaps Service** - Eco-friendly action tracking and points awarding
3. **Badges Service** - Badge unlock logic based on reduction milestones
4. **E2E Tests** - Full user journey testing with Playwright

## Test Structure

### Backend Unit Tests

#### 1. Baseline Service Tests (`backend/src/baseline/__tests__/baseline.service.spec.ts`)

**Purpose**: Test baseline calculation logic with various data scenarios

**Test Categories**:

##### calculateBaseline
- ✅ **Already Locked**: Verifies returning locked baseline when established
- ✅ **15 Days Data (Projected)**: Tests baseline projection with 15 days of data
- ✅ **30+ Days (Locked)**: Tests baseline locking and database update with 30+ days
- ✅ **No Data**: Handles zero emissions gracefully
- ✅ **35 Days**: Tests correct projection with >30 days of data

**Key Scenarios**:
- Day 1-15: Baseline calculating (projected baseline shown)
- Day 16-30: Baseline locked (exactly 30+ days)
- Day 31+: Baseline locked, reduction calculated against locked baseline

##### getReductionStats
Tests reduction percentage calculation for a given month

- ✅ **25% Reduction**: Actual 300 kg vs Baseline 400 kg = 25% reduction
- ✅ **Zero Reduction**: Actual = Baseline shows 0% reduction
- ✅ **No Penalty**: When actual > baseline, reduction stays 0% (no penalty)
- ✅ **Baseline Not Locked**: Returns empty stats when baseline not yet established
- ✅ **33% Reduction**: Verifies precise percentage calculation
- ✅ **50% Reduction**: Tests major reduction scenario

##### getMonthlyHistory
Tests monthly grouping and historical reduction tracking

- ✅ **Group by Month**: Correctly groups emissions by month
- ✅ **Calculate Reduction %**: Accurate percentage calculation per month
- ✅ **Empty History**: Handles baseline not locked
- ✅ **Empty Emissions**: Handles no data gracefully
- ✅ **Multiple Months**: Tracks 4+ months with varying reductions
  - Jan: 50% reduction (150 CO2)
  - Feb: 33.33% reduction (200 CO2)
  - Mar: 66.67% reduction (100 CO2)
  - Apr: 0% reduction (300 CO2)

##### Edge Cases
- ✅ **Decimal Values**: Proper rounding of fractional CO2 values
- ✅ **Single Day Projection**: Correctly projects 1 day to monthly baseline

**Running Baseline Tests**:
```bash
npm test -- baseline/__tests__/baseline.service.spec.ts
```

#### 2. Eco-Swaps Service Tests (`backend/src/eco-swaps/__tests__/eco-swaps.service.spec.ts`)

**Purpose**: Test eco-swap creation, points awarding, and statistics

**Point System**:
- `public_transit`: 10 points
- `vegetarian`: 5 points
- `secondhand`: 20 points
- `biking`: 15 points
- `plant_based`: 3 points

**Test Categories**:

##### createSwap
- ✅ Tests swap creation with valid types
- ✅ Verifies correct points awarded for each swap type
- ✅ Handles Supabase errors gracefully

##### getUserSwaps
- ✅ Retrieves user swap history in descending order
- ✅ Returns empty array when no swaps exist
- ✅ Handles null responses

##### getSwapStats
Tests counting and statistics by swap type and period

- ✅ **No Period Filter**: Counts all-time swaps by type
- ✅ **Week Period**: Filters to last 7 days
- ✅ **Month Period**: Filters to last month
- ✅ **Year Period**: Filters to last year
- ✅ **Multiple Types**: Tracks 5+ swaps of different types correctly
- ✅ **Invalid Types**: Gracefully handles unknown swap types

**Running Eco-Swaps Tests**:
```bash
npm test -- eco-swaps/__tests__/eco-swaps.service.spec.ts
```

#### 3. Badges Service Tests (`backend/src/badges/__tests__/badges-reduction.service.spec.ts`)

**Purpose**: Test badge unlock logic based on reduction milestones and eco-swaps

**Badge Definitions**:

| Badge | Threshold | Trigger |
|-------|-----------|---------|
| Carbon Cutter | 10% | 10% CO2 reduction |
| Planet Saver | 25% | 25% CO2 reduction |
| Eco Warrior | 50% | 50% CO2 reduction |
| Green Warrior | 10 swaps | 10+ eco-swaps completed |
| Consistent Hero | 3 months | 3+ consecutive months at 20%+ reduction |

**Test Categories**:

##### Carbon Cutter (10% Reduction)
- ✅ Unlocks at exactly 10% reduction
- ✅ Does not unlock below 10%
- ✅ Unlocks above 10% (e.g., 30%)

##### Planet Saver (25% Reduction)
- ✅ Unlocks at 25% reduction
- ✅ Does not unlock below 25%

##### Eco Warrior (50% Reduction)
- ✅ Unlocks at exactly 50%
- ✅ Does not unlock below 50%
- ✅ Tests scenario with 200 kg from 400 kg baseline

##### Green Warrior (10+ Swaps)
- ✅ Unlocks with exactly 10 swaps
- ✅ Does not unlock with 9 swaps
- ✅ Unlocks with 15+ swaps

##### Consistent Hero (3 Consecutive Months 20%+)
- ✅ Unlocks with 3 consecutive months at 20%+
- ✅ Resets if any month drops below 20%
- ✅ Does not unlock with non-consecutive months
- ✅ Unlocks with 4+ consecutive months

##### Badge Deduplication
- ✅ Does not re-unlock already unlocked badges

**Running Badges Tests**:
```bash
npm test -- badges/__tests__/badges-reduction.service.spec.ts
```

## E2E Testing

### Playwright Test Suite (`frontend/e2e-tests/reduction-flow.spec.ts`)

**Purpose**: Test the complete user journey from baseline establishment to badge unlock

**Environment Variables**:
```bash
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:3001
```

**Test Scenarios**:

#### Phase 1: Baseline Establishment
- Days 1-30: Log 300 kg CO2 across 30 days
- Verify baseline is locked at 400 kg/month
- Message displays: "Baseline established"

#### Phase 2: 30% Reduction & Badge Unlock
- Establish baseline first (400 kg)
- Next month: Log 280 kg (30% reduction)
- Verify badges unlock:
  - ✅ Carbon Cutter (10% threshold)
  - ✅ Planet Saver (25% threshold)
  - ✅ Confirm at 30%
- Verify Eco Warrior locked (need 50%)

#### Phase 3: 50% Reduction
- Establish 400 kg baseline
- Next month: Log 200 kg (50% reduction)
- Verify Eco Warrior badge unlocks

#### Phase 4: Eco-Swap Points
- Create public_transit swap (10 points)
- Verify points awarded immediately
- Check pet exp increase

#### Phase 5: Pet Progression
- Baseline established with varying CO2
- Next month with reductions
- Verify pet levels up with reduction points

#### Phase 6: Leaderboard Display
- Verify leaderboard shows reduction % not absolute kg
- Format: "XX.X%" not "XXX kg"

#### Phase 7: No Penalty for Over-baseline
- Baseline: 400 kg
- Next month: 500 kg (exceeds baseline)
- Verify 0 points awarded
- Verify 0% reduction shown

#### Phase 8: Monthly History Tracking
- Establish baseline month 1
- Month 2: Various reduction
- Month 3: Different reduction
- Verify history shows each month's reduction %

**Test Data Constants**:
```typescript
Baseline: 400 kg/month
Reduction Scenarios:
  - 30%: 280 kg (unlock Carbon Cutter + Planet Saver)
  - 50%: 200 kg (unlock Eco Warrior)
  - Over: 500 kg (no points, neutral)
```

**Running E2E Tests**:
```bash
# Install Playwright (if not already installed)
npm install --save-dev @playwright/test

# Run all E2E tests
npx playwright test frontend/e2e-tests/reduction-flow.spec.ts

# Run specific test
npx playwright test -g "should establish baseline"

# Run with UI
npx playwright test --ui
```

## Test Data Reference

### Baseline Scenarios
| Scenario | Days | Total CO2 | Projected | Status |
|----------|------|-----------|-----------|--------|
| 7 days | 7 | 40 kg | 171 kg/mo | Calculating |
| 15 days | 15 | 37 kg | 74 kg/mo | Calculating |
| 30 days | 30 | 400 kg | 400 kg/mo | **LOCKED** |
| 35 days | 35 | 450 kg | 385 kg/mo | **LOCKED** |

### Reduction Percentages
| Baseline | Actual | Reduction | % | Badge Unlocked |
|----------|--------|-----------|---|---|
| 400 | 300 | 100 kg | 25% | ✓ Planet Saver |
| 400 | 360 | 40 kg | 10% | ✓ Carbon Cutter |
| 400 | 200 | 200 kg | 50% | ✓ Eco Warrior |
| 300 | 300 | 0 kg | 0% | None |
| 300 | 500 | 0 kg | 0% | None |

## Running All Tests

### Backend Tests
```bash
cd backend
npm test                          # Run all tests
npm test -- --coverage          # With coverage report
npm test -- --watch             # Watch mode
npm test -- --testNamePattern="baseline"  # Filter tests
```

### Frontend E2E Tests
```bash
cd frontend
npx playwright test
npx playwright test --debug     # Debug mode
npx playwright test --headed    # With browser visible
```

## Test Coverage Goals

### Baseline Service: 100%
- All edge cases covered
- Projection formulas verified
- Database updates validated

### Eco-Swaps Service: 100%
- All swap types tested
- Point awards verified
- Period filtering tested

### Badges Service: 95%+
- All badge thresholds tested
- Edge cases (month boundaries) covered
- Deduplication verified

### E2E Coverage: 100%
- Full user journeys covered
- All major features tested
- Happy path and error scenarios

## Debugging Tests

### Viewing Test Output
```bash
npm test -- --verbose
npm test -- --no-coverage     # Faster without coverage
```

### Debugging Specific Test
```bash
# Run one test file
npm test baseline.service.spec.ts

# Run tests matching pattern
npm test -- --testNamePattern="should calculate"

# Debug in browser (E2E)
npx playwright test --debug
```

### Common Issues

**Mock Chain Not Resolving**:
- Ensure `.order()` calls resolve with `mockSupabase.order.mockResolvedValue()`
- Ensure `.lt()` calls resolve with `mockSupabase.lt.mockResolvedValue()`
- Ensure `.single()` calls resolve with `mockSupabase.single.mockResolvedValue()`

**E2E Timeout**:
- Increase timeout: `test.setTimeout(60000)`
- Check API server is running on correct port
- Verify test data creates successfully

## Continuous Integration

Add to GitHub Actions:
```yaml
- name: Run Unit Tests
  run: cd backend && npm test -- --coverage

- name: Run E2E Tests
  run: cd frontend && npx playwright test
```

## Metrics & Goals

### Coverage Requirements
- Baseline Service: 100% (critical path)
- Eco-Swaps Service: 100%
- Badges Service: 95%+
- Overall Backend: 90%+

### Performance Targets
- Unit tests: < 10 seconds total
- E2E tests: < 2 minutes total
- All tests: < 3 minutes total

## Future Test Enhancements

1. **Integration Tests**: Test services interacting together
2. **Performance Tests**: Benchmark baseline calculation with 1000+ entries
3. **Load Tests**: Simulate 100+ concurrent users
4. **Security Tests**: Test SQL injection prevention, authorization
5. **Mobile E2E**: Test responsive design on various devices
