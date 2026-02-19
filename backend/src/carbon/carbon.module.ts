import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { CarbonCalculationService } from './carbon-calculation.service';
import { CarbonEmissionsService } from './carbon-emissions.service';
import { CarbonEmissionsController } from './carbon-emissions.controller';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [CarbonEmissionsController],
  providers: [CarbonCalculationService, CarbonEmissionsService],
  exports: [CarbonCalculationService, CarbonEmissionsService],
})
export class CarbonModule {}
