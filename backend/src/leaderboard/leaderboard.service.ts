import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CarbonCalculationService } from '../carbon/carbon-calculation.service';

@Injectable()
export class LeaderboardService {
  constructor(
    private dbService: DatabaseService,
    private carbonCalcService: CarbonCalculationService,
  ) {}

  async getLeaderboard(period: 'all_time' | 'monthly' | 'weekly' = 'all_time', limit = 50) {
    const { data: expenditures } = await this.dbService.db
      .from('expenditures')
      .select('user_id, category, amount, created_at');

    const { data: users } = await this.dbService.db
      .from('users')
      .select('id, username, display_name, avatar_url');

    if (!expenditures || !users) return [];

    const userStats: {
      [userId: string]: {
        username?: string;
        display_name?: string;
        avatar_url?: string;
        totalCarbon: number;
        totalSpent: number;
        expenditures: number;
      };
    } = {};

    // Build user stats
    expenditures.forEach((exp: any) => {
      if (!userStats[exp.user_id]) {
        const user = users.find((u: any) => u.id === exp.user_id);
        userStats[exp.user_id] = {
          username: user?.username,
          display_name: user?.display_name,
          avatar_url: user?.avatar_url,
          totalCarbon: 0,
          totalSpent: 0,
          expenditures: 0,
        };
      }

      const carbon = this.carbonCalcService.calculateEmissions(exp.amount, exp.category);
      userStats[exp.user_id].totalCarbon += carbon;
      userStats[exp.user_id].totalSpent += exp.amount;
      userStats[exp.user_id].expenditures += 1;
    });

    // Convert to array and sort
    const leaderboard = Object.entries(userStats)
      .map(([userId, stats]) => ({
        userId,
        ...stats,
        totalCarbon: Math.round(stats.totalCarbon * 100) / 100,
        totalSpent: Math.round(stats.totalSpent * 100) / 100,
      }))
      .sort((a, b) => b.totalCarbon - a.totalCarbon)
      .slice(0, limit)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    return leaderboard;
  }

  async getUserRank(userId: string) {
    const leaderboard = await this.getLeaderboard('all_time', 500);
    const userEntry = leaderboard.find((entry) => entry.userId === userId);
    return userEntry || null;
  }

  async getTopByCategory(category: string, limit = 10) {
    const { data: expenditures } = await this.dbService.db
      .from('expenditures')
      .select('user_id, category, amount')
      .eq('category', category);

    const { data: users } = await this.dbService.db
      .from('users')
      .select('id, username, display_name');

    if (!expenditures || !users) return [];

    const userTotals: { [userId: string]: { username?: string; display_name?: string; amount: number } } = {};

    expenditures.forEach((exp: any) => {
      if (!userTotals[exp.user_id]) {
        const user = users.find((u: any) => u.id === exp.user_id);
        userTotals[exp.user_id] = {
          username: user?.username,
          display_name: user?.display_name,
          amount: 0,
        };
      }
      userTotals[exp.user_id].amount += exp.amount;
    });

    return Object.entries(userTotals)
      .map(([userId, stats]) => ({ userId, ...stats }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit);
  }
}
