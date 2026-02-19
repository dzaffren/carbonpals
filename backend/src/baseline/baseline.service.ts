import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface BaselineResult {
  baseline_co2_monthly: number;
  baseline_locked: boolean;
  baseline_period_start: string;
  message: string;
}

@Injectable()
export class BaselineService {
  constructor(private dbService: DatabaseService) {}

  /**
   * Calculate baseline CO2 for a user based on first 30+ days of data
   */
  async calculateBaseline(userId: string): Promise<BaselineResult> {
    // Get user's current baseline status
    const { data: userData } = await this.dbService.db
      .from('users')
      .select('baseline_locked, baseline_co2_monthly, baseline_period_start')
      .eq('id', userId)
      .single();

    if (userData?.baseline_locked) {
      return {
        baseline_co2_monthly: userData.baseline_co2_monthly,
        baseline_locked: true,
        baseline_period_start: userData.baseline_period_start,
        message: 'Baseline already established and locked',
      };
    }

    // Get all carbon emissions for this user from first 30+ days
    const { data: emissions } = await this.dbService.db
      .from('carbon_emissions')
      .select('kg_co2e, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .async();

    if (!emissions || emissions.length === 0) {
      return {
        baseline_co2_monthly: 0,
        baseline_locked: false,
        baseline_period_start: new Date().toISOString(),
        message: 'No expenditure data yet. Keep logging to establish baseline.',
      };
    }

    // Find the date range
    const firstDate = new Date(emissions[0].created_at);
    const lastDate = new Date(emissions[emissions.length - 1].created_at);
    const daysElapsed = Math.max(1, Math.ceil(
      (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24),
    ));

    const totalCO2 = emissions.reduce((sum: number, e: any) => sum + e.kg_co2e, 0);

    // For testing/prototype: allow locking baseline with just 1 day of data
    // In production, require 30+ days
    const isProduction = process.env.NODE_ENV === 'production';
    const minDaysRequired = isProduction ? 30 : 1;

    if (daysElapsed < minDaysRequired) {
      const projectedMonthly = daysElapsed > 0 ? (totalCO2 / daysElapsed) * 30 : totalCO2 * 30;

      return {
        baseline_co2_monthly: Math.round(projectedMonthly * 10000) / 10000,
        baseline_locked: false,
        baseline_period_start: firstDate.toISOString(),
        message: `Establishing baseline... ${daysElapsed}/${minDaysRequired} days of data (projected: ${projectedMonthly.toFixed(1)} kg/month)`,
      };
    }

    // Calculate baseline
    const baseline = daysElapsed > 0 ? (totalCO2 / daysElapsed) * 30 : totalCO2 * 30;

    // Note: In production, we would persist this to the database
    // For now, just return the calculated baseline
    // The frontend can cache this value if needed

    return {
      baseline_co2_monthly: Math.round(baseline * 10000) / 10000,
      baseline_locked: true,
      baseline_period_start: firstDate.toISOString(),
      message: `Baseline established: ${baseline.toFixed(1)} kg CO₂/month (locked)`,
    };
  }

  /**
   * Get reduction stats for a user for a given month
   */
  async getReductionStats(
    userId: string,
    year: number = new Date().getFullYear(),
    month: number = new Date().getMonth() + 1,
  ) {
    // Get user's baseline
    const { data: user } = await this.dbService.db
      .from('users')
      .select('baseline_co2_monthly, baseline_locked')
      .eq('id', userId)
      .single();

    if (!user?.baseline_locked) {
      return {
        message: 'Baseline not yet established',
        baseline: null,
        current_month_co2: 0,
        reduction_kg: 0,
        reduction_percent: 0,
        points_this_month: 0,
      };
    }

    // Get CO2 for the specified month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const { data: emissions } = await this.dbService.db
      .from('carbon_emissions')
      .select('kg_co2e')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString())
      .async();

    const currentMonthCO2 = emissions?.reduce((sum: number, e: any) => sum + e.kg_co2e, 0) || 0;
    const reductionKg = Math.max(0, user.baseline_co2_monthly - currentMonthCO2);
    const reductionPercent = (reductionKg / user.baseline_co2_monthly) * 100;

    return {
      baseline: user.baseline_co2_monthly,
      current_month_co2: currentMonthCO2,
      reduction_kg: Math.round(reductionKg * 10000) / 10000,
      reduction_percent: Math.round(reductionPercent * 100) / 100,
      points_this_month: Math.floor(reductionKg),
    };
  }

  /**
   * Finalize points for all completed months since baseline was locked.
   * Runs lazily — inserts a record for any past month not yet finalized.
   */
  async finalizePastMonths(userId: string): Promise<void> {
    const { data: user } = await this.dbService.db
      .from('users')
      .select('baseline_co2_monthly, baseline_locked, baseline_period_start')
      .eq('id', userId)
      .single();

    if (!user?.baseline_locked || !user.baseline_co2_monthly) return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Collect all months from baseline start up to (but not including) the current month
    const start = new Date(user.baseline_period_start);
    const monthsToFinalize: { year: number; month: number }[] = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);

