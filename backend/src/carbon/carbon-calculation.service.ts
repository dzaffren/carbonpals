import { Injectable } from '@nestjs/common';

interface CarbonEmissionFactor {
  [category: string]: number;
}

@Injectable()
export class CarbonCalculationService {
  private emissionFactors: CarbonEmissionFactor = {
    fuel: 2.31,
    groceries: 0.5,
    electricity: 0.4,
    transportation: 0.15,
    meat: 27.0,
    dairy: 1.9,
    clothing: 5.0,
    home_heating: 0.2,
    flights: 255.0,
    restaurant: 1.5,
    default: 0.5,
  };

  calculateEmissions(amount: number, category: string): number {
    const factor = this.emissionFactors[category.toLowerCase()] || this.emissionFactors.default;
    return Math.round(amount * factor * 10000) / 10000;
  }

  updateEmissionFactors(factors: Partial<CarbonEmissionFactor>) {
    this.emissionFactors = { ...this.emissionFactors, ...factors } as CarbonEmissionFactor;
  }

  getEmissionFactors(): CarbonEmissionFactor {
    return { ...this.emissionFactors };
  }

  calculateTotalEmissions(entries: Array<{ amount: number; category: string }>): number {
    return entries.reduce(
      (total, entry) => total + this.calculateEmissions(entry.amount, entry.category),
      0,
    );
  }

  calculatePoints(carbonKgCO2e: number): number {
    return Math.floor(carbonKgCO2e);
  }

  calculateReductionPoints(baseline: number, actual: number): number {
    return Math.max(0, baseline - actual);
  }
}
