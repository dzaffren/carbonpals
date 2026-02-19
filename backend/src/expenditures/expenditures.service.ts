import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CarbonEmissionsService } from '../carbon/carbon-emissions.service';
import { PetsService } from '../pets/pets.service';
import { CreateExpenditureDto, UpdateExpenditureDto } from './dtos/expenditure.dto';

@Injectable()
export class ExpendituresService {
  constructor(
    private dbService: DatabaseService,
    private carbonEmissionsService: CarbonEmissionsService,
    private petsService: PetsService,
  ) {}

  async create(userId: string, createExpenditureDto: CreateExpenditureDto) {
    const { data, error } = await this.dbService.db
      .from('expenditures')
      .insert([
        {
          user_id: userId,
          category: createExpenditureDto.category,
          amount: createExpenditureDto.amount,
          description: createExpenditureDto.description || null,
        },
      ])
      .single();

    if (error) throw error;

    // Record carbon emissions for this expenditure
    if (data?.id) {
      try {
        const emission = await this.carbonEmissionsService.recordEmission(
          data.id,
          userId,
          createExpenditureDto.category,
          createExpenditureDto.amount,
        );
        
        // Do NOT award pet XP for emissions — that would incentivize higher carbon output.
        // Pet XP is awarded for eco-swap actions instead.
      } catch (err) {
        console.error('Failed to record carbon emissions:', err);
        // Continue anyway - expenditure was created successfully
      }
    }

    return data;
  }

  async findAll(userId: string, limit = 50, offset = 0) {
    const { data, error } = await this.dbService.db
      .from('expenditures')
      .select('*')
      .eq('user_id', userId)
      .async();

    if (error) throw error;
    return { data: data || [], total: (data || []).length };
  }

  async findOne(id: string, userId: string) {
    const { data, error } = await this.dbService.db
      .from('expenditures')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (data?.user_id !== userId) throw new Error('Unauthorized');
    return data;
  }

  async update(
    id: string,
    userId: string,
    updateExpenditureDto: UpdateExpenditureDto,
  ) {
    const { data, error } = await this.dbService.db
      .from('expenditures')
      .update({
        ...(updateExpenditureDto.category && {
          category: updateExpenditureDto.category,
        }),
        ...(updateExpenditureDto.amount && {
          amount: updateExpenditureDto.amount,
        }),
        ...(updateExpenditureDto.description && {
          description: updateExpenditureDto.description,
        }),
      })
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async remove(id: string, userId: string) {
    const { error } = await this.dbService.db
      .from('expenditures')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  }

  async getTotalByCategory(userId: string) {
    const { data, error } = await this.dbService.db
      .from('expenditures')
      .select('*')
      .eq('user_id', userId)
      .async();

    if (error) throw error;

    const totals: { [key: string]: number } = {};
    (data || []).forEach((exp: any) => {
      totals[exp.category] = (totals[exp.category] || 0) + exp.amount;
    });

    return totals;
  }

  /**
   * Test helper: Create expenditures backdated to last month
   * to simulate month-end finalization
   */
  async seedLastMonthData(userId: string) {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    lastMonth.setDate(15); // mid-month

    const testExpenditures = [
      { category: 'fuel', amount: 50, description: 'Gas (last month)' },
      { category: 'groceries', amount: 150, description: 'Groceries (last month)' },
      { category: 'electricity', amount: 80, description: 'Electric bill (last month)' },
    ];

    const results = [];
    for (const exp of testExpenditures) {
      // Insert with backdated timestamp
      const { data: expData } = await this.dbService.db
        .from('expenditures')
        .insert([
          {
            user_id: userId,
            category: exp.category,
            amount: exp.amount,
            description: exp.description,
            created_at: lastMonth.toISOString(),
          },
        ])
        .single();

      if (expData?.id) {
        // Record carbon emission with backdated timestamp
        const emission = await this.carbonEmissionsService.recordEmission(
          expData.id,
          userId,
          exp.category,
          exp.amount,
        );

        // Manually update carbon_emissions timestamp (mock DB doesn't respect created_at on insert)
        if (this.dbService.isUsingMock()) {
          const mockDb = this.dbService.getMockDb();
          const emissions = mockDb.getTable('carbon_emissions');
          const lastEmission = emissions[emissions.length - 1];
          if (lastEmission) {
            lastEmission.created_at = lastMonth.toISOString();
          }
        }

        results.push({ expenditure: expData, emission });
      }
    }

    return {
      message: `Seeded ${results.length} expenditures from last month`,
      month: lastMonth.toISOString().substring(0, 7),
      results,
    };
  }
}
