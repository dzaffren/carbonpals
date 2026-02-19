import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PetsService } from '../pets/pets.service';

export type EcoSwapType =
  | 'public_transit'
  | 'vegetarian'
  | 'secondhand'
  | 'biking'
  | 'plant_based';

interface EcoSwapRecord {
  id: string;
  user_id: string;
  swap_type: EcoSwapType;
  points_awarded: number;
  created_at: string;
}

interface SwapStats {
  public_transit?: number;
  vegetarian?: number;
  secondhand?: number;
  biking?: number;
  plant_based?: number;
  total?: number;
}

@Injectable()
export class EcoSwapsService {
  private swapPoints: Record<EcoSwapType, number> = {
    public_transit: 10,
    vegetarian: 5,
    secondhand: 20,
    biking: 15,
    plant_based: 3,
  };

  constructor(
    private dbService: DatabaseService,
    private petsService: PetsService,
  ) {}

  async createSwap(
    token: string,
    userId: string,
    swapType: EcoSwapType,
  ): Promise<{ points: number; swap: EcoSwapRecord }> {
    const pointsAwarded = this.swapPoints[swapType];

    const { data, error } = await this.dbService.db
      .from('eco_swaps')
      .insert([
        {
          user_id: userId,
          swap_type: swapType,
          points_awarded: pointsAwarded,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Award pet XP equal to the swap's points (green actions grow the pet)
    try {
      await this.petsService.addExperience(userId, pointsAwarded);
    } catch (petErr) {
      console.error('Failed to update pet experience:', petErr);
    }

    return {
      points: pointsAwarded,
      swap: data,
    };
  }

  async getUserSwaps(
    token: string,
    userId: string,
  ): Promise<EcoSwapRecord[]> {
    const { data, error } = await this.dbService.db
      .from('eco_swaps')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .async();

    if (error) throw error;
    return data || [];
  }

  async getSwapStats(
    token: string,
    userId: string,
    period?: 'week' | 'month' | 'year',
  ): Promise<SwapStats> {
    let query = this.dbService.db
      .from('eco_swaps')
      .select('swap_type')
      .eq('user_id', userId);

    if (period) {
      const now = new Date();
      let startDate = new Date();

      switch (period) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      query = query.gte('created_at', startDate.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    const stats: SwapStats = {
      public_transit: 0,
      vegetarian: 0,
      secondhand: 0,
      biking: 0,
      plant_based: 0,
      total: 0,
    };

    if (data) {
      data.forEach((record: any) => {
        const swapType = record.swap_type as EcoSwapType;
        if (swapType in stats) {
          stats[swapType] = (stats[swapType] || 0) + 1;
        }
        stats.total = (stats.total || 0) + 1;
      });
    }

    return stats;
  }
}

