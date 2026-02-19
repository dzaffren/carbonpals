import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ExpendituresModule } from './expenditures/expenditures.module';
import { CarbonModule } from './carbon/carbon.module';
import { PetsModule } from './pets/pets.module';
import { BadgesModule } from './badges/badges.module';
import { SocialModule } from './social/social.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { EcoSwapsModule } from './eco-swaps/eco-swaps.module';
import { BaselineModule } from './baseline/baseline.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    ExpendituresModule,
    CarbonModule,
    PetsModule,
    BadgesModule,
    SocialModule,
    LeaderboardModule,
    EcoSwapsModule,
    BaselineModule,
  ],
})
export class AppModule {}
