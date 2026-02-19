import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { PetsModule } from '../pets/pets.module';
import { EcoSwapsService } from './eco-swaps.service';
import { EcoSwapsController } from './eco-swaps.controller';

@Module({
  imports: [AuthModule, DatabaseModule, PetsModule],
  controllers: [EcoSwapsController],
  providers: [EcoSwapsService],
  exports: [EcoSwapsService],
})
export class EcoSwapsModule {}
