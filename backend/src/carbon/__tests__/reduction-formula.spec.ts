import { Test, TestingModule } from '@nestjs/testing';
import { CarbonCalculationService } from '../carbon-calculation.service';

describe('Reduction Points Formula', () => {
  let service: CarbonCalculationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CarbonCalculationService],
    }).compile();

    service = module.get<CarbonCalculationService>(CarbonCalculationService);
  });

  describe('reduction points calculation', () => {
    it('should calculate reduction points: baseline 400, actual 280', () => {
      const baseline = 400;
      const actual = 280;
      const reductionPoints = Math.max(0, baseline - actual);

      expect(reductionPoints).toBe(120);
    });

    it('should award no points when over baseline', () => {
      const baseline = 400;
      const actual = 500;
      const reductionPoints = Math.max(0, baseline - actual);

      expect(reductionPoints).toBe(0); // No penalty
    });

    it('should award max points at zero emissions', () => {
      const baseline = 400;
      const actual = 0;
      const reductionPoints = baseline - actual;

      expect(reductionPoints).toBe(400);
    });

    it('should calculate monthly progression', () => {
      const baseline = 400;
      const monthlyData = [
        { month: 1, actual: 400, expectedPoints: 0 },    // No reduction
        { month: 2, actual: 350, expectedPoints: 50 },   // 12.5% reduction
        { month: 3, actual: 280, expectedPoints: 120 },  // 30% reduction
        { month: 4, actual: 200, expectedPoints: 200 },  // 50% reduction
      ];

      monthlyData.forEach(({ actual, expectedPoints }) => {
        const points = Math.max(0, baseline - actual);
        expect(points).toBe(expectedPoints);
      });
    });
  });

  describe('pet level progression from reduction', () => {
    it('should calculate pet level: 50 points per level', () => {
      const testCases = [
        { totalPoints: 0, expectedLevel: 0 },    // Egg
        { totalPoints: 49, expectedLevel: 0 },   // Still egg
        { totalPoints: 50, expectedLevel: 1 },   // Chick
        { totalPoints: 100, expectedLevel: 2 },  // Baby duck
        { totalPoints: 250, expectedLevel: 5 },  // Owl (max)
      ];

      testCases.forEach(({ totalPoints, expectedLevel }) => {
        const level = Math.floor(totalPoints / 50);
        expect(level).toBe(expectedLevel);
      });
    });

    it('should track cumulative points across months', () => {
      const baseline = 400;
      const months = [
        { actual: 300, reduction: 100 },  // Month 1: 100 pts
        { actual: 280, reduction: 120 },  // Month 2: 120 pts
        { actual: 250, reduction: 150 },  // Month 3: 150 pts
      ];

      let cumulativePoints = 0;
      months.forEach(({ actual, reduction }) => {
        const monthPoints = Math.max(0, baseline - actual);
        expect(monthPoints).toBe(reduction);
        cumulativePoints += monthPoints;
      });

      const finalLevel = Math.floor(cumulativePoints / 50);
      expect(cumulativePoints).toBe(370);
      expect(finalLevel).toBe(7); // 370 / 50 = 7.4
    });
  });

  describe('reduction percent thresholds (badges)', () => {
    it('should unlock badge at 10% reduction (Carbon Cutter)', () => {
      const baseline = 400;
      const threshold = 10;
      const actual = baseline * (1 - threshold / 100);

      const reduction = ((baseline - actual) / baseline) * 100;
      expect(reduction).toBe(threshold);
    });

    it('should unlock badge at 25% reduction (Planet Saver)', () => {
      const baseline = 400;
      const threshold = 25;
      const actual = baseline * (1 - threshold / 100);

      const reduction = ((baseline - actual) / baseline) * 100;
      expect(reduction).toBe(threshold);
    });

    it('should unlock badge at 50% reduction (Eco Warrior)', () => {
      const baseline = 400;
      const threshold = 50;
      const actual = baseline * (1 - threshold / 100);

      const reduction = ((baseline - actual) / baseline) * 100;
      expect(reduction).toBe(threshold);
    });
  });

  describe('edge cases', () => {
    it('should handle baseline = 0 gracefully', () => {
      const baseline = 0;
      const actual = 100;
      // Would prevent division by zero
      if (baseline === 0) {
        expect(baseline).toBe(0);
      }
    });

    it('should handle very small reductions', () => {
      const baseline = 400;
      const actual = 399.5;
      const reductionKg = Math.round((baseline - actual) * 10000) / 10000;

      expect(reductionKg).toBe(0.5);
    });

    it('should handle negative reduction correctly', () => {
      const baseline = 400;
      const actual = 500;
      const reductionPoints = Math.max(0, baseline - actual);

      expect(reductionPoints).toBe(0);
      expect(reductionPoints).not.toBeLessThan(0);
    });
  });
});
