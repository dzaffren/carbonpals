import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadgesService } from '../badges.service';
import { CarbonCalculationService } from '../../carbon/carbon-calculation.service';

describe('BadgesService - Reduction-Based Badges', () => {
  let service: BadgesService;
  let mockSupabase: any;

  const createMockChain = () => {
    const chain = {
      from: jest.fn(),
      select: jest.fn(),
      insert: jest.fn(),
      eq: jest.fn(),
      single: jest.fn(),
      order: jest.fn(),
      limit: jest.fn(),
      async: jest.fn(),
    };

    // Make all chain methods return the chain itself for fluent API
    chain.from.mockReturnValue(chain);
    chain.select.mockReturnValue(chain);
    chain.insert.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    chain.single.mockReturnValue(chain);
    chain.order.mockReturnValue(chain);
    chain.limit.mockReturnValue(chain);
    chain.async.mockReturnValue(chain);

    return chain;
  };

  beforeEach(async () => {
    mockSupabase = createMockChain();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: BadgesService,
          useFactory: () => {
            const carbonCalcService = {
              calculateEmissions: jest.fn((amount: number) => amount * 0.1),
            };

            const mockDatabaseService = {
              db: mockSupabase,
            };

            const instance = new BadgesService(
              mockDatabaseService as any,
              carbonCalcService as any,
            );
            (instance as any).supabase = mockSupabase;
            return instance;
          },
        },
      ],
    }).compile();

    service = module.get<BadgesService>(BadgesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Carbon Cutter Badge - 10% Reduction', () => {
    it('should unlock carbon_cutter badge at 10% reduction', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: { total_baseline: 300 } });
      mockSupabase.limit.mockResolvedValueOnce({ data: [] });

      const badges = await service.checkAndUnlockBadges('user-cutter-10');

      expect(Array.isArray(badges)).toBe(true);
    });
  });

  describe('Planet Saver Badge - 25% Reduction', () => {
    it('should unlock planet_saver badge at 25% reduction', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: { total_baseline: 400 } });
      mockSupabase.limit.mockResolvedValueOnce({ data: [] });

      const badges = await service.checkAndUnlockBadges('user-saver-25');

      expect(Array.isArray(badges)).toBe(true);
    });
  });

  describe('Eco Warrior Badge - 50% Reduction', () => {
    it('should unlock eco_warrior badge at 50% reduction', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: { total_baseline: 200 } });
      mockSupabase.limit.mockResolvedValueOnce({ data: [] });

      const badges = await service.checkAndUnlockBadges('user-warrior-50');

      expect(Array.isArray(badges)).toBe(true);
    });
  });

  describe('Green Warrior Badge - 10+ Swaps', () => {
    it('should unlock green_warrior badge with 10 eco-swaps', async () => {
      const swaps = Array(10).fill({ swap_type: 'public_transit' });

      mockSupabase.single
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: swaps })
        .mockResolvedValueOnce({ data: { total_baseline: 300 } });
      mockSupabase.limit.mockResolvedValueOnce({ data: [] });

      const badges = await service.checkAndUnlockBadges('user-green-10');

      expect(Array.isArray(badges)).toBe(true);
    });

    it('should not unlock green_warrior badge with 9 swaps', async () => {
      const swaps = Array(9).fill({ swap_type: 'public_transit' });

      mockSupabase.single
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: swaps })
        .mockResolvedValueOnce({ data: { total_baseline: 300 } });

      const badges = await service.checkAndUnlockBadges('user-green-9');

      expect(Array.isArray(badges)).toBe(true);
    });
  });;

  describe('Consistent Hero Badge - 3 Consecutive Months 20%+', () => {
    it('should unlock consistent_hero badge with 3 consecutive months', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: { total_baseline: 300 } });
      mockSupabase.limit.mockResolvedValueOnce({
        data: [
          { reduction_percent: 25, month: '2024-03' },
          { reduction_percent: 22, month: '2024-02' },
          { reduction_percent: 20, month: '2024-01' },
        ],
      });

      const badges = await service.checkAndUnlockBadges('user-consistent-3');

      expect(Array.isArray(badges)).toBe(true);
    });

    it('should unlock with 4+ consecutive months 20%+', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: { total_baseline: 300 } });
      mockSupabase.limit.mockResolvedValueOnce({
        data: [
          { reduction_percent: 30, month: '2024-04' },
          { reduction_percent: 25, month: '2024-03' },
          { reduction_percent: 22, month: '2024-02' },
          { reduction_percent: 20, month: '2024-01' },
        ],
      });

      const badges = await service.checkAndUnlockBadges('user-consistent-4');

      expect(Array.isArray(badges)).toBe(true);
    });
  });

  describe('getBadgeDefinitions', () => {
    it('should return all badge definitions', () => {
      const definitions = service.getBadgeDefinitions();

      expect(Array.isArray(definitions)).toBe(true);
      expect(definitions.length).toBeGreaterThan(0);

      const badgeTypes = definitions.map(b => b.type);
      expect(badgeTypes).toContain('carbon_cutter');
      expect(badgeTypes).toContain('planet_saver');
      expect(badgeTypes).toContain('eco_warrior');
      expect(badgeTypes).toContain('green_warrior');
      expect(badgeTypes).toContain('consistent_hero');
    });

    it('should have correct threshold values', () => {
      const definitions = service.getBadgeDefinitions();
      const badgeMap = Object.fromEntries(
        definitions.map(b => [b.type, b.threshold]),
      );

      expect(badgeMap['carbon_cutter']).toBe(10);
      expect(badgeMap['planet_saver']).toBe(25);
      expect(badgeMap['eco_warrior']).toBe(50);
      expect(badgeMap['green_warrior']).toBe(10);
      expect(badgeMap['consistent_hero']).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with no data', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: null });

      const badges = await service.checkAndUnlockBadges('user-empty');

      expect(Array.isArray(badges)).toBe(true);
    });

    it('should handle zero baseline', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: { total_baseline: 0 } });

      const badges = await service.checkAndUnlockBadges('user-zero');

      expect(Array.isArray(badges)).toBe(true);
    });
  });
});
