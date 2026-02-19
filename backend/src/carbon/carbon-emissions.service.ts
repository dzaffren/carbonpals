import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CarbonCalculationService } from './carbon-calculation.service';

@Injectable()
export class CarbonEmissionsService {
  constructor(
    private dbService: DatabaseService,
    private carbonCalcService: CarbonCalculationService,
  ) {}

  async recordEmission(
    expenditureId: string,
    userId: string,
    category: string,
    amount: number,
  ) {
    const kgCO2e = this.carbonCalcService.calculateEmissions(amount, category);
    const { data, error } = await this.dbService.db
      .from('carbon_emissions')
      .insert([
        {
          expenditure_id: expenditureId,
          user_id: userId,
          category,
          kg_co2e: kgCO2e,
          calculation_method: 'default_factors',
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserTotalEmissions(userId: string): Promise<number> {
    const { data, error } = await this.dbService.db
      .from('carbon_emissions')
      .select('kg_co2e')
      .eq('user_id', userId)
      .async();

    if (error) throw error;
    return (data || []).reduce((sum: number, entry: any) => sum + (entry.kg_co2e || 0), 0);
  }

  async getUserEmissionsByCategory(userId: string) {
    const { data, error } = await this.dbService.db
      .from('carbon_emissions')
      .select('category, kg_co2e')
      .eq('user_id', userId)
      .async();

    if (error) throw error;
    const totals: { [key: string]: number } = {};
    (data || []).forEach((entry: any) => {
      totals[entry.category] = (totals[entry.category] || 0) + entry.kg_co2e;
    });
    return totals;
  }

  async getEmissionStats(userId: string) {
    const total = await this.getUserTotalEmissions(userId);
    const byCategory = await this.getUserEmissionsByCategory(userId);
    return {
      total_kg_co2e: Math.round(total * 100) / 100,
      by_category: Object.entries(byCategory).reduce(
        (acc: { [key: string]: number }, [category, amount]) => {
          acc[category] = Math.round((amount as number) * 100) / 100;
          return acc;
        },
        {},
      ),
    };
  }
}