    while (
      cursor.getFullYear() < currentYear ||
      (cursor.getFullYear() === currentYear && cursor.getMonth() + 1 < currentMonth)
    ) {
      monthsToFinalize.push({ year: cursor.getFullYear(), month: cursor.getMonth() + 1 });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    if (monthsToFinalize.length === 0) return;

    // Find which months are already finalized
    const { data: existing } = await this.dbService.db
      .from('monthly_points')
      .select('year, month')
      .eq('user_id', userId);

    const alreadyDone = new Set(
      (existing || []).map((r: any) => `${r.year}-${r.month}`),
    );

    for (const { year, month } of monthsToFinalize) {
      if (alreadyDone.has(`${year}-${month}`)) continue;

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);

      const { data: emissions } = await this.dbService.db
        .from('carbon_emissions')
        .select('kg_co2e')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString())
        .async();

      const actualCO2 = emissions?.reduce((sum: number, e: any) => sum + e.kg_co2e, 0) || 0;
      const baseline = user.baseline_co2_monthly;
      // Only award points if emissions are strictly below the baseline threshold
      const reductionKg = actualCO2 < baseline ? baseline - actualCO2 : 0;
      const pointsEarned = Math.floor(reductionKg);

      await this.dbService.db.from('monthly_points').insert({
        user_id: userId,
        year,
        month,
        baseline_co2: Math.round(baseline * 10000) / 10000,
        actual_co2: Math.round(actualCO2 * 10000) / 10000,
        reduction_kg: Math.round(reductionKg * 10000) / 10000,
        points_earned: pointsEarned,
      });
    }
  }

  /**
   * Get cumulative finalized reduction points for a user (all past months).
   */
  async getCumulativeReductionPoints(userId: string): Promise<number> {
    const { data } = await this.dbService.db
      .from('monthly_points')
      .select('points_earned')
      .eq('user_id', userId);

    return (data || []).reduce((sum: number, r: any) => sum + r.points_earned, 0);
  }

  /**
   * Get total eco-swap points for a user (all time).
   */
  async getTotalEcoSwapPoints(userId: string): Promise<number> {
    const { data } = await this.dbService.db
      .from('eco_swaps')
      .select('points_awarded')
      .eq('user_id', userId)
      .async();

    return (data || []).reduce((sum: number, r: any) => sum + (r.points_awarded || 0), 0);
  }

  /**
   * Get the user's full points summary:
   * - cumulative earned reduction points (finalized past months)
   * - eco-swap points (all time)
   * - projected reduction points for the current (unfinished) month
   */
  async getPointsSummary(userId: string) {
    await this.finalizePastMonths(userId);

    const cumulativeReductionPoints = await this.getCumulativeReductionPoints(userId);
    const ecoSwapPoints = await this.getTotalEcoSwapPoints(userId);

    // Projected points for the current month (not yet finalized)
    const now = new Date();
    const reductionStats = await this.getReductionStats(userId, now.getFullYear(), now.getMonth() + 1);
    const projectedReductionPoints =
      reductionStats.baseline !== null && reductionStats.current_month_co2 < reductionStats.baseline
        ? Math.floor(reductionStats.reduction_kg)
        : 0;

    return {
      cumulative_reduction_points: cumulativeReductionPoints,
      eco_swap_points: ecoSwapPoints,
      total_earned_points: cumulativeReductionPoints + ecoSwapPoints,
      projected_reduction_points_this_month: projectedReductionPoints,
    };
  }


  async getMonthlyHistory(userId: string) {
    const { data: user } = await this.dbService.db
      .from('users')
      .select('baseline_co2_monthly, baseline_locked, baseline_period_start')
      .eq('id', userId)
      .single();

    if (!user?.baseline_locked) {
      return { message: 'Baseline not established', history: [] };
    }

    // Finalize any past months before building history
    await this.finalizePastMonths(userId);

    // Get all months with emission data
    const { data: allEmissions } = await this.dbService.db
      .from('carbon_emissions')
      .select('kg_co2e, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .async();

    if (!allEmissions || allEmissions.length === 0) {
      return { history: [] };
    }

    // Load all finalized monthly_points records for this user
    const { data: finalizedRecords } = await this.dbService.db
      .from('monthly_points')
      .select('year, month, points_earned')
      .eq('user_id', userId);

    const finalizedMap = new Map<string, number>(
      (finalizedRecords || []).map((r: any) => [`${r.year}-${r.month}`, r.points_earned]),
    );

    const now = new Date();
    const currentKey = `${now.getFullYear()}-${now.getMonth() + 1}`;

    // Group by month
    const monthMap = new Map<string, number>();
    allEmissions.forEach((e: any) => {
      const date = new Date(e.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(key, (monthMap.get(key) || 0) + e.kg_co2e);
    });

    // Convert to array
    const history = Array.from(monthMap.entries()).map(([monthKey, co2]) => {
      const [yr, mo] = monthKey.split('-').map(Number);
      const reductionKg = Math.max(0, user.baseline_co2_monthly - co2);
      const reductionPercent = (reductionKg / user.baseline_co2_monthly) * 100;
      const lookupKey = `${yr}-${mo}`;
      const isCurrentMonth = lookupKey === currentKey;

      // Use finalized points for past months; projected for the current month
      const points = isCurrentMonth
        ? (co2 < user.baseline_co2_monthly ? Math.floor(user.baseline_co2_monthly - co2) : 0)
        : (finalizedMap.get(lookupKey) ?? 0);

      return {
        month: monthKey,
        baseline: user.baseline_co2_monthly,
        actual_co2: Math.round(co2 * 10000) / 10000,
        reduction_kg: Math.round(reductionKg * 10000) / 10000,
        reduction_percent: Math.round(reductionPercent * 100) / 100,
        points,
        finalized: !isCurrentMonth,
      };
    });

    return { baseline_established: user.baseline_period_start, history };
  }
}
