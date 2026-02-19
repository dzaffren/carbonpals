import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CarbonCalculationService } from '../carbon/carbon-calculation.service';

export interface BadgeDefinition {
  type: string;
  name: string;
  description: string;
  threshold: number;
  icon: string;
}

@Injectable()
export class BadgesService {
  private badges: { [key: string]: BadgeDefinition } = {
    first_tracker: {
      type: 'first_tracker',
      name: 'First Steps',
      description: 'Log your first expenditure',
      threshold: 1,
      icon: '🌱',
    },
    carbon_cutter: {
      type: 'carbon_cutter',
      name: 'Carbon Cutter',
      description: 'Achieve 10% reduction in carbon emissions',
      threshold: 10,
      icon: '✂️',
    },
    planet_saver: {
      type: 'planet_saver',
      name: 'Planet Saver',
      description: 'Achieve 25% reduction in carbon emissions',
      threshold: 25,
      icon: '🌍',
    },
    eco_warrior: {
      type: 'eco_warrior',
      name: 'Eco Warrior',
      description: 'Achieve 50% reduction in carbon emissions',
      threshold: 50,
      icon: '⚔️',
    },
    green_warrior: {
      type: 'green_warrior',
      name: 'Green Warrior',
      description: 'Complete 10 eco-swaps',
      threshold: 10,
      icon: '🟢',
    },
    veggie_lover: {
      type: 'veggie_lover',
      name: 'Veggie Lover',
      description: 'Complete 5 vegetarian eco-swaps',
      threshold: 5,
      icon: '🥬',
    },
    transit_master: {
      type: 'transit_master',
      name: 'Transit Master',
      description: 'Complete 5 public transit eco-swaps',
      threshold: 5,
      icon: '🚌',
    },
    consistent_hero: {
      type: 'consistent_hero',
      name: 'Consistent Hero',
      description: 'Maintain 20%+ reduction for 3+ consecutive months',
      threshold: 3,
      icon: '🏆',
    },
  };

  constructor(
    private dbService: DatabaseService,
    private carbonCalcService: CarbonCalculationService,
  ) {}

  async checkAndUnlockBadges(userId: string) {
    const unlockedBadges = [];

    // Get current stats
    const { data: expenditures } = await this.dbService.db
      .from('expenditures')
      .select('category, amount')
      .eq('user_id', userId);

    const { data: ecoSwaps } = await this.dbService.db
      .from('eco_swaps')
      .select('swap_type')
      .eq('user_id', userId);

    // Calculate baseline and actual emissions for reduction
    const { data: baselines } = await this.dbService.db
      .from('baseline')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Calculate stats
    const totalCarbon = expenditures?.reduce(
      (sum: number, e: any) => sum + this.carbonCalcService.calculateEmissions(e.amount, e.category),
      0,
    ) || 0;

    const expenditureCount = expenditures?.length || 0;

    // Calculate reduction percentage
    let reductionPercent = 0;
    if (baselines && baselines.total_baseline > 0) {
      reductionPercent = Math.max(
        0,
        ((baselines.total_baseline - totalCarbon) / baselines.total_baseline) * 100,
      );
    }

    // Count eco-swaps by type
    const ecoSwapCounts = {
      vegetarian: 0,
      public_transit: 0,
      total: 0,
    };

    if (ecoSwaps) {
      ecoSwaps.forEach((swap: any) => {
        ecoSwapCounts.total++;
        if (swap.swap_type === 'vegetarian') ecoSwapCounts.vegetarian++;
        if (swap.swap_type === 'public_transit') ecoSwapCounts.public_transit++;
      });
    }

    // Check first tracker
    if (expenditureCount >= 1) {
      unlockedBadges.push(await this.unlockBadge(userId, 'first_tracker'));
    }

    // Check carbon reduction milestones
    if (reductionPercent >= 10) {
      unlockedBadges.push(await this.unlockBadge(userId, 'carbon_cutter'));
    }
    if (reductionPercent >= 25) {
      unlockedBadges.push(await this.unlockBadge(userId, 'planet_saver'));
    }
    if (reductionPercent >= 50) {
      unlockedBadges.push(await this.unlockBadge(userId, 'eco_warrior'));
    }

    // Check eco-swap milestones
    if (ecoSwapCounts.total >= 10) {
      unlockedBadges.push(await this.unlockBadge(userId, 'green_warrior'));
    }
    if (ecoSwapCounts.vegetarian >= 5) {
      unlockedBadges.push(await this.unlockBadge(userId, 'veggie_lover'));
    }
    if (ecoSwapCounts.public_transit >= 5) {
      unlockedBadges.push(await this.unlockBadge(userId, 'transit_master'));
    }

    // Check consistent hero (3+ consecutive months with 20%+ reduction)
    const consistentMonths = await this.checkConsecutiveMonths(userId, 20);
    if (consistentMonths >= 3) {
      unlockedBadges.push(await this.unlockBadge(userId, 'consistent_hero'));
    }

    return unlockedBadges.filter(b => b !== null);
  }

  private async checkConsecutiveMonths(userId: string, minReductionPercent: number): Promise<number> {
    const { data: monthlyStats } = await this.dbService.db
      .from('monthly_carbon_stats')
      .select('*')
      .eq('user_id', userId)
      .order('month', { ascending: false })
      .async();

    const limited = (monthlyStats || []).slice(0, 12);
    if (!limited || limited.length === 0) return 0;

    let consecutiveCount = 0;
    for (const stat of limited) {
      if (stat.reduction_percent >= minReductionPercent) {
        consecutiveCount++;
      } else {
        break;
      }
    }

    return consecutiveCount;
  }

  private async unlockBadge(userId: string, badgeType: string) {
    // Check if already unlocked
    const { data: existing } = await this.dbService.db
      .from('badges')
      .select('*')
      .eq('user_id', userId)
      .eq('badge_type', badgeType)
      .single();

    if (existing) {
      return null; // Already unlocked
    }

    const badgeDef = this.badges[badgeType];
    const { data, error } = await this.dbService.db
      .from('badges')
      .insert([
        {
          user_id: userId,
          badge_type: badgeType,
          metadata: {
            name: badgeDef.name,
            description: badgeDef.description,
            icon: badgeDef.icon,
          },
        },
      ])
      .select()
      .single();

    if (error) return null;
    return data;
  }

  async getUserBadges(userId: string) {
    const { data, error } = await this.dbService.db
      .from('badges')
      .select('*')
      .eq('user_id', userId)
      .async();

    if (error || !data) return [];
    return data.map((badge: any) => ({
      id: badge.id,
      type: badge.badge_type,
      ...badge.metadata,
      unlockedAt: badge.unlocked_at,
    }));
  }

  getBadgeDefinitions() {
    return Object.values(this.badges);
  }
}
