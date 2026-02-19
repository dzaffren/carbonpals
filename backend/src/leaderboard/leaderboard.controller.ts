import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { LeaderboardService } from './leaderboard.service';

@ApiTags('leaderboard')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Get global leaderboard' })
  async getLeaderboard(
    @Query('period') period: 'all_time' | 'monthly' | 'weekly' = 'all_time',
    @Query('limit') limit = 50,
  ) {
    return this.leaderboardService.getLeaderboard(period, limit);
  }

  @Get('rank/:userId')
  @ApiResponse({ status: 200, description: 'Get user rank' })
  async getUserRank(@Param('userId') userId: string) {
    return this.leaderboardService.getUserRank(userId);
  }

  @Get('category/:category')
  @ApiResponse({ status: 200, description: 'Get top users by category' })
  async getByCategory(@Param('category') category: string, @Query('limit') limit = 10) {
    return this.leaderboardService.getTopByCategory(category, limit);
  }
}
