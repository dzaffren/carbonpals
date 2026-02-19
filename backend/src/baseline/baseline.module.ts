import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { BaselineService } from './baseline.service';
import { BaselineController } from './baseline.controller';

@Module({
  imports: [AuthModule, DatabaseModule],
  providers: [BaselineService],
  controllers: [BaselineController],
  exports: [BaselineService],
})
export class BaselineModule {}
