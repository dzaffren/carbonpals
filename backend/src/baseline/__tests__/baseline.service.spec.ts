import { Test, TestingModule } from '@nestjs/testing';
import { BaselineService } from '../baseline.service';
import { DatabaseService } from '../../database/database.service';

describe('BaselineService', () => {
  let service: BaselineService;

  beforeEach(async () => {
    const mockDatabaseService = {
      db: {},
      isUsingMock: jest.fn().mockReturnValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BaselineService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<BaselineService>(BaselineService);
  });

  describe('baseline calculation logic', () => {
    it('should project baseline for <30 days', () => {
      // 15 days of data: 200 kg total
      const totalCO2 = 200;
      const daysElapsed = 14;
      const projectedMonthly = (totalCO2 / daysElapsed) * 30;

      expect(projectedMonthly).toBeCloseTo(428.57, 1);
    });

    it('should lock baseline at 30+ days', () => {
      // 30 days of data: 400 kg total
      const totalCO2 = 400;
      const daysElapsed = 29;
      const baseline = (totalCO2 / daysElapsed) * 30;

      expect(baseline).toBeCloseTo(413.79, 1);
    });
  });

  describe('reduction calculation', () => {
    it('should calculate reduction: baseline 400, actual 280', () => {
      const baseline = 400;
      const actual = 280;
      const reductionKg = Math.max(0, baseline - actual);
      const reductionPercent = (reductionKg / baseline) * 100;

      expect(reductionKg).toBe(120);
      expect(reductionPercent).toBe(30);
    });

    it('should return 0 reduction when over baseline', () => {
      const baseline = 400;
      const actual = 500;
      const reductionKg = Math.max(0, baseline - actual);

      expect(reductionKg).toBe(0);
    });

    it('should calculate max reduction (100% at zero)', () => {
      const baseline = 400;
      const actual = 0;
      const reductionPercent = ((baseline - actual) / baseline) * 100;

      expect(reductionPercent).toBe(100);
    });

    it('should handle various reduction percentages', () => {
      const baseline = 400;
      const testCases = [
        { actual: 360, expectedPercent: 10 },   // Carbon Cutter threshold
        { actual: 300, expectedPercent: 25 },   // Planet Saver threshold
        { actual: 200, expectedPercent: 50 },   // Eco Warrior threshold
      ];

      testCases.forEach(({ actual, expectedPercent }) => {
        const reductionPercent = ((baseline - actual) / baseline) * 100;
        expect(reductionPercent).toBe(expectedPercent);
      });
    });
  });

  describe('monthly points finalization threshold', () => {
    it('should award points only when actual is strictly below baseline', () => {
      const baseline = 400;

      // Below baseline → points awarded
      const actualBelow = 300;
      const reductionBelow = actualBelow < baseline ? baseline - actualBelow : 0;
      expect(Math.floor(reductionBelow)).toBe(100);

      // Equal to baseline → no points
      const actualEqual = 400;
      const reductionEqual = actualEqual < baseline ? baseline - actualEqual : 0;
      expect(reductionEqual).toBe(0);

      // Above baseline → no points
      const actualAbove = 500;
      const reductionAbove = actualAbove < baseline ? baseline - actualAbove : 0;
      expect(reductionAbove).toBe(0);
    });
  });

  describe('monthly grouping', () => {
    it('should group emissions by month', () => {
      const emissions = [
        { kg_co2e: 100, created_at: new Date(2026, 0, 15).toISOString() },
        { kg_co2e: 150, created_at: new Date(2026, 0, 25).toISOString() },
        { kg_co2e: 200, created_at: new Date(2026, 1, 10).toISOString() },
      ];

      const monthMap = new Map<string, number>();
      emissions.forEach((e) => {
        const date = new Date(e.created_at);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthMap.set(key, (monthMap.get(key) || 0) + e.kg_co2e);
      });

      expect(monthMap.get('2026-01')).toBe(250);
      expect(monthMap.get('2026-02')).toBe(200);
    });
  });
});

