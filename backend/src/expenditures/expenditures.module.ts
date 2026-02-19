import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { CarbonModule } from '../carbon/carbon.module';
import { PetsModule } from '../pets/pets.module';
import { ExpendituresService } from './expenditures.service';
import { ExpendituresController } from './expenditures.controller';

@Module({
  imports: [AuthModule, DatabaseModule, CarbonModule, PetsModule],
  controllers: [ExpendituresController],
  providers: [ExpendituresService],
  exports: [ExpendituresService],
})
export class ExpendituresModule {}
