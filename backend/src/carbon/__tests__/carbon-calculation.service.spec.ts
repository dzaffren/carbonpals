import { Test, TestingModule } from '@nestjs/testing';
import { CarbonCalculationService } from '../carbon-calculation.service';

describe('CarbonCalculationService', () => {
  let service: CarbonCalculationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CarbonCalculationService],
    }).compile();

    service = module.get<CarbonCalculationService>(CarbonCalculationService);
  });

  describe('calculateEmissions', () => {
    it('should calculate fuel emissions correctly', () => {
      const emissions = service.calculateEmissions(50, 'fuel');
      expect(emissions).toBeCloseTo(115.5, 1);
    });

    it('should calculate groceries emissions correctly', () => {
      const emissions = service.calculateEmissions(100, 'groceries');
      expect(emissions).toBe(50);
    });

    it('should use default factor for unknown category', () => {
      const emissions = service.calculateEmissions(100, 'unknown');
      expect(emissions).toBe(50);
    });

    it('should handle zero amount', () => {
      const emissions = service.calculateEmissions(0, 'fuel');
      expect(emissions).toBe(0);
    });

    it('should be case-insensitive for category', () => {
      const emissions1 = service.calculateEmissions(50, 'FUEL');
      const emissions2 = service.calculateEmissions(50, 'fuel');
      expect(emissions1).toEqual(emissions2);
    });
  });

  describe('calculatePoints', () => {
    it('should convert kg CO2 to points correctly', () => {
      const points = service.calculatePoints(123.45);
      expect(points).toBe(123);
    });

    it('should floor decimal points', () => {
      const points = service.calculatePoints(99.99);
      expect(points).toBe(99);
    });
  });

  describe('calculateTotalEmissions', () => {
    it('should sum emissions from multiple entries', () => {
      const entries = [
        { amount: 50, category: 'fuel' },
        { amount: 100, category: 'groceries' },
      ];
      const total = service.calculateTotalEmissions(entries);
      expect(total).toBeCloseTo(165.5, 1);
    });

    it('should handle empty array', () => {
      const total = service.calculateTotalEmissions([]);
      expect(total).toBe(0);
    });
  });

  describe('updateEmissionFactors', () => {
    it('should update factors without affecting others', () => {
      service.updateEmissionFactors({ fuel: 3.0 });
      const emissions = service.calculateEmissions(50, 'fuel');
      expect(emissions).toBe(150);

      const groceryEmissions = service.calculateEmissions(100, 'groceries');
      expect(groceryEmissions).toBe(50);
    });
  });
});
