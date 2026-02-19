import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExpenditureDto {
  @ApiProperty({ example: 'fuel', description: 'Expenditure category' })
  @IsString()
  category!: string;

  @ApiProperty({ example: 50.0, description: 'Amount spent' })
  @IsNumber()
  amount!: number;

  @ApiProperty({
    example: 'Tank of fuel',
    description: 'Optional description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateExpenditureDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ExpenditureDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  user_id!: string;

  @ApiProperty()
  category!: string;

  @ApiProperty()
  amount!: number;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  created_at!: string;

  @ApiProperty()
  updated_at!: string;
}
