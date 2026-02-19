import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { EcoSwapsService } from './eco-swaps.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

export type EcoSwapType =
  | 'public_transit'
  | 'vegetarian'
  | 'secondhand'
  | 'biking'
  | 'plant_based';

@ApiTags('eco-swaps')
@Controller('eco-swaps')
export class EcoSwapsController {
  constructor(private readonly ecoSwapsService: EcoSwapsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(201)
  @ApiResponse({
    status: 201,
    description: 'Eco-swap created successfully',
  })
  async createSwap(
    @Request() req: any,
    @Body() body: { swapType?: EcoSwapType; swap_type?: EcoSwapType },
  ): Promise<any> {
    const token = req.headers.authorization?.split(' ')[1];
    const swapType = body.swapType || body.swap_type;
    if (!swapType) {
      throw new Error('swapType or swap_type is required');
    }
    return this.ecoSwapsService.createSwap(
      token,
      req.user.id,
      swapType,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Get user eco-swaps',
  })
  async getUserSwaps(@Request() req: any): Promise<any> {
    const token = req.headers.authorization?.split(' ')[1];
    return this.ecoSwapsService.getUserSwaps(token, req.user.id);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Get eco-swap statistics',
  })
  async getSwapStats(
    @Request() req: any,
    @Query('period') period?: 'week' | 'month' | 'year',
  ): Promise<any> {
    const token = req.headers.authorization?.split(' ')[1];
    return this.ecoSwapsService.getSwapStats(token, req.user.id, period);
  }
}

