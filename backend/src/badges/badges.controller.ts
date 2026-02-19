import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { BadgesService } from './badges.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@ApiTags('badges')
@Controller('badges')
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get('my-badges')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Get user badges' })
  async getUserBadges(@Request() req: any) {
    return this.badgesService.getUserBadges(req.user.id);
  }

  @Get('definitions')
  @ApiResponse({ status: 200, description: 'Get all badge definitions' })
  async getBadgeDefinitions() {
    return this.badgesService.getBadgeDefinitions();
  }

  @Get('check')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Check for new unlocked badges' })
  async checkBadges(@Request() req: any) {
    const newBadges = await this.badgesService.checkAndUnlockBadges(req.user.id);
    const total = await this.badgesService.getUserBadges(req.user.id);
    return { newBadges, total };
  }
}
