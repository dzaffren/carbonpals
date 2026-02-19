import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EcoSwapsService, EcoSwapType } from '../eco-swaps.service';

describe('EcoSwapsService', () => {
  let service: EcoSwapsService;
  let mockSupabase: any;

  const createMockChain = () => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(),
    async: jest.fn(),
  });

  beforeEach(async () => {
    mockSupabase = createMockChain();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: EcoSwapsService,
          useFactory: () => {
            const mockDatabaseService = {
              db: mockSupabase,
            };

            const instance = new EcoSwapsService(
              mockDatabaseService as any,
              { addExperience: jest.fn().mockResolvedValue(undefined) } as any,
            );
            (instance as any).supabase = mockSupabase;
            return instance;
          },
        },
      ],
    }).compile();

    service = module.get<EcoSwapsService>(EcoSwapsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSwap', () => {
    it('should create swap with public_transit and award 10 points', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'swap-1',
          swap_type: 'public_transit',
          points_awarded: 10,
        },
      });

      const result = await service.createSwap('token', 'user-123', 'public_transit');

      expect(result.points).toBe(10);
    });

    it('should create swap with vegetarian and award 5 points', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'swap-2',
          swap_type: 'vegetarian',
          points_awarded: 5,
        },
      });

      const result = await service.createSwap('token', 'user-456', 'vegetarian');

      expect(result.points).toBe(5);
    });

    it('should create swap with secondhand and award 20 points', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'swap-3',
          swap_type: 'secondhand',
          points_awarded: 20,
        },
      });

      const result = await service.createSwap('token', 'user-789', 'secondhand');

      expect(result.points).toBe(20);
    });

    it('should create swap with biking and award 15 points', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'swap-4',
          swap_type: 'biking',
          points_awarded: 15,
        },
      });

      const result = await service.createSwap('token', 'user-111', 'biking');

      expect(result.points).toBe(15);
    });

    it('should create swap with plant_based and award 3 points', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'swap-5',
          swap_type: 'plant_based',
          points_awarded: 3,
        },
      });

      const result = await service.createSwap('token', 'user-222', 'plant_based');

      expect(result.points).toBe(3);
    });
  });

  describe('getUserSwaps', () => {
    it('should retrieve user swap history', async () => {
      const mockSwaps = [
        {
          id: 'swap-1',
          swap_type: 'public_transit',
          created_at: '2024-02-20T10:00:00Z',
        },
        {
          id: 'swap-2',
          swap_type: 'vegetarian',
          created_at: '2024-02-19T15:30:00Z',
        },
      ];

      mockSupabase.async.mockResolvedValueOnce({
        data: mockSwaps,
        error: null,
      });

      const result = await service.getUserSwaps('token', 'user-history');

      expect(result).toHaveLength(2);
      expect(result[0].swap_type).toBe('public_transit');
    });

    it('should return empty array when no swaps exist', async () => {
      mockSupabase.async.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await service.getUserSwaps('token', 'user-no-swaps');

      expect(result).toEqual([]);
    });
  });

  describe('getSwapStats', () => {
    it('should count swaps by type', async () => {
      const mockSwaps = [
        { swap_type: 'public_transit' },
        { swap_type: 'public_transit' },
        { swap_type: 'vegetarian' },
        { swap_type: 'biking' },
        { swap_type: 'biking' },
      ];

      mockSupabase.eq.mockResolvedValueOnce({
        data: mockSwaps,
      });

      const stats = await service.getSwapStats('token', 'user-stats');

      expect(stats.public_transit).toBe(2);
      expect(stats.vegetarian).toBe(1);
      expect(stats.biking).toBe(2);
      expect(stats.total).toBe(5);
    });

    it('should return zero stats when no swaps exist', async () => {
      mockSupabase.eq.mockResolvedValueOnce({
        data: [],
      });

      const stats = await service.getSwapStats('token', 'user-empty');

      expect(stats.total).toBe(0);
    });

    it('should handle all swap types', async () => {
      const mockSwaps = [
        { swap_type: 'public_transit' },
        { swap_type: 'vegetarian' },
        { swap_type: 'secondhand' },
        { swap_type: 'biking' },
        { swap_type: 'plant_based' },
      ];

      mockSupabase.eq.mockResolvedValueOnce({
        data: mockSwaps,
      });

      const stats = await service.getSwapStats('token', 'user-all');

      expect(stats.public_transit).toBe(1);
      expect(stats.vegetarian).toBe(1);
      expect(stats.secondhand).toBe(1);
      expect(stats.biking).toBe(1);
      expect(stats.plant_based).toBe(1);
      expect(stats.total).toBe(5);
    });

    it('should filter by period', async () => {
      mockSupabase.gte.mockResolvedValueOnce({
        data: [
          { swap_type: 'public_transit' },
          { swap_type: 'vegetarian' },
        ],
      });

      const stats = await service.getSwapStats('token', 'user-period', 'month');

      expect(stats.total).toBe(2);
    });
  });

  describe('Point Values', () => {
    it('all swap types have correct points', async () => {
      const types: EcoSwapType[] = ['public_transit', 'vegetarian', 'secondhand', 'biking', 'plant_based'];
      const points = [10, 5, 20, 15, 3];

      for (let i = 0; i < types.length; i++) {
        mockSupabase.single.mockResolvedValueOnce({
          data: { swap_type: types[i], points_awarded: points[i] },
        });

        const result = await service.createSwap('token', 'user', types[i]);
        expect(result.points).toBe(points[i]);
      }
    });
  });
});
