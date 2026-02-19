import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ExpendituresService } from './expenditures.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import {
  CreateExpenditureDto,
  UpdateExpenditureDto,
  ExpenditureDto,
} from './dtos/expenditure.dto';

@ApiTags('expenditures')
@Controller('expenditures')
export class ExpendituresController {
  constructor(private readonly expendituresService: ExpendituresService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({
    status: 201,
    description: 'Expenditure created',
    type: ExpenditureDto,
  })
  async create(
    @Request() req: any,
    @Body() createExpenditureDto: CreateExpenditureDto,
  ) {
    return this.expendituresService.create(req.user.id, createExpenditureDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'List of expenditures',
    type: [ExpenditureDto],
  })
  async findAll(
    @Request() req: any,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ) {
    return this.expendituresService.findAll(req.user.id, limit, offset);
  }

  @Get('stats/by-category')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Total expenditure by category' })
  async getByCategory(@Request() req: any) {
    return this.expendituresService.getTotalByCategory(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Single expenditure', type: ExpenditureDto })
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.expendituresService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Expenditure updated', type: ExpenditureDto })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateExpenditureDto: UpdateExpenditureDto,
  ) {
    return this.expendituresService.update(id, req.user.id, updateExpenditureDto);
  }

  @Delete(':id')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Expenditure deleted' })
  async remove(@Request() req: any, @Param('id') id: string) {
    return this.expendituresService.remove(id, req.user.id);
  }

  @Post('test/seed-last-month')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Test data seeded for last month' })
  async seedLastMonth(@Request() req: any) {
    return this.expendituresService.seedLastMonthData(req.user.id);
  }
}

