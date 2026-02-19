import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CarbonModule } from '../carbon/carbon.module';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardController } from './leaderboard.controller';

@Module({
  imports: [DatabaseModule, CarbonModule],
  controllers: [LeaderboardController],
  providers: [LeaderboardService],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}
