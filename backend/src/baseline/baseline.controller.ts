import { Controller, Post, Get, UseGuards, Req } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { BaselineService, BaselineResult } from './baseline.service';

@Controller('baseline')
export class BaselineController {
  constructor(private baselineService: BaselineService) {}

  @Post('calculate')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Calculate or lock user baseline' })
  async calculateBaseline(@Req() req: any): Promise<BaselineResult> {
    const userId = req.user.id;
    return this.baselineService.calculateBaseline(userId);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get reduction stats for current month' })
  async getStats(@Req() req: any) {
    const userId = req.user.id;
    return this.baselineService.getReductionStats(userId);
  }

  @Get('points')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get cumulative earned points and current month projection' })
  async getPoints(@Req() req: any) {
    const userId = req.user.id;
    return this.baselineService.getPointsSummary(userId);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get monthly reduction history' })
  async getHistory(@Req() req: any) {
    const userId = req.user.id;
    return this.baselineService.getMonthlyHistory(userId);
  }
}

