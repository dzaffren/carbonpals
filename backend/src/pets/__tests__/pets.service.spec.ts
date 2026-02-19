import { Test, TestingModule } from '@nestjs/testing';
import { PetsService } from '../pets.service';
import { DatabaseService } from '../../database/database.service';

describe('PetsService', () => {
  let service: PetsService;

  beforeEach(async () => {
    const mockDatabaseService = {
      db: {},
      isUsingMock: jest.fn().mockReturnValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PetsService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();

    service = module.get<PetsService>(PetsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Avatar progression', () => {
    it('should provide correct emoji for each level', () => {
      expect(service['getAvatarForLevel'](0)).toBe('🥚');
      expect(service['getAvatarForLevel'](1)).toBe('🐣');
      expect(service['getAvatarForLevel'](2)).toBe('🐤');
      expect(service['getAvatarForLevel'](5)).toBe('🦉');
    });
  });
});
