import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CarbonEmissionsService } from './carbon-emissions.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@ApiTags('carbon')
@Controller('carbon')
export class CarbonEmissionsController {
  constructor(private readonly carbonService: CarbonEmissionsService) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'User carbon emissions statistics',
  })
  async getStats(@Request() req: any) {
    return this.carbonService.getEmissionStats(req.user.id);
  }

  @Get('total')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Total carbon emissions for user',
  })
  async getTotal(@Request() req: any) {
    const total = await this.carbonService.getUserTotalEmissions(req.user.id);
    return { total_kg_co2e: Math.round(total * 100) / 100 };
  }

  @Get('by-category')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Carbon emissions by category',
  })
  async getByCategory(@Request() req: any) {
    return this.carbonService.getUserEmissionsByCategory(req.user.id);
  }
}
