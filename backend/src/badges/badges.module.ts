import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CarbonModule } from '../carbon/carbon.module';
import { DatabaseModule } from '../database/database.module';
import { BadgesService } from './badges.service';
import { BadgesController } from './badges.controller';

@Module({
  imports: [AuthModule, CarbonModule, DatabaseModule],
  controllers: [BadgesController],
  providers: [BadgesService],
  exports: [BadgesService],
})
export class BadgesModule {}
